import type { Express } from "express";
import express from "express";
import Stripe from "stripe";
import { storage } from "./storage";
import { AuthService, authenticateToken, requireProPlan, type AuthRequest } from "./auth";
import { insertUserSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { z } from "zod";
import { rateLimit, acquireLease, releaseLease, rows } from "./security";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { sendVerification } from "./onboarding-routes";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
});

export function registerAuthRoutes(app: Express) {
  const getAppBaseUrl = (req: any) => {
    const configuredUrl =
      process.env.APP_URL ||
      process.env.PRODUCTION_URL ||
      (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : undefined) ||
      (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : undefined);

    if (configuredUrl) {
      return configuredUrl.replace(/\/$/, '');
    }

    return `${req.protocol}://${req.get('host')}`;
  };

  // Stripe webhook. server/index.ts leaves this route unparsed so express.raw can verify the signature.
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

    const object = event.data.object as any;
    const leaseKey = `stripe:${object.subscription || object.id}`;
    let lease: string | null = null;
    try {
      lease = await acquireLease(leaseKey);
      if (!lease) return res.status(503).json({ error: "Event processing in progress" });
      if (rows(await db.execute(sql`SELECT id FROM processed_stripe_events WHERE id = ${event.id}`)).length) return res.json({ received: true });
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object as Stripe.Checkout.Session;
          await handleCheckoutComplete(session);
          break;
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionChange(await stripe.subscriptions.retrieve(subscription.id));
          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
      await db.execute(sql`INSERT INTO processed_stripe_events (id) VALUES (${event.id}) ON CONFLICT DO NOTHING`);
      res.json({received: true});
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).json({error: 'Webhook processing failed'});
    } finally {
      if (lease) await releaseLease(leaseKey, lease);
    }
  });

  // Authentication routes
  app.post('/api/auth/register', rateLimit('register', 5, 3600), async (req, res) => {
    try {
      const userSchema = z.object({
        email: z.string().trim().email().max(254),
        password: z.string().min(10).max(72),
        termsAccepted: z.literal(true),
        firstName: z.string().trim().min(1).max(150),
        lastName: z.string().trim().min(1).max(150),
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

      const { user } = await AuthService.register(validationResult.data);
      await sendVerification(user).catch(() => false);

      await new Promise<void>((resolve, reject) => req.logIn(user, error => error ? reject(error) : resolve()));
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
        }
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/auth/login', rateLimit('login', 15, 900), async (req, res) => {
    try {
      const { email, password } = z.object({email:z.string().email().max(254),password:z.string().min(1).max(72)}).parse(req.body);
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const { user } = await AuthService.login(email, password);

      await new Promise<void>((resolve, reject) => req.logIn(user, error => error ? reject(error) : resolve()));
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
        }
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(401).json({ error: error.message });
    }
  });

  app.get('/api/auth/me', authenticateToken as any, async (req: any, res: any) => {
    try {
      const user = req.user!;
      const subscription = await storage.getUserActiveSubscription(user.id);
      const usageCheck = await storage.checkUsageLimits(user.id);

      // Use the centralized, robust embed access computation
      const hasEmbedAccess = await storage.computeEmbedAccess(user.id);
      
      // Check for Professional access (including team membership)
      const hasBusinessProAccess = await storage.hasBusinessProAccess(user.id);
      
      // Get team membership information
      const userTeams = await storage.getUserTeams(user.id);
      const teamOwner = await storage.getTeamByOwnerId(user.id);
      const teamAccess = await storage.getUserTeamAccess(user.id);
      const workspaceOwnerId = teamAccess.effectiveUserId;
      const workspaceTenant = await storage.ensureAccountTenant(workspaceOwnerId);
      
      // Add extra logging for debugging production issues
      if (user.email === 'jordanlacey2821@gmail.com') {
        console.log(`[DEBUG] User ${user.email}:`);
        console.log(`  - User ID: ${user.id}`);
        console.log(`  - Usage Plan Name: "${usageCheck.planName}"`);
        console.log(`  - Active Subscription: ${subscription ? subscription.planId : 'none'}`);
        console.log(`  - Computed Embed Access: ${hasEmbedAccess}`);
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
          hasEmbedAccess,
          hasBusinessProAccess,
          teams: userTeams,
          teamOwner: teamOwner || null,
          workspaceOwnerId,
          enterpriseTenant: workspaceTenant ? {
            id: workspaceTenant.id,
            slug: workspaceTenant.slug,
            companyName: workspaceTenant.companyName,
            clientType: workspaceTenant.clientType,
            isEnterprise: workspaceTenant.isEnterprise,
            monthlyGenerationLimit: workspaceTenant.monthlyGenerationLimit,
            currentMonthGenerations: workspaceTenant.currentMonthGenerations,
            embedVisitorLimit: workspaceTenant.embedVisitorLimit,
            embedRequireQuoteAfterLimit: workspaceTenant.embedRequireQuoteAfterLimit,
            embedEnabled: workspaceTenant.embedEnabled,
          } : null
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

  app.post('/api/subscription/checkout', authenticateToken as any, async (req: any, res: any) => {
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
      if (!plan.active) {
        return res.status(400).json({ error: 'This plan is no longer available' });
      }
      if (plan.price <= 0) {
        return res.status(400).json({ error: 'Checkout is only available for paid plans' });
      }

      // Create Stripe checkout session
      const baseUrl = getAppBaseUrl(req);

      const session = await stripe.checkout.sessions.create({
        customer_email: user.email,
        client_reference_id: user.id.toString(),
        line_items: [{
          price: planId, // Using Stripe Price ID directly
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: `${baseUrl}/setup?success=true`,
        cancel_url: `${baseUrl}/pricing?canceled=true`,
        metadata: {
          userId: user.id.toString(),
          planId: planId,
        },
        subscription_data: {
          metadata: {
            userId: user.id.toString(),
            planId: planId,
          },
        },
      });

      res.json({ success: true, data: { url: session.url } });
    } catch (error: any) {
      console.error('Checkout error:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });

  app.post('/api/subscription/cancel', authenticateToken as any, async (req: any, res: any) => {
    try {
      const user = req.user!;

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
  app.use('/api/usage/track', authenticateToken as any, async (req: any, res: any) => {
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

  // Subscription diagnostics endpoint for debugging
  app.get('/api/debug/subscriptions', authenticateToken as any, async (req: any, res: any) => {
    try {
      const user = req.user!;
      
      // Get ALL subscriptions for this user
      const allSubscriptions = await storage.getUserSubscriptions(user.id);
      const activeSubscription = await storage.getUserActiveSubscription(user.id);
      const usageCheck = await storage.checkUsageLimits(user.id);
      
      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email
          },
          allSubscriptions: allSubscriptions.map(sub => ({
            id: sub.id,
            planId: sub.planId,
            status: sub.status,
            stripeSubscriptionId: sub.stripeSubscriptionId,
            stripeCustomerId: sub.stripeCustomerId,
            currentPeriodStart: sub.currentPeriodStart,
            currentPeriodEnd: sub.currentPeriodEnd,
            cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
            createdAt: sub.createdAt
          })),
          activeSubscription: activeSubscription ? {
            id: activeSubscription.id,
            planId: activeSubscription.planId,
            status: activeSubscription.status
          } : null,
          usageCheck,
          expectedContractorPlanId: 'price_1TcynuBY2SPm2HvO1Eri2ogI',
          expectedProfessionalPlanId: 'price_1SGN4YBY2SPm2HvOrpREWCn1'
        }
      });
    } catch (error: any) {
      console.error('Debug subscriptions error:', error);
      res.status(500).json({ error: 'Failed to get subscription info' });
    }
  });

  // Team quota diagnostics endpoint for debugging
  app.get('/api/debug/team-quota', authenticateToken as any, async (req: any, res: any) => {
    try {
      const user = req.user!;
      
      // Get team memberships
      const ownedTeam = await storage.getTeamByOwnerId(user.id);
      const userTeams = await storage.getUserTeams(user.id);
      
      // Get usage check
      const usageCheck = await storage.checkUsageLimits(user.id);
      
      // Try to find team membership
      let teamMembershipDetails = null;
      if (userTeams.length > 0) {
        const team = userTeams[0];
        const members = await storage.getTeamMembers(team.id);
        const userMember = members.find(m => 
          m.userId === user.id || m.email === user.email.toLowerCase()
        );
        
        teamMembershipDetails = {
          teamId: team.id,
          teamName: team.name,
          teamOwner: team.ownerId,
          memberRecord: userMember ? {
            id: userMember.id,
            email: userMember.email,
            userId: userMember.userId,
            status: userMember.status,
            role: userMember.role,
            hasUserIdSet: !!userMember.userId,
            emailMatches: userMember.email === user.email.toLowerCase()
          } : null,
          allMembers: members.map(m => ({
            email: m.email,
            userId: m.userId,
            status: m.status
          }))
        };
      }
      
      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email
          },
          isTeamOwner: !!ownedTeam,
          ownedTeam: ownedTeam ? {
            id: ownedTeam.id,
            name: ownedTeam.name
          } : null,
          memberOfTeams: userTeams.map(t => ({
            id: t.id,
            name: t.name,
            ownerId: t.ownerId
          })),
          teamMembershipDetails,
          usageCheck,
          diagnosis: {
            shouldHaveTeamAccess: userTeams.length > 0 || !!ownedTeam,
            actuallyHasTeamAccess: usageCheck.planName.includes('(Team)'),
            possibleIssue: userTeams.length > 0 && !usageCheck.planName.includes('(Team)') 
              ? 'Team membership found but quota not applying - userId field may need repair'
              : null
          }
        }
      });
    } catch (error: any) {
      console.error('Debug team quota error:', error);
      res.status(500).json({ error: 'Failed to get team quota info' });
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
      console.log(`[Admin] Fetched ${users.length} users for admin dashboard`);
      
      res.json({ success: true, data: users });
    } catch (error: any) {
      console.error('[Admin] Get customers error:', error);
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
        'Contractor': 'price_1TcynuBY2SPm2HvO1Eri2ogI',
        'Professional': 'price_1SGN4YBY2SPm2HvOrpREWCn1',
        'Pro': 'price_1TcynuBY2SPm2HvO1Eri2ogI',
        'Business Pro': 'price_1SGN4YBY2SPm2HvOrpREWCn1',
        'Enterprise': 'enterprise'
      };

      const actualPlanId = planMapping[planId] || planId;

      // Create new subscription based on plan
      let newSubscription;
      if (planId === 'Free' || actualPlanId === 'free') {
        newSubscription = await storage.createFreeSubscription(userId);
      } else {
        const selectedPlan = await storage.getSubscriptionPlan(actualPlanId);
        if (!selectedPlan || !selectedPlan.active) {
          return res.status(400).json({ error: "Selected plan is not available" });
        }

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
        subscription: newSubscription,
        tenant: await storage.ensureAccountTenant(userId),
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
      await storage.ensureAccountTenant(userId);

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
        subscription,
        tenant: await storage.ensureAccountTenant(userId),
      });
    } catch (error) {
      console.error("Error setting user plan by Stripe ID:", error);
      res.status(500).json({ error: "Failed to set user plan" });
    }
  });

  // Helper functions for Stripe webhooks
  function getSubscriptionPeriod(subscription: Stripe.Subscription) {
    const sub = subscription as any;
    const item = sub.items?.data?.[0];
    const periodStart = sub.current_period_start || item?.current_period_start;
    const periodEnd = sub.current_period_end || item?.current_period_end;

    return {
      currentPeriodStart: periodStart ? new Date(periodStart * 1000) : new Date(),
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
  }

  function getSubscriptionPlanId(subscription: Stripe.Subscription) {
    const sub = subscription as any;
    return sub.metadata?.planId || sub.items?.data?.[0]?.price?.id;
  }

  async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId || session.client_reference_id;
    let planId = session.metadata?.planId;
    const stripeSubscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

    if (!userId || !stripeSubscriptionId) {
      console.error('Missing metadata in checkout session');
      return;
    }

    try {
      const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId, {
        expand: ['items.data.price'],
      });
      planId = planId || getSubscriptionPlanId(stripeSubscription);

      if (!planId) {
        console.error('Missing plan ID in checkout subscription');
        return;
      }

      const userIdNum = parseInt(userId);
      const { currentPeriodStart, currentPeriodEnd } = getSubscriptionPeriod(stripeSubscription);
      const existingSubscriptions = await storage.getUserSubscriptions(userIdNum);
      const existingStripeSubscription = existingSubscriptions.find(
        (subscription) => subscription.stripeSubscriptionId === stripeSubscriptionId
      );

      if (existingStripeSubscription) {
        await storage.updateSubscription(existingStripeSubscription.id, {
          planId,
          stripeCustomerId: stripeSubscription.customer as string,
          stripeSubscriptionId,
          status: stripeSubscription.status,
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd: !!(stripeSubscription as any).cancel_at_period_end,
        } as any);
        await storage.ensureAccountTenant(userIdNum);
        return;
      }

      const activeSubscription = existingSubscriptions.find((subscription) => subscription.status === 'active');
      if (activeSubscription) {
        await storage.updateSubscription(activeSubscription.id, {
          status: 'inactive',
          cancelAtPeriodEnd: false,
        });
      }

      await storage.createSubscription({
        userId: parseInt(userId),
        planId,
        stripeCustomerId: stripeSubscription.customer as string,
        stripeSubscriptionId,
        status: stripeSubscription.status,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: !!(stripeSubscription as any).cancel_at_period_end,
      } as any);
      await storage.ensureAccountTenant(userIdNum);
    } catch (error) {
      console.error('Error creating subscription');
      throw error;
    }
  }

  async function handleSubscriptionChange(subscription: Stripe.Subscription) {
    try {
      const planId = getSubscriptionPlanId(subscription);
      const { currentPeriodStart, currentPeriodEnd } = getSubscriptionPeriod(subscription);
      const updateData: any = {
        status: subscription.status,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: !!(subscription as any).cancel_at_period_end,
      };

      if (planId) {
        updateData.planId = planId;
      }

      const updatedSubscription = await storage.updateSubscriptionByStripeId(subscription.id, updateData);
      if (updatedSubscription) {
        await storage.ensureAccountTenant(updatedSubscription.userId);
        return;
      }

      const userId = (subscription as any).metadata?.userId;
      if (!userId || !planId) {
        console.error('Subscription change has no matching local subscription and no metadata to create one');
        return;
      }

      const userIdNum = parseInt(userId);
      const activeSubscription = await storage.getUserActiveSubscription(userIdNum);
      if (activeSubscription) {
        await storage.updateSubscription(activeSubscription.id, {
          status: 'inactive',
          cancelAtPeriodEnd: false,
        });
      }

      await storage.createSubscription({
        userId: userIdNum,
        planId,
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: !!(subscription as any).cancel_at_period_end,
      } as any);
      await storage.ensureAccountTenant(userIdNum);
    } catch (error) {
      console.error('Error updating subscription');
      throw error;
    }
  }
}
