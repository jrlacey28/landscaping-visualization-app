import { 
  users, subscriptions, subscriptionPlans, userUsage, tenants, leads, visualizations, poolVisualizations, landscapeVisualizations,
  type User, type InsertUser, type Subscription, type InsertSubscription, type SubscriptionPlan, type UserUsage, type InsertUserUsage,
  type Tenant, type InsertTenant, type Lead, type InsertLead, type Visualization, type InsertVisualization, 
  type PoolVisualization, type InsertPoolVisualization, type LandscapeVisualization, type InsertLandscapeVisualization 
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

  // Admin methods
  getAllUsersWithUsage(): Promise<Array<User & { usage?: UserUsage; subscription?: Subscription }>>;

  // Legacy tenant usage stats methods
  trackUsage(tenantId: number, type: 'visualization' | 'landscape' | 'pool'): Promise<void>;
  getUsageStats(tenantId: number, days?: number): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  private db = db;

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user || undefined;
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

    // Try to get existing usage record
    const existingUsage = await this.getUserUsage(userId, month, year);

    if (existingUsage) {
      // Update existing record
      const updates: Partial<InsertUserUsage> = {
        totalCount: existingUsage.totalCount + 1,
        updatedAt: now,
      };

      if (type === 'visualization') {
        updates.visualizationCount = existingUsage.visualizationCount + 1;
      } else if (type === 'landscape') {
        updates.landscapeCount = existingUsage.landscapeCount + 1;
      } else if (type === 'pool') {
        updates.poolCount = existingUsage.poolCount + 1;
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
        userId,
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

    // Get user's current usage
    const usage = await this.getUserUsage(userId, month, year);
    const currentUsage = usage ? usage.totalCount : 0;

    // Get user's subscription
    const subscription = await this.getUserActiveSubscription(userId);
    
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
    const canUse = plan.visualizationLimit === -1 || currentUsage < plan.visualizationLimit;
    
    return {
      canUse,
      currentUsage,
      limit: plan.visualizationLimit,
      planName: plan.name
    };
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
    
    // Increment the tenant's generation count
    await this.incrementTenantGenerations(insertVisualization.tenantId);
    
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
    
    // Increment the tenant's generation count
    await this.incrementTenantGenerations(insertPoolVisualization.tenantId);
    
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
    
    // Increment the tenant's generation count
    await this.incrementTenantGenerations(insertLandscapeVisualization.tenantId);
    
    return landscapeVisualization;
  }

  async updateLandscapeVisualization(id: number, updates: Partial<InsertLandscapeVisualization & { replicateId?: string; status?: string; generatedImageUrl?: string }>) {
    const [updated] = await this.db
      .update(landscapeVisualizations)
      .set(updates)
      .where(eq(landscapeVisualizations.id, id))
      .returning();

    // Track usage when landscape generation completes
    if (updates.status === 'completed') {
      await this.trackUsage(updated.tenantId, 'landscape');
    }

    return updated;
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
}

export const storage = new DatabaseStorage();