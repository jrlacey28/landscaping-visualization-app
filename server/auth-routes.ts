import type { Express } from "express";
import express from "express";
import session from "express-session";
import passport from "passport";
import Stripe from "stripe";
import { storage } from "./storage";
import { AuthService, authenticateToken, requireProPlan, type AuthRequest } from "./auth";
import { insertUserSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { z } from "zod";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
});

export function registerAuthRoutes(app: Express) {
  // Configure session middleware for passport
  app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Stripe webhook (must be before express.json middleware)
  app.post('/api/stripe/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
      console.error('Stripe webhook secret not configured');
      return res.status(400).send('Webhook secret not configured');
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig!, endpointSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object as Stripe.Checkout.Session;
          await handleCheckoutComplete(session);
          break;
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionChange(subscription);
          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
      res.json({received: true});
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).json({error: 'Webhook processing failed'});
    }
  });

  // Google OAuth callback success handler
  app.get('/api/auth/google/success', async (req, res) => {
    try {
      const token = req.query.token as string;
      if (!token) {
        return res.redirect('/auth?error=no_token');
      }

      // Redirect to frontend with token
      res.redirect(`/auth/success?token=${encodeURIComponent(token)}`);
    } catch (error) {
      console.error('Google success handler error:', error);
      res.redirect('/auth?error=callback_failed');
    }
  });

  // Authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userSchema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        businessName: z.string().optional(),
        phone: z.string().optional(),
      });

      const validationResult = userSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: fromZodError(validationResult.error).toString() 
        });
      }

      const { user, token } = await AuthService.register(validationResult.data);

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            businessName: user.businessName,
            emailVerified: user.emailVerified,
          },
          token
        }
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const { user, token } = await AuthService.login(email, password);

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            businessName: user.businessName,
            emailVerified: user.emailVerified,
          },
          token
        }
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(401).json({ error: error.message });
    }
  });

  app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user!;
      const subscription = await storage.getUserActiveSubscription(user.id);
      const usageCheck = await storage.checkUsageLimits(user.id);

      // Check embed access based on subscription plan
      let hasEmbedAccess = false;
      if (subscription) {
        const plan = await storage.getSubscriptionPlan(subscription.planId);
        hasEmbedAccess = plan?.embedAccess || false;
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            businessName: user.businessName,
            emailVerified: user.emailVerified,
          },
          subscription: subscription ? {
            planId: subscription.planId,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
          } : null,
          usage: usageCheck,
          hasEmbedAccess
        }
      });
    } catch (error: any) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to get user info' });
    }
  });

  // Subscription and billing routes
  app.get('/api/subscription/plans', async (req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json({ success: true, data: plans });
    } catch (error: any) {
      console.error('Get plans error:', error);
      res.status(500).json({ error: 'Failed to get subscription plans' });
    }
  });

  app.post('/api/subscription/checkout', authenticateToken, async (req, res) => {
    try {
      const { planId } = req.body;
      const user = (req as any).user!;

      if (!planId) {
        return res.status(400).json({ error: 'Plan ID is required' });
      }

      // Get plan details
      const plan = await storage.getSubscriptionPlan(planId);
      if (!plan) {
        return res.status(404).json({ error: 'Plan not found' });
      }

      // Create Stripe checkout session
      const baseUrl = `https://${process.env.REPLIT_DEV_DOMAIN}`;

      const session = await stripe.checkout.sessions.create({
        customer_email: user.email,
        line_items: [{
          price: planId, // Using Stripe Price ID directly
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: `${baseUrl}/dashboard?success=true`,
        cancel_url: `${baseUrl}/pricing?canceled=true`,
        metadata: {
          userId: user.id.toString(),
          planId: planId,
        },
      });

      res.json({ success: true, data: { url: session.url } });
    } catch (error: any) {
      console.error('Checkout error:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });

  app.post('/api/subscription/cancel', authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user!;

      // Get user's active subscription
      const subscription = await storage.getUserActiveSubscription(user.id);
      if (!subscription) {
        return res.status(404).json({ error: 'No active subscription found' });
      }

      // Cancel subscription in Stripe (at period end)
      if (subscription.stripeSubscriptionId) {
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true
        });
      }

      // Update local subscription record
      await storage.updateSubscription(subscription.id, {
        cancelAtPeriodEnd: true
      });

      res.json({ 
        success: true, 
        message: 'Subscription will be canceled at the end of the current billing period' 
      });
    } catch (error: any) {
      console.error('Cancel subscription error:', error);
      res.status(500).json({ error: 'Failed to cancel subscription' });
    }
  });

  // Usage tracking middleware
  app.use('/api/usage/track', authenticateToken, async (req, res) => {
    try {
      const { type } = req.body;
      const user = (req as any).user!;

      if (!type || !['visualization', 'landscape', 'pool'].includes(type)) {
        return res.status(400).json({ error: 'Valid usage type is required' });
      }

      // Check if user can create more visualizations
      const usageCheck = await storage.checkUsageLimits(user.id);
      if (!usageCheck.canUse) {
        return res.status(403).json({ 
          error: 'Usage limit exceeded', 
          details: usageCheck
        });
      }

      // Track the usage
      const updatedUsage = await storage.createOrUpdateUserUsage(user.id, type as any);

      res.json({ 
        success: true, 
        data: { 
          usage: updatedUsage,
          limits: usageCheck 
        } 
      });
    } catch (error) {
      console.error('Usage tracking error:', error);
      res.status(500).json({ error: 'Failed to track usage' });
    }
  });

  // Define admin auth middleware
  const requireAdminAuth = (req: any, res: any, next: any) => {
    if (req.session?.isAdmin) {
      next();
    } else {
      res.status(401).json({ error: "Admin authentication required" });
    }
  };

  // Customer management routes (admin only)
  app.get('/api/customers', requireAdminAuth, async (req, res) => {
    try {
      const users = await storage.getAllUsersWithUsage();
      res.json({ success: true, data: users });
    } catch (error: any) {
      console.error('Get customers error:', error);
      res.status(500).json({ error: 'Failed to get customers' });
    }
  });

  // Admin: Update user plan
  app.post("/api/admin/update-user-plan", requireAdminAuth, async (req, res) => {
    try {
      const { userId, planId } = req.body;

      if (!userId || !planId) {
        return res.status(400).json({ error: "User ID and Plan ID are required" });
      }

      // End any existing active subscriptions for this user
      const existingSubscription = await storage.getUserActiveSubscription(userId);
      if (existingSubscription) {
        await storage.updateSubscription(existingSubscription.id, {
          status: 'inactive',
          cancelAtPeriodEnd: true
        });
      }

      // Map display names to actual database plan IDs
      const planMapping: Record<string, string> = {
        'Free': 'free',
        'Basic': 'price_1S5X1sBY2SPm2HvOuDHNzsIp', // PRODUCTION Basic price ID
        'Pro': 'price_1S5X2XBY2SPm2HvO2he9Unto',     // PRODUCTION Pro price ID
        'Enterprise': 'enterprise'
      };

      const actualPlanId = planMapping[planId] || planId;

      // Create new subscription based on plan
      let newSubscription;
      if (planId === 'Free' || actualPlanId === 'free') {
        newSubscription = await storage.createFreeSubscription(userId);
      } else {
        // Create admin-managed subscription for paid plans
        const now = new Date();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        newSubscription = await storage.createSubscription({
          userId,
          stripeCustomerId: `admin_${userId}_${Date.now()}`,
          planId: actualPlanId,
          status: 'active',
          currentPeriodStart: now,
          currentPeriodEnd: endOfMonth,
          cancelAtPeriodEnd: false,
        });
      }

      res.json({ 
        success: true, 
        message: `User plan updated to ${planId}`,
        subscription: newSubscription 
      });
    } catch (error) {
      console.error("Error updating user plan:", error);
      res.status(500).json({ error: "Failed to update user plan" });
    }
  });

  // Admin: Reset user monthly usage
  app.post("/api/admin/reset-user-usage", requireAdminAuth, async (req, res) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      // Reset current month's usage to 0
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      await storage.resetUserUsage(userId, month, year);

      res.json({ 
        success: true, 
        message: "User monthly usage reset successfully"
      });
    } catch (error) {
      console.error("Error resetting user usage:", error);
      res.status(500).json({ error: "Failed to reset user usage" });
    }
  });

  // Admin: Set custom usage limit for user
  app.post("/api/admin/set-user-limit", requireAdminAuth, async (req, res) => {
    try {
      const { userId, limit } = req.body;

      if (!userId || typeof limit !== 'number') {
        return res.status(400).json({ error: "User ID and numeric limit are required" });
      }

      await storage.setUserCustomLimit(userId, limit);

      res.json({ 
        success: true, 
        message: `User custom limit set to ${limit}`
      });
    } catch (error) {
      console.error("Error setting user limit:", error);
      res.status(500).json({ error: "Failed to set user limit" });
    }
  });

  // Admin: Set user plan by Stripe price ID
  app.post("/api/admin/set-user-plan-stripe", requireAdminAuth, async (req, res) => {
    try {
      const { userId, stripePriceId } = req.body;

      if (!userId || !stripePriceId) {
        return res.status(400).json({ error: "User ID and Stripe price ID are required" });
      }

      const subscription = await storage.setUserPlanByStripeId(userId, stripePriceId);

      res.json({ 
        success: true, 
        message: `User plan set to ${stripePriceId}`,
        subscription
      });
    } catch (error) {
      console.error("Error setting user plan by Stripe ID:", error);
      res.status(500).json({ error: "Failed to set user plan" });
    }
  });

  // Helper functions for Stripe webhooks
  async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;

    if (!userId || !planId) {
      console.error('Missing metadata in checkout session');
      return;
    }

    try {
      // Create subscription record
      await storage.createSubscription({
        userId: parseInt(userId),
        planId: planId,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      });
    } catch (error) {
      console.error('Error creating subscription:', error);
    }
  }

  async function handleSubscriptionChange(subscription: Stripe.Subscription) {
    try {
      const status = subscription.status === 'active' ? 'active' : 
                    subscription.status === 'past_due' ? 'past_due' : 'inactive';

      await storage.updateSubscriptionByStripeId(subscription.id, {
        status: status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      });
    } catch (error) {
      console.error('Error updating subscription:', error);
    }
  }
}