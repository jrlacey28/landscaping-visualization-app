import { tenants, leads, visualizations, poolVisualizations, type Tenant, type InsertTenant, type Lead, type InsertLead, type Visualization, type InsertVisualization, type PoolVisualization, type InsertPoolVisualization } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

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
}

export class DatabaseStorage implements IStorage {
  async getTenant(id: number): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant || undefined;
  }

  async getTenantBySlug(slug: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, slug));
    return tenant || undefined;
  }

  async createTenant(insertTenant: InsertTenant): Promise<Tenant> {
    const [tenant] = await db
      .insert(tenants)
      .values(insertTenant)
      .returning();
    return tenant;
  }

  async updateTenant(id: number, insertTenant: Partial<InsertTenant>): Promise<Tenant> {
    const [tenant] = await db
      .update(tenants)
      .set(insertTenant)
      .where(eq(tenants.id, id))
      .returning();
    return tenant;
  }

  async getLead(id: number): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead || undefined;
  }

  async getLeadsByTenant(tenantId: number): Promise<Lead[]> {
    return await db
      .select()
      .from(leads)
      .where(eq(leads.tenantId, tenantId))
      .orderBy(desc(leads.createdAt));
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const [lead] = await db
      .insert(leads)
      .values(insertLead)
      .returning();
    return lead;
  }

  async getVisualization(id: number): Promise<Visualization | undefined> {
    const [visualization] = await db.select().from(visualizations).where(eq(visualizations.id, id));
    return visualization || undefined;
  }

  async getVisualizationsByTenant(tenantId: number): Promise<Visualization[]> {
    return await db
      .select()
      .from(visualizations)
      .where(eq(visualizations.tenantId, tenantId))
      .orderBy(desc(visualizations.createdAt));
  }

  async createVisualization(insertVisualization: InsertVisualization): Promise<Visualization> {
    const [visualization] = await db
      .insert(visualizations)
      .values(insertVisualization)
      .returning();
    return visualization;
  }

  async updateVisualization(id: number, insertVisualization: Partial<InsertVisualization>): Promise<Visualization> {
    const [visualization] = await db
      .update(visualizations)
      .set(insertVisualization)
      .where(eq(visualizations.id, id))
      .returning();
    return visualization;
  }

  async getPoolVisualization(id: number): Promise<PoolVisualization | undefined> {
    const [poolVisualization] = await db.select().from(poolVisualizations).where(eq(poolVisualizations.id, id));
    return poolVisualization || undefined;
  }

  async getPoolVisualizationsByTenant(tenantId: number): Promise<PoolVisualization[]> {
    return await db
      .select()
      .from(poolVisualizations)
      .where(eq(poolVisualizations.tenantId, tenantId))
      .orderBy(desc(poolVisualizations.createdAt));
  }

  async createPoolVisualization(insertPoolVisualization: InsertPoolVisualization): Promise<PoolVisualization> {
    const [poolVisualization] = await db
      .insert(poolVisualizations)
      .values(insertPoolVisualization)
      .returning();
    return poolVisualization;
  }

  async updatePoolVisualization(id: number, insertPoolVisualization: Partial<InsertPoolVisualization>): Promise<PoolVisualization> {
    const [poolVisualization] = await db
      .update(poolVisualizations)
      .set(insertPoolVisualization)
      .where(eq(poolVisualizations.id, id))
      .returning();
    return poolVisualization;
  }
}

export const storage = new DatabaseStorage();