import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for customer accounts
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"), // Made optional for Google OAuth users
  googleId: text("google_id"),
  profileImageUrl: text("profile_image_url"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  businessName: text("business_name"),
  phone: text("phone"),
  address: text("address"),
  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: text("email_verification_token"),
  resetPasswordToken: text("reset_password_token"),
  resetPasswordExpires: timestamp("reset_password_expires"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscription plans
export const subscriptionPlans = pgTable("subscription_plans", {
  id: text("id").primaryKey(), // Stripe price ID
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // in cents
  interval: text("interval").notNull(), // month, year
  visualizationLimit: integer("visualization_limit").notNull(), // -1 for unlimited
  embedAccess: boolean("embed_access").default(false),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// User subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  stripeCustomerId: text("stripe_customer_id").notNull(),
  planId: text("plan_id").notNull().references(() => subscriptionPlans.id, { onDelete: "restrict", onUpdate: "cascade" }),
  status: text("status").notNull(), // active, past_due, canceled, incomplete
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User usage tracking
export const userUsage = pgTable("user_usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  visualizationCount: integer("visualization_count").default(0),
  poolCount: integer("pool_count").default(0),
  landscapeCount: integer("landscape_count").default(0),
  totalCount: integer("total_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tenant-owned visualizations for white-label customers
export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Links to user account
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
  embedEnabled: boolean("embed_enabled").default(false),
  embedCtaText: text("embed_cta_text").default("Get Your Free Quote"),
  embedCtaPhone: text("embed_cta_phone"),
  embedCtaUrl: text("embed_cta_url"),
  embedPrimaryColor: text("embed_primary_color").default("#2563EB"),
  embedSecondaryColor: text("embed_secondary_color").default("#059669"),
  monthlyGenerationLimit: integer("monthly_generation_limit").default(100),
  currentMonthGenerations: integer("current_month_generations").default(0),
  lastResetDate: timestamp("last_reset_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // For user-generated leads
  tenantId: integer("tenant_id").references(() => tenants.id), // For tenant-captured leads
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
  userId: integer("user_id").references(() => users.id), // For user-owned visualizations
  tenantId: integer("tenant_id").references(() => tenants.id), // For tenant-owned visualizations
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
  userId: integer("user_id").references(() => users.id), // For user-owned visualizations
  tenantId: integer("tenant_id").references(() => tenants.id), // For tenant-owned visualizations
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
  userId: integer("user_id").references(() => users.id), // For user-owned visualizations
  tenantId: integer("tenant_id").references(() => tenants.id), // For tenant-owned visualizations
  originalImageUrl: text("original_image_url").notNull(),
  generatedImageUrl: text("generated_image_url"),
  selectedCurbing: text("selected_curbing"),
  selectedLandscape: text("selected_landscape"),
  selectedPatios: text("selected_patios"),
  replicateId: text("replicate_id"),
  status: text("status").default("pending"), // pending, processing, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  subscription: one(subscriptions),
  tenant: one(tenants),
  usage: many(userUsage),
  visualizations: many(visualizations),
  poolVisualizations: many(poolVisualizations),
  landscapeVisualizations: many(landscapeVisualizations),
  leads: many(leads),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [subscriptions.planId],
    references: [subscriptionPlans.id],
  }),
}));

export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  user: one(users, {
    fields: [tenants.userId],
    references: [users.id],
  }),
  leads: many(leads),
  visualizations: many(visualizations),
  poolVisualizations: many(poolVisualizations),
  landscapeVisualizations: many(landscapeVisualizations),
}));

export const leadsRelations = relations(leads, ({ one }) => ({
  user: one(users, {
    fields: [leads.userId],
    references: [users.id],
  }),
  tenant: one(tenants, {
    fields: [leads.tenantId],
    references: [tenants.id],
  }),
}));

export const visualizationsRelations = relations(visualizations, ({ one }) => ({
  user: one(users, {
    fields: [visualizations.userId],
    references: [users.id],
  }),
  tenant: one(tenants, {
    fields: [visualizations.tenantId],
    references: [tenants.id],
  }),
}));

export const poolVisualizationsRelations = relations(poolVisualizations, ({ one }) => ({
  user: one(users, {
    fields: [poolVisualizations.userId],
    references: [users.id],
  }),
  tenant: one(tenants, {
    fields: [poolVisualizations.tenantId],
    references: [tenants.id],
  }),
}));

export const landscapeVisualizationsRelations = relations(landscapeVisualizations, ({ one }) => ({
  user: one(users, {
    fields: [landscapeVisualizations.userId],
    references: [users.id],
  }),
  tenant: one(tenants, {
    fields: [landscapeVisualizations.tenantId],
    references: [tenants.id],
  }),
}));

// Legacy tenant usage stats - keeping for compatibility
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

export const userUsageRelations = relations(userUsage, ({ one }) => ({
  user: one(users, {
    fields: [userUsage.userId],
    references: [users.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  emailVerified: true,
  emailVerificationToken: true,
  resetPasswordToken: true,
  resetPasswordExpires: true,
}).partial({
  passwordHash: true, // Make passwordHash optional for Google OAuth users
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  createdAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserUsageSchema = createInsertSchema(userUsage).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

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

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type UserUsage = typeof userUsage.$inferSelect;
export type InsertUserUsage = z.infer<typeof insertUserUsageSchema>;
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
