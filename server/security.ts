import crypto from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { sql } from "drizzle-orm";
import { db } from "./db";

export function rows(result: any): any[] { return Array.isArray(result) ? result : result.rows || []; }

export function productionSecret(name: string): string {
  const value = process.env[name];
  if (process.env.NODE_ENV === "production" && (!value || value.length < 32 || /change.in.production|^your-secret|^dev-secret/i.test(value))) {
    throw new Error(`${name} must be a unique secret of at least 32 characters`);
  }
  return value || developmentSecret;
}
const developmentSecret = crypto.randomBytes(32).toString("hex");
export const securitySecret = productionSecret("JWT_SECRET");
export const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

export function jobToken(service: string, id: number) {
  const payload = Buffer.from(JSON.stringify({ service, id, exp: Date.now() + 24 * 60 * 60_000 })).toString("base64url");
  return `${payload}.${crypto.createHmac("sha256", securitySecret).update(payload).digest("base64url")}`;
}
export function validJobToken(token: unknown, service: string, id: number) {
  if (typeof token !== "string" || token.length > 1000) return false;
  try {
    const [payload, signature] = token.split(".");
    const expected = crypto.createHmac("sha256", securitySecret).update(payload).digest();
    const supplied = Buffer.from(signature, "base64url");
    if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) return false;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return data.service === service && data.id === id && data.exp > Date.now();
  } catch { return false; }
}

export function rateLimit(scope: string, limit: number, windowSeconds = 60) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
      const key = hashToken(`${scope}:${req.ip}:${bucket}`);
      await db.execute(sql`DELETE FROM security_rate_limits WHERE expires_at < now()`);
      const result = rows(await db.execute(sql`
        INSERT INTO security_rate_limits (key, count, expires_at)
        VALUES (${key}, 1, now() + ${windowSeconds * 2} * interval '1 second')
        ON CONFLICT (key) DO UPDATE SET count = security_rate_limits.count + 1 RETURNING count
      `));
      if (result[0].count > limit) {
        res.setHeader("Retry-After", String(windowSeconds));
        return res.status(429).json({ error: "Too many requests. Please try again shortly." });
      }
      next();
    } catch { res.status(503).json({ error: "Please try again shortly." }); }
  };
}

export async function acquireLease(key: string, seconds = 300) {
  const token = crypto.randomBytes(16).toString("hex");
  const result = rows(await db.execute(sql`
    INSERT INTO security_leases (key, token, expires_at)
    VALUES (${key}, ${token}, now() + ${seconds} * interval '1 second')
    ON CONFLICT (key) DO UPDATE SET token = EXCLUDED.token, expires_at = EXCLUDED.expires_at
    WHERE security_leases.expires_at < now() RETURNING token
  `));
  return result.length ? token : null;
}
export async function releaseLease(key: string, token: string) {
  await db.execute(sql`DELETE FROM security_leases WHERE key = ${key} AND token = ${token}`);
}

export function requestSecurity(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json.bind(res);
  res.json = (body: any) => originalJson(res.statusCode >= 500 ? { error: "The service could not complete this request. Please try again shortly." } : body);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=()");
  res.setHeader("Content-Security-Policy", "object-src 'none'; base-uri 'self'; " +
    (req.path.startsWith("/embed") ? "" : "frame-ancestors 'self';"));
  if (process.env.NODE_ENV === "production") res.setHeader("Strict-Transport-Security", "max-age=31536000");
  if (req.path.startsWith("/api/")) res.setHeader("Cache-Control", "no-store");
  // Public embeds call the API on this app's origin from inside their iframe.
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method) && req.path !== "/api/stripe/webhook") {
    const origin = req.get("origin");
    const configured = process.env.APP_URL || process.env.PRODUCTION_URL;
    const expected = configured ? new URL(configured).origin : `${req.protocol}://${req.get("host")}`;
    if ((origin && origin !== expected) || req.get("sec-fetch-site") === "cross-site") {
      return res.status(403).json({ error: "Cross-site request rejected" });
    }
  }
  next();
}

export function securityErrorHandler(error: any, _req: Request, res: Response, _next: NextFunction) {
  const status = error.code === "LIMIT_FILE_SIZE" ? 413 : error.code?.startsWith("LIMIT_") ? 400 : error.status || error.statusCode || 500;
  console.error("Request failed:", error.code || status);
  res.status(status).json({ error: status >= 500 ? "Please try again shortly." : error.code === "LIMIT_FILE_SIZE" ? "Images must be under 15 MB." : "Invalid request. Check the uploaded image and fields." });
}
