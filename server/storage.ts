import { tenants, leads, visualizations, poolVisualizations, landscapeVisualizations, type Tenant, type InsertTenant, type Lead, type InsertLead, type Visualization, type InsertVisualization, type PoolVisualization, type InsertPoolVisualization, type LandscapeVisualization, type InsertLandscapeVisualization } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte } from "drizzle-orm";

// Usage stats functionality temporarily disabled
// TODO: Implement proper usageStats table in schema when needed


export interface IStorage {
  // Tenant methods
  getTenant(id: number): Promise<Tenant | undefined>;
  getTenantBySlug(slug: string): Promise<Tenant | undefined>;
  getAllTenants(): Promise<Tenant[]>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  updateTenant(id: number, tenant: Partial<InsertTenant>): Promise<Tenant>;

  // Lead methods
  getLead(id: number): Promise<Lead | undefined>;
  getLeadsByTenant(tenantId: number): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  deleteLead(id: number): Promise<void>;

  // Visualization methods
  getVisualization(id: number): Promise<Visualization | undefined>;
  getVisualizationsByTenant(tenantId: number): Promise<Visualization[]>;
  createVisualization(visualization: InsertVisualization): Promise<Visualization>;
  updateVisualization(id: number, visualization: Partial<InsertVisualization>): Promise<Visualization>;

  // Pool Visualization methods
  getPoolVisualization(id: number): Promise<PoolVisualization | undefined>;
  getPoolVisualizationsByTenant(tenantId: number): Promise<PoolVisualization[]>;
  createPoolVisualization(poolVisualization: InsertPoolVisualization): Promise<PoolVisualization>;
  updatePoolVisualization(id: number, poolVisualization: Partial<InsertPoolVisualization>): Promise<PoolVisualization>;

  // Landscape Visualization methods
  getLandscapeVisualization(id: number): Promise<LandscapeVisualization | undefined>;
  getLandscapeVisualizationsByTenant(tenantId: number): Promise<LandscapeVisualization[]>;
  createLandscapeVisualization(landscapeVisualization: InsertLandscapeVisualization): Promise<LandscapeVisualization>;
  updateLandscapeVisualization(id: number, landscapeVisualization: Partial<InsertLandscapeVisualization>): Promise<LandscapeVisualization>;

  // Usage stats methods
  trackUsage(tenantId: number, type: 'visualization' | 'landscape' | 'pool'): Promise<void>;
  getUsageStats(tenantId: number, days?: number): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // Assuming 'db' is initialized and available within the class scope
  private db = db;

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
}

export const storage = new DatabaseStorage();