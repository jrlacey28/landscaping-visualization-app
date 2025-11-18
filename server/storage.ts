import { 
  users, subscriptions, subscriptionPlans, userUsage, tenants, leads, visualizations, poolVisualizations, landscapeVisualizations, halloweenVisualizations, christmasLightsVisualizations,
  userFeatureOverrides, teams, teamMembers,
  type User, type InsertUser, type Subscription, type InsertSubscription, type SubscriptionPlan, type UserUsage, type InsertUserUsage,
  type Tenant, type InsertTenant, type Lead, type InsertLead, type Visualization, type InsertVisualization, 
  type PoolVisualization, type InsertPoolVisualization, type LandscapeVisualization, type InsertLandscapeVisualization,
  type HalloweenVisualization, type InsertHalloweenVisualization,
  type ChristmasLightsVisualization, type InsertChristmasLightsVisualization,
  type UserFeatureOverrides, type InsertUserFeatureOverrides,
  type Team, type InsertTeam, type TeamMember, type InsertTeamMember
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte } from "drizzle-orm";

// Usage stats functionality temporarily disabled
// TODO: Implement proper usageStats table in schema when needed


export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByEmailVerificationToken(token: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;

  // Subscription methods
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined>;
  getUserActiveSubscription(userId: number): Promise<Subscription | undefined>;
  getUserSubscriptions(userId: number): Promise<Subscription[]>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  createFreeSubscription(userId: number): Promise<Subscription>;
  updateSubscription(id: number, subscription: Partial<InsertSubscription>): Promise<Subscription>;
  updateSubscriptionByStripeId(stripeSubscriptionId: string, subscription: Partial<InsertSubscription>): Promise<Subscription>;

  // Usage tracking
  getUserUsage(userId: number, month: number, year: number): Promise<UserUsage | undefined>;
  createOrUpdateUserUsage(userId: number, type: 'visualization' | 'landscape' | 'pool'): Promise<UserUsage>;
  checkUsageLimits(userId: number): Promise<{ canUse: boolean; currentUsage: number; limit: number; planName: string }>;

  // Tenant methods (for white-label customers)
  getTenant(id: number): Promise<Tenant | undefined>;
  getTenantBySlug(slug: string): Promise<Tenant | undefined>;
  getTenantByUserId(userId: number): Promise<Tenant | undefined>;
  getAllTenants(): Promise<Tenant[]>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  updateTenant(id: number, tenant: Partial<InsertTenant>): Promise<Tenant>;

  // Lead methods
  getLead(id: number): Promise<Lead | undefined>;
  getLeadsByTenant(tenantId: number): Promise<Lead[]>;
  getLeadsByUser(userId: number): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  deleteLead(id: number): Promise<void>;

  // Visualization methods
  getVisualization(id: number): Promise<Visualization | undefined>;
  getVisualizationsByTenant(tenantId: number): Promise<Visualization[]>;
  getVisualizationsByUser(userId: number): Promise<Visualization[]>;
  createVisualization(visualization: InsertVisualization): Promise<Visualization>;
  updateVisualization(id: number, visualization: Partial<InsertVisualization>): Promise<Visualization>;

  // Pool Visualization methods
  getPoolVisualization(id: number): Promise<PoolVisualization | undefined>;
  getPoolVisualizationsByTenant(tenantId: number): Promise<PoolVisualization[]>;
  getPoolVisualizationsByUser(userId: number): Promise<PoolVisualization[]>;
  createPoolVisualization(poolVisualization: InsertPoolVisualization): Promise<PoolVisualization>;
  updatePoolVisualization(id: number, poolVisualization: Partial<InsertPoolVisualization>): Promise<PoolVisualization>;

  // Landscape Visualization methods
  getLandscapeVisualization(id: number): Promise<LandscapeVisualization | undefined>;
  getLandscapeVisualizationsByTenant(tenantId: number): Promise<LandscapeVisualization[]>;
  getLandscapeVisualizationsByUser(userId: number): Promise<LandscapeVisualization[]>;
  createLandscapeVisualization(landscapeVisualization: InsertLandscapeVisualization): Promise<LandscapeVisualization>;
  updateLandscapeVisualization(id: number, landscapeVisualization: Partial<InsertLandscapeVisualization>): Promise<LandscapeVisualization>;

  // Halloween Visualization methods
  getHalloweenVisualization(id: number): Promise<HalloweenVisualization | undefined>;
  getHalloweenVisualizationsByTenant(tenantId: number): Promise<HalloweenVisualization[]>;
  getHalloweenVisualizationsByUser(userId: number): Promise<HalloweenVisualization[]>;
  createHalloweenVisualization(halloweenVisualization: InsertHalloweenVisualization): Promise<HalloweenVisualization>;
  updateHalloweenVisualization(id: number, halloweenVisualization: Partial<InsertHalloweenVisualization>): Promise<HalloweenVisualization>;

  // Christmas Lights Visualization methods
  getChristmasLightsVisualization(id: number): Promise<ChristmasLightsVisualization | undefined>;
  getChristmasLightsVisualizationsByTenant(tenantId: number): Promise<ChristmasLightsVisualization[]>;
  getChristmasLightsVisualizationsByUser(userId: number): Promise<ChristmasLightsVisualization[]>;
  createChristmasLightsVisualization(christmasVisualization: InsertChristmasLightsVisualization): Promise<ChristmasLightsVisualization>;
  updateChristmasLightsVisualization(id: number, christmasVisualization: Partial<InsertChristmasLightsVisualization>): Promise<ChristmasLightsVisualization>;

  // Admin methods
  getAllUsersWithUsage(): Promise<Array<User & { usage?: UserUsage; subscription?: Subscription }>>;
  setUserPlanByStripeId(userId: number, stripePriceId: string): Promise<Subscription>;

  // Feature override methods
  getUserFeatureOverrides(userId: number): Promise<UserFeatureOverrides | undefined>;
  setUserEmbedOverride(userId: number, embedOverride: boolean | null, updatedBy: string): Promise<UserFeatureOverrides>;
  computeEmbedAccess(userId: number): Promise<boolean>;

  // Legacy tenant usage stats methods
  trackUsage(tenantId: number, type: 'visualization' | 'landscape' | 'pool'): Promise<void>;
  getUsageStats(tenantId: number, days?: number): Promise<any[]>;
  
  // Team methods
  getTeamByOwnerId(ownerId: number): Promise<Team | undefined>;
  getTeamById(id: number): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team>;
  getTeamMembers(teamId: number): Promise<TeamMember[]>;
  getTeamMemberByEmail(teamId: number, email: string): Promise<TeamMember | undefined>;
  addTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  updateTeamMember(id: number, member: Partial<InsertTeamMember>): Promise<TeamMember>;
  removeTeamMember(id: number): Promise<void>;
  getUserTeams(userId: number): Promise<Team[]>;
  getTeamMemberByToken(token: string): Promise<(TeamMember & { team: Team }) | undefined>;
  acceptTeamInvitation(token: string, userId: number): Promise<TeamMember>;
  getTeamMemberByJoinCode(joinCode: string): Promise<(TeamMember & { team: Team }) | undefined>;
  acceptTeamInvitationByJoinCode(joinCode: string, userId: number): Promise<TeamMember>;
  hasBusinessProAccess(userId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  private db = db;

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  // Robust team membership detection for production
  async getActiveTeamMembership(userId: number): Promise<{ team: Team; member: TeamMember } | null> {
    try {
      // First try: Direct userId lookup
      const [directMembership] = await this.db
        .select({ team: teams, member: teamMembers })
        .from(teamMembers)
        .innerJoin(teams, eq(teamMembers.teamId, teams.id))
        .where(and(
          eq(teamMembers.userId, userId),
          eq(teamMembers.status, 'active')
        ))
        .limit(1);
      
      if (directMembership) {
        return directMembership;
      }

      // Second try: Email lookup with auto-repair
      const user = await this.getUser(userId);
      if (!user) return null;

      // Try both exact email match and lowercase
      const emails = [user.email, user.email.toLowerCase()];
      for (const email of emails) {
        const [emailMembership] = await this.db
          .select({ team: teams, member: teamMembers })
          .from(teamMembers)
          .innerJoin(teams, eq(teamMembers.teamId, teams.id))
          .where(and(
            eq(teamMembers.email, email),
            eq(teamMembers.status, 'active')
          ))
          .limit(1);
        
        if (emailMembership) {
          // Auto-repair: Update the userId field for future lookups
          await this.db
            .update(teamMembers)
            .set({ userId, email: user.email.toLowerCase() })
            .where(eq(teamMembers.id, emailMembership.member.id));
          
          console.log(`[Team] Auto-repaired team membership for user ${userId} (${user.email})`);
          return emailMembership;
        }
      }

      return null;
    } catch (error) {
      console.error(`Error getting team membership for user ${userId}:`, error);
      return null;
    }
  }

  // Check if user has team access (owner or member)
  async getUserTeamAccess(userId: number): Promise<{ isOwner: boolean; isMember: boolean; team: Team | null; effectiveUserId: number }> {
    // Check if user owns a team
    const ownedTeam = await this.getTeamByOwnerId(userId);
    if (ownedTeam) {
      return {
        isOwner: true,
        isMember: false,
        team: ownedTeam,
        effectiveUserId: userId
      };
    }

    // Check if user is a team member
    const membership = await this.getActiveTeamMembership(userId);
    if (membership) {
      return {
        isOwner: false,
        isMember: true,
        team: membership.team,
        effectiveUserId: membership.team.ownerId
      };
    }

    return {
      isOwner: false,
      isMember: false,
      team: null,
      effectiveUserId: userId
    };
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByEmailVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.emailVerificationToken, token));
    return user || undefined;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.resetPasswordToken, token));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await this.db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, insertUser: Partial<InsertUser>): Promise<User> {
    const [user] = await this.db
      .update(users)
      .set({...insertUser, updatedAt: new Date()})
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Subscription methods
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await this.db.select().from(subscriptionPlans).where(eq(subscriptionPlans.active, true));
  }

  async getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined> {
    const [plan] = await this.db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id));
    return plan || undefined;
  }

  async getUserActiveSubscription(userId: number): Promise<Subscription | undefined> {
    const [subscription] = await this.db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
      .orderBy(desc(subscriptions.createdAt));
    return subscription || undefined;
  }

  async getUserSubscriptions(userId: number): Promise<Subscription[]> {
    return await this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt));
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const [subscription] = await this.db
      .insert(subscriptions)
      .values(insertSubscription)
      .returning();
    return subscription;
  }

  async createFreeSubscription(userId: number): Promise<Subscription> {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const freeSubscription: InsertSubscription = {
      userId,
      stripeCustomerId: `free_${userId}_${Date.now()}`, // Unique identifier for free plan
      planId: 'free',
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: endOfMonth,
      cancelAtPeriodEnd: false,
    };

    const [subscription] = await this.db
      .insert(subscriptions)
      .values(freeSubscription)
      .returning();
    return subscription;
  }

  async updateSubscription(id: number, insertSubscription: Partial<InsertSubscription>): Promise<Subscription> {
    const [subscription] = await this.db
      .update(subscriptions)
      .set({...insertSubscription, updatedAt: new Date()})
      .where(eq(subscriptions.id, id))
      .returning();
    return subscription;
  }

  async updateSubscriptionByStripeId(stripeSubscriptionId: string, insertSubscription: Partial<InsertSubscription>): Promise<Subscription> {
    const [subscription] = await this.db
      .update(subscriptions)
      .set({...insertSubscription, updatedAt: new Date()})
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
      .returning();
    return subscription;
  }

  // Usage tracking
  async getUserUsage(userId: number, month: number, year: number): Promise<UserUsage | undefined> {
    const [usage] = await this.db
      .select()
      .from(userUsage)
      .where(and(
        eq(userUsage.userId, userId),
        eq(userUsage.month, month),
        eq(userUsage.year, year)
      ));
    return usage || undefined;
  }

  async createOrUpdateUserUsage(userId: number, type: 'visualization' | 'landscape' | 'pool'): Promise<UserUsage> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Use the robust team access check
    const teamAccess = await this.getUserTeamAccess(userId);
    const effectiveUserId = teamAccess.effectiveUserId;
    
    if (teamAccess.isMember) {
      console.log(`[Usage] Team member ${userId} creating ${type}, tracking under owner ${effectiveUserId}`);
    }

    // Try to get existing usage record for the effective user
    const existingUsage = await this.getUserUsage(effectiveUserId, month, year);

    if (existingUsage) {
      // Update existing record
      const updates: Partial<InsertUserUsage> = {
        totalCount: (existingUsage.totalCount || 0) + 1,
      };

      if (type === 'visualization') {
        updates.visualizationCount = (existingUsage.visualizationCount || 0) + 1;
      } else if (type === 'landscape') {
        updates.landscapeCount = (existingUsage.landscapeCount || 0) + 1;
      } else if (type === 'pool') {
        updates.poolCount = (existingUsage.poolCount || 0) + 1;
      }

      const [updatedUsage] = await this.db
        .update(userUsage)
        .set(updates)
        .where(eq(userUsage.id, existingUsage.id))
        .returning();
      return updatedUsage;
    } else {
      // Create new record
      const newUsage: InsertUserUsage = {
        userId: effectiveUserId,  // Use effective user ID (team owner if member)
        month,
        year,
        totalCount: 1,
        visualizationCount: type === 'visualization' ? 1 : 0,
        landscapeCount: type === 'landscape' ? 1 : 0,
        poolCount: type === 'pool' ? 1 : 0,
      };

      const [usage] = await this.db
        .insert(userUsage)
        .values(newUsage)
        .returning();
      return usage;
    }
  }

  async checkUsageLimits(userId: number): Promise<{ canUse: boolean; currentUsage: number; limit: number; planName: string }> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Use the robust team access check
    const teamAccess = await this.getUserTeamAccess(userId);
    const effectiveUserId = teamAccess.effectiveUserId;
    const isPartOfTeam = teamAccess.isOwner || teamAccess.isMember;
    const activeTeam = teamAccess.team;

    // Get subscription (either user's own or team owner's)
    const subscription = await this.getUserActiveSubscription(effectiveUserId);

    if (isPartOfTeam && activeTeam && subscription) {
      // SIMPLIFIED: All team usage is now tracked under the team owner's ID
      // No need to sum individual member usage anymore
      const teamUsage = await this.getUserUsage(effectiveUserId, month, year);
      const totalTeamUsage = teamUsage ? (teamUsage.totalCount || 0) : 0;

      // Get plan details
      const plan = await this.getSubscriptionPlan(subscription.planId);
      if (!plan) {
        return {
          canUse: false,
          currentUsage: totalTeamUsage,
          limit: 0,
          planName: 'Unknown'
        };
      }

      // Check limit (-1 means unlimited)
      const planLimit = plan.visualizationLimit || 0;
      const canUse = planLimit === -1 || totalTeamUsage < planLimit;

      return {
        canUse,
        currentUsage: totalTeamUsage,
        limit: plan.visualizationLimit || 0,
        planName: `${plan.name} (Team)`
      };
    }

    // Not part of a team or team owner doesn't have subscription - use individual limits
    const usage = await this.getUserUsage(userId, month, year);
    const currentUsage = usage ? (usage.totalCount || 0) : 0;

    if (!subscription) {
      // No subscription - they get 5 free visualizations
      return {
        canUse: currentUsage < 5,
        currentUsage,
        limit: 5,
        planName: 'Free'
      };
    }

    // Get plan details
    const plan = await this.getSubscriptionPlan(subscription.planId);
    if (!plan) {
      return {
        canUse: false,
        currentUsage,
        limit: 0,
        planName: 'Unknown'
      };
    }

    // Check limit (-1 means unlimited)
    const planLimit = plan.visualizationLimit || 0;
    const canUse = planLimit === -1 || currentUsage < planLimit;

    return {
      canUse,
      currentUsage,
      limit: plan.visualizationLimit || 0,
      planName: plan.name
    };
  }

  async resetUserUsage(userId: number, month: number, year: number): Promise<void> {
    // Get existing usage record
    const existingUsage = await this.getUserUsage(userId, month, year);

    if (existingUsage) {
      // Reset all counts to 0
      await this.db
        .update(userUsage)
        .set({
          totalCount: 0,
          visualizationCount: 0,
          landscapeCount: 0,
          poolCount: 0,
          updatedAt: new Date(),
        })
        .where(eq(userUsage.id, existingUsage.id));
    }
    // If no usage record exists, no need to create one
  }

  async setUserCustomLimit(userId: number, limit: number): Promise<void> {
    // Create a custom admin-managed subscription with the specified limit
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    await this.createSubscription({
      userId,
      stripeCustomerId: `admin_custom_${userId}_${Date.now()}`,
      planId: 'custom', // Custom plan identifier
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: endOfMonth,
      cancelAtPeriodEnd: false,
    });

    // We'd also need to update the plan lookup to handle custom limits
    // For now, this sets up the infrastructure
  }

  async setUserPlanByStripeId(userId: number, stripePriceId: string): Promise<Subscription> {
    // Handle special "free" plan case
    if (stripePriceId === 'free') {
      // For free plan, use the existing createFreeSubscription method
      // First deactivate any existing active subscription
      const existingSubscription = await this.getUserActiveSubscription(userId);
      if (existingSubscription) {
        await this.updateSubscription(existingSubscription.id, {
          status: 'canceled',
          cancelAtPeriodEnd: false
        });
      }

      return await this.createFreeSubscription(userId);
    }

    // Check if the plan exists, if not create it with proper default values
    let plan = await this.db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, stripePriceId))
      .limit(1)
      .then(rows => rows[0]);

    if (!plan) {
      // Auto-create missing subscription plan with all required defaults
      [plan] = await this.db
        .insert(subscriptionPlans)
        .values({
          id: stripePriceId,
          name: `Plan ${stripePriceId}`,
          description: `Plan created for Stripe price ID: ${stripePriceId}`,
          price: 2000, // Default $20.00 in cents
          interval: 'month',
          visualizationLimit: 100, // Default limit
          embedAccess: false,
          active: true
        })
        .returning();
    }

    // Properly deactivate any existing active subscription for this user
    const existingSubscription = await this.getUserActiveSubscription(userId);
    if (existingSubscription) {
      await this.updateSubscription(existingSubscription.id, {
        status: 'canceled',
        cancelAtPeriodEnd: false
      });
    }

    // Create new subscription using the createSubscription method for consistency
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const newSubscription = await this.createSubscription({
      userId,
      stripeCustomerId: `admin_${userId}_${Date.now()}`,
      planId: stripePriceId,
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: endOfMonth,
      cancelAtPeriodEnd: false,
    });

    return newSubscription;
  }


  async createSubscriptionPlan(planData: any): Promise<SubscriptionPlan> {
    const [plan] = await this.db
      .insert(subscriptionPlans)
      .values(planData)
      .returning();

    return plan;
  }

  async updateSubscriptionPlan(id: string, planData: any): Promise<SubscriptionPlan> {
    const [plan] = await this.db
      .update(subscriptionPlans)
      .set(planData)
      .where(eq(subscriptionPlans.id, id))
      .returning();

    return plan;
  }

  async deleteSubscriptionPlan(id: string): Promise<void> {
    await this.db
      .update(subscriptionPlans)
      .set({ active: false })
      .where(eq(subscriptionPlans.id, id));
  }


  // Lead methods with user support
  async getLeadsByUser(userId: number): Promise<Lead[]> {
    return await this.db
      .select()
      .from(leads)
      .where(eq(leads.userId, userId))
      .orderBy(desc(leads.createdAt));
  }

  // Visualization methods with user support
  async getVisualizationsByUser(userId: number): Promise<Visualization[]> {
    return await this.db
      .select()
      .from(visualizations)
      .where(eq(visualizations.userId, userId))
      .orderBy(desc(visualizations.createdAt));
  }

  async getPoolVisualizationsByUser(userId: number): Promise<PoolVisualization[]> {
    return await this.db
      .select()
      .from(poolVisualizations)
      .where(eq(poolVisualizations.userId, userId))
      .orderBy(desc(poolVisualizations.createdAt));
  }

  async getLandscapeVisualizationsByUser(userId: number): Promise<LandscapeVisualization[]> {
    return await this.db
      .select()
      .from(landscapeVisualizations)
      .where(eq(landscapeVisualizations.userId, userId))
      .orderBy(desc(landscapeVisualizations.createdAt));
  }

  async getTenant(id: number): Promise<Tenant | undefined> {
    const [tenant] = await this.db.select().from(tenants).where(eq(tenants.id, id));
    return tenant || undefined;
  }

  async getTenantBySlug(slug: string): Promise<Tenant | undefined> {
    const [tenant] = await this.db.select().from(tenants).where(eq(tenants.slug, slug));
    return tenant || undefined;
  }

  async getTenantByUserId(userId: number): Promise<Tenant | undefined> {
    const [tenant] = await this.db.select().from(tenants).where(eq(tenants.userId, userId));
    return tenant || undefined;
  }

  async getAllTenants(): Promise<Tenant[]> {
    return await this.db
      .select()
      .from(tenants)
      .orderBy(desc(tenants.createdAt));
  }

  async createTenant(insertTenant: InsertTenant): Promise<Tenant> {
    const [tenant] = await this.db
      .insert(tenants)
      .values(insertTenant)
      .returning();
    return tenant;
  }

  async updateTenant(id: number, insertTenant: Partial<InsertTenant>): Promise<Tenant> {
    const [tenant] = await this.db
      .update(tenants)
      .set(insertTenant)
      .where(eq(tenants.id, id))
      .returning();
    return tenant;
  }

  async getLead(id: number): Promise<Lead | undefined> {
    const [lead] = await this.db.select().from(leads).where(eq(leads.id, id));
    return lead || undefined;
  }

  async getLeadsByTenant(tenantId: number): Promise<Lead[]> {
    return await this.db
      .select()
      .from(leads)
      .where(eq(leads.tenantId, tenantId))
      .orderBy(desc(leads.createdAt));
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const [lead] = await this.db
      .insert(leads)
      .values(insertLead)
      .returning();
    return lead;
  }

  async deleteLead(id: number): Promise<void> {
    await this.db.delete(leads).where(eq(leads.id, id));
  }

  async getVisualization(id: number): Promise<Visualization | undefined> {
    const [visualization] = await this.db.select().from(visualizations).where(eq(visualizations.id, id));
    return visualization || undefined;
  }

  async getVisualizationsByTenant(tenantId: number): Promise<Visualization[]> {
    return await this.db
      .select()
      .from(visualizations)
      .where(eq(visualizations.tenantId, tenantId))
      .orderBy(desc(visualizations.createdAt));
  }

  async createVisualization(insertVisualization: InsertVisualization): Promise<Visualization> {
    const [visualization] = await this.db
      .insert(visualizations)
      .values(insertVisualization)
      .returning();

    // Don't increment tenant generations for authenticated users
    // Only track user-level usage

    return visualization;
  }

  async incrementTenantGenerations(tenantId: number): Promise<void> {
    // Get current tenant data
    const tenant = await this.getTenant(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Check if we need to reset the monthly count (start of new month)
    const now = new Date();
    const lastReset = new Date(tenant.lastResetDate || tenant.createdAt || now);

    let shouldReset = false;
    if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
      shouldReset = true;
    }

    const newCount = shouldReset ? 1 : (tenant.currentMonthGenerations || 0) + 1;
    const limit = tenant.monthlyGenerationLimit || 100;

    // Update the generation count and reset date if needed
    const updateData: any = {
      currentMonthGenerations: newCount,
    };

    if (shouldReset) {
      updateData.lastResetDate = now;
    }

    // Auto-suspend if over limit
    if (newCount > limit && tenant.active) {
      updateData.active = false;
      console.log(`Auto-suspending tenant ${tenant.slug} - exceeded limit: ${newCount}/${limit}`);
    }

    await this.db
      .update(tenants)
      .set(updateData)
      .where(eq(tenants.id, tenantId));
  }

  async updateVisualization(id: number, insertVisualization: Partial<InsertVisualization>): Promise<Visualization> {
    const [visualization] = await this.db
      .update(visualizations)
      .set(insertVisualization)
      .where(eq(visualizations.id, id))
      .returning();
    return visualization;
  }

  async getPoolVisualization(id: number): Promise<PoolVisualization | undefined> {
    const [poolVisualization] = await this.db.select().from(poolVisualizations).where(eq(poolVisualizations.id, id));
    return poolVisualization || undefined;
  }

  async getPoolVisualizationsByTenant(tenantId: number): Promise<PoolVisualization[]> {
    return await this.db
      .select()
      .from(poolVisualizations)
      .where(eq(poolVisualizations.tenantId, tenantId))
      .orderBy(desc(poolVisualizations.createdAt));
  }

  async createPoolVisualization(insertPoolVisualization: InsertPoolVisualization): Promise<PoolVisualization> {
    const [poolVisualization] = await this.db
      .insert(poolVisualizations)
      .values(insertPoolVisualization)
      .returning();

    // Don't increment tenant generations for authenticated users
    // Only track user-level usage

    return poolVisualization;
  }

  async updatePoolVisualization(id: number, insertPoolVisualization: Partial<InsertPoolVisualization>): Promise<PoolVisualization> {
    const [poolVisualization] = await this.db
      .update(poolVisualizations)
      .set(insertPoolVisualization)
      .where(eq(poolVisualizations.id, id))
      .returning();
    return poolVisualization;
  }

  async getLandscapeVisualization(id: number): Promise<LandscapeVisualization | undefined> {
    const [landscapeVisualization] = await this.db.select().from(landscapeVisualizations).where(eq(landscapeVisualizations.id, id));
    return landscapeVisualization || undefined;
  }

  async getLandscapeVisualizationsByTenant(tenantId: number): Promise<LandscapeVisualization[]> {
    return await this.db
      .select()
      .from(landscapeVisualizations)
      .where(eq(landscapeVisualizations.tenantId, tenantId))
      .orderBy(desc(landscapeVisualizations.createdAt));
  }

  async createLandscapeVisualization(insertLandscapeVisualization: InsertLandscapeVisualization): Promise<LandscapeVisualization> {
    const [landscapeVisualization] = await this.db
      .insert(landscapeVisualizations)
      .values(insertLandscapeVisualization)
      .returning();

    // Don't increment tenant generations for authenticated users
    // Only track user-level usage

    return landscapeVisualization;
  }

  async updateLandscapeVisualization(id: number, updates: Partial<InsertLandscapeVisualization & { replicateId?: string; status?: string; generatedImageUrl?: string }>) {
    const [updated] = await this.db
      .update(landscapeVisualizations)
      .set(updates)
      .where(eq(landscapeVisualizations.id, id))
      .returning();

    // Track usage when landscape generation completes
    if (updates.status === 'completed' && updated.tenantId) {
      await this.trackUsage(updated.tenantId, 'landscape');
    }

    return updated;
  }

  async getHalloweenVisualization(id: number): Promise<HalloweenVisualization | undefined> {
    const [halloweenVisualization] = await this.db.select().from(halloweenVisualizations).where(eq(halloweenVisualizations.id, id));
    return halloweenVisualization || undefined;
  }

  async getHalloweenVisualizationsByTenant(tenantId: number): Promise<HalloweenVisualization[]> {
    return await this.db
      .select()
      .from(halloweenVisualizations)
      .where(eq(halloweenVisualizations.tenantId, tenantId))
      .orderBy(desc(halloweenVisualizations.createdAt));
  }

  async getHalloweenVisualizationsByUser(userId: number): Promise<HalloweenVisualization[]> {
    return await this.db
      .select()
      .from(halloweenVisualizations)
      .where(eq(halloweenVisualizations.userId, userId))
      .orderBy(desc(halloweenVisualizations.createdAt));
  }

  async createHalloweenVisualization(insertHalloweenVisualization: InsertHalloweenVisualization): Promise<HalloweenVisualization> {
    const [halloweenVisualization] = await this.db
      .insert(halloweenVisualizations)
      .values(insertHalloweenVisualization)
      .returning();

    // Don't increment tenant generations for authenticated users
    // Only track user-level usage

    return halloweenVisualization;
  }

  async updateHalloweenVisualization(id: number, insertHalloweenVisualization: Partial<InsertHalloweenVisualization>): Promise<HalloweenVisualization> {
    const [halloweenVisualization] = await this.db
      .update(halloweenVisualizations)
      .set(insertHalloweenVisualization)
      .where(eq(halloweenVisualizations.id, id))
      .returning();
    return halloweenVisualization;
  }

  async getChristmasLightsVisualization(id: number): Promise<ChristmasLightsVisualization | undefined> {
    const [christmasVisualization] = await this.db.select().from(christmasLightsVisualizations).where(eq(christmasLightsVisualizations.id, id));
    return christmasVisualization || undefined;
  }

  async getChristmasLightsVisualizationsByTenant(tenantId: number): Promise<ChristmasLightsVisualization[]> {
    return await this.db
      .select()
      .from(christmasLightsVisualizations)
      .where(eq(christmasLightsVisualizations.tenantId, tenantId))
      .orderBy(desc(christmasLightsVisualizations.createdAt));
  }

  async getChristmasLightsVisualizationsByUser(userId: number): Promise<ChristmasLightsVisualization[]> {
    return await this.db
      .select()
      .from(christmasLightsVisualizations)
      .where(eq(christmasLightsVisualizations.userId, userId))
      .orderBy(desc(christmasLightsVisualizations.createdAt));
  }

  async createChristmasLightsVisualization(insertChristmasVisualization: InsertChristmasLightsVisualization): Promise<ChristmasLightsVisualization> {
    const [christmasVisualization] = await this.db
      .insert(christmasLightsVisualizations)
      .values(insertChristmasVisualization)
      .returning();

    // Don't increment tenant generations for authenticated users
    // Only track user-level usage

    return christmasVisualization;
  }

  async updateChristmasLightsVisualization(id: number, insertChristmasVisualization: Partial<InsertChristmasLightsVisualization>): Promise<ChristmasLightsVisualization> {
    const [christmasVisualization] = await this.db
      .update(christmasLightsVisualizations)
      .set(insertChristmasVisualization)
      .where(eq(christmasLightsVisualizations.id, id))
      .returning();
    return christmasVisualization;
  }

  async trackUsage(tenantId: number, type: 'visualization' | 'landscape' | 'pool'): Promise<void> {
    // Usage tracking temporarily disabled
    // TODO: Implement proper usage tracking when usageStats table is created
    console.log(`Usage tracked for tenant ${tenantId}, type: ${type}`);
    return Promise.resolve();
  }

  async getUsageStats(tenantId: number, days: number = 30): Promise<any[]> {
    // Usage stats temporarily disabled - return empty data
    // TODO: Implement proper usage stats when usageStats table is created
    return Promise.resolve([]);
  }

  // Admin methods
  async getAllUsersWithUsage(): Promise<Array<User & { usage?: any; subscription?: Subscription }>> {
    const allUsers = await this.db.select().from(users);

    const usersWithData = await Promise.all(allUsers.map(async (user) => {
      const [usageLimits, subscription] = await Promise.all([
        this.checkUsageLimits(user.id),
        this.getUserActiveSubscription(user.id)
      ]);

      return {
        ...user,
        usage: usageLimits,
        subscription: subscription || undefined
      };
    }));

    return usersWithData;
  }

  // Feature override methods
  async getUserFeatureOverrides(userId: number): Promise<UserFeatureOverrides | undefined> {
    const [override] = await this.db
      .select()
      .from(userFeatureOverrides)
      .where(eq(userFeatureOverrides.userId, userId));
    return override || undefined;
  }

  async setUserEmbedOverride(userId: number, embedOverride: boolean | null, updatedBy: string): Promise<UserFeatureOverrides> {
    // Upsert the override
    const [result] = await this.db
      .insert(userFeatureOverrides)
      .values({
        userId,
        embedOverride,
        updatedBy,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userFeatureOverrides.userId,
        set: {
          embedOverride,
          updatedBy,
          updatedAt: new Date(),
        },
      })
      .returning();
    
    console.log(`[Admin] Set embed override for user ${userId}: ${embedOverride}`);
    return result;
  }

  async computeEmbedAccess(userId: number): Promise<boolean> {
    // Check for embed access including team membership
    
    try {
      // First, check for admin override
      const [override] = await this.db
        .select()
        .from(userFeatureOverrides)
        .where(eq(userFeatureOverrides.userId, userId));
      
      if (override && override.embedOverride !== null) {
        console.log(`[Embed] User ${userId} has admin override: ${override.embedOverride}`);
        return override.embedOverride;
      }
      
      // Use the robust team access check
      const teamAccess = await this.getUserTeamAccess(userId);
      const effectiveUserId = teamAccess.effectiveUserId;
      const isTeamMember = teamAccess.isMember;
      
      if (isTeamMember) {
        console.log(`[Embed] User ${userId} is team member, using owner ${effectiveUserId}'s subscription`);
      }
      
      // Get the effective user's subscription (either own or team owner's)
      const subscription = await this.getUserActiveSubscription(effectiveUserId);
      
      // Check for Contractor and Business Pro plan IDs
      const CONTRACTOR_PLAN_ID = 'price_1S5X2XBY2SPm2HvO2he9Unto';
      const BUSINESS_PRO_PLAN_ID = 'price_1SGN4YBY2SPm2HvOrpREWCn1';
      
      // If they have these exact plan IDs and it's active, they get embed
      if (subscription && subscription.status === 'active') {
        if (subscription.planId === CONTRACTOR_PLAN_ID || subscription.planId === BUSINESS_PRO_PLAN_ID) {
          console.log(`[Embed] User ${userId} - HAS ${subscription.planId === BUSINESS_PRO_PLAN_ID ? 'BUSINESS PRO' : 'CONTRACTOR'} PLAN ${isTeamMember ? '(via team)' : ''} - EMBED ENABLED`);
          return true;
        }
      }
      
      // Also check if the plan in subscription_plans table has embed access
      if (subscription && subscription.status === 'active') {
        const plan = await this.getSubscriptionPlan(subscription.planId);
        if (plan) {
          // Check if plan name includes pro/contractor/business (case insensitive)
          const normalizedName = (plan.name || '').trim().toLowerCase();
          if (normalizedName === 'pro' || normalizedName === 'contractor' || normalizedName === 'business pro' || normalizedName === 'custom') {
            console.log(`[Embed] User ${userId} - ${plan.name} plan detected ${isTeamMember ? '(via team)' : ''} - EMBED ENABLED`);
            return true;
          }
          // Also check if the plan has embedAccess flag set to true
          if (plan.embedAccess === true) {
            console.log(`[Embed] User ${userId} - Plan has embedAccess=true ${isTeamMember ? '(via team)' : ''} - EMBED ENABLED`);
            return true;
          }
        }
      }
      
      console.log(`[Embed] User ${userId} - Not Pro/Contractor/Business Pro/Custom - NO EMBED`);
      return false;
    } catch (error) {
      console.error(`[Embed] Error checking embed access for user ${userId}:`, error);
      return false;
    }
  }
  
  // Team methods implementation
  async getTeamByOwnerId(ownerId: number): Promise<Team | undefined> {
    const [team] = await this.db.select().from(teams).where(eq(teams.ownerId, ownerId));
    return team || undefined;
  }

  async getTeamById(id: number): Promise<Team | undefined> {
    const [team] = await this.db.select().from(teams).where(eq(teams.id, id));
    return team || undefined;
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const [team] = await this.db
      .insert(teams)
      .values(insertTeam)
      .returning();
    return team;
  }

  async updateTeam(id: number, insertTeam: Partial<InsertTeam>): Promise<Team> {
    const [team] = await this.db
      .update(teams)
      .set({ ...insertTeam, updatedAt: new Date() })
      .where(eq(teams.id, id))
      .returning();
    return team;
  }

  async getTeamMembers(teamId: number): Promise<TeamMember[]> {
    return await this.db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.teamId, teamId));
  }

  async getTeamMemberByEmail(teamId: number, email: string): Promise<TeamMember | undefined> {
    const [member] = await this.db
      .select()
      .from(teamMembers)
      .where(and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.email, email)
      ));
    return member || undefined;
  }

  async addTeamMember(insertMember: InsertTeamMember): Promise<TeamMember> {
    const [member] = await this.db
      .insert(teamMembers)
      .values(insertMember)
      .returning();
    return member;
  }

  async updateTeamMember(id: number, insertMember: Partial<InsertTeamMember>): Promise<TeamMember> {
    const [member] = await this.db
      .update(teamMembers)
      .set(insertMember)
      .where(eq(teamMembers.id, id))
      .returning();
    return member;
  }

  async removeTeamMember(id: number): Promise<void> {
    await this.db
      .delete(teamMembers)
      .where(eq(teamMembers.id, id));
  }

  async getUserTeams(userId: number): Promise<Team[]> {
    // Get teams where user is owner
    const ownedTeams = await this.db
      .select()
      .from(teams)
      .where(eq(teams.ownerId, userId));
    
    // Get teams where user is a member
    const memberTeams = await this.db
      .select({ team: teams })
      .from(teamMembers)
      .innerJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.userId, userId));
    
    // Combine and deduplicate
    const allTeams = [...ownedTeams, ...memberTeams.map(m => m.team)];
    const uniqueTeams = Array.from(new Map(allTeams.map(t => [t.id, t])).values());
    
    return uniqueTeams;
  }

  async getTeamMemberByToken(token: string): Promise<(TeamMember & { team: Team }) | undefined> {
    const result = await this.db
      .select({
        member: teamMembers,
        team: teams
      })
      .from(teamMembers)
      .innerJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.invitationToken, token))
      .limit(1);
    
    if (result.length === 0) return undefined;
    
    return {
      ...result[0].member,
      team: result[0].team
    };
  }

  async acceptTeamInvitation(token: string, userId: number): Promise<TeamMember> {
    // Get the user's email to update the invitation record
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const [member] = await this.db
      .update(teamMembers)
      .set({
        userId,
        email: user.email, // Update email to authenticated user's email
        status: 'active',
        joinedAt: new Date()
      })
      .where(eq(teamMembers.invitationToken, token))
      .returning();
    
    if (!member) {
      throw new Error('Invitation not found');
    }
    
    return member;
  }

  async getTeamMemberByJoinCode(joinCode: string): Promise<(TeamMember & { team: Team }) | undefined> {
    const result = await this.db
      .select({
        member: teamMembers,
        team: teams
      })
      .from(teamMembers)
      .innerJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.joinCode, joinCode))
      .limit(1);
    
    if (result.length === 0) return undefined;
    
    return {
      ...result[0].member,
      team: result[0].team
    };
  }

  async acceptTeamInvitationByJoinCode(joinCode: string, userId: number): Promise<TeamMember> {
    // Get the user's email to update the invitation record
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const [member] = await this.db
      .update(teamMembers)
      .set({
        userId,
        email: user.email, // Update email to authenticated user's email
        status: 'active',
        joinedAt: new Date()
      })
      .where(eq(teamMembers.joinCode, joinCode))
      .returning();
    
    if (!member) {
      throw new Error('Join code not found');
    }
    
    return member;
  }

  async hasBusinessProAccess(userId: number): Promise<boolean> {
    // Check if user has Business Pro access (either as owner or team member)
    const BUSINESS_PRO_PLAN_ID = 'price_1SGN4YBY2SPm2HvOrpREWCn1';
    
    try {
      // Use the robust team access check
      const teamAccess = await this.getUserTeamAccess(userId);
      const effectiveUserId = teamAccess.effectiveUserId;
      
      if (teamAccess.isMember) {
        console.log(`[Business Pro] User ${userId} is team member, checking owner ${effectiveUserId}'s subscription`);
      }
      
      // Check if the effective user has Business Pro subscription
      const subscription = await this.getUserActiveSubscription(effectiveUserId);
      const hasAccess = subscription?.status === 'active' && subscription?.planId === BUSINESS_PRO_PLAN_ID;
      
      if (hasAccess && teamAccess.isMember) {
        console.log(`[Business Pro] Team member ${userId} has Business Pro access via owner ${effectiveUserId}`);
      }
      
      return hasAccess;
      
    } catch (error) {
      console.error(`Error checking Business Pro access for user ${userId}:`, error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();