import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  companyName: text("company_name").notNull(),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").default("#2563EB"),
  secondaryColor: text("secondary_color").default("#059669"),
  phone: text("phone"),
  contactPhone: text("contact_phone"), // Separate contact phone for lead capture
  email: text("email"),
  address: text("address"),
  description: text("description"),
  showPricing: boolean("show_pricing").default(true),
  requirePhone: boolean("require_phone").default(false),
  active: boolean("active").default(true),
  monthlyGenerationLimit: integer("monthly_generation_limit").default(100),
  currentMonthGenerations: integer("current_month_generations").default(0),
  lastResetDate: timestamp("last_reset_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  businessName: text("business_name"),
  address: text("address"),
  projectDetails: text("project_details"),
  timeline: text("timeline"),
  selectedStyles: jsonb("selected_styles"),
  originalImageUrl: text("original_image_url"),
  generatedImageUrl: text("generated_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const visualizations = pgTable("visualizations", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  originalImageUrl: text("original_image_url").notNull(),
  generatedImageUrl: text("generated_image_url"),
  selectedRoof: text("selected_roof"),
  selectedSiding: text("selected_siding"),
  selectedSurpriseMe: text("selected_surprise_me"),
  replicateId: text("replicate_id"),
  status: text("status").default("pending"), // pending, processing, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
});

export const poolVisualizations = pgTable("pool_visualizations", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  originalImageUrl: text("original_image_url").notNull(),
  generatedImageUrl: text("generated_image_url"),
  selectedPoolType: text("selected_pool_type"),
  selectedPoolSize: text("selected_pool_size"),
  selectedDecking: text("selected_decking"),
  selectedLandscaping: text("selected_landscaping"),
  selectedFeatures: text("selected_features"),
  replicateId: text("replicate_id"),
  status: text("status").default("pending"), // pending, processing, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
});

export const landscapeVisualizations = pgTable("landscape_visualizations", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  originalImageUrl: text("original_image_url").notNull(),
  generatedImageUrl: text("generated_image_url"),
  selectedCurbing: text("selected_curbing"),
  selectedLandscape: text("selected_landscape"),
  selectedPatios: text("selected_patios"),
  replicateId: text("replicate_id"),
  status: text("status").default("pending"), // pending, processing, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
});

export const tenantsRelations = relations(tenants, ({ many }) => ({
  leads: many(leads),
  visualizations: many(visualizations),
  poolVisualizations: many(poolVisualizations),
  landscapeVisualizations: many(landscapeVisualizations),
}));

export const leadsRelations = relations(leads, ({ one }) => ({
  tenant: one(tenants, {
    fields: [leads.tenantId],
    references: [tenants.id],
  }),
}));

export const visualizationsRelations = relations(visualizations, ({ one }) => ({
  tenant: one(tenants, {
    fields: [visualizations.tenantId],
    references: [tenants.id],
  }),
}));

export const poolVisualizationsRelations = relations(poolVisualizations, ({ one }) => ({
  tenant: one(tenants, {
    fields: [poolVisualizations.tenantId],
    references: [tenants.id],
  }),
}));

export const landscapeVisualizationsRelations = relations(landscapeVisualizations, ({ one }) => ({
  tenant: one(tenants, {
    fields: [landscapeVisualizations.tenantId],
    references: [tenants.id],
  }),
}));

export const usageStats = pgTable("usage_stats", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  date: timestamp("date").defaultNow(),
  imageGenerations: integer("image_generations").default(0),
  landscapeGenerations: integer("landscape_generations").default(0),
  poolGenerations: integer("pool_generations").default(0),
  totalGenerations: integer("total_generations").default(0),
});

export const usageStatsRelations = relations(usageStats, ({ one }) => ({
  tenant: one(tenants, {
    fields: [usageStats.tenantId],
    references: [tenants.id],
  }),
}));

export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
});

export const insertVisualizationSchema = createInsertSchema(visualizations).omit({
  id: true,
  createdAt: true,
});

export const insertPoolVisualizationSchema = createInsertSchema(poolVisualizations).omit({
  id: true,
  createdAt: true,
});

export const insertLandscapeVisualizationSchema = createInsertSchema(landscapeVisualizations).omit({
  id: true,
  createdAt: true,
});

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Visualization = typeof visualizations.$inferSelect;
export type InsertVisualization = z.infer<typeof insertVisualizationSchema>;
export type PoolVisualization = typeof poolVisualizations.$inferSelect;
export type InsertPoolVisualization = z.infer<typeof insertPoolVisualizationSchema>;
export type LandscapeVisualization = typeof landscapeVisualizations.$inferSelect;
export type InsertLandscapeVisualization = z.infer<typeof insertLandscapeVisualizationSchema>;
export type UsageStats = typeof usageStats.$inferSelect;

export const insertUsageStatsSchema = createInsertSchema(usageStats).omit({
  id: true,
  date: true,
});
