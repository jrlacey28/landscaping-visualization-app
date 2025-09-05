import { tenants, leads, visualizations, poolVisualizations, landscapeVisualizations, type Tenant, type InsertTenant, type Lead, type InsertLead, type Visualization, type InsertVisualization, type PoolVisualization, type InsertPoolVisualization, type LandscapeVisualization, type InsertLandscapeVisualization } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte } from "drizzle-orm";

// Assuming usageStats table definition exists in @shared/schema
// import { usageStats, type UsageStat } from "@shared/schema";

// Placeholder for the usageStats table definition if it's not imported
// In a real scenario, this should be properly imported from your schema file.
const usageStats = {
  id: { type: 'number', primaryKey: true },
  tenantId: { type: 'number' },
  date: { type: 'date' },
  totalGenerations: { type: 'number', default: 0 },
  imageGenerations: { type: 'number', default: 0 },
  landscapeGenerations: { type: 'number', default: 0 },
  poolGenerations: { type: 'number', default: 0 },
};


export interface IStorage {
  // Tenant methods
  getTenant(id: number): Promise<Tenant | undefined>;
  getTenantBySlug(slug: string): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  updateTenant(id: number, tenant: Partial<InsertTenant>): Promise<Tenant>;

  // Lead methods
  getLead(id: number): Promise<Lead | undefined>;
  getLeadsByTenant(tenantId: number): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;

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
    return visualization;
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

  async trackUsage(tenantId: number, type: 'visualization' | 'landscape' | 'pool') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // Try to get today's stats for the tenant
      const existingStats = await this.db
        .select()
        .from(usageStats)
        .where(
          and(
            eq(usageStats.tenantId, tenantId),
            gte(usageStats.date, today)
          )
        )
        .limit(1);

      if (existingStats.length > 0) {
        // Update existing stats
        const stats = existingStats[0];
        const updates: any = {
          totalGenerations: stats.totalGenerations + 1
        };

        if (type === 'visualization') {
          updates.imageGenerations = stats.imageGenerations + 1;
        } else if (type === 'landscape') {
          updates.landscapeGenerations = stats.landscapeGenerations + 1;
        } else if (type === 'pool') {
          updates.poolGenerations = stats.poolGenerations + 1;
        }

        await this.db
          .update(usageStats)
          .set(updates)
          .where(eq(usageStats.id, stats.id));
      } else {
        // Create new stats entry
        const newStats: any = {
          tenantId,
          date: today,
          totalGenerations: 1,
          imageGenerations: type === 'visualization' ? 1 : 0,
          landscapeGenerations: type === 'landscape' ? 1 : 0,
          poolGenerations: type === 'pool' ? 1 : 0,
        };

        await this.db.insert(usageStats).values(newStats);
      }
    } catch (error) {
      console.error('Error tracking usage:', error);
      // Don't fail the main operation if usage tracking fails
    }
  }

  async getUsageStats(tenantId: number, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.db
      .select()
      .from(usageStats)
      .where(
        and(
          eq(usageStats.tenantId, tenantId),
          gte(usageStats.date, startDate)
        )
      )
      .orderBy(desc(usageStats.date));
  }
}

export const storage = new DatabaseStorage();