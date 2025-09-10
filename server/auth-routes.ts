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
  apiVersion: '2024-12-18.acacia',
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

  app.get('/api/auth/me', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      const subscription = await storage.getUserActiveSubscription(user.id);
      const usageCheck = await storage.checkUsageLimits(user.id);
      
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
          usage: usageCheck
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

  app.post('/api/subscription/checkout', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { planId } = req.body;
      const user = req.user!;
      
      if (!planId) {
        return res.status(400).json({ error: 'Plan ID is required' });
      }

      // Get plan details
      const plan = await storage.getSubscriptionPlan(planId);
      if (!plan) {
        return res.status(404).json({ error: 'Plan not found' });
      }

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        customer_email: user.email,
        payment_method_types: ['card'],
        line_items: [{
          price: planId, // Using Stripe Price ID directly
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: `${req.headers.origin}/dashboard?success=true`,
        cancel_url: `${req.headers.origin}/pricing?canceled=true`,
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

  // Usage tracking middleware
  app.use('/api/usage/track', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { type } = req.body;
      const user = req.user!;
      
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

  // Customer management routes (admin only - would need admin middleware)
  app.get('/api/customers', async (req, res) => {
    try {
      const users = await storage.getAllUsersWithUsage();
      res.json({ success: true, data: users });
    } catch (error: any) {
      console.error('Get customers error:', error);
      res.status(500).json({ error: 'Failed to get customers' });
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