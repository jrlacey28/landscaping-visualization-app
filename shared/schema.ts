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
  halloweenCount: integer("halloween_count").default(0),
  christmasLightsCount: integer("christmas_lights_count").default(0),
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
  clientType: text("client_type").default("standard"), // standard, enterprise
  isEnterprise: boolean("is_enterprise").default(false),
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
  embedVisitorLimit: integer("embed_visitor_limit").default(3),
  embedRequireQuoteAfterLimit: boolean("embed_require_quote_after_limit").default(false),
  embedQuoteGateTitle: text("embed_quote_gate_title").default("Ready for a free quote?"),
  embedQuoteGateMessage: text("embed_quote_gate_message").default("You've reached the free visualization limit. Request a quote to keep planning your project."),
  embedQuoteFormTitle: text("embed_quote_form_title").default("Get your free quote"),
  embedQuoteFormMessage: text("embed_quote_form_message").default("Send your project details and the team will follow up with a quote."),
  embedQuoteDestinationType: text("embed_quote_destination_type").default("email"), // email, phone, link
  embedQuoteRecipientEmail: text("embed_quote_recipient_email"),
  embedQuoteSuccessRedirectUrl: text("embed_quote_success_redirect_url"),
  embedQuoteIncludeImages: boolean("embed_quote_include_images").default(true),
  embedCustomizations: jsonb("embed_customizations"),
  monthlyGenerationLimit: integer("monthly_generation_limit").default(100),
  currentMonthGenerations: integer("current_month_generations").default(0),
  visualizationRolloverEnabled: boolean("visualization_rollover_enabled").notNull().default(false),
  visualizationRolloverBalance: integer("visualization_rollover_balance").notNull().default(0),
  visualizationRolloverCap: integer("visualization_rollover_cap").notNull().default(0), // 0 means no cap
  visualizationRolloverLastProcessedAt: timestamp("visualization_rollover_last_processed_at"),
  lastResetDate: timestamp("last_reset_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const embedVisitorUsage = pgTable("embed_visitor_usage", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  visitorKey: text("visitor_key").notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  visualizationCount: integer("visualization_count").default(0),
  quoteClickCount: integer("quote_click_count").default(0),
  firstSeenAt: timestamp("first_seen_at").defaultNow(),
  lastSeenAt: timestamp("last_seen_at").defaultNow(),
  lastGeneratedAt: timestamp("last_generated_at"),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // For user-generated leads
  tenantId: integer("tenant_id").references(() => tenants.id), // For tenant-captured leads
  leadType: text("lead_type").default("standard"), // standard, quote, bug, feature
  service: text("service"), // landscape, roofing-siding, pools
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  businessName: text("business_name"),
  address: text("address"),
  location: text("location"), // City, State for quote requests
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

export const halloweenVisualizations = pgTable("halloween_visualizations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // For user-owned visualizations
  tenantId: integer("tenant_id").references(() => tenants.id), // For tenant-owned visualizations
  originalImageUrl: text("original_image_url").notNull(),
  generatedImageUrl: text("generated_image_url"),
  selectedDecorations: text("selected_decorations"),
  nightMode: boolean("night_mode"),
  spookyMode: boolean("spooky_mode"),
  replicateId: text("replicate_id"),
  status: text("status").default("pending"), // pending, processing, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
});

export const christmasLightsVisualizations = pgTable("christmas_lights_visualizations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // For user-owned visualizations
  tenantId: integer("tenant_id").references(() => tenants.id), // For tenant-owned visualizations
  originalImageUrl: text("original_image_url").notNull(),
  generatedImageUrl: text("generated_image_url"),
  lightType: text("light_type").notNull(), // c9_rope_lights
  lightColor: text("light_color").notNull(), // warm_white, pure_white, cool_white, rgb
  addSnow: boolean("add_snow").default(false),
  replicateId: text("replicate_id"),
  status: text("status").default("pending"), // pending, processing, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
});

export const generationProjects = pgTable("generation_projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  address: text("address"),
  notes: text("notes"),
  coverImageUrl: text("cover_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projectGenerations = pgTable("project_generations", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => generationProjects.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id),
  service: text("service").notNull(),
  visualizationId: integer("visualization_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Teams for Business Pro plan
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  maxMembers: integer("max_members").default(3), // Default 3 for Business Pro
  additionalSeats: integer("additional_seats").default(0), // Extra seats beyond base plan
  customPromptEnabled: boolean("custom_prompt_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Team members linking users to teams
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id),
  email: text("email").notNull(),
  role: text("role").notNull().default("member"), // owner, member
  status: text("status").notNull().default("pending"), // pending, active, deactivated
  invitationToken: text("invitation_token").unique(), // Unique token for invitation acceptance
  joinCode: text("join_code").unique(), // 6-8 char code for manual team joining
  invitedBy: integer("invited_by").references(() => users.id),
  invitedAt: timestamp("invited_at").defaultNow(),
  joinedAt: timestamp("joined_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User feature overrides for manual control of feature access
export const userFeatureOverrides = pgTable("user_feature_overrides", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  embedOverride: boolean("embed_override"), // null = inherit from plan, true = force enable, false = force disable
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: text("updated_by"), // admin email who made the change
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  subscription: one(subscriptions),
  tenant: one(tenants),
  usage: many(userUsage),
  visualizations: many(visualizations),
  poolVisualizations: many(poolVisualizations),
  landscapeVisualizations: many(landscapeVisualizations),
  halloweenVisualizations: many(halloweenVisualizations),
  christmasLightsVisualizations: many(christmasLightsVisualizations),
  generationProjects: many(generationProjects),
  projectGenerations: many(projectGenerations),
  leads: many(leads),
  featureOverrides: one(userFeatureOverrides),
  ownedTeam: one(teams),
  teamMemberships: many(teamMembers),
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
  visitorUsage: many(embedVisitorUsage),
  leads: many(leads),
  visualizations: many(visualizations),
  poolVisualizations: many(poolVisualizations),
  landscapeVisualizations: many(landscapeVisualizations),
  halloweenVisualizations: many(halloweenVisualizations),
  christmasLightsVisualizations: many(christmasLightsVisualizations),
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

export const halloweenVisualizationsRelations = relations(halloweenVisualizations, ({ one }) => ({
  user: one(users, {
    fields: [halloweenVisualizations.userId],
    references: [users.id],
  }),
  tenant: one(tenants, {
    fields: [halloweenVisualizations.tenantId],
    references: [tenants.id],
  }),
}));

export const christmasLightsVisualizationsRelations = relations(christmasLightsVisualizations, ({ one }) => ({
  user: one(users, {
    fields: [christmasLightsVisualizations.userId],
    references: [users.id],
  }),
  tenant: one(tenants, {
    fields: [christmasLightsVisualizations.tenantId],
    references: [tenants.id],
  }),
}));

export const embedVisitorUsageRelations = relations(embedVisitorUsage, ({ one }) => ({
  tenant: one(tenants, {
    fields: [embedVisitorUsage.tenantId],
    references: [tenants.id],
  }),
}));

export const generationProjectsRelations = relations(generationProjects, ({ one, many }) => ({
  user: one(users, {
    fields: [generationProjects.userId],
    references: [users.id],
  }),
  generations: many(projectGenerations),
}));

export const projectGenerationsRelations = relations(projectGenerations, ({ one }) => ({
  user: one(users, {
    fields: [projectGenerations.userId],
    references: [users.id],
  }),
  project: one(generationProjects, {
    fields: [projectGenerations.projectId],
    references: [generationProjects.id],
  }),
}));

export const userFeatureOverridesRelations = relations(userFeatureOverrides, ({ one }) => ({
  user: one(users, {
    fields: [userFeatureOverrides.userId],
    references: [users.id],
  }),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  owner: one(users, {
    fields: [teams.ownerId],
    references: [users.id],
  }),
  members: many(teamMembers),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  invitedByUser: one(users, {
    fields: [teamMembers.invitedBy],
    references: [users.id],
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

export const insertEmbedVisitorUsageSchema = createInsertSchema(embedVisitorUsage).omit({
  id: true,
  firstSeenAt: true,
  lastSeenAt: true,
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

export const insertHalloweenVisualizationSchema = createInsertSchema(halloweenVisualizations).omit({
  id: true,
  createdAt: true,
});

export const insertChristmasLightsVisualizationSchema = createInsertSchema(christmasLightsVisualizations).omit({
  id: true,
  createdAt: true,
});

export const insertGenerationProjectSchema = createInsertSchema(generationProjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectGenerationSchema = createInsertSchema(projectGenerations).omit({
  id: true,
  createdAt: true,
});

export const insertUserFeatureOverridesSchema = createInsertSchema(userFeatureOverrides).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
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
export type EmbedVisitorUsage = typeof embedVisitorUsage.$inferSelect;
export type InsertEmbedVisitorUsage = z.infer<typeof insertEmbedVisitorUsageSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Visualization = typeof visualizations.$inferSelect;
export type InsertVisualization = z.infer<typeof insertVisualizationSchema>;
export type PoolVisualization = typeof poolVisualizations.$inferSelect;
export type InsertPoolVisualization = z.infer<typeof insertPoolVisualizationSchema>;
export type LandscapeVisualization = typeof landscapeVisualizations.$inferSelect;
export type InsertLandscapeVisualization = z.infer<typeof insertLandscapeVisualizationSchema>;
export type HalloweenVisualization = typeof halloweenVisualizations.$inferSelect;
export type InsertHalloweenVisualization = z.infer<typeof insertHalloweenVisualizationSchema>;
export type ChristmasLightsVisualization = typeof christmasLightsVisualizations.$inferSelect;
export type InsertChristmasLightsVisualization = z.infer<typeof insertChristmasLightsVisualizationSchema>;
export type GenerationProject = typeof generationProjects.$inferSelect;
export type InsertGenerationProject = z.infer<typeof insertGenerationProjectSchema>;
export type ProjectGeneration = typeof projectGenerations.$inferSelect;
export type InsertProjectGeneration = z.infer<typeof insertProjectGenerationSchema>;
export type UserFeatureOverrides = typeof userFeatureOverrides.$inferSelect;
export type InsertUserFeatureOverrides = z.infer<typeof insertUserFeatureOverridesSchema>;
export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type UsageStats = typeof usageStats.$inferSelect;

export const insertUsageStatsSchema = createInsertSchema(usageStats).omit({
  id: true,
  date: true,
});
