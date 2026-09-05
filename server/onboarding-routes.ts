import type { Express } from "express";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { db } from "./db";
import { storage } from "./storage";
import { AuthService, authenticateToken, type AuthRequest } from "./auth";
import { rateLimit, hashToken, acquireLease, releaseLease } from "./security";
import { TERMS_VERSION } from "@shared/legal";
import { sendAccountEmail } from "./email-service";
import { removePrivateQuoteCrmConfig } from "./quote-crm";
import { publicHttpsUrl } from "./safe-request";

const text = z.string().trim().max(150);
const imageUrl = z.string().max(1000).refine(value => !value || /^\/(?:uploads|api\/public-images)\/[\w. -]+$/.test(value) || (() => { try { publicHttpsUrl(value); return true; } catch { return false; } })(), "Use a public HTTPS image or an uploaded image");
const product = z.object({ label: text.min(1), value: text.optional(), prompt: z.string().max(1500).optional(), swatch: z.string().regex(/^#[\da-f]{6}$/i).optional(), groupLabel: text.optional(), referenceImageUrls: z.array(imageUrl).max(5).optional(), allowedColorValues: z.array(text).max(100).optional() }).strict();
const color = z.object({ label: text.min(1), value: text.optional(), hex: z.string().regex(/^#[\da-f]{6}$/i), groupLabel: text.optional(), prompt: z.string().max(1000).optional(), referenceImageUrls: z.array(imageUrl).max(5).optional() }).strict();
export const workspaceSettingsSchema = z.object({
  companyName: text.min(1), logoUrl: imageUrl, primaryColor: z.string().regex(/^#[\da-f]{6}$/i),
  phone: z.string().trim().max(40), trade: z.enum(["roofing", "landscape", "pools", "painting", "kitchen", "bathroom", "living-room"]),
  exteriorOptions: z.object({ roof: z.array(product).max(100), siding: z.array(product).max(100), windows: z.array(product).max(100) }).strict(),
  roofColors: z.array(color).max(100), sidingColors: z.array(color).max(100), windowColors: z.array(color).max(100),
}).strict();

export async function sendVerification(user: { id: number; email: string }) {
  const token = AuthService.generateVerificationToken();
  await storage.updateUser(user.id, { emailVerificationToken: hashToken(token), emailVerificationExpires: new Date(Date.now() + 24 * 3600_000) } as any);
  return sendAccountEmail(user.email, "Verify your DreamBuilder email", "Confirm your email to publish your business visualizer.", `/account/verify?token=${token}`);
}

export function registerOnboardingRoutes(app: Express) {
  app.post("/api/auth/logout", authenticateToken as any, async (req: AuthRequest, res) => {
    try {
      await db.execute(sql`UPDATE users SET auth_version = auth_version + 1 WHERE id = ${req.user!.id}`);
      req.session.destroy(error => {
        if (error) return res.sendStatus(500);
        res.clearCookie("connect.sid", { path: "/" });
        res.json({ success: true });
      });
    } catch { res.sendStatus(500); }
  });
  app.post("/api/auth/verification", authenticateToken as any, rateLimit("verify-email", 3, 3600), async (req: AuthRequest, res) => {
    try {
      if (!req.user!.emailVerified && !await sendVerification(req.user!)) return res.status(503).json({ error: "Email delivery is unavailable. Please try again later." });
      res.json({ success: true });
    } catch { res.status(503).json({ error: "Could not send verification email" }); }
  });
  app.post("/api/auth/verify", rateLimit("verify", 15, 900), async (req, res) => {
    try { await AuthService.verifyEmail(z.string().length(64).parse(req.body.token)); res.json({ success: true }); }
    catch { res.status(400).json({ error: "This link is invalid or expired. Request a new verification email." }); }
  });
  app.post("/api/auth/forgot-password", rateLimit("reset-request", 5, 3600), async (req, res) => {
    const email = z.string().email().max(254).safeParse(req.body.email);
    if (!email.success) return res.status(400).json({ error: "Enter a valid email" });
    try {
      const token = await AuthService.requestPasswordReset(email.data);
      await sendAccountEmail(email.data, "Reset your DreamBuilder password", "Use this link within one hour. If you did not request it, ignore this message.", `/account/reset?token=${token}`);
    } catch { /* The response must not reveal whether an account exists. */ }
    res.json({ success: true, message: "If that account exists, a reset link will be sent." });
  });
  app.post("/api/auth/reset-password", rateLimit("reset-password", 10, 900), async (req, res) => {
    let lease: string | null = null;
    let key = "";
    try {
      const { token, password } = z.object({ token: z.string().length(64), password: z.string().min(10).max(72) }).parse(req.body);
      key = `reset:${hashToken(token)}`;
      lease = await acquireLease(key);
      if (!lease) return res.sendStatus(409);
      await AuthService.resetPassword(token, password);
      res.json({ success: true });
    } catch { res.status(400).json({ error: "Invalid or expired link, or password must be 10–72 characters." }); }
    finally { if (lease) await releaseLease(key, lease); }
  });
  app.post("/api/auth/terms", authenticateToken as any, async (req: AuthRequest, res) => {
    if (req.body.accepted !== true || req.body.version !== TERMS_VERSION) return res.sendStatus(400);
    try {
      await storage.updateUser(req.user!.id, { termsVersion: TERMS_VERSION, termsAcceptedAt: new Date() } as any);
      res.json({ success: true });
    } catch { res.status(500).json({ error: "Could not save agreement. Please retry." }); }
  });

  const owner = async (req: AuthRequest) => {
    const access = await storage.getUserTeamAccess(req.user!.id);
    return access.effectiveUserId === req.user!.id;
  };
  async function workspace(user: any) {
    let tenant = await storage.ensureAccountTenant(user.id);
    if (!tenant) {
      try {
        tenant = await storage.createTenant({ userId: user.id, slug: `account-${user.id}`, companyName: user.businessName || "Your Company", active: true, embedEnabled: false, email: user.email, embedQuoteRecipientEmail: user.email, embedRequireQuoteAfterLimit: true });
      } catch (error) { tenant = await storage.getTenantByUserId(user.id); if (!tenant) throw error; }
    }
    return tenant;
  }
  app.get("/api/workspace/setup", authenticateToken as any, async (req: AuthRequest, res) => {
    try {
      if (!await owner(req)) return res.status(403).json({ error: "Your workspace owner manages business setup. Continue to the dashboard." });
      const tenant = await workspace(req.user!);
      res.json({ tenant: { ...tenant, embedCustomizations: removePrivateQuoteCrmConfig(tenant.embedCustomizations) }, emailVerified: req.user!.emailVerified, termsAccepted: req.user!.termsVersion === TERMS_VERSION, termsVersion: TERMS_VERSION, onboarding: req.user!.onboarding || {}, canPublish: await storage.computeEmbedAccess(req.user!.id) });
    } catch { res.status(500).json({ error: "Could not load setup" }); }
  });
  app.put("/api/workspace/setup", authenticateToken as any, async (req: AuthRequest, res) => {
    try {
      if (!await owner(req)) return res.sendStatus(403);
      const settings = workspaceSettingsSchema.parse(req.body);
      const tenant = await workspace(req.user!);
      const { exteriorOptions, roofColors, sidingColors, windowColors } = settings;
      await storage.updateTenant(tenant.id, { companyName: settings.companyName, logoUrl: settings.logoUrl || null, primaryColor: settings.primaryColor, embedPrimaryColor: settings.primaryColor, phone: settings.phone, contactPhone: settings.phone, embedCtaPhone: settings.phone, embedQuoteRecipientEmail: req.user!.email, embedCustomizations: { ...(tenant.embedCustomizations as any || {}), exteriorOptions, roofColors, sidingColors, windowColors } });
      await storage.updateUser(req.user!.id, { businessName: settings.companyName, onboarding: { ...(req.user!.onboarding as any || {}), trade: settings.trade, brandSavedAt: new Date().toISOString() } } as any);
      res.json({ success: true });
    } catch (error) { res.status(error instanceof z.ZodError ? 400 : 500).json({ error: error instanceof z.ZodError ? "Check the company, product and color fields." : "Could not save setup" }); }
  });
  app.post("/api/workspace/publish", authenticateToken as any, async (req: AuthRequest, res) => {
    try {
      if (!await owner(req)) return res.sendStatus(403);
      if (!req.user!.emailVerified || req.user!.termsVersion !== TERMS_VERSION) return res.status(403).json({ error: "Verify your email and accept the terms first." });
      if (!await storage.computeEmbedAccess(req.user!.id)) return res.status(403).json({ error: "Choose a plan with website embed access to publish." });
      if (!(req.user!.onboarding as any)?.brandSavedAt) return res.status(400).json({ error: "Save your business settings first." });
      const tenant = await workspace(req.user!);
      await storage.updateTenant(tenant.id, { embedEnabled: true });
      const onboarding = { ...(req.user!.onboarding as any || {}), publishedAt: new Date().toISOString() };
      await storage.updateUser(req.user!.id, { onboarding } as any);
      res.json({ success: true, path: `/embed${onboarding.trade === "roofing" ? "-roofing" : onboarding.trade === "pools" ? "-pools" : onboarding.trade === "landscape" ? "" : `-${onboarding.trade || "roofing"}`}?tenant=${encodeURIComponent(tenant.slug)}` });
    } catch { res.status(500).json({ error: "Could not publish your visualizer" }); }
  });
  app.post("/api/workspace/test-email", authenticateToken as any, rateLimit("test-email", 3, 3600), async (req: AuthRequest, res) => {
    if (!req.user!.emailVerified || !await owner(req)) return res.sendStatus(403);
    const sent = await sendAccountEmail(req.user!.email, "DreamBuilder quote delivery test", "Your business account can receive email here. New quote requests will appear in your dashboard and be sent to your configured destination.", "/dashboard?tab=quotes");
    res.status(sent ? 200 : 503).json({ success: sent, error: sent ? undefined : "Email delivery is unavailable. Please try again later." });
  });
}
