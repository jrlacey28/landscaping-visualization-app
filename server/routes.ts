import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import crypto from "crypto";

import { storage } from "./storage";
import { databaseUrl, db, dbDriver, dbUsesSsl, getDatabaseHost, serverBuild } from "./db";
import { users, visualizations, poolVisualizations, landscapeVisualizations, halloweenVisualizations, christmasLightsVisualizations, generationProjects, projectGenerations, teamMembers, teams, leads, userUsage, subscriptions, tenants, insertLeadSchema, insertVisualizationSchema, insertPoolVisualizationSchema, insertLandscapeVisualizationSchema, insertHalloweenVisualizationSchema, insertChristmasLightsVisualizationSchema, insertTenantSchema } from "@shared/schema";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { processLandscapeWithGemini, processPoolWithGemini, analyzeLandscapeImage, processInteriorVisualizationWithGemini, processHalloweenVisualizationWithGemini, processChristmasLightsWithGemini } from "./gemini-service";
import {
  getAllStyles,
  getStylesByCategory,
  getStyleForRegion,
} from "./style-config";
import { buildTenantExteriorCustomContext } from "./tenant-exterior-context";
import {
  buildTenantInteriorOptionPrompt,
  collectInteriorReferenceImageUrls,
} from "@shared/interior-reference-options";
import {
  buildUnlimitedEnterpriseEmbedStatus,
  canUseEmbedCustomInstructions,
  getEmbedVisitorLimit,
  hasUnlimitedEnterpriseEmbedAccess,
  resolveCanonicalEmbedTenant,
  resolveEmbedGenerationAccounting,
  isPlatformDemoEmbed,
} from "./embed-account-access";
import { getAllPoolStyles, getPoolStylesByCategory, getPoolStyleForRegion } from "./pool-style-config";
import { authenticateToken, optionalAuthenticateToken, AuthRequest } from "./auth";
import jwt from 'jsonwebtoken';
import { sendQuoteLeadNotificationEmail, sendTeamInvitationEmail } from "./email-service";
import {
  mergeQuoteCrmConfig,
  removePrivateQuoteCrmConfig,
  sendQuoteLeadToCrm,
  validateQuoteCrmWebhookUrl,
} from "./quote-crm";

const upload = multer({ storage: multer.memoryStorage() });

function toPublicTenant(tenant: any) {
  if (!tenant) return tenant;

  return {
    ...tenant,
    embedCustomizations: removePrivateQuoteCrmConfig(tenant.embedCustomizations),
  };
}

function sanitizeDatabaseError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return message
    .replace(databaseUrl || "", "[DATABASE_URL]")
    .replace(/postgres(?:ql)?:\/\/[^@\s]+@/gi, "postgres://[redacted]@");
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string) {
  let timeout: NodeJS.Timeout | undefined;

  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      timeout = setTimeout(
        () => reject(new Error(`${label} timed out after ${timeoutMs}ms`)),
        timeoutMs,
      );
    }),
  ]).finally(() => {
    if (timeout) {
      clearTimeout(timeout);
    }
  });
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
const publicReferenceImageMaxDimension = 1600;
const publicReferenceImageJpegQuality = 86;

const generationServices = [
  "roofing-siding",
  "interior",
  "pools",
  "landscape",
  "halloween",
  "christmas-lights",
] as const;

type GenerationService = typeof generationServices[number];

const interiorServiceSlugs = new Set(["painting", "bathroom", "kitchen", "living_room"]);

const serviceLabels: Record<GenerationService, string> = {
  "roofing-siding": "Roofing & Siding",
  interior: "Interior",
  pools: "Pools",
  landscape: "Landscape",
  halloween: "Halloween",
  "christmas-lights": "Christmas Lights",
};

function isGenerationService(value: unknown): value is GenerationService {
  return typeof value === "string" && generationServices.includes(value as GenerationService);
}

function humanize(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  return String(value)
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function styleLine(label: string, value: unknown) {
  const formatted = humanize(value);
  return formatted ? `${label}: ${formatted}` : null;
}

function compactStyles(values: Array<string | null | undefined | false>) {
  return values.filter(Boolean) as string[];
}

function getVisualizationService(visualization: any): GenerationService {
  return interiorServiceSlugs.has(visualization.selectedRoof || "") ? "interior" : "roofing-siding";
}

function getStyleSummary(service: GenerationService, visualization: any) {
  if (service === "roofing-siding") {
    return compactStyles([
      styleLine("Roof", visualization.selectedRoof),
      styleLine("Siding", visualization.selectedSiding),
      styleLine("Surprise", visualization.selectedSurpriseMe),
    ]);
  }

  if (service === "interior") {
    const selectedStyles = typeof visualization.selectedSiding === "string"
      ? visualization.selectedSiding.split(",").map((style: string) => humanize(style)).filter(Boolean)
      : [];

    return compactStyles([
      styleLine("Room", visualization.selectedRoof),
      selectedStyles.length ? `Styles: ${selectedStyles.join(", ")}` : null,
    ]);
  }

  if (service === "pools") {
    return compactStyles([
      styleLine("Type", visualization.selectedPoolType),
      styleLine("Size", visualization.selectedPoolSize),
      styleLine("Decking", visualization.selectedDecking),
      styleLine("Landscaping", visualization.selectedLandscaping),
      styleLine("Features", visualization.selectedFeatures),
    ]);
  }

  if (service === "landscape") {
    return compactStyles([
      styleLine("Curbing", visualization.selectedCurbing),
      styleLine("Landscape", visualization.selectedLandscape),
      styleLine("Patio", visualization.selectedPatios),
    ]);
  }

  if (service === "halloween") {
    return compactStyles([
      styleLine("Decorations", visualization.selectedDecorations),
      visualization.nightMode ? "Night Mode" : null,
      visualization.spookyMode ? "Spooky Mode" : null,
    ]);
  }

  return compactStyles([
    styleLine("Light Type", visualization.lightType),
    styleLine("Color", visualization.lightColor),
    visualization.addSnow ? "Snow Added" : null,
  ]);
}

function normalizeGeneration(visualization: any, service: GenerationService, assignments: any[]) {
  const hasOriginalImage = Boolean(visualization.hasOriginalImage ?? visualization.originalImageUrl);
  const hasGeneratedImage = Boolean(visualization.hasGeneratedImage ?? visualization.generatedImageUrl);

  return {
    id: `${service}:${visualization.id}`,
    visualizationId: visualization.id,
    service,
    serviceLabel: serviceLabels[service],
    status: visualization.status || "completed",
    hasOriginalImage,
    hasGeneratedImage,
    hasImage: hasOriginalImage || hasGeneratedImage,
    createdAt: visualization.createdAt,
    styles: getStyleSummary(service, visualization),
    assignments,
  };
}

function getPrimaryGenerationImageUrl(generation: any) {
  return generation?.generatedImageUrl || generation?.originalImageUrl || "";
}

async function createThumbnailImageUrl(imageUrl: string) {
  if (!imageUrl.startsWith("data:image/")) {
    return imageUrl;
  }

  const commaIndex = imageUrl.indexOf(",");
  if (commaIndex === -1) {
    return imageUrl;
  }

  const header = imageUrl.slice(0, commaIndex);
  if (!header.includes(";base64")) {
    return imageUrl;
  }

  const imageBuffer = Buffer.from(imageUrl.slice(commaIndex + 1), "base64");
  const thumbnailBuffer = await sharp(imageBuffer)
    .rotate()
    .resize({ width: 240, height: 160, fit: "cover", withoutEnlargement: true })
    .jpeg({ quality: 72, mozjpeg: true })
    .toBuffer();

  return `data:image/jpeg;base64,${thumbnailBuffer.toString("base64")}`;
}

function imagePresence(originalImageUrlColumn: any, generatedImageUrlColumn: any) {
  return {
    hasOriginalImage: sql<boolean>`${originalImageUrlColumn} IS NOT NULL`,
    hasGeneratedImage: sql<boolean>`${generatedImageUrlColumn} IS NOT NULL`,
  };
}

async function getGenerationProjectSummariesByUser(userId: number) {
  return db
    .select({
      id: generationProjects.id,
      userId: generationProjects.userId,
      name: generationProjects.name,
      address: generationProjects.address,
      notes: generationProjects.notes,
      createdAt: generationProjects.createdAt,
      updatedAt: generationProjects.updatedAt,
    })
    .from(generationProjects)
    .where(eq(generationProjects.userId, userId))
    .orderBy(desc(generationProjects.updatedAt), desc(generationProjects.createdAt));
}

async function getVisualizationSummariesByUser(userId: number) {
  return db
    .select({
      id: visualizations.id,
      userId: visualizations.userId,
      tenantId: visualizations.tenantId,
      selectedRoof: visualizations.selectedRoof,
      selectedSiding: visualizations.selectedSiding,
      selectedSurpriseMe: visualizations.selectedSurpriseMe,
      status: visualizations.status,
      createdAt: visualizations.createdAt,
      ...imagePresence(visualizations.originalImageUrl, visualizations.generatedImageUrl),
    })
    .from(visualizations)
    .where(eq(visualizations.userId, userId))
    .orderBy(desc(visualizations.createdAt));
}

async function getVisualizationSummariesByTenant(tenantId: number) {
  return db
    .select({
      id: visualizations.id,
      userId: visualizations.userId,
      tenantId: visualizations.tenantId,
      selectedRoof: visualizations.selectedRoof,
      selectedSiding: visualizations.selectedSiding,
      selectedSurpriseMe: visualizations.selectedSurpriseMe,
      status: visualizations.status,
      createdAt: visualizations.createdAt,
      ...imagePresence(visualizations.originalImageUrl, visualizations.generatedImageUrl),
    })
    .from(visualizations)
    .where(eq(visualizations.tenantId, tenantId))
    .orderBy(desc(visualizations.createdAt));
}

async function getPoolVisualizationSummariesByUser(userId: number) {
  return db
    .select({
      id: poolVisualizations.id,
      userId: poolVisualizations.userId,
      tenantId: poolVisualizations.tenantId,
      selectedPoolType: poolVisualizations.selectedPoolType,
      selectedPoolSize: poolVisualizations.selectedPoolSize,
      selectedDecking: poolVisualizations.selectedDecking,
      selectedLandscaping: poolVisualizations.selectedLandscaping,
      selectedFeatures: poolVisualizations.selectedFeatures,
      status: poolVisualizations.status,
      createdAt: poolVisualizations.createdAt,
      ...imagePresence(poolVisualizations.originalImageUrl, poolVisualizations.generatedImageUrl),
    })
    .from(poolVisualizations)
    .where(eq(poolVisualizations.userId, userId))
    .orderBy(desc(poolVisualizations.createdAt));
}

async function getPoolVisualizationSummariesByTenant(tenantId: number) {
  return db
    .select({
      id: poolVisualizations.id,
      userId: poolVisualizations.userId,
      tenantId: poolVisualizations.tenantId,
      selectedPoolType: poolVisualizations.selectedPoolType,
      selectedPoolSize: poolVisualizations.selectedPoolSize,
      selectedDecking: poolVisualizations.selectedDecking,
      selectedLandscaping: poolVisualizations.selectedLandscaping,
      selectedFeatures: poolVisualizations.selectedFeatures,
      status: poolVisualizations.status,
      createdAt: poolVisualizations.createdAt,
      ...imagePresence(poolVisualizations.originalImageUrl, poolVisualizations.generatedImageUrl),
    })
    .from(poolVisualizations)
    .where(eq(poolVisualizations.tenantId, tenantId))
    .orderBy(desc(poolVisualizations.createdAt));
}

async function getLandscapeVisualizationSummariesByUser(userId: number) {
  return db
    .select({
      id: landscapeVisualizations.id,
      userId: landscapeVisualizations.userId,
      tenantId: landscapeVisualizations.tenantId,
      selectedCurbing: landscapeVisualizations.selectedCurbing,
      selectedLandscape: landscapeVisualizations.selectedLandscape,
      selectedPatios: landscapeVisualizations.selectedPatios,
      status: landscapeVisualizations.status,
      createdAt: landscapeVisualizations.createdAt,
      ...imagePresence(landscapeVisualizations.originalImageUrl, landscapeVisualizations.generatedImageUrl),
    })
    .from(landscapeVisualizations)
    .where(eq(landscapeVisualizations.userId, userId))
    .orderBy(desc(landscapeVisualizations.createdAt));
}

async function getLandscapeVisualizationSummariesByTenant(tenantId: number) {
  return db
    .select({
      id: landscapeVisualizations.id,
      userId: landscapeVisualizations.userId,
      tenantId: landscapeVisualizations.tenantId,
      selectedCurbing: landscapeVisualizations.selectedCurbing,
      selectedLandscape: landscapeVisualizations.selectedLandscape,
      selectedPatios: landscapeVisualizations.selectedPatios,
      status: landscapeVisualizations.status,
      createdAt: landscapeVisualizations.createdAt,
      ...imagePresence(landscapeVisualizations.originalImageUrl, landscapeVisualizations.generatedImageUrl),
    })
    .from(landscapeVisualizations)
    .where(eq(landscapeVisualizations.tenantId, tenantId))
    .orderBy(desc(landscapeVisualizations.createdAt));
}

async function getHalloweenVisualizationSummariesByUser(userId: number) {
  return db
    .select({
      id: halloweenVisualizations.id,
      userId: halloweenVisualizations.userId,
      tenantId: halloweenVisualizations.tenantId,
      selectedDecorations: halloweenVisualizations.selectedDecorations,
      nightMode: halloweenVisualizations.nightMode,
      spookyMode: halloweenVisualizations.spookyMode,
      status: halloweenVisualizations.status,
      createdAt: halloweenVisualizations.createdAt,
      ...imagePresence(halloweenVisualizations.originalImageUrl, halloweenVisualizations.generatedImageUrl),
    })
    .from(halloweenVisualizations)
    .where(eq(halloweenVisualizations.userId, userId))
    .orderBy(desc(halloweenVisualizations.createdAt));
}

async function getHalloweenVisualizationSummariesByTenant(tenantId: number) {
  return db
    .select({
      id: halloweenVisualizations.id,
      userId: halloweenVisualizations.userId,
      tenantId: halloweenVisualizations.tenantId,
      selectedDecorations: halloweenVisualizations.selectedDecorations,
      nightMode: halloweenVisualizations.nightMode,
      spookyMode: halloweenVisualizations.spookyMode,
      status: halloweenVisualizations.status,
      createdAt: halloweenVisualizations.createdAt,
      ...imagePresence(halloweenVisualizations.originalImageUrl, halloweenVisualizations.generatedImageUrl),
    })
    .from(halloweenVisualizations)
    .where(eq(halloweenVisualizations.tenantId, tenantId))
    .orderBy(desc(halloweenVisualizations.createdAt));
}

async function getChristmasLightsVisualizationSummariesByUser(userId: number) {
  return db
    .select({
      id: christmasLightsVisualizations.id,
      userId: christmasLightsVisualizations.userId,
      tenantId: christmasLightsVisualizations.tenantId,
      lightType: christmasLightsVisualizations.lightType,
      lightColor: christmasLightsVisualizations.lightColor,
      addSnow: christmasLightsVisualizations.addSnow,
      status: christmasLightsVisualizations.status,
      createdAt: christmasLightsVisualizations.createdAt,
      ...imagePresence(christmasLightsVisualizations.originalImageUrl, christmasLightsVisualizations.generatedImageUrl),
    })
    .from(christmasLightsVisualizations)
    .where(eq(christmasLightsVisualizations.userId, userId))
    .orderBy(desc(christmasLightsVisualizations.createdAt));
}

async function getChristmasLightsVisualizationSummariesByTenant(tenantId: number) {
  return db
    .select({
      id: christmasLightsVisualizations.id,
      userId: christmasLightsVisualizations.userId,
      tenantId: christmasLightsVisualizations.tenantId,
      lightType: christmasLightsVisualizations.lightType,
      lightColor: christmasLightsVisualizations.lightColor,
      addSnow: christmasLightsVisualizations.addSnow,
      status: christmasLightsVisualizations.status,
      createdAt: christmasLightsVisualizations.createdAt,
      ...imagePresence(christmasLightsVisualizations.originalImageUrl, christmasLightsVisualizations.generatedImageUrl),
    })
    .from(christmasLightsVisualizations)
    .where(eq(christmasLightsVisualizations.tenantId, tenantId))
    .orderBy(desc(christmasLightsVisualizations.createdAt));
}

async function isGenerationOwnedByUser(userId: number, generation: any) {
  if (!generation) return false;
  if (generation.userId === userId) return true;

  if (generation.tenantId) {
    const tenant = await storage.getTenant(generation.tenantId);
    return tenant?.userId === userId;
  }

  return false;
}

async function getOwnedGenerationForService(userId: number, service: GenerationService, visualizationId: number) {
  if (service === "pools") {
    const generation = await storage.getPoolVisualization(visualizationId);
    return await isGenerationOwnedByUser(userId, generation) ? generation : undefined;
  }

  if (service === "landscape") {
    const generation = await storage.getLandscapeVisualization(visualizationId);
    return await isGenerationOwnedByUser(userId, generation) ? generation : undefined;
  }

  if (service === "halloween") {
    const generation = await storage.getHalloweenVisualization(visualizationId);
    return await isGenerationOwnedByUser(userId, generation) ? generation : undefined;
  }

  if (service === "christmas-lights") {
    const generation = await storage.getChristmasLightsVisualization(visualizationId);
    return await isGenerationOwnedByUser(userId, generation) ? generation : undefined;
  }

  const generation = await storage.getVisualization(visualizationId);
  if (!(await isGenerationOwnedByUser(userId, generation))) {
    return undefined;
  }

  return getVisualizationService(generation) === service ? generation : undefined;
}



export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware is now configured in server/index.ts BEFORE this function is called
  // This ensures all routes (including auth routes) have access to sessions

  // Admin authentication middleware
  const requireAdminAuth = (req: any, res: any, next: any) => {
    if (req.session?.isAdmin) {
      next();
    } else {
      res.status(401).json({ error: "Admin authentication required" });
    }
  };

  // Health check endpoint for debugging production issues
  app.get("/api/health", async (req, res) => {
    try {
      // Check database connection
      let dbStatus = 'unknown';
      let dbHost = 'unknown';
      let dbError: string | undefined;
      try {
        await withTimeout(storage.getUser(1), 5_000, "Database health check");
        dbStatus = 'connected';
        dbHost = getDatabaseHost();
      } catch (e) {
        dbStatus = 'failed';
        dbHost = getDatabaseHost();
        dbError = sanitizeDatabaseError(e);
      }

      // Check Stripe configuration
      const stripeSecretSet = Boolean(process.env.STRIPE_SECRET_KEY);
      const stripeWebhookSet = Boolean(process.env.STRIPE_WEBHOOK_SECRET);
      const stripePublicSet = Boolean(process.env.VITE_STRIPE_PUBLIC_KEY);

      // Check session/auth configuration
      const sessionSecretSet = Boolean(process.env.SESSION_SECRET);
      const googleClientSet = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

      // Check production environment
      const isProduction = process.env.NODE_ENV === 'production';
      const baseUrl = process.env.REPLIT_DOMAINS?.split(',')[0] || 'unknown';

      // Check paid plan configuration
      const CONTRACTOR_PLAN_ID = 'price_1TcynuBY2SPm2HvO1Eri2ogI';
      const PROFESSIONAL_PLAN_ID = 'price_1SGN4YBY2SPm2HvOrpREWCn1';
      let paidUsers = 0;
      let embedEnabledUsers = 0;
      let embedStatsIssue = dbStatus === 'failed' ? 'skipped because database health check failed' : 'ok';
      
      if (dbStatus === 'connected') {
        try {
          const users = await withTimeout(
            storage.getAllUsersWithUsage(),
            5_000,
            "Paid user health check",
          );
          for (const user of users) {
            if (
              user.subscription?.planId === CONTRACTOR_PLAN_ID ||
              user.subscription?.planId === PROFESSIONAL_PLAN_ID ||
              (user.usage?.planName && ['Contractor', 'Professional'].includes(user.usage.planName))
            ) {
              paidUsers++;
            }
            const hasEmbed = await withTimeout(
              storage.computeEmbedAccess(user.id),
              2_000,
              `Embed access health check for user ${user.id}`,
            );
            if (hasEmbed) embedEnabledUsers++;
          }
          embedStatsIssue = paidUsers > embedEnabledUsers ? 'Some paid users missing embed access' : 'ok';
        } catch (e) {
          console.error('Error checking users:', e);
          embedStatsIssue = sanitizeDatabaseError(e);
        }
      }

      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        build: {
          server: serverBuild,
        },
        environment: {
          NODE_ENV: process.env.NODE_ENV || 'unknown',
          isProduction,
          baseUrl,
          replitDomains: process.env.REPLIT_DOMAINS || 'not set',
        },
        database: {
          status: dbStatus,
          driver: dbDriver,
          ssl: dbUsesSsl,
          host: dbHost,
          url_set: Boolean(databaseUrl || process.env.DATABASE_URL),
          error: dbError,
        },
        stripe: {
          secret_key_set: stripeSecretSet,
          webhook_secret_set: stripeWebhookSet,
          public_key_set: stripePublicSet,
          contractor_plan_id: CONTRACTOR_PLAN_ID,
          professional_plan_id: PROFESSIONAL_PLAN_ID,
        },
        session: {
          secret_set: sessionSecretSet,
          google_oauth_set: googleClientSet,
          cookie_config: {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            httpOnly: true,
          }
        },
        embedStats: {
          paidUsers,
          embedEnabledUsers,
          issue: embedStatsIssue,
        },
        debug: {
          cookies_sent: req.headers.cookie || 'none',
          origin: req.headers.origin || 'none',
          host: req.headers.host || 'none',
          protocol: req.protocol,
          secure: req.secure,
        }
      });
    } catch (error: any) {
      res.status(500).json({ 
        status: 'error', 
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Debug endpoint for specific user embed access (temporary)
  app.get("/api/debug/user/:userId/embed", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const subscription = await storage.getUserActiveSubscription(userId);
      const usage = await storage.checkUsageLimits(userId);
      const hasEmbed = await storage.computeEmbedAccess(userId);
      
      // Get all subscriptions for this user to check for duplicates
      const allSubs: any[] = [];
      
      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
        },
        activeSubscription: subscription,
        allSubscriptions: allSubs.map(s => ({
          id: s.id,
          planId: s.planId,
          status: s.status,
          createdAt: s.createdAt,
        })),
        duplicateActiveCount: allSubs.filter(s => s.status === 'active').length,
        usage: usage,
        computedEmbedAccess: hasEmbed,
        checks: {
          hasContractorPlanId: subscription?.planId === 'price_1TcynuBY2SPm2HvO1Eri2ogI',
          hasProfessionalPlanId: subscription?.planId === 'price_1SGN4YBY2SPm2HvOrpREWCn1',
          usageSaysPaid: ['Contractor', 'Professional'].includes(usage.planName),
          usageSaysCustom: usage.planName === 'Custom',
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin login endpoint
  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminPassword) {
      console.error("ADMIN_PASSWORD environment variable not found");
      return res.status(500).json({ error: "Admin password not configured" });
    }
    
    if (password === adminPassword) {
      req.session.isAdmin = true;
      res.json({ success: true, message: "Authenticated successfully" });
    } else {
      res.status(401).json({ error: "Invalid password" });
    }
  });

  // Admin logout endpoint
  app.post("/api/admin/logout", (req, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ error: "Could not log out" });
      }
      res.json({ success: true, message: "Logged out successfully" });
    });
  });

  // Check admin auth status
  app.get("/api/admin/status", (req, res) => {
    res.json({ isAuthenticated: !!req.session?.isAdmin });
  });

  // Admin: Delete user
  app.delete("/api/admin/user/:userId", requireAdminAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const userIdNum = parseInt(userId);
      
      // Check if user exists
      const user = await storage.getUser(userIdNum);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Delete all related data first (to avoid foreign key constraint errors)
      console.log(`[ADMIN] Deleting all data for user ${userIdNum}`);
      
      // Delete visualizations
      await db.delete(visualizations).where(eq(visualizations.userId, userIdNum));
      await db.delete(poolVisualizations).where(eq(poolVisualizations.userId, userIdNum));
      await db.delete(landscapeVisualizations).where(eq(landscapeVisualizations.userId, userIdNum));
      await db.delete(halloweenVisualizations).where(eq(halloweenVisualizations.userId, userIdNum));
      await db.delete(christmasLightsVisualizations).where(eq(christmasLightsVisualizations.userId, userIdNum));
      await db.delete(projectGenerations).where(eq(projectGenerations.userId, userIdNum));
      await db.delete(generationProjects).where(eq(generationProjects.userId, userIdNum));
      
      // Delete ALL team member records (both active memberships and pending invitations)
      // First, get all teams owned by this user
      const ownedTeams = await db.select().from(teams).where(eq(teams.ownerId, userIdNum));
      
      // Delete ALL members from teams owned by this user (prevents FK constraint errors)
      for (const team of ownedTeams) {
        await db.delete(teamMembers).where(eq(teamMembers.teamId, team.id));
      }
      
      // Delete where userId is set (user's active memberships in other teams)
      await db.delete(teamMembers).where(eq(teamMembers.userId, userIdNum));
      
      // Delete pending invitations sent TO this user's email
      await db.delete(teamMembers).where(eq(teamMembers.email, user.email));
      
      // Delete pending invitations sent BY this user (invitedBy field)
      await db.delete(teamMembers).where(eq(teamMembers.invitedBy, userIdNum));
      
      // Now safe to delete teams owned by user (all members are gone)
      await db.delete(teams).where(eq(teams.ownerId, userIdNum));
      
      // Delete leads created by user
      await db.delete(leads).where(eq(leads.userId, userIdNum));
      
      // Delete user usage records
      await db.delete(userUsage).where(eq(userUsage.userId, userIdNum));
      
      // Delete subscriptions
      await db.delete(subscriptions).where(eq(subscriptions.userId, userIdNum));
      
      // Delete tenants owned by user
      await db.delete(tenants).where(eq(tenants.userId, userIdNum));
      
      // Finally, delete the user
      await db.delete(users).where(eq(users.id, userIdNum));
      
      console.log(`[ADMIN] User ${userIdNum} and all related data deleted successfully`);
      res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  // Subscription plans management
  app.get("/api/subscription/plans", async (req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json({ success: true, data: plans });
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ error: "Failed to fetch subscription plans" });
    }
  });

  app.post("/api/admin/plans", requireAdminAuth, async (req, res) => {
    try {
      const planData = req.body;
      const plan = await storage.createSubscriptionPlan(planData);
      res.json({ success: true, data: plan });
    } catch (error) {
      console.error("Error creating subscription plan:", error);
      res.status(500).json({ error: "Failed to create subscription plan" });
    }
  });

  app.patch("/api/admin/plans/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const planData = req.body;
      const plan = await storage.updateSubscriptionPlan(id, planData);
      res.json({ success: true, data: plan });
    } catch (error) {
      console.error("Error updating subscription plan:", error);
      res.status(500).json({ error: "Failed to update subscription plan" });
    }
  });

  app.delete("/api/admin/plans/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSubscriptionPlan(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting subscription plan:", error);
      res.status(500).json({ error: "Failed to delete subscription plan" });
    }
  });

  // Debug endpoint to view all plans (as requested in task)
  app.get('/api/admin/plans', requireAdminAuth, async (req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get user's current subscription (as requested in task)
  app.get('/api/admin/user-subscription/:userId', requireAdminAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const subscription = await storage.getUserActiveSubscription(parseInt(userId));
      
      if (!subscription) {
        return res.status(404).json({ error: 'No subscription found for this user' });
      }

      // Get plan details
      const plan = await storage.getSubscriptionPlan(subscription.planId);
      
      res.json({
        ...subscription,
        plan_name: plan?.name,
        price: plan?.price
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin endpoints for managing embed access overrides
  app.get('/api/admin/users-with-embed-access', requireAdminAuth, async (req, res) => {
    try {
      const usersWithData = await storage.getAllUsersWithUsage();
      
      // Compute embed access for each user - paid users get it
      const usersWithEmbedAccess = await Promise.all(
        usersWithData.map(async (user) => {
          const hasEmbedAccess = await storage.computeEmbedAccess(user.id);
          
          return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            businessName: user.businessName,
            subscription: user.subscription,
            hasEmbedAccess,
            embedOverride: null, // Not using overrides anymore
            overrideUpdatedBy: null,
            overrideUpdatedAt: null,
          };
        })
      );
      
      res.json({ success: true, data: usersWithEmbedAccess });
    } catch (error: any) {
      console.error('Error fetching users with embed access:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/admin/user/:userId/embed-override', requireAdminAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const { embedOverride } = req.body; // true, false, or null
      const adminEmail = req.session?.adminEmail || 'admin';
      
      const override = await storage.setUserEmbedOverride(
        parseInt(userId),
        embedOverride,
        adminEmail
      );
      
      // Compute new embed access
      const hasEmbedAccess = await storage.computeEmbedAccess(parseInt(userId));
      
      res.json({ 
        success: true, 
        data: {
          override,
          hasEmbedAccess
        }
      });
    } catch (error: any) {
      console.error('Error setting embed override:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/admin/user/:userId/embed-status', requireAdminAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const userIdNum = parseInt(userId);
      
      const [user, subscription, override, hasEmbedAccess] = await Promise.all([
        storage.getUser(userIdNum),
        storage.getUserActiveSubscription(userIdNum),
        storage.getUserFeatureOverrides(userIdNum),
        storage.computeEmbedAccess(userIdNum)
      ]);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      let plan = null;
      if (subscription) {
        plan = await storage.getSubscriptionPlan(subscription.planId);
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
          },
          subscription: subscription ? {
            planId: subscription.planId,
            planName: plan?.name,
            status: subscription.status,
            embedAccessFromPlan: plan?.embedAccess || false,
          } : null,
          override: override ? {
            embedOverride: override.embedOverride,
            updatedBy: override.updatedBy,
            updatedAt: override.updatedAt,
          } : null,
          hasEmbedAccess,
        }
      });
    } catch (error: any) {
      console.error('Error fetching embed status:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Serve static files from uploads directory
  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

  // Get all tenants (admin only)
  app.get("/api/tenants", requireAdminAuth, async (req, res) => {
    try {
      const allTenants = await storage.syncEligibleAccountTenants();
      res.json(allTenants);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      res.status(500).json({ error: "Failed to fetch tenants" });
    }
  });

  async function ensureStandardEmbedTenant(workspaceOwnerId: number) {
    return await storage.ensureAccountTenant(workspaceOwnerId);
  }

  async function getEmbedTenantBySlug(slug: string) {
    return slug === "demo"
      ? await storage.ensureDemoTenant()
      : await storage.getTenantBySlug(slug);
  }

  async function resolveEmbedTenantForAccount(tenant: any, accountUserIdValue: unknown) {
    const accountUserId = parsePositiveId(accountUserIdValue);
    if (!accountUserId || tenant?.userId) return tenant;

    const workspaceOwnerId = await getWorkspaceOwnerId(accountUserId);
    const accountTenant = await ensureStandardEmbedTenant(workspaceOwnerId);
    return resolveCanonicalEmbedTenant(tenant, accountTenant);
  }

  async function isEmbedBrandingRequired(tenant: any) {
    if (!tenant || tenant.isEnterprise || tenant.clientType === "enterprise") return false;
    if (tenant.slug === "demo" || !tenant.userId) return true;

    const subscription = await storage.getUserActiveSubscription(tenant.userId);
    if (!subscription || subscription.status !== "active") return true;

    const plan = await storage.getSubscriptionPlan(subscription.planId);
    const normalizedPlanName = String(plan?.name || "").trim().toLowerCase();
    const isProfessional =
      subscription.planId === "price_1SGN4YBY2SPm2HvOrpREWCn1" ||
      normalizedPlanName === "professional" ||
      normalizedPlanName === "business pro" ||
      normalizedPlanName === "pro";

    return !isProfessional;
  }

  async function withEmbedBrandingEntitlement(tenant: any, includePrivateSettings = false) {
    if (!tenant) return tenant;

    return {
      ...(includePrivateSettings ? tenant : toPublicTenant(tenant)),
      embedBrandingRequired: await isEmbedBrandingRequired(tenant),
    };
  }

  // Get tenant by slug (for multi-tenant setup)
  // Get authenticated user's tenant
  app.get("/api/tenant/my-tenant", authenticateToken as any, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const workspaceOwnerId = await getWorkspaceOwnerId(req.user.id);
      const userTenant = await ensureStandardEmbedTenant(workspaceOwnerId);
      
      if (!userTenant) {
        // If user doesn't have a tenant, return the demo tenant
        const demoTenant = await storage.ensureDemoTenant();
        return res.json(await withEmbedBrandingEntitlement(demoTenant, true));
      }

      res.json(await withEmbedBrandingEntitlement(userTenant, true));
    } catch (error) {
      console.error("Error fetching user tenant:", error);
      res.status(500).json({ error: "Failed to fetch tenant" });
    }
  });

  const accountQuoteFlowSettingsSchema = z.object({
    embedRequireQuoteAfterLimit: z.boolean(),
    embedVisitorLimit: z.number().int().min(0).max(100),
    embedCtaText: z.string().trim().min(1).max(80),
    embedCtaPhone: z.string().trim().max(40),
    embedCtaUrl: z.union([z.string().trim().url(), z.literal("")]),
    embedQuoteDestinationType: z.enum(["email", "phone", "link"]),
    embedQuoteRecipientEmail: z.union([z.string().trim().email(), z.literal("")]),
    embedQuoteSuccessRedirectUrl: z.union([z.string().trim().url(), z.literal("")]),
    embedQuoteGateTitle: z.string().trim().min(1).max(160),
    embedQuoteGateMessage: z.string().trim().min(1).max(1200),
    embedQuoteFormTitle: z.string().trim().min(1).max(160),
    embedQuoteFormMessage: z.string().trim().min(1).max(1200),
    embedQuoteIncludeImages: z.boolean(),
    embedQuoteCrmEnabled: z.boolean(),
    embedQuoteCrmWebhookUrl: z.string().trim().max(1000),
  });

  app.patch("/api/tenant/my-tenant/quote-flow", authenticateToken as any, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const workspaceOwnerId = await getWorkspaceOwnerId(req.user.id);
      const userTenant = await ensureStandardEmbedTenant(workspaceOwnerId);
      if (!userTenant) {
        return res.status(404).json({ error: "Embed account not found" });
      }

      const settings = accountQuoteFlowSettingsSchema.parse(req.body);
      const hasAdvancedQuoteFlowAccess = await storage.hasBusinessProAccess(req.user.id);

      if (!hasAdvancedQuoteFlowAccess) {
        const updatedTenant = await storage.updateTenant(userTenant.id, {
          embedRequireQuoteAfterLimit: true,
          embedVisitorLimit: Math.max(settings.embedVisitorLimit, 1),
        });
        return res.json(updatedTenant);
      }

      const {
        embedQuoteCrmEnabled,
        embedQuoteCrmWebhookUrl,
        ...tenantSettings
      } = settings;
      if (embedQuoteCrmEnabled && !embedQuoteCrmWebhookUrl) {
        return res.status(400).json({ error: "CRM webhook URL is required when CRM delivery is enabled" });
      }
      if (settings.embedQuoteDestinationType === "link" && !settings.embedCtaUrl) {
        return res.status(400).json({ error: "External quote URL is required when the quote destination is an external link" });
      }
      if (settings.embedQuoteDestinationType === "phone" && !settings.embedCtaPhone) {
        return res.status(400).json({ error: "Quote phone number is required when the quote destination is a phone call" });
      }
      const normalizedCrmWebhookUrl = embedQuoteCrmWebhookUrl
        ? validateQuoteCrmWebhookUrl(embedQuoteCrmWebhookUrl)
        : "";
      const updatedTenant = await storage.updateTenant(userTenant.id, {
        ...tenantSettings,
        embedCustomizations: mergeQuoteCrmConfig(userTenant.embedCustomizations, {
          enabled: embedQuoteCrmEnabled,
          webhookUrl: normalizedCrmWebhookUrl,
        }),
      });
      res.json(updatedTenant);
    } catch (error) {
      console.error("Error updating account quote flow:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid quote flow settings", details: error.errors });
      }
      if (error instanceof Error && error.message.startsWith("CRM webhook URL")) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to update quote flow settings" });
    }
  });

  app.get("/api/tenant/my-tenant/quote-leads", authenticateToken as any, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const workspaceOwnerId = await getWorkspaceOwnerId(req.user.id);
      const userTenant = await ensureStandardEmbedTenant(workspaceOwnerId);
      if (!userTenant) {
        return res.status(404).json({ error: "Embed account not found" });
      }

      if (!(await storage.hasBusinessProAccess(req.user.id))) {
        return res.status(403).json({ error: "Professional or Enterprise plan required" });
      }

      const tenantLeads = await storage.getLeadsByTenant(userTenant.id);
      const quoteLeads = tenantLeads.filter((lead) => lead.leadType === "quote");
      res.json({
        tenant: {
          id: userTenant.id,
          companyName: userTenant.companyName,
        },
        leads: quoteLeads,
      });
    } catch (error) {
      console.error("Error fetching account quote leads:", error);
      res.status(500).json({ error: "Failed to fetch quote leads" });
    }
  });

  const quoteCrmTestSchema = z.object({
    webhookUrl: z.string().trim().min(1).max(1000),
  });

  app.post("/api/tenant/my-tenant/quote-crm/test", authenticateToken as any, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const workspaceOwnerId = await getWorkspaceOwnerId(req.user.id);
      const userTenant = await ensureStandardEmbedTenant(workspaceOwnerId);
      if (!userTenant) {
        return res.status(404).json({ error: "Embed account not found" });
      }


      if (!(await storage.hasBusinessProAccess(req.user.id))) {
        return res.status(403).json({ error: "Professional or Enterprise plan required" });
      }

      const { webhookUrl } = quoteCrmTestSchema.parse(req.body);
      const delivery = await sendQuoteLeadToCrm({
        tenant: userTenant,
        webhookUrl,
        test: true,
        lead: {
          id: null,
          createdAt: new Date(),
          service: "roofing-siding",
          firstName: "Test",
          lastName: "Lead",
          email: "test@example.com",
          phone: "(555) 555-0100",
          location: "Your service area",
          projectDetails: "DreamBuilder CRM connection test",
          timeline: "Planning",
          selectedStyles: { roof: "Test roof", siding: "Test siding" },
          originalImageUrl: null,
          generatedImageUrl: null,
        },
      });

      if (!delivery.sent) {
        return res.status(502).json({ error: delivery.error || "CRM webhook did not accept the test" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error testing account CRM webhook:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid CRM webhook settings", details: error.errors });
      }
      const message = error instanceof Error ? error.message : "Failed to test CRM webhook";
      res.status(400).json({ error: message });
    }
  });

  app.get("/api/tenant/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      
      // Check if slug is numeric (ID) or string (slug)
      const isNumeric = /^\d+$/.test(slug);
      
      let tenant;
      if (isNumeric) {
        // Treat as ID
        tenant = await storage.getTenant(parseInt(slug));
      } else {
        // Treat as slug
        tenant = await getEmbedTenantBySlug(slug);
      }

      tenant = await resolveEmbedTenantForAccount(tenant, req.query.accountUserId);

      if (!tenant) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      res.json(await withEmbedBrandingEntitlement(tenant));
    } catch (error) {
      console.error("Error fetching tenant:", error);
      res.status(500).json({ error: "Failed to fetch tenant" });
    }
  });

  app.get("/api/embed/visitor-usage", optionalAuthenticateToken as any, async (req: AuthRequest, res) => {
    try {
      const tenantId = parsePositiveId(req.query.tenantId);
      const tenantSlug = typeof req.query.tenantSlug === "string" ? req.query.tenantSlug.trim() : "";

      let tenant;
      if (tenantId) {
        tenant = await storage.getTenant(tenantId);
      } else if (tenantSlug) {
        tenant = await getEmbedTenantBySlug(tenantSlug);
      }

      tenant = await resolveEmbedTenantForAccount(tenant, req.query.accountUserId);

      if (!tenant) {
        return res.status(404).json({ error: "Embed account not found" });
      }

      const { status } = await getEmbedVisitorStatusForRequest(req, tenant);
      res.json(buildEmbedVisitorStatusResponse(tenant, status));
    } catch (error) {
      console.error("Error fetching embed visitor usage:", error);
      res.status(500).json({ error: "Failed to fetch embed usage status" });
    }
  });

  app.post("/api/embed/quote-click", async (req, res) => {
    try {
      const tenantId = parsePositiveId(req.body.tenantId);
      const tenantSlug = typeof req.body.tenantSlug === "string" ? req.body.tenantSlug.trim() : "";

      let tenant;
      if (tenantId) {
        tenant = await storage.getTenant(tenantId);
      } else if (tenantSlug) {
        tenant = await getEmbedTenantBySlug(tenantSlug);
      }

      tenant = await resolveEmbedTenantForAccount(tenant, req.body.accountUserId);

      if (!tenant) {
        return res.status(404).json({ error: "Embed account not found" });
      }

      const visitorKey = buildEmbedVisitorKey(req, tenant);
      await storage.recordEmbedQuoteClick(tenant.id, visitorKey);
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking embed quote click:", error);
      res.status(500).json({ error: "Failed to track quote click" });
    }
  });

  // Create tenant (admin only)
  app.post("/api/tenants", requireAdminAuth, async (req, res) => {
    try {
      const tenantData = insertTenantSchema.parse({
        ...req.body,
        visualizationRolloverBalance: 0,
        visualizationRolloverLastProcessedAt: undefined,
      });
      const isEnterprise =
        tenantData.isEnterprise || tenantData.clientType === "enterprise";
      if ((tenantData.visualizationRolloverCap ?? 0) < 0) {
        return res.status(400).json({
          error: "The visualization rollover cap cannot be negative.",
        });
      }
      if (tenantData.visualizationRolloverEnabled) {
        if (!isEnterprise) {
          return res.status(400).json({
            error: "Visualization rollover is available only for enterprise clients.",
          });
        }
        if (!tenantData.userId) {
          return res.status(400).json({
            error: "Link an account before enabling visualization rollover.",
          });
        }
        if ((tenantData.monthlyGenerationLimit ?? -1) <= 0) {
          return res.status(400).json({
            error: "Set a finite monthly generation limit before enabling rollover.",
          });
        }

        tenantData.visualizationRolloverBalance = 0;
        tenantData.visualizationRolloverLastProcessedAt = new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1,
        );
      }
      if (tenantData.userId) {
        const linkedTenant = await storage.getTenantByUserId(tenantData.userId);
        if (linkedTenant) {
          return res.status(409).json({
            error: `That account is already linked to /${linkedTenant.slug}. Edit the existing client instead.`,
          });
        }
      }
      const tenant = await storage.createTenant(tenantData);
      res.json(tenant);
    } catch (error) {
      console.error("Error creating tenant:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid tenant data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create tenant" });
    }
  });

  // Update tenant
  app.patch("/api/tenants/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      // Convert string dates to Date objects before validation
      const requestBody = { ...req.body };
      if (requestBody.lastResetDate && typeof requestBody.lastResetDate === 'string') {
        requestBody.lastResetDate = new Date(requestBody.lastResetDate);
      }
      delete requestBody.visualizationRolloverBalance;
      delete requestBody.visualizationRolloverLastProcessedAt;
      
      const tenantData = insertTenantSchema.partial().parse(requestBody);
      const existingTenant = await storage.getTenant(parseInt(id));
      if (!existingTenant) {
        return res.status(404).json({ error: "Client not found" });
      }
      if (tenantData.userId) {
        const linkedTenant = await storage.getTenantByUserId(tenantData.userId);
        if (linkedTenant && linkedTenant.id !== parseInt(id)) {
          return res.status(409).json({
            error: `That account is already linked to /${linkedTenant.slug}. Unlink it there before assigning it to this client.`,
          });
        }
      }

      const nextClientType = tenantData.clientType ?? existingTenant.clientType;
      const nextIsEnterprise =
        Boolean(tenantData.isEnterprise ?? existingTenant.isEnterprise) ||
        nextClientType === "enterprise";
      const nextMonthlyLimit =
        tenantData.monthlyGenerationLimit ??
        existingTenant.monthlyGenerationLimit ??
        -1;
      const nextUserId =
        tenantData.userId === undefined ? existingTenant.userId : tenantData.userId;
      const nextRolloverEnabled =
        tenantData.visualizationRolloverEnabled ??
        existingTenant.visualizationRolloverEnabled ??
        false;
      if (
        typeof tenantData.visualizationRolloverCap === "number" &&
        tenantData.visualizationRolloverCap < 0
      ) {
        return res.status(400).json({
          error: "The visualization rollover cap cannot be negative.",
        });
      }
      const currentMonthStart = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1,
      );

      if (nextRolloverEnabled) {
        if (!nextIsEnterprise) {
          return res.status(400).json({
            error: "Visualization rollover is available only for enterprise clients.",
          });
        }
        if (!nextUserId) {
          return res.status(400).json({
            error: "Link an account before enabling visualization rollover.",
          });
        }
        if (nextMonthlyLimit <= 0) {
          return res.status(400).json({
            error: "Set a finite monthly generation limit before enabling rollover.",
          });
        }
      }

      if (
        nextRolloverEnabled &&
        !existingTenant.visualizationRolloverEnabled
      ) {
        tenantData.visualizationRolloverBalance = 0;
        tenantData.visualizationRolloverLastProcessedAt = currentMonthStart;
      } else if (
        !nextRolloverEnabled &&
        existingTenant.visualizationRolloverEnabled
      ) {
        tenantData.visualizationRolloverBalance = 0;
        tenantData.visualizationRolloverLastProcessedAt = currentMonthStart;
      } else if (
        nextRolloverEnabled &&
        typeof tenantData.visualizationRolloverCap === "number" &&
        tenantData.visualizationRolloverCap > 0
      ) {
        tenantData.visualizationRolloverBalance = Math.min(
          existingTenant.visualizationRolloverBalance || 0,
          tenantData.visualizationRolloverCap,
        );
      }

      if (existingTenant.userId && tenantData.currentMonthGenerations === 0) {
        const now = new Date();
        await storage.resetUserUsage(existingTenant.userId, now.getMonth() + 1, now.getFullYear());
      }
      const tenant = await storage.updateTenant(parseInt(id), tenantData);
      res.json(tenant);
    } catch (error) {
      console.error("Error updating tenant:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid tenant data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update tenant" });
    }
  });

  app.delete("/api/tenants/:id", requireAdminAuth, async (req, res) => {
    try {
      const tenantId = parsePositiveId(req.params.id);
      if (!tenantId) {
        return res.status(400).json({ error: "Invalid client ID" });
      }

      const tenant = await storage.getTenant(tenantId);
      if (!tenant) {
        return res.status(404).json({ error: "Client not found" });
      }

      if (tenant.slug === "demo") {
        return res.status(409).json({
          error: "The DreamBuilder homepage demo is a protected system client and cannot be deleted.",
        });
      }

      await storage.deleteTenant(tenantId);
      if (tenant.userId) {
        await storage.setUserEmbedOverride(tenant.userId, false, "admin-client-delete");
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting tenant:", error);
      res.status(500).json({ error: "Failed to delete client" });
    }
  });

  // Upload image to public directory and return URL
  app.post("/api/upload-image", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      let optimizedImageBuffer: Buffer;
      try {
        optimizedImageBuffer = await sharp(req.file.buffer)
          .rotate()
          .resize({
            width: publicReferenceImageMaxDimension,
            height: publicReferenceImageMaxDimension,
            fit: "inside",
            withoutEnlargement: true,
          })
          .jpeg({ quality: publicReferenceImageJpegQuality, mozjpeg: true })
          .toBuffer();
      } catch (error) {
        return res.status(400).json({ error: "Invalid image file" });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `upload_${timestamp}.jpg`;
      const filepath = path.join(uploadsDir, filename);

      // Save file to public directory
      fs.writeFileSync(filepath, optimizedImageBuffer);

      // Return public URL
      const publicUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
      res.json({ imageUrl: publicUrl });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // Helper function to check tenant usage limits
  async function checkTenantUsageLimits(tenantId: number) {
    const tenant = await storage.getTenant(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Check if tenant is active
    if (!tenant.active) {
      throw new Error('Account is suspended. Please contact support.');
    }

    if (tenant.userId) {
      const usage = await storage.checkUsageLimits(tenant.userId);
      if (!usage.canUse) {
        throw new Error(
          `Monthly generation limit of ${usage.limit} visualizations exceeded. Please contact support.`,
        );
      }
      return tenant;
    }

    // Check monthly generation limits
    const limit = tenant.monthlyGenerationLimit ?? 100;
    const currentUsage = tenant.currentMonthGenerations || 0;
    
    if (limit !== -1 && currentUsage >= limit) {
      throw new Error(`Monthly generation limit of ${limit} visualizations exceeded. Please upgrade your plan.`);
    }

    return tenant;
  }

  // Helper function to check user usage limits based on subscription (with team support)
  async function checkUserUsageLimits(userId: number, type: 'visualization' | 'landscape' | 'pool') {
    // Use the storage method that already handles team membership correctly
    const usageCheck = await storage.checkUsageLimits(userId);
    
    if (!usageCheck.canUse) {
      // Provide a more informative error message based on the plan
      if (usageCheck.planName === 'Free') {
        throw new Error(`You have reached your free tier limit of ${usageCheck.limit} visualizations. Please upgrade to continue.`);
      } else {
        throw new Error(`You have reached your monthly limit of ${usageCheck.limit} visualizations for the ${usageCheck.planName} plan.`);
      }
    }
    
    // Get subscription for return value compatibility
    const subscription = await storage.getUserActiveSubscription(userId);
    const plan = subscription ? await storage.getSubscriptionPlan(subscription.planId) : null;
    
    return { subscription, plan };
  }

  class GenerationRequestError extends Error {
    status: number;
    details?: Record<string, unknown>;

    constructor(status: number, message: string, details?: Record<string, unknown>) {
      super(message);
      this.status = status;
      this.details = details;
    }
  }

  function parsePositiveId(value: unknown) {
    if (typeof value !== "string" && typeof value !== "number") return null;
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }

  async function getTenantFromGenerationRequest(req: AuthRequest, allowMissingTenant = false) {
    const tenantSlug = typeof req.body.tenantSlug === "string" ? req.body.tenantSlug.trim() : "";
    let tenant = null;
    if (tenantSlug) {
      tenant = await getEmbedTenantBySlug(tenantSlug);
      if (!tenant && !allowMissingTenant) {
        throw new GenerationRequestError(404, "Embed account not found");
      }
    } else {
      const tenantId = parsePositiveId(req.body.tenantId);
      if (tenantId) {
        tenant = await storage.getTenant(tenantId);
      }
      if (tenantId && !tenant && !allowMissingTenant) {
        throw new GenerationRequestError(404, "Embed account not found");
      }
    }

    return await resolveEmbedTenantForAccount(tenant, req.body.accountUserId);
  }

  function getClientIp(req: any) {
    const forwardedFor = req.headers["x-forwarded-for"];
    if (typeof forwardedFor === "string" && forwardedFor.trim()) {
      return forwardedFor.split(",")[0].trim();
    }

    if (Array.isArray(forwardedFor) && forwardedFor[0]) {
      return forwardedFor[0].split(",")[0].trim();
    }

    return req.ip || req.socket?.remoteAddress || "";
  }

  function buildEmbedVisitorKey(req: any, tenant: any) {
    const suppliedVisitorId =
      typeof req.body?.visitorId === "string"
        ? req.body.visitorId
        : typeof req.query?.visitorId === "string"
          ? req.query.visitorId
          : "";
    const ip = getClientIp(req);
    const userAgent = req.get?.("user-agent") || "";
    const fingerprintSource = tenant?.slug === "demo"
      ? `demo:${ip || "unknown"}:agent:${userAgent || "unknown"}`
      : suppliedVisitorId
        ? `visitor:${suppliedVisitorId}`
        : ip
          ? `ip:${ip}`
          : `agent:${userAgent || "unknown"}`;
    const salt = process.env.EMBED_VISITOR_HASH_SALT || process.env.JWT_SECRET || "dreambuilder-embed";

    return crypto
      .createHash("sha256")
      .update(`${salt}:${tenant.id}:${fingerprintSource}`)
      .digest("hex");
  }

  function buildEmbedVisitorStatusResponse(tenant: any, status: any) {
    return {
      ...status,
      quoteGateTitle: tenant.embedQuoteGateTitle || "Ready for a free quote?",
      quoteGateMessage:
        tenant.embedQuoteGateMessage ||
        "You've reached the free visualization limit. Request a quote to keep planning your project.",
      quoteButtonText: tenant.embedCtaText || "Get Free Quote",
      quoteFormTitle: tenant.embedQuoteFormTitle || "Get your free quote",
      quoteFormMessage:
        tenant.embedQuoteFormMessage ||
        "Send your project details and the team will follow up with a quote.",
    };
  }

  async function getEmbedVisitorStatusForRequest(req: any, tenant: any) {
    const unlimitedAccountAccess = await hasUnlimitedEnterpriseEmbedAccess(
      req.user?.id,
      tenant,
      (userId) => storage.getUserTeamAccess(userId),
    );

    if (unlimitedAccountAccess) {
      return {
        visitorKey: "",
        status: buildUnlimitedEnterpriseEmbedStatus(),
        unlimitedAccountAccess: true,
      };
    }

    const visitorKey = buildEmbedVisitorKey(req, tenant);
    const limit = getEmbedVisitorLimit(tenant);
    const status = await storage.getEmbedVisitorUsageStatus(tenant.id, visitorKey, limit);

    return { visitorKey, status, unlimitedAccountAccess: false };
  }

  async function assertEmbedVisitorCanGenerate(req: any, tenant: any) {
    const access = await getEmbedVisitorStatusForRequest(req, tenant);
    const before = access.status;

    if (before.limitEnabled && !before.canGenerate) {
      throw new GenerationRequestError(
        429,
        "This visitor has reached the free visualization limit. Request a quote to continue.",
        {
          code: "EMBED_VISITOR_LIMIT",
          embedVisitorUsage: buildEmbedVisitorStatusResponse(tenant, before),
        },
      );
    }

    return access;
  }

  async function recordSuccessfulEmbedVisitorGeneration(generationOwner: any) {
    const tracking = generationOwner?.embedVisitorTracking;
    if (!tracking) return;

    try {
      await storage.recordEmbedVisitorGeneration(
        tracking.tenantId,
        tracking.visitorKey,
        tracking.limit,
      );
    } catch (error) {
      console.error("Failed to record successful embed visitor generation:", error);
    }
  }

  function normalizeTenantCustomOptionValue(value: unknown) {
    const rawValue = String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    return rawValue.startsWith("tenant_custom_") ? rawValue : `tenant_custom_${rawValue}`;
  }

  function normalizeTenantToken(value: unknown) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function collectReferenceImageUrls(source: any) {
    const references = [
      ...(Array.isArray(source?.referenceImageUrls) ? source.referenceImageUrls : []),
      ...(Array.isArray(source?.referenceImages) ? source.referenceImages : []),
      source?.referenceImageUrl,
      source?.imageUrl,
    ];

    return references
      .map((url) => String(url || "").trim())
      .filter(Boolean)
      .slice(0, 8);
  }

  function collectTenantInteriorOptions(tenant: any, service: "painting" | "bathroom" | "kitchen" | "living_room") {
    const customizations = tenant?.embedCustomizations || {};
    const byService = customizations?.interiorOptions?.[service];
    const legacyBathroomOptions = service === "bathroom" ? customizations?.bathroomOptions : null;
    const source = Array.isArray(byService) ? byService : Array.isArray(legacyBathroomOptions) ? legacyBathroomOptions : [];

    return source
      .map((option: any) => {
        const label = String(option?.label || option?.name || option?.value || "").trim();
        if (!label) return null;

        return {
          value: normalizeTenantCustomOptionValue(option?.value || label),
          label,
          prompt: String(option?.prompt || option?.instructions || "").trim(),
          referenceImageUrls: collectInteriorReferenceImageUrls(option),
        };
      })
      .filter(Boolean) as Array<{ value: string; label: string; prompt: string; referenceImageUrls: string[] }>;
  }

  function buildTenantInteriorCustomContext(
    tenant: any,
    service: "painting" | "bathroom" | "kitchen" | "living_room",
    selectedStyles: string[],
  ) {
    const selected = new Set(selectedStyles);
    const matchingOptions = collectTenantInteriorOptions(tenant, service)
      .filter((option) => selected.has(option.value));
    const matchingPrompts = matchingOptions.map((option) =>
      buildTenantInteriorOptionPrompt({
        service,
        label: option.label,
        prompt: option.prompt,
        referenceImageUrls: option.referenceImageUrls,
      }),
    );

    return {
      prompt: matchingPrompts.length
        ? [
            "CLIENT-SPECIFIC EMBED OPTIONS:",
            ...matchingPrompts.map((prompt, index) => `${index + 1}. ${prompt}`),
          ].join("\n")
        : "",
      referenceImageUrls: matchingOptions.flatMap((option) => option.referenceImageUrls),
    };
  }

  function normalizeTenantPrefixedOptionValue(option: any, prefix: string) {
    const label = String(option?.label || option?.name || option?.value || "option").trim();
    const rawValue = normalizeTenantToken(option?.value || `${prefix}_${normalizeTenantToken(label)}`);
    return rawValue.startsWith("tenant_custom_") ? rawValue : `${prefix}_${rawValue}`;
  }

  function buildTenantOptionContext(
    entries: Array<{
      categoryLabel: string;
      selectedStyle?: string;
      options: any[];
      valuePrefix: string;
      transformSelectedStyle?: (value: string) => string;
    }>,
    heading: string,
  ) {
    const prompts: string[] = [];
    const referenceImageUrls: string[] = [];

    for (const entry of entries) {
      if (!entry.selectedStyle || !Array.isArray(entry.options)) continue;

      const selectedStyle = entry.transformSelectedStyle
        ? entry.transformSelectedStyle(entry.selectedStyle)
        : entry.selectedStyle;
      const selectedToken = normalizeTenantToken(selectedStyle);
      if (!selectedToken) continue;

      const matchedOption = entry.options.find((option: any) =>
        normalizeTenantToken(normalizeTenantPrefixedOptionValue(option, entry.valuePrefix)) === selectedToken
      );

      if (!matchedOption) continue;

      const label = String(matchedOption.label || matchedOption.name || selectedStyle).trim();
      const swatch = String(matchedOption.swatch || matchedOption.hex || matchedOption.color || "").trim();
      const prompt = String(matchedOption.prompt || matchedOption.instructions || "").trim();

      prompts.push(
        prompt ||
          `Apply the client-specific ${entry.categoryLabel} option "${label}"${swatch ? ` (${swatch})` : ""} exactly as configured for this tenant.`,
      );
      referenceImageUrls.push(...collectReferenceImageUrls(matchedOption));
    }

    return {
      prompt: prompts.length
        ? [heading, ...prompts.map((prompt, index) => `${index + 1}. ${prompt}`)].join("\n")
        : "",
      referenceImageUrls,
    };
  }

  function buildTenantLandscapeCustomContext(
    tenant: any,
    selectedStyles: {
      curbing?: string;
      landscape?: string;
      patios?: string;
    },
  ) {
    const customizations = tenant?.embedCustomizations || {};

    return buildTenantOptionContext(
      [
        {
          categoryLabel: "curbing",
          selectedStyle: selectedStyles.curbing,
          options: customizations?.landscapeOptions?.curbing || [],
          valuePrefix: "tenant_custom_landscape_curbing",
        },
        {
          categoryLabel: "landscape material",
          selectedStyle: selectedStyles.landscape,
          options: customizations?.landscapeOptions?.landscape || [],
          valuePrefix: "tenant_custom_landscape_landscape",
        },
        {
          categoryLabel: "patio",
          selectedStyle: selectedStyles.patios,
          options: customizations?.landscapeOptions?.patios || [],
          valuePrefix: "tenant_custom_landscape_patios",
          transformSelectedStyle: (value) => value.split("|")[0],
        },
      ],
      "CLIENT-SPECIFIC LANDSCAPE EMBED OPTIONS:",
    );
  }

  function buildTenantPoolCustomContext(
    tenant: any,
    selectedStyles: {
      poolType?: string;
      poolSize?: string;
      decking?: string;
      landscaping?: string;
      features?: string;
      hotTub?: string;
      sauna?: string;
    },
  ) {
    const customizations = tenant?.embedCustomizations || {};

    return buildTenantOptionContext(
      [
        {
          categoryLabel: "pool type",
          selectedStyle: selectedStyles.poolType,
          options: customizations?.poolOptions?.poolType || [],
          valuePrefix: "tenant_custom_pool_pool_type",
        },
        {
          categoryLabel: "pool size",
          selectedStyle: selectedStyles.poolSize,
          options: customizations?.poolOptions?.poolSize || [],
          valuePrefix: "tenant_custom_pool_pool_size",
        },
        {
          categoryLabel: "decking",
          selectedStyle: selectedStyles.decking,
          options: customizations?.poolOptions?.decking || [],
          valuePrefix: "tenant_custom_pool_decking",
        },
        {
          categoryLabel: "pool landscaping",
          selectedStyle: selectedStyles.landscaping,
          options: customizations?.poolOptions?.landscaping || [],
          valuePrefix: "tenant_custom_pool_landscaping",
        },
        {
          categoryLabel: "pool feature",
          selectedStyle: selectedStyles.features,
          options: customizations?.poolOptions?.features || [],
          valuePrefix: "tenant_custom_pool_features",
        },
        {
          categoryLabel: "hot tub",
          selectedStyle: selectedStyles.hotTub,
          options: customizations?.poolOptions?.hotTub || [],
          valuePrefix: "tenant_custom_pool_hot_tub",
        },
        {
          categoryLabel: "sauna",
          selectedStyle: selectedStyles.sauna,
          options: customizations?.poolOptions?.sauna || [],
          valuePrefix: "tenant_custom_pool_sauna",
        },
      ],
      "CLIENT-SPECIFIC POOL EMBED OPTIONS:",
    );
  }

  type EmbedServiceKey =
    | "landscape"
    | "roofing"
    | "pools"
    | "painting"
    | "kitchen"
    | "bathroom"
    | "living-room";

  function isTenantEmbedServiceEnabled(tenant: any, serviceKey: EmbedServiceKey) {
    const customizations = tenant?.embedCustomizations || {};
    const enabledServices = customizations?.enabledServices || {};
    return enabledServices?.[serviceKey] !== false;
  }

  async function requireTenantEmbedServiceEnabled(
    tenantId: number | null,
    serviceKey: EmbedServiceKey,
  ) {
    if (!tenantId) return;

    const tenant = await storage.getTenant(tenantId);
    if (!tenant) return;

    if (!isTenantEmbedServiceEnabled(tenant, serviceKey)) {
      throw new GenerationRequestError(403, "This visualizer service is not enabled");
    }
  }

  async function resolveGenerationOwner(req: AuthRequest, usageType: 'visualization' | 'landscape' | 'pool') {
    const accountUserId = parsePositiveId(req.body.accountUserId);
    let tenant = await getTenantFromGenerationRequest(req, !!accountUserId);
    if (!tenant && accountUserId) {
      tenant = (await ensureStandardEmbedTenant(accountUserId)) || null;
    }
    const isEmbedGeneration = req.body.source === "embed" || (!req.user && (!!tenant || !!accountUserId));

    if (isEmbedGeneration) {
      if (isPlatformDemoEmbed({
        tenantSlug: tenant?.slug,
        tenantOwnerUserId: tenant?.userId,
        accountUserId,
      })) {
        let checkedTenant;
        try {
          checkedTenant = await checkTenantUsageLimits(tenant.id);
        } catch (error: any) {
          throw new GenerationRequestError(429, error.message || "Demo usage limit reached");
        }

        const embedVisitorAccess = await assertEmbedVisitorCanGenerate(req, checkedTenant);
        return {
          userId: null,
          tenantId: checkedTenant.id,
          customizationTenantId: checkedTenant.id,
          shouldTrackUserUsage: false as const,
          hasBusinessPro: false,
          unlimitedAccountAccess: false,
          embedVisitorTracking: {
            tenantId: checkedTenant.id,
            visitorKey: embedVisitorAccess.visitorKey,
            limit: getEmbedVisitorLimit(checkedTenant),
            status: embedVisitorAccess.status,
          },
        };
      }

      const accounting = resolveEmbedGenerationAccounting({
        tenantOwnerUserId: tenant?.userId,
        accountUserId,
        authenticatedViewerUserId: req.user?.id,
      });

      if (!accounting) {
        throw new GenerationRequestError(403, "This embed is not connected to an account");
      }
      const ownerUserId = accounting.ownerUserId;

      const hasEmbedAccess = await storage.computeEmbedAccess(ownerUserId);
      if (!hasEmbedAccess) {
        throw new GenerationRequestError(403, "Embed access is not enabled for this account");
      }

      if (tenant) {
        let checkedTenant;
        try {
          if (tenant.userId && !tenant.isEnterprise && tenant.clientType !== "enterprise") {
            if (!tenant.active) {
              throw new Error("Account is suspended. Please contact support.");
            }
            checkedTenant = tenant;
            await checkUserUsageLimits(ownerUserId, usageType);
          } else {
            checkedTenant = await checkTenantUsageLimits(tenant.id);
          }
        } catch (error: any) {
          throw new GenerationRequestError(429, error.message || "Embed usage limit reached");
        }

        const embedVisitorAccess = await assertEmbedVisitorCanGenerate(req, checkedTenant);

        return {
          userId: ownerUserId,
          tenantId: checkedTenant.id,
          customizationTenantId: checkedTenant.id,
          shouldTrackUserUsage: accounting.shouldTrackUserUsage,
          hasBusinessPro: await storage.hasBusinessProAccess(ownerUserId),
          unlimitedAccountAccess: embedVisitorAccess.unlimitedAccountAccess,
          embedVisitorTracking: embedVisitorAccess.unlimitedAccountAccess
            ? undefined
            : {
                tenantId: checkedTenant.id,
                visitorKey: embedVisitorAccess.visitorKey,
                limit: getEmbedVisitorLimit(checkedTenant),
                status: embedVisitorAccess.status,
              },
        };
      }

      try {
        await checkUserUsageLimits(ownerUserId, usageType);
      } catch (error: any) {
        throw new GenerationRequestError(429, error.message || "Embed usage limit reached");
      }

      return {
        userId: ownerUserId,
        tenantId: null,
        customizationTenantId: null,
        shouldTrackUserUsage: accounting.shouldTrackUserUsage,
        hasBusinessPro: await storage.hasBusinessProAccess(ownerUserId),
      };
    }

    if (!req.user) {
      throw new GenerationRequestError(401, "Authentication required");
    }

    try {
      await checkUserUsageLimits(req.user.id, usageType);
    } catch (error: any) {
      throw new GenerationRequestError(429, error.message || "Usage limit reached");
    }

    return {
      userId: req.user.id,
      tenantId: null,
      customizationTenantId: tenant?.id || null,
      shouldTrackUserUsage: true,
      hasBusinessPro: await storage.hasBusinessProAccess(req.user.id),
    };
  }

  function handleGenerationRequestError(res: any, error: unknown) {
    if (error instanceof GenerationRequestError) {
      res.status(error.status).json({ error: error.message, ...error.details });
      return true;
    }

    return false;
  }

  const projectSchema = z.object({
    name: z.string().trim().min(1, "Project name is required").max(120),
    address: z.string().trim().max(200).optional().nullable(),
    notes: z.string().trim().max(1000).optional().nullable(),
  });

  const projectGenerationSchema = z.object({
    service: z.enum(generationServices),
    visualizationId: z.number().int().positive(),
  });

  async function getWorkspaceOwnerId(userId: number) {
    const teamAccess = await storage.getUserTeamAccess(userId);
    return teamAccess.effectiveUserId;
  }

  app.get("/api/generation-projects", authenticateToken as any, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const workspaceOwnerId = await getWorkspaceOwnerId(req.user.id);
      const [projects, assignments] = await Promise.all([
        getGenerationProjectSummariesByUser(workspaceOwnerId),
        storage.getProjectGenerationsByUser(workspaceOwnerId),
      ]);

      const projectStats = new Map<number, { count: number; lastSavedAt: Date | null }>();
      for (const assignment of assignments) {
        const stats = projectStats.get(assignment.projectId) || { count: 0, lastSavedAt: null };
        stats.count += 1;
        if (!stats.lastSavedAt || (assignment.createdAt && assignment.createdAt > stats.lastSavedAt)) {
          stats.lastSavedAt = assignment.createdAt || null;
        }
        projectStats.set(assignment.projectId, stats);
      }

      res.json({
        projects: projects.map((project) => ({
          ...project,
          coverImageUrl: null,
          generationCount: projectStats.get(project.id)?.count || 0,
          lastSavedAt: projectStats.get(project.id)?.lastSavedAt || null,
        })),
      });
    } catch (error) {
      console.error("Error fetching generation projects:", error);
      res.status(500).json({ error: "Failed to fetch generation projects" });
    }
  });

  app.post("/api/generation-projects", authenticateToken as any, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const payload = projectSchema.parse(req.body);
      const workspaceOwnerId = await getWorkspaceOwnerId(req.user.id);
      const project = await storage.createGenerationProject({
        userId: workspaceOwnerId,
        name: payload.name,
        address: payload.address || null,
        notes: payload.notes || null,
      });

      res.status(201).json({ project });
    } catch (error) {
      console.error("Error creating generation project:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid project data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create generation project" });
    }
  });

  app.patch("/api/generation-projects/:projectId", authenticateToken as any, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const projectId = parseInt(req.params.projectId);
      const workspaceOwnerId = await getWorkspaceOwnerId(req.user.id);
      const payload = projectSchema.partial().parse(req.body);
      const project = await storage.updateGenerationProject(projectId, workspaceOwnerId, {
        name: payload.name,
        address: payload.address,
        notes: payload.notes,
      });

      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      res.json({ project });
    } catch (error) {
      console.error("Error updating generation project:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid project data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update generation project" });
    }
  });

  app.delete("/api/generation-projects/:projectId", authenticateToken as any, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const projectId = parseInt(req.params.projectId);
      const workspaceOwnerId = await getWorkspaceOwnerId(req.user.id);
      const project = await storage.getGenerationProject(projectId, workspaceOwnerId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      await storage.deleteGenerationProject(projectId, workspaceOwnerId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting generation project:", error);
      res.status(500).json({ error: "Failed to delete generation project" });
    }
  });

  app.get("/api/generations", authenticateToken as any, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const userId = await getWorkspaceOwnerId(req.user.id);
      const serviceFilter = isGenerationService(req.query.service) ? req.query.service : "all";
      const projectFilter = typeof req.query.projectId === "string" ? req.query.projectId : "all";
      const requestedPage = Number.parseInt(String(req.query.page || "1"), 10);
      const requestedLimit = Number.parseInt(String(req.query.limit || "10"), 10);
      const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
      const pageSize = Number.isInteger(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, 10)
        : 10;

      const generationLoadErrors: string[] = [];
      const safeLoadRows = async <T>(label: string, loader: () => Promise<T[]>): Promise<T[]> => {
        try {
          return await loader();
        } catch (error) {
          generationLoadErrors.push(label);
          console.error(`Error loading ${label} for generation library:`, error);
          return [];
        }
      };

      const [projects, projectAssignments] = await Promise.all([
        safeLoadRows("generation projects", () => getGenerationProjectSummariesByUser(userId)),
        safeLoadRows("project assignments", () => storage.getProjectGenerationsByUser(userId)),
      ]);

      let userTenant;
      try {
        userTenant = await storage.getTenantByUserId(userId);
      } catch (error) {
        generationLoadErrors.push("tenant lookup");
        console.error("Error loading tenant for generation library:", error);
      }

      const projectsById = new Map(projects.map((project) => [project.id, project]));
      let filteredAssignments = projectAssignments;

      if (projectFilter !== "all" && projectFilter !== "unassigned") {
        const projectId = parseInt(projectFilter);
        if (!Number.isInteger(projectId) || !projectsById.has(projectId)) {
          return res.status(404).json({ error: "Project not found" });
        }
      }

      const assignmentsByGeneration = new Map<string, any[]>();
      for (const assignment of filteredAssignments) {
        const project = projectsById.get(assignment.projectId);
        if (!project) continue;

        const key = `${assignment.service}:${assignment.visualizationId}`;
        const currentAssignments = assignmentsByGeneration.get(key) || [];
        currentAssignments.push({
          id: assignment.id,
          projectId: assignment.projectId,
          projectName: project.name,
          createdAt: assignment.createdAt,
        });
        assignmentsByGeneration.set(key, currentAssignments);
      }

      const shouldLoad = (service: GenerationService) => serviceFilter === "all" || serviceFilter === service;
      const generations: any[] = [];
      const addGeneration = (visualization: any, service: GenerationService) => {
        const key = `${service}:${visualization.id}`;
        if (generations.some((generation) => generation.id === key)) return;

        generations.push(normalizeGeneration(
          visualization,
          service,
          assignmentsByGeneration.get(key) || []
        ));
      };

      if (shouldLoad("roofing-siding") || shouldLoad("interior")) {
        const userVisualizations = await safeLoadRows("account roofing/interior generations", () =>
          getVisualizationSummariesByUser(userId)
        );
        for (const visualization of userVisualizations) {
          const service = getVisualizationService(visualization);
          if (!shouldLoad(service)) continue;

          addGeneration(visualization, service);
        }

        if (userTenant) {
          const tenantVisualizations = await safeLoadRows("embed roofing/interior generations", () =>
            getVisualizationSummariesByTenant(userTenant.id)
          );
          for (const visualization of tenantVisualizations) {
            const service = getVisualizationService(visualization);
            if (!shouldLoad(service)) continue;

            addGeneration(visualization, service);
          }
        }
      }

      if (shouldLoad("pools")) {
        const poolGenerations = await safeLoadRows("account pool generations", () =>
          getPoolVisualizationSummariesByUser(userId)
        );
        for (const visualization of poolGenerations) {
          addGeneration(visualization, "pools");
        }

        if (userTenant) {
          const tenantPoolGenerations = await safeLoadRows("embed pool generations", () =>
            getPoolVisualizationSummariesByTenant(userTenant.id)
          );
          for (const visualization of tenantPoolGenerations) {
            addGeneration(visualization, "pools");
          }
        }
      }

      if (shouldLoad("landscape")) {
        const landscapeGenerations = await safeLoadRows("account landscape generations", () =>
          getLandscapeVisualizationSummariesByUser(userId)
        );
        for (const visualization of landscapeGenerations) {
          addGeneration(visualization, "landscape");
        }

        if (userTenant) {
          const tenantLandscapeGenerations = await safeLoadRows("embed landscape generations", () =>
            getLandscapeVisualizationSummariesByTenant(userTenant.id)
          );
          for (const visualization of tenantLandscapeGenerations) {
            addGeneration(visualization, "landscape");
          }
        }
      }

      if (shouldLoad("halloween")) {
        const halloweenGenerations = await safeLoadRows("account halloween generations", () =>
          getHalloweenVisualizationSummariesByUser(userId)
        );
        for (const visualization of halloweenGenerations) {
          addGeneration(visualization, "halloween");
        }

        if (userTenant) {
          const tenantHalloweenGenerations = await safeLoadRows("embed halloween generations", () =>
            getHalloweenVisualizationSummariesByTenant(userTenant.id)
          );
          for (const visualization of tenantHalloweenGenerations) {
            addGeneration(visualization, "halloween");
          }
        }
      }

      if (shouldLoad("christmas-lights")) {
        const christmasGenerations = await safeLoadRows("account christmas lights generations", () =>
          getChristmasLightsVisualizationSummariesByUser(userId)
        );
        for (const visualization of christmasGenerations) {
          addGeneration(visualization, "christmas-lights");
        }

        if (userTenant) {
          const tenantChristmasGenerations = await safeLoadRows("embed christmas lights generations", () =>
            getChristmasLightsVisualizationSummariesByTenant(userTenant.id)
          );
          for (const visualization of tenantChristmasGenerations) {
            addGeneration(visualization, "christmas-lights");
          }
        }
      }

      const filteredGenerations = generations
        .filter((generation) => {
          if (projectFilter === "all") return true;
          if (projectFilter === "unassigned") return generation.assignments.length === 0;

          const projectId = parseInt(projectFilter);
          return generation.assignments.some((assignment: any) => assignment.projectId === projectId);
        })
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      const total = filteredGenerations.length;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const currentPage = Math.min(page, totalPages);
      const startIndex = (currentPage - 1) * pageSize;

      res.json({
        generations: filteredGenerations.slice(startIndex, startIndex + pageSize),
        total,
        page: currentPage,
        pageSize,
        totalPages,
        partial: generationLoadErrors.length > 0,
      });
    } catch (error) {
      console.error("Error fetching generation library:", error);
      res.status(500).json({ error: "Failed to fetch generation library" });
    }
  });

  app.get("/api/generations/:service/:visualizationId/thumbnail", authenticateToken as any, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (!isGenerationService(req.params.service)) {
        return res.status(400).json({ error: "Unknown generation service" });
      }

      const visualizationId = parseInt(req.params.visualizationId);
      if (!Number.isInteger(visualizationId) || visualizationId <= 0) {
        return res.status(400).json({ error: "Invalid visualization id" });
      }

      const workspaceOwnerId = await getWorkspaceOwnerId(req.user.id);
      const generation = await getOwnedGenerationForService(workspaceOwnerId, req.params.service, visualizationId);
      if (!generation) {
        return res.status(404).json({ error: "Generation not found" });
      }

      const imageUrl = getPrimaryGenerationImageUrl(generation);
      if (!imageUrl) {
        return res.status(404).json({ error: "Generation image not found" });
      }

      const thumbnailImageUrl = await createThumbnailImageUrl(imageUrl);
      res.setHeader("Cache-Control", "private, max-age=3600");
      res.json({ thumbnailImageUrl });
    } catch (error) {
      console.error("Error fetching generation thumbnail:", error);
      res.status(500).json({ error: "Failed to fetch generation thumbnail" });
    }
  });

  app.get("/api/generations/:service/:visualizationId/image", authenticateToken as any, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (!isGenerationService(req.params.service)) {
        return res.status(400).json({ error: "Unknown generation service" });
      }

      const visualizationId = parseInt(req.params.visualizationId);
      if (!Number.isInteger(visualizationId) || visualizationId <= 0) {
        return res.status(400).json({ error: "Invalid visualization id" });
      }

      const workspaceOwnerId = await getWorkspaceOwnerId(req.user.id);
      const generation = await getOwnedGenerationForService(workspaceOwnerId, req.params.service, visualizationId);
      if (!generation) {
        return res.status(404).json({ error: "Generation not found" });
      }

      res.setHeader("Cache-Control", "private, max-age=300");
      res.json({
        originalImageUrl: generation.originalImageUrl || null,
        generatedImageUrl: generation.generatedImageUrl || null,
      });
    } catch (error) {
      console.error("Error fetching generation image:", error);
      res.status(500).json({ error: "Failed to fetch generation image" });
    }
  });

  app.post("/api/generation-projects/:projectId/generations", authenticateToken as any, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const projectId = parseInt(req.params.projectId);
      const workspaceOwnerId = await getWorkspaceOwnerId(req.user.id);
      const project = await storage.getGenerationProject(projectId, workspaceOwnerId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const payload = projectGenerationSchema.parse(req.body);
      const generation = await getOwnedGenerationForService(workspaceOwnerId, payload.service, payload.visualizationId);
      if (!generation) {
        return res.status(404).json({ error: "Generation not found" });
      }

      const existingAssignment = await storage.getProjectGenerationForVisualization(
        projectId,
        workspaceOwnerId,
        payload.service,
        payload.visualizationId
      );

      if (existingAssignment) {
        return res.json({ projectGeneration: existingAssignment });
      }

      const projectGeneration = await storage.addProjectGeneration({
        projectId,
        userId: workspaceOwnerId,
        service: payload.service,
        visualizationId: payload.visualizationId,
      });

      const coverImageUrl = getPrimaryGenerationImageUrl(generation) || null;
      if (!project.coverImageUrl && coverImageUrl) {
        await storage.updateGenerationProject(projectId, workspaceOwnerId, {
          coverImageUrl: coverImageUrl.startsWith("data:") ? null : coverImageUrl,
        });
      }

      res.status(201).json({ projectGeneration });
    } catch (error) {
      console.error("Error saving generation to project:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid generation data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to save generation to project" });
    }
  });

  app.delete("/api/project-generations/:assignmentId", authenticateToken as any, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const workspaceOwnerId = await getWorkspaceOwnerId(req.user.id);
      await storage.removeProjectGeneration(parseInt(req.params.assignmentId), workspaceOwnerId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing generation from project:", error);
      res.status(500).json({ error: "Failed to remove generation from project" });
    }
  });

  // Gemini-powered roofing/siding editing workflow (account or embed-owned)
  app.post("/api/upload", optionalAuthenticateToken as any, upload.single("image"), async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      let generationOwner;
      try {
        generationOwner = await resolveGenerationOwner(req, 'visualization');
      } catch (error) {
        if (handleGenerationRequestError(res, error)) return;
        throw error;
      }

      const { selectedRoof, selectedSiding, selectedSurpriseMe, selectedWindows, customPrompt } = req.body;
      const maskData = typeof req.body.maskData === "string" ? req.body.maskData.trim() : "";
      const userId = generationOwner.userId;
      const hasBusinessPro = generationOwner.hasBusinessPro;
      const hasCustomPromptAccess = canUseEmbedCustomInstructions(
        hasBusinessPro,
        generationOwner.unlimitedAccountAccess,
      );
      const selectedStyles = {
        roof: selectedRoof || undefined,
        siding: selectedSiding || undefined,
        surpriseMe: selectedSurpriseMe || undefined,
        windows: selectedWindows || undefined
      };
      const customizationTenantId = generationOwner.customizationTenantId || generationOwner.tenantId;
      await requireTenantEmbedServiceEnabled(customizationTenantId, "roofing");

      // Validate custom prompt access (Professional feature)
      let validatedCustomPrompt = undefined;
      let tenantReferenceImages: any[] = [];
      let tenantExteriorDebug: any = {
        selectedCategory: selectedSiding ? "siding" : selectedRoof ? "roof" : selectedWindows ? "windows" : "",
        selectedSidingStyleId: selectedSiding || "",
        selectedColorId: "",
        resolvedSidingStylePrompt: "",
        resolvedSidingColorPrompt: "",
        referenceImagesCount: 0,
      };
      if (customizationTenantId) {
        const ownerTenant = await storage.getTenant(customizationTenantId);
        const customContext = buildTenantExteriorCustomContext(ownerTenant, selectedStyles);
        validatedCustomPrompt = customContext.prompt || undefined;
        tenantReferenceImages = customContext.referenceImages;
        tenantExteriorDebug = customContext.debug;
      }

      console.log("[Embed][Exterior] Generation debug", {
        selectedCategory: tenantExteriorDebug.selectedCategory,
        selectedSidingStyleId: tenantExteriorDebug.selectedSidingStyleId,
        selectedColorId: tenantExteriorDebug.selectedColorId,
        resolvedStylePrompt: tenantExteriorDebug.resolvedSidingStylePrompt,
        resolvedColorPrompt: tenantExteriorDebug.resolvedSidingColorPrompt,
        referenceImagesCount: tenantExteriorDebug.referenceImagesCount,
        referenceImages: tenantExteriorDebug.referenceImages,
        masking: {
          maskProvided: Boolean(maskData),
          maskApplied: false,
          reason:
            "Gemini exterior generateContent flow does not currently apply a deterministic siding-area mask; prompt fallback restricts edits to siding only.",
        },
      });

      if (customPrompt && customPrompt.trim()) {
        if (hasCustomPromptAccess) {
          validatedCustomPrompt = [validatedCustomPrompt, customPrompt.trim()].filter(Boolean).join("\n\n");
        } else {
          console.log(`User ${userId} attempted to use custom prompt without Professional access`);
        }
      }

      // Process image with size constraints (max 1920x1080)
      const originalImageBuffer = req.file.buffer;

      // Create base64 for storage
      const base64Image = `data:image/jpeg;base64,${originalImageBuffer.toString('base64')}`;

      const visualization = await storage.createVisualization({
        tenantId: generationOwner.tenantId,
        userId: userId,
        originalImageUrl: base64Image,
        selectedRoof: selectedRoof || null,
        selectedSiding: selectedSiding || null,
        selectedSurpriseMe: selectedSurpriseMe || null,
        status: "processing",
      });

      if (generationOwner.shouldTrackUserUsage && userId) {
        await storage.createOrUpdateUserUsage(userId, 'visualization');
      }

      // Process with Gemini AI
      try {
        const result = await processLandscapeWithGemini({
          imageBuffer: originalImageBuffer,
          selectedStyles,
          customPrompt: validatedCustomPrompt,
          referenceImages: tenantReferenceImages,
          debugContext: {
            ...tenantExteriorDebug,
            masking: {
              maskProvided: Boolean(maskData),
              maskApplied: false,
              reason:
                "TODO: wire a true siding-area mask into an image-edit endpoint that accepts masks. Current Gemini flow uses strict prompt constraints only.",
            },
          },
          usePremiumModel: hasBusinessPro
        });

        // Convert edited image to base64 for storage
        const editedBase64 = `data:image/jpeg;base64,${result.editedImageBuffer.toString('base64')}`;

        // Create a prediction-like object for compatibility
        const prediction = {
          id: `gemini_${Date.now()}`,
          status: 'succeeded',
          output: [editedBase64],
          appliedStyles: result.appliedStyles,
          prompt: result.prompt
        };

        // Update visualization with result
        await storage.updateVisualization(visualization.id, {
          replicateId: prediction.id,
          generatedImageUrl: editedBase64,
          status: "completed",
        });
        await recordSuccessfulEmbedVisitorGeneration(generationOwner);

        res.json({
          visualizationId: visualization.id,
          replicateId: prediction.id,
          status: "completed",
          appliedStyles: result.appliedStyles,
          prompt: result.prompt
        });

      } catch (geminiError: any) {
        console.error("Gemini processing error:", geminiError);
        await storage.updateVisualization(visualization.id, {
          status: "failed",
        });
        
        // Check if this is a Google service error
        const isGoogleServiceError = geminiError.message && 
          (geminiError.message.includes('Internal error encountered') || 
           geminiError.message.includes('500') ||
           geminiError.status === 500);
        
        const errorMessage = isGoogleServiceError 
          ? "Google's AI service is temporarily unavailable. Please try again in a few minutes."
          : "AI processing failed. Please try again.";
        
        res.status(500).json({ 
          error: errorMessage,
          details: geminiError.message 
        });
      }

    } catch (error) {
      console.error("Error processing upload:", error);
      res.status(500).json({ error: "Failed to process image upload" });
    }
  });

  // Check visualization status (simplified for Gemini workflow)
  app.get("/api/visualizations/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const visualization = await storage.getVisualization(parseInt(id));

      if (!visualization) {
        return res.status(404).json({ error: "Visualization not found" });
      }

      // With Gemini, processing is immediate, so just return the current status
      res.json(visualization);
    } catch (error) {
      console.error("Error checking visualization status:", error);
      res.status(500).json({ error: "Failed to check status" });
    }
  });

  // Interior visualization upload (account or embed-owned)
  app.post("/api/interior/upload", optionalAuthenticateToken as any, upload.single("image"), async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      let generationOwner;
      try {
        generationOwner = await resolveGenerationOwner(req, 'visualization');
      } catch (error) {
        if (handleGenerationRequestError(res, error)) return;
        throw error;
      }

      const service = z.enum(["painting", "bathroom", "kitchen", "living_room"]).parse(req.body.service);
      const selectedStylesRaw = typeof req.body.selectedStyles === "string" ? req.body.selectedStyles : "";
      const selectedStyleRaw = typeof req.body.selectedStyle === "string" ? req.body.selectedStyle : "";
      let selectedStyles: string[];

      if (selectedStylesRaw) {
        selectedStyles = z.array(z.string().min(1)).min(1).max(24).parse(JSON.parse(selectedStylesRaw));
      } else {
        selectedStyles = [z.string().min(1).parse(selectedStyleRaw)];
      }

      const customColorName = typeof req.body.customColorName === "string" ? req.body.customColorName : "";
      const customColorHex = typeof req.body.customColorHex === "string" ? req.body.customColorHex : "";
      const customPrompt = typeof req.body.customPrompt === "string" ? req.body.customPrompt : "";
      const userId = generationOwner.userId;
      const hasBusinessPro = generationOwner.hasBusinessPro;
      const embedServiceKey =
        service === "living_room" ? "living-room" : service;
      const customizationTenantId = generationOwner.customizationTenantId || generationOwner.tenantId;
      await requireTenantEmbedServiceEnabled(customizationTenantId, embedServiceKey);

      let validatedCustomPrompt = "";
      let tenantReferenceImageUrls: string[] = [];
      if (customizationTenantId) {
        const ownerTenant = await storage.getTenant(customizationTenantId);
        const customContext = buildTenantInteriorCustomContext(ownerTenant, service, selectedStyles);
        validatedCustomPrompt = customContext.prompt;
        tenantReferenceImageUrls = customContext.referenceImageUrls;
      }

      if (customPrompt && customPrompt.trim()) {
        if (hasBusinessPro) {
          validatedCustomPrompt = [validatedCustomPrompt, customPrompt.trim()].filter(Boolean).join("\n\n");
        } else {
          console.log(`User ${userId} attempted to use custom prompt without Professional access`);
        }
      }

      const originalImageBuffer = req.file.buffer;
      const base64Image = `data:image/jpeg;base64,${originalImageBuffer.toString('base64')}`;

      const visualization = await storage.createVisualization({
        tenantId: generationOwner.tenantId,
        userId,
        originalImageUrl: base64Image,
        selectedRoof: service,
        selectedSiding: selectedStyles.join(","),
        selectedSurpriseMe: null,
        status: "processing",
      });

      if (generationOwner.shouldTrackUserUsage && userId) {
        await storage.createOrUpdateUserUsage(userId, 'visualization');
      }

      try {
        const result = await processInteriorVisualizationWithGemini({
          imageBuffer: originalImageBuffer,
          service,
          selectedStyles,
          customColorName,
          customColorHex,
          customPrompt: validatedCustomPrompt || undefined,
          referenceImageUrls: tenantReferenceImageUrls,
          usePremiumModel: hasBusinessPro
        });

        const editedBase64 = `data:image/jpeg;base64,${result.editedImageBuffer.toString('base64')}`;
        const predictionId = `interior_gemini_${Date.now()}`;

        await storage.updateVisualization(visualization.id, {
          replicateId: predictionId,
          generatedImageUrl: editedBase64,
          status: "completed",
        });
        await recordSuccessfulEmbedVisitorGeneration(generationOwner);

        res.json({
          visualizationId: visualization.id,
          replicateId: predictionId,
          status: "completed",
          generatedImageUrl: editedBase64,
          appliedStyles: result.appliedStyles,
          prompt: result.prompt
        });
      } catch (geminiError: any) {
        console.error("Interior Gemini processing error:", geminiError);
        await storage.updateVisualization(visualization.id, {
          status: "failed",
        });

        res.status(500).json({
          error: "Interior AI processing failed. Please try again.",
          visualizationId: visualization.id
        });
      }
    } catch (error: any) {
      console.error("Interior upload error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid interior request", details: error.errors });
      }
      res.status(500).json({ error: "Upload failed. Please try again." });
    }
  });

  // Submit lead
  app.post("/api/leads", async (req, res) => {
    try {
      let leadData = insertLeadSchema.parse(req.body);
      
      // If user is authenticated, override tenantId with their actual tenant
      const authHeader = req.headers.authorization;
      if (authHeader) {
        const token = authHeader.split(' ')[1];
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
          const userTenant = await storage.getTenantByUserId(decoded.userId);
          if (userTenant) {
            leadData = { ...leadData, tenantId: userTenant.id };
          }
        } catch (tokenError) {
          // Token invalid or expired, continue with original tenantId
        }
      }
      
      const lead = await storage.createLead(leadData);
      let quoteNotificationSent = false;
      let crmWebhookAttempted = false;
      let crmWebhookSent = false;

      if (lead.leadType === "quote" && lead.tenantId) {
        const tenant = await storage.getTenant(lead.tenantId);
        const quoteRecipientEmail =
          tenant?.embedQuoteRecipientEmail ||
          tenant?.email ||
          undefined;

        if (tenant) {
          const [emailSent, crmDelivery] = await Promise.all([
            quoteRecipientEmail
              ? sendQuoteLeadNotificationEmail({
                  tenant,
                  lead,
                  toEmail: quoteRecipientEmail,
                })
              : Promise.resolve(false),
            sendQuoteLeadToCrm({ tenant, lead }),
          ]);
          quoteNotificationSent = emailSent;
          crmWebhookAttempted = crmDelivery.attempted;
          crmWebhookSent = crmDelivery.sent;
          if (crmDelivery.attempted && !crmDelivery.sent) {
            console.error("CRM quote delivery failed:", crmDelivery.error || "Unknown CRM webhook error");
          }
        }
      }

      res.json({ ...lead, quoteNotificationSent, crmWebhookAttempted, crmWebhookSent });
    } catch (error) {
      console.error("Error creating lead:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid lead data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to submit lead" });
    }
  });

  // Get leads for tenant (admin)
  app.get("/api/admin/leads", requireAdminAuth, async (_req, res) => {
    try {
      const allLeads = await db
        .select()
        .from(leads)
        .orderBy(desc(leads.createdAt));
      res.json(allLeads);
    } catch (error) {
      console.error("Error fetching admin leads:", error);
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  app.get("/api/tenants/:tenantId/leads", requireAdminAuth, async (req, res) => {
    try {
      const { tenantId } = req.params;
      const leads = await storage.getLeadsByTenant(parseInt(tenantId));
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  // Delete lead (admin)
  app.delete("/api/leads/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteLead(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting lead:", error);
      res.status(500).json({ error: "Failed to delete lead" });
    }
  });

  // Get visualizations for tenant
  app.get("/api/tenants/:tenantId/visualizations", async (req, res) => {
    try {
      const { tenantId } = req.params;
      const visualizations = await storage.getVisualizationsByTenant(parseInt(tenantId));
      res.json(visualizations);
    } catch (error) {
      console.error("Error fetching visualizations:", error);
      res.status(500).json({ error: "Failed to fetch visualizations" });
    }
  });

  // Pool-specific API routes - completely separate from roofing/siding
  
  // Pool visualization upload (account or embed-owned)
  app.post("/api/pools/upload", optionalAuthenticateToken as any, upload.single("image"), async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      let generationOwner;
      try {
        generationOwner = await resolveGenerationOwner(req, 'pool');
      } catch (error) {
        if (handleGenerationRequestError(res, error)) return;
        throw error;
      }

      const { selectedPoolType, selectedPoolSize, selectedDecking, selectedLandscaping, selectedFeatures, selectedHotTub, selectedSauna, customPrompt } = req.body;
      const userId = generationOwner.userId;
      const hasBusinessPro = generationOwner.hasBusinessPro;
      const selectedPoolStyles = {
        poolType: selectedPoolType || undefined,
        poolSize: selectedPoolSize || undefined,
        decking: selectedDecking || undefined,
        landscaping: selectedLandscaping || undefined,
        features: selectedFeatures || undefined,
        hotTub: selectedHotTub || undefined,
        sauna: selectedSauna || undefined
      };
      const customizationTenantId = generationOwner.customizationTenantId || generationOwner.tenantId;
      await requireTenantEmbedServiceEnabled(customizationTenantId, "pools");

      // Validate custom prompt access (Professional feature)
      let validatedCustomPrompt = undefined;
      let tenantReferenceImageUrls: string[] = [];
      if (customizationTenantId) {
        const ownerTenant = await storage.getTenant(customizationTenantId);
        const customContext = buildTenantPoolCustomContext(ownerTenant, selectedPoolStyles);
        validatedCustomPrompt = customContext.prompt || undefined;
        tenantReferenceImageUrls = customContext.referenceImageUrls;
      }

      if (customPrompt && customPrompt.trim()) {
        if (hasBusinessPro) {
          validatedCustomPrompt = [validatedCustomPrompt, customPrompt.trim()].filter(Boolean).join("\n\n");
        } else {
          console.log(`User ${userId} attempted to use custom prompt without Professional access`);
        }
      }

      // Process image with size constraints (max 1920x1080)
      const originalImageBuffer = req.file.buffer;

      // Create base64 for storage
      const base64Image = `data:image/jpeg;base64,${originalImageBuffer.toString('base64')}`;

      const poolVisualization = await storage.createPoolVisualization({
        tenantId: generationOwner.tenantId,
        userId: userId,
        originalImageUrl: base64Image,
        selectedPoolType: selectedPoolType || null,
        selectedPoolSize: selectedPoolSize || null,
        selectedDecking: selectedDecking || null,
        selectedLandscaping: selectedLandscaping || null,
        selectedFeatures: selectedFeatures || null,
        status: "processing",
      });

      if (generationOwner.shouldTrackUserUsage && userId) {
        await storage.createOrUpdateUserUsage(userId, 'pool');
      }

      // Process with Gemini AI using pool-specific prompts
      try {
        // Import the pool style config to get detailed prompts
        const { POOL_STYLE_CONFIG } = await import("./pool-style-config");
        
        // Build proper pool styles object using the configuration system
        const poolStylesForProcessing: Record<string, any> = {};
        let detailedPrompts: string[] = [];
        
        // Get detailed prompts from pool style configuration
        if (selectedPoolType && POOL_STYLE_CONFIG[selectedPoolType]) {
          poolStylesForProcessing[selectedPoolType] = POOL_STYLE_CONFIG[selectedPoolType];
          detailedPrompts.push(POOL_STYLE_CONFIG[selectedPoolType].prompt);
        }
        if (selectedPoolSize && POOL_STYLE_CONFIG[selectedPoolSize]) {
          poolStylesForProcessing[selectedPoolSize] = POOL_STYLE_CONFIG[selectedPoolSize];
          detailedPrompts.push(POOL_STYLE_CONFIG[selectedPoolSize].prompt);
        }
        if (selectedDecking && POOL_STYLE_CONFIG[selectedDecking]) {
          poolStylesForProcessing[selectedDecking] = POOL_STYLE_CONFIG[selectedDecking];
          detailedPrompts.push(POOL_STYLE_CONFIG[selectedDecking].prompt);
        }
        if (selectedLandscaping && POOL_STYLE_CONFIG[selectedLandscaping]) {
          poolStylesForProcessing[selectedLandscaping] = POOL_STYLE_CONFIG[selectedLandscaping];
          detailedPrompts.push(POOL_STYLE_CONFIG[selectedLandscaping].prompt);
        }
        if (selectedFeatures && POOL_STYLE_CONFIG[selectedFeatures]) {
          poolStylesForProcessing[selectedFeatures] = POOL_STYLE_CONFIG[selectedFeatures];
          detailedPrompts.push(POOL_STYLE_CONFIG[selectedFeatures].prompt);
        }
        if (selectedHotTub && POOL_STYLE_CONFIG[selectedHotTub]) {
          poolStylesForProcessing[selectedHotTub] = POOL_STYLE_CONFIG[selectedHotTub];
          detailedPrompts.push(POOL_STYLE_CONFIG[selectedHotTub].prompt);
        }
        if (selectedSauna && POOL_STYLE_CONFIG[selectedSauna]) {
          poolStylesForProcessing[selectedSauna] = POOL_STYLE_CONFIG[selectedSauna];
          detailedPrompts.push(POOL_STYLE_CONFIG[selectedSauna].prompt);
        }

        // Process with Gemini using the pool-specific processing function
        const result = await processPoolWithGemini({
          imageBuffer: originalImageBuffer,
          selectedStyles: poolStylesForProcessing,
          customPrompt: validatedCustomPrompt,
          referenceImageUrls: tenantReferenceImageUrls,
          usePremiumModel: hasBusinessPro
        });

        // Convert edited image to base64 for storage
        const editedBase64 = `data:image/jpeg;base64,${result.editedImageBuffer.toString('base64')}`;

        // Create a prediction-like object for compatibility
        const prediction = {
          id: `pool_gemini_${Date.now()}`,
          status: 'succeeded',
          output: [editedBase64],
          appliedStyles: selectedPoolStyles,
          prompt: detailedPrompts.join(' ')
        };

        // Update pool visualization with result
        await storage.updatePoolVisualization(poolVisualization.id, {
          replicateId: prediction.id,
          generatedImageUrl: editedBase64,
          status: "completed",
        });
        await recordSuccessfulEmbedVisitorGeneration(generationOwner);

        res.json({
          poolVisualizationId: poolVisualization.id,
          replicateId: prediction.id,
          status: "completed",
          appliedStyles: selectedPoolStyles,
          prompt: detailedPrompts.join(' ')
        });

      } catch (geminiError: any) {
        console.error("Gemini pool processing error:", geminiError);
        await storage.updatePoolVisualization(poolVisualization.id, {
          status: "failed",
        });
        
        // Check if this is a Google service error
        const isGoogleServiceError = geminiError.message && 
          (geminiError.message.includes('Internal error encountered') || 
           geminiError.message.includes('500') ||
           geminiError.status === 500);
        
        const errorMessage = isGoogleServiceError 
          ? "Google's AI service is temporarily unavailable. Please try again in a few minutes."
          : "AI pool processing failed. Please try again.";
        
        res.status(500).json({ 
          error: errorMessage,
          details: geminiError.message 
        });
      }

    } catch (error) {
      console.error("Error processing pool upload:", error);
      res.status(500).json({ error: "Failed to process pool image upload" });
    }
  });

  // Check pool visualization status
  app.get("/api/pools/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const poolVisualization = await storage.getPoolVisualization(parseInt(id));

      if (!poolVisualization) {
        return res.status(404).json({ error: "Pool visualization not found" });
      }

      // With Gemini, processing is immediate, so just return the current status
      res.json(poolVisualization);
    } catch (error) {
      console.error("Error checking pool visualization status:", error);
      res.status(500).json({ error: "Failed to check pool status" });
    }
  });

  // Get pool visualizations for tenant
  app.get("/api/tenants/:tenantId/pool-visualizations", async (req, res) => {
    try {
      const { tenantId } = req.params;
      const poolVisualizations = await storage.getPoolVisualizationsByTenant(parseInt(tenantId));
      res.json(poolVisualizations);
    } catch (error) {
      console.error("Error fetching pool visualizations:", error);
      res.status(500).json({ error: "Failed to fetch pool visualizations" });
    }
  });



  // Get all available styles
  app.get("/api/styles", (req, res) => {
    try {
      const styles = getAllStyles();
      res.json(styles);
    } catch (error) {
      console.error("Error fetching styles:", error);
      res.status(500).json({ error: "Failed to fetch styles" });
    }
  });

  // Get styles by category
  app.get("/api/styles/:category", (req, res) => {
    try {
      const { category } = req.params;
      const styles = getStylesByCategory(category as any);
      res.json(styles);
    } catch (error) {
      console.error("Error fetching styles by category:", error);
      res.status(500).json({ error: "Failed to fetch styles by category" });
    }
  });

  // Gemini-powered image analysis endpoint
  app.post("/api/analyze", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const analysis = await analyzeLandscapeImage(req.file.buffer);

      res.json({
        success: true,
        analysis: analysis,
        recommendations: analysis
      });

    } catch (error) {
      console.error("Image analysis error:", error);
      res.status(500).json({ 
        error: "Image analysis failed",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Landscape-specific API routes
  
  // Landscape visualization upload (account or embed-owned)
  app.post("/api/landscape/upload", optionalAuthenticateToken as any, upload.single("image"), async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      let generationOwner;
      try {
        generationOwner = await resolveGenerationOwner(req, 'landscape');
      } catch (error) {
        if (handleGenerationRequestError(res, error)) return;
        throw error;
      }

      const { selectedCurbing, selectedLandscape, selectedPatios, customPrompt } = req.body;
      const userId = generationOwner.userId;
      const hasBusinessPro = generationOwner.hasBusinessPro;
      const selectedLandscapeStyles = {
        curbing: selectedCurbing || undefined,
        landscape: selectedLandscape || undefined,
        patios: selectedPatios || undefined
      };
      const customizationTenantId = generationOwner.customizationTenantId || generationOwner.tenantId;
      await requireTenantEmbedServiceEnabled(customizationTenantId, "landscape");

      // Validate custom prompt access (Professional feature)
      let validatedCustomPrompt = undefined;
      let tenantReferenceImageUrls: string[] = [];
      if (customizationTenantId) {
        const ownerTenant = await storage.getTenant(customizationTenantId);
        const customContext = buildTenantLandscapeCustomContext(ownerTenant, selectedLandscapeStyles);
        validatedCustomPrompt = customContext.prompt || undefined;
        tenantReferenceImageUrls = customContext.referenceImageUrls;
      }

      if (customPrompt && customPrompt.trim()) {
        if (hasBusinessPro) {
          validatedCustomPrompt = [validatedCustomPrompt, customPrompt.trim()].filter(Boolean).join("\n\n");
        } else {
          console.log(`User ${userId} attempted to use custom prompt without Professional access`);
        }
      }

      // Process image with size constraints (max 1920x1080)
      const originalImageBuffer = req.file.buffer;

      // Create base64 for storage
      const base64Image = `data:image/jpeg;base64,${originalImageBuffer.toString('base64')}`;

      const landscapeVisualization = await storage.createLandscapeVisualization({
        tenantId: generationOwner.tenantId,
        userId: userId,
        originalImageUrl: base64Image,
        selectedCurbing: selectedCurbing || null,
        selectedLandscape: selectedLandscape || null,
        selectedPatios: selectedPatios || null,
        status: "processing",
      });

      if (generationOwner.shouldTrackUserUsage && userId) {
        await storage.createOrUpdateUserUsage(userId, 'landscape');
      }

      // Process with Gemini AI using landscape-specific prompts
      try {
        console.log('🌿 Processing landscape with Gemini:', selectedLandscapeStyles);

        const { processLandscapeVisualizationWithGemini } = await import("./gemini-service");
        const result = await processLandscapeVisualizationWithGemini({
          imageBuffer: originalImageBuffer,
          selectedStyles: selectedLandscapeStyles,
          customPrompt: validatedCustomPrompt,
          referenceImageUrls: tenantReferenceImageUrls,
          usePremiumModel: hasBusinessPro
        });

        // Convert processed image to base64 for storage
        const processedBase64 = `data:image/jpeg;base64,${result.editedImageBuffer.toString('base64')}`;

        // Update landscape visualization with result
        await storage.updateLandscapeVisualization(landscapeVisualization.id, {
          generatedImageUrl: processedBase64,
          status: "completed"
        });
        await recordSuccessfulEmbedVisitorGeneration(generationOwner);

        res.json({
          landscapeVisualizationId: landscapeVisualization.id,
          generatedImageUrl: processedBase64,
          appliedStyles: result.appliedStyles,
          message: "Landscape visualization completed successfully"
        });

      } catch (error: any) {
        console.error("Landscape Gemini processing error:", error);
        
        // Update record with error status
        await storage.updateLandscapeVisualization(landscapeVisualization.id, {
          status: "failed"
        });

        // Provide more specific error messages
        let errorMessage = "AI processing failed. Please try again.";
        if (error.message && error.message.includes("Internal error encountered")) {
          errorMessage = "Google's AI service is temporarily unavailable. Please try again in a moment.";
        } else if (error.message && error.message.includes("after all retries")) {
          errorMessage = "AI service is experiencing issues. Please try again in a few minutes.";
        }

        res.status(500).json({ 
          error: errorMessage,
          landscapeVisualizationId: landscapeVisualization.id
        });
      }

    } catch (error: any) {
      console.error("Landscape upload error:", error);
      res.status(500).json({ error: "Upload failed. Please try again." });
    }
  });

  // Get landscape visualization status
  app.get("/api/landscape/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const landscapeVisualization = await storage.getLandscapeVisualization(parseInt(id));

      if (!landscapeVisualization) {
        return res.status(404).json({ error: "Landscape visualization not found" });
      }

      // With Gemini, processing is immediate, so just return the current status
      res.json(landscapeVisualization);
    } catch (error) {
      console.error("Error checking landscape visualization status:", error);
      res.status(500).json({ error: "Failed to check landscape status" });
    }
  });

  // Get landscape visualizations for tenant
  app.get("/api/tenants/:tenantId/landscape-visualizations", async (req, res) => {
    try {
      const { tenantId } = req.params;
      const landscapeVisualizations = await storage.getLandscapeVisualizationsByTenant(parseInt(tenantId));
      res.json(landscapeVisualizations);
    } catch (error) {
      console.error("Error fetching landscape visualizations:", error);
      res.status(500).json({ error: "Failed to fetch landscape visualizations" });
    }
  });

  // Halloween-specific API routes
  
  // Halloween visualization upload (account or embed-owned)
  app.post("/api/halloween/upload", optionalAuthenticateToken as any, upload.single("image"), async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      let generationOwner;
      try {
        generationOwner = await resolveGenerationOwner(req, 'visualization');
      } catch (error) {
        if (handleGenerationRequestError(res, error)) return;
        throw error;
      }

      const { selectedDecorations, decorations, nightMode, spookyMode } = req.body;
      const selectedDecorationList = selectedDecorations || decorations;
      const userId = generationOwner.userId;
      const hasBusinessPro = generationOwner.hasBusinessPro;

      // Process image with size constraints (max 1920x1080)
      const originalImageBuffer = req.file.buffer;

      // Create base64 for storage
      const base64Image = `data:image/jpeg;base64,${originalImageBuffer.toString('base64')}`;

      // Create halloween visualization record with user ID only
      const halloweenVisualization = await storage.createHalloweenVisualization({
        tenantId: generationOwner.tenantId,
        userId: userId,
        originalImageUrl: base64Image,
        selectedDecorations: selectedDecorationList || null,
        nightMode: nightMode === 'true' || nightMode === true,
        spookyMode: spookyMode === 'true' || spookyMode === true,
        status: "processing",
      });

      if (generationOwner.shouldTrackUserUsage && userId) {
        await storage.createOrUpdateUserUsage(userId, 'visualization');
      }

      // Process with Halloween AI
      try {
        console.log('Processing Halloween visualization:', {
          decorations: selectedDecorationList,
          nightMode: nightMode,
          spookyMode: spookyMode
        });

        // Call Halloween processing function
        const result = await processHalloweenVisualizationWithGemini({
          imageBuffer: originalImageBuffer,
          selectedDecorations: selectedDecorationList || '',
          nightMode: nightMode === 'true' || nightMode === true,
          spookyMode: spookyMode === 'true' || spookyMode === true,
          usePremiumModel: hasBusinessPro
        });

        // Convert edited image to base64 for storage
        const editedBase64Image = `data:image/jpeg;base64,${result.editedImageBuffer.toString('base64')}`;

        // Update visualization with generated image
        await storage.updateHalloweenVisualization(halloweenVisualization.id, {
          generatedImageUrl: editedBase64Image,
          status: "completed"
        });
        await recordSuccessfulEmbedVisitorGeneration(generationOwner);

        res.json({
          halloweenVisualizationId: halloweenVisualization.id,
          generatedImageUrl: editedBase64Image,
          appliedDecorations: result.appliedDecorations,
          prompt: result.prompt,
          message: "Halloween visualization created successfully"
        });

      } catch (error: any) {
        console.error("Halloween processing error:", error);
        
        // Update record with error status
        await storage.updateHalloweenVisualization(halloweenVisualization.id, {
          status: "failed"
        });

        res.status(500).json({ 
          error: "AI processing failed. Please try again.",
          halloweenVisualizationId: halloweenVisualization.id
        });
      }

    } catch (error: any) {
      console.error("Halloween upload error:", error);
      res.status(500).json({ error: "Upload failed. Please try again." });
    }
  });

  // Get Halloween visualizations for authenticated user
  app.get("/api/halloween/visualizations", authenticateToken as any, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const halloweenVisualizations = await storage.getHalloweenVisualizationsByUser(req.user.id);
      res.json(halloweenVisualizations);
    } catch (error) {
      console.error("Error fetching Halloween visualizations:", error);
      res.status(500).json({ error: "Failed to fetch Halloween visualizations" });
    }
  });

  // Get Halloween visualization status
  app.get("/api/halloween/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const halloweenVisualization = await storage.getHalloweenVisualization(parseInt(id));

      if (!halloweenVisualization) {
        return res.status(404).json({ error: "Halloween visualization not found" });
      }

      res.json(halloweenVisualization);
    } catch (error) {
      console.error("Error checking Halloween visualization status:", error);
      res.status(500).json({ error: "Failed to check Halloween status" });
    }
  });

  // Christmas Lights-specific API routes
  
  // Christmas Lights visualization upload (account or embed-owned)
  app.post("/api/christmas-lights/upload", optionalAuthenticateToken as any, upload.single("image"), async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      let generationOwner;
      try {
        generationOwner = await resolveGenerationOwner(req, 'visualization');
      } catch (error) {
        if (handleGenerationRequestError(res, error)) return;
        throw error;
      }

      const { lightType, lightColor, addSnow } = req.body;
      const userId = generationOwner.userId;
      const hasBusinessPro = generationOwner.hasBusinessPro;

      // Process image with size constraints (max 1920x1080)
      const originalImageBuffer = req.file.buffer;

      // Create base64 for storage
      const base64Image = `data:image/jpeg;base64,${originalImageBuffer.toString('base64')}`;

      // Create Christmas lights visualization record with user ID only
      const christmasVisualization = await storage.createChristmasLightsVisualization({
        tenantId: generationOwner.tenantId,
        userId: userId,
        originalImageUrl: base64Image,
        lightType: lightType || 'c9_rope_lights',
        lightColor: lightColor || 'warm_white',
        addSnow: addSnow === 'true' || addSnow === true,
        status: "processing",
      });

      if (generationOwner.shouldTrackUserUsage && userId) {
        await storage.createOrUpdateUserUsage(userId, 'visualization');
      }

      // Process with Christmas Lights AI
      try {
        console.log('🎄 Processing Christmas lights visualization:', {
          lightType,
          lightColor,
          addSnow
        });

        // Call Christmas lights processing function
        const result = await processChristmasLightsWithGemini(
          originalImageBuffer,
          lightType || 'c9_rope_lights',
          lightColor || 'warm_white',
          addSnow === 'true' || addSnow === true,
          hasBusinessPro
        );

        // Convert edited image to base64 for storage
        const editedBase64Image = `data:image/jpeg;base64,${result.editedImageBuffer.toString('base64')}`;

        // Update visualization with generated image
        await storage.updateChristmasLightsVisualization(christmasVisualization.id, {
          generatedImageUrl: editedBase64Image,
          status: "completed"
        });
        await recordSuccessfulEmbedVisitorGeneration(generationOwner);

        res.json({
          christmasLightsVisualizationId: christmasVisualization.id,
          generatedImageUrl: editedBase64Image,
          appliedFeatures: result.appliedFeatures,
          prompt: result.prompt,
          message: "Christmas lights visualization created successfully"
        });

      } catch (error: any) {
        console.error("Christmas lights processing error:", error);
        
        // Update record with error status
        await storage.updateChristmasLightsVisualization(christmasVisualization.id, {
          status: "failed"
        });

        res.status(500).json({ 
          error: "AI processing failed. Please try again.",
          christmasLightsVisualizationId: christmasVisualization.id
        });
      }

    } catch (error: any) {
      console.error("Christmas lights upload error:", error);
      res.status(500).json({ error: "Upload failed. Please try again." });
    }
  });

  // Get Christmas Lights visualizations for authenticated user
  app.get("/api/christmas-lights/visualizations", authenticateToken as any, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const christmasVisualizations = await storage.getChristmasLightsVisualizationsByUser(req.user.id);
      res.json(christmasVisualizations);
    } catch (error) {
      console.error("Error fetching Christmas lights visualizations:", error);
      res.status(500).json({ error: "Failed to fetch Christmas lights visualizations" });
    }
  });

  // Get Christmas Lights visualization status
  app.get("/api/christmas-lights/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const christmasVisualization = await storage.getChristmasLightsVisualization(parseInt(id));

      if (!christmasVisualization) {
        return res.status(404).json({ error: "Christmas lights visualization not found" });
      }

      res.json(christmasVisualization);
    } catch (error) {
      console.error("Error checking Christmas lights visualization status:", error);
      res.status(500).json({ error: "Failed to check Christmas lights status" });
    }
  });

  // Create subscription for tenant
  app.post("/api/tenants/:tenantId/subscription", async (req, res) => {
    try {
      const { tenantId } = req.params;
      const { plan, billingEmail, paymentMethodId } = req.body;
      
      // Here you would integrate with Stripe, Paddle, or your payment processor
      // For now, we'll just update the tenant record
      
      const subscription = {
        plan: plan, // 'basic', 'pro'
        status: 'active',
        billingEmail: billingEmail,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      };
      
      // You would store this in a subscriptions table
      res.json({ success: true, subscription });
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ error: "Failed to create subscription" });
    }
  });

  // Generate API key for tenant (for direct API access)
  app.post("/api/tenants/:tenantId/api-key", async (req, res) => {
    try {
      const { tenantId } = req.params;
      
      // Generate a unique API key
      const apiKey = `lv_${Buffer.from(`${tenantId}_${Date.now()}`).toString('base64')}`;
      
      // Store API key in database (you'd need to add an api_keys table)
      // For now, just return it
      
      res.json({ apiKey });
    } catch (error) {
      console.error("Error generating API key:", error);
      res.status(500).json({ error: "Failed to generate API key" });
    }
  });

  // Get usage statistics for tenant
  app.get("/api/tenants/:tenantId/usage", async (req, res) => {
    try {
      const { tenantId } = req.params;
      const { days } = req.query;
      
      const stats = await storage.getUsageStats(
        parseInt(tenantId), 
        days ? parseInt(days as string) : 30
      );
      
      // Calculate totals
      const totals = stats.reduce((acc, stat) => ({
        totalGenerations: acc.totalGenerations + stat.totalGenerations,
        imageGenerations: acc.imageGenerations + stat.imageGenerations,
        landscapeGenerations: acc.landscapeGenerations + stat.landscapeGenerations,
        poolGenerations: acc.poolGenerations + stat.poolGenerations,
      }), {
        totalGenerations: 0,
        imageGenerations: 0,
        landscapeGenerations: 0,
        poolGenerations: 0,
      });

      res.json({
        stats,
        totals,
        period: `${days || 30} days`
      });
    } catch (error) {
      console.error("Error fetching usage stats:", error);
      res.status(500).json({ error: "Failed to fetch usage statistics" });
    }
  });

  // Team management routes for Professional users
  app.get("/api/teams/my-team", authenticateToken as any, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const team = await storage.getTeamByOwnerId(userId);
      
      if (!team) {
        // Check if user is member of any team
        const teams = await storage.getUserTeams(userId);
        if (teams.length > 0) {
          // User is a team member, not owner
          // Members shouldn't see the member list or be able to manage team
          return res.json({ 
            team: teams[0], 
            members: [], 
            isOwner: false,
            currentUserId: userId
          });
        }
        return res.status(404).json({ error: "No team found" });
      }
      
      // User is the team owner
      const members = await storage.getTeamMembers(team.id);
      res.json({ 
        team, 
        members,
        isOwner: true,
        currentUserId: userId
      });
    } catch (error) {
      console.error("Error fetching team:", error);
      res.status(500).json({ error: "Failed to fetch team" });
    }
  });

  app.post("/api/teams", authenticateToken as any, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { name } = req.body;
      
      // Check if user already has a team
      const existingTeam = await storage.getTeamByOwnerId(userId);
      if (existingTeam) {
        return res.status(400).json({ error: "You already have a team" });
      }
      
      // Check if user has team access through Professional or an enterprise tenant.
      const hasTeamAccess = await storage.hasBusinessProAccess(userId);
      if (!hasTeamAccess) {
        return res.status(403).json({ error: "Professional or enterprise access required" });
      }

      const userTenant = await storage.getTenantByUserId(userId);
      const baseSeatCount = userTenant?.isEnterprise ? 7 : 3;
      
      const team = await storage.createTeam({
        ownerId: userId,
        name,
        maxMembers: baseSeatCount,
        additionalSeats: 0,
      });
      
      res.json({ team });
    } catch (error) {
      console.error("Error creating team:", error);
      res.status(500).json({ error: "Failed to create team" });
    }
  });

  app.post("/api/teams/:teamId/invite", authenticateToken as any, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { teamId } = req.params;
      const { email, role = "member" } = req.body;
      
      const team = await storage.getTeamById(parseInt(teamId));
      if (!team || team.ownerId !== userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      // Check team member limit
      const members = await storage.getTeamMembers(team.id);
      const totalAllowed = (team.maxMembers || 3) + (team.additionalSeats || 0);
      if (members.length >= totalAllowed) {
        return res.status(400).json({ 
          error: `Team limit reached. You can have ${totalAllowed} members. Add more seats for $50/month each.`
        });
      }
      
      // Check if already invited
      const existingMember = await storage.getTeamMemberByEmail(team.id, email);
      if (existingMember) {
        return res.status(400).json({ error: "User already invited" });
      }
      
      // Generate unique invitation token and join code
      const { nanoid } = await import('nanoid');
      const invitationToken = nanoid(32);
      const joinCode = nanoid(8).toUpperCase(); // 8-char uppercase code for easy sharing
      
      const member = await storage.addTeamMember({
        teamId: team.id,
        email,
        role,
        invitedBy: userId,
        status: "pending",
        invitationToken,
        joinCode,
      });
      
      // Send invitation email
      const inviterUser = await storage.getUser(userId);
      const inviterName = inviterUser ? `${inviterUser.firstName} ${inviterUser.lastName}` : 'A team member';
      
      // Get the app URL for invitation link - prioritize production domain
      const productionUrl = process.env.APP_URL || process.env.PRODUCTION_URL;
      const replitDomain = process.env.REPLIT_DOMAINS?.split(',')[0];
      const appUrl = productionUrl 
        ? productionUrl 
        : (replitDomain ? `https://${replitDomain}` : 'http://localhost:5000');
      
      console.log(`🔗 Generating invitation URL with APP_URL=${process.env.APP_URL}, using: ${appUrl}`);
      
      await sendTeamInvitationEmail({
        toEmail: email,
        teamName: team.name,
        inviterName,
        invitationLink: `${appUrl}/accept-invitation?token=${invitationToken}`,
        joinCode,
      });
      
      res.json({ member });
    } catch (error) {
      console.error("Error inviting team member:", error);
      res.status(500).json({ error: "Failed to invite team member" });
    }
  });

  app.patch("/api/teams/:teamId/members/:memberId", authenticateToken as any, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { teamId, memberId } = req.params;
      const { role, status } = req.body;
      
      const team = await storage.getTeamById(parseInt(teamId));
      if (!team || team.ownerId !== userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      const member = await storage.updateTeamMember(parseInt(memberId), { role, status });
      res.json({ member });
    } catch (error) {
      console.error("Error updating team member:", error);
      res.status(500).json({ error: "Failed to update team member" });
    }
  });

  app.delete("/api/teams/:teamId/members/:memberId", authenticateToken as any, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { teamId, memberId } = req.params;
      
      const team = await storage.getTeamById(parseInt(teamId));
      if (!team || team.ownerId !== userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      await storage.removeTeamMember(parseInt(memberId));
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing team member:", error);
      res.status(500).json({ error: "Failed to remove team member" });
    }
  });

  app.post("/api/teams/:teamId/add-seats", authenticateToken as any, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { teamId } = req.params;
      const { additionalSeats } = req.body;
      
      const team = await storage.getTeamById(parseInt(teamId));
      if (!team || team.ownerId !== userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      // Update team with additional seats
      const updatedTeam = await storage.updateTeam(team.id, {
        additionalSeats
      });
      
      // TODO: Update Stripe subscription with additional seats
      
      res.json({ team: updatedTeam });
    } catch (error) {
      console.error("Error adding seats:", error);
      res.status(500).json({ error: "Failed to add seats" });
    }
  });

  // Team invitation acceptance routes
  app.get("/api/invitations/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      const invitation = await storage.getTeamMemberByToken(token);
      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found or expired" });
      }
      
      if (invitation.status !== 'pending') {
        return res.status(400).json({ error: "Invitation already accepted" });
      }
      
      res.json({
        email: invitation.email,
        teamName: invitation.team.name,
        role: invitation.role
      });
    } catch (error) {
      console.error("Error fetching invitation:", error);
      res.status(500).json({ error: "Failed to fetch invitation" });
    }
  });

  app.post("/api/invitations/:token/accept", authenticateToken as any, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { token } = req.params;
      
      const invitation = await storage.getTeamMemberByToken(token);
      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }
      
      if (invitation.status !== 'pending') {
        return res.status(400).json({ error: "Invitation already accepted" });
      }
      
      // RELAXED ACCEPTANCE: Allow any authenticated user with valid token
      // This allows new users to create accounts and accept invitations seamlessly
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Accept the invitation and update with actual user email
      const member = await storage.acceptTeamInvitation(token, userId);
      res.json({ 
        success: true, 
        member,
        emailUpdated: user.email.toLowerCase() !== invitation.email.toLowerCase()
      });
    } catch (error) {
      console.error("Error accepting invitation:", error);
      res.status(500).json({ error: "Failed to accept invitation" });
    }
  });

  // Join team using join code (backup method)
  app.post("/api/teams/join-with-code", authenticateToken as any, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { joinCode } = req.body;
      
      if (!joinCode || typeof joinCode !== 'string') {
        return res.status(400).json({ error: "Join code is required" });
      }
      
      // Find pending invitation with this join code
      const invitation = await storage.getTeamMemberByJoinCode(joinCode.toUpperCase());
      if (!invitation) {
        return res.status(404).json({ error: "Invalid join code" });
      }
      
      if (invitation.status !== 'pending') {
        return res.status(400).json({ error: "This join code has already been used" });
      }
      
      // Accept the invitation with the current user
      const member = await storage.acceptTeamInvitationByJoinCode(joinCode.toUpperCase(), userId);
      
      res.json({ 
        success: true, 
        message: "Successfully joined team",
        member 
      });
    } catch (error) {
      console.error("Error joining with code:", error);
      res.status(500).json({ error: "Failed to join team with code" });
    }
  });

  // Leave team endpoint
  app.delete("/api/teams/:teamId/leave", authenticateToken as any, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { teamId } = req.params;
      
      const team = await storage.getTeamById(parseInt(teamId));
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      
      // Can't leave if you're the owner
      if (team.ownerId === userId) {
        return res.status(403).json({ error: "Team owner cannot leave team" });
      }
      
      // Find the member record
      const members = await storage.getTeamMembers(team.id);
      const member = members.find(m => m.userId === userId);
      
      if (!member) {
        return res.status(404).json({ error: "Not a member of this team" });
      }
      
      await storage.removeTeamMember(member.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error leaving team:", error);
      res.status(500).json({ error: "Failed to leave team" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
