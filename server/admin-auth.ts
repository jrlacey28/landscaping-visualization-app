import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { adminUsers } from "@shared/schema";

const ADMIN_JWT_COOKIE = "admin_token";
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

function getAdminJwtSecret() {
  return process.env.ADMIN_JWT_SECRET || process.env.SESSION_SECRET || "change-me-admin-jwt-secret";
}

function parseCookie(req: Request, key: string) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) {
    return undefined;
  }

  const chunks = cookieHeader.split(";").map((chunk) => chunk.trim());
  for (const chunk of chunks) {
    if (chunk.startsWith(`${key}=`)) {
      return decodeURIComponent(chunk.slice(key.length + 1));
    }
  }

  return undefined;
}

function getTokenFromRequest(req: Request) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return parseCookie(req, ADMIN_JWT_COOKIE);
}

export async function ensureDefaultAdmin() {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@local").toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return;
  }

  const [existingAdmin] = await db
    .select()
    .from(adminUsers)
    .where(and(eq(adminUsers.email, adminEmail), eq(adminUsers.isActive, true)))
    .limit(1);

  if (existingAdmin) {
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await db.insert(adminUsers).values({
    email: adminEmail,
    passwordHash,
    role: "super_admin",
    mfaEnabled: Boolean(process.env.ADMIN_MFA_CODE),
    mfaSecretHash: process.env.ADMIN_MFA_CODE ? await bcrypt.hash(process.env.ADMIN_MFA_CODE, 12) : null,
    failedLoginAttempts: 0,
    isActive: true,
  });
}

async function registerFailedAttempt(adminId: number, failedLoginAttempts: number) {
  const nextAttempts = failedLoginAttempts + 1;
  const isLocked = nextAttempts >= MAX_LOGIN_ATTEMPTS;
  const lockedUntil = isLocked ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null;

  await db
    .update(adminUsers)
    .set({
      failedLoginAttempts: nextAttempts,
      lockedUntil,
      lastFailedLoginAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(adminUsers.id, adminId));

  return { nextAttempts, lockedUntil };
}

export async function adminLoginHandler(req: Request, res: Response) {
  await ensureDefaultAdmin();

  const { email, password, mfaCode } = req.body as { email?: string; password?: string; mfaCode?: string };
  const normalizedEmail = (email || process.env.ADMIN_EMAIL || "admin@local").toLowerCase().trim();

  if (!password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const [adminUser] = await db
    .select()
    .from(adminUsers)
    .where(and(eq(adminUsers.email, normalizedEmail), eq(adminUsers.isActive, true)))
    .limit(1);

  if (!adminUser) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  if (adminUser.lockedUntil && adminUser.lockedUntil.getTime() > Date.now()) {
    return res.status(423).json({
      error: "Account is temporarily locked",
      lockedUntil: adminUser.lockedUntil,
    });
  }

  const passwordMatch = await bcrypt.compare(password, adminUser.passwordHash);
  if (!passwordMatch) {
    const failed = await registerFailedAttempt(adminUser.id, adminUser.failedLoginAttempts || 0);
    return res.status(401).json({
      error: failed.lockedUntil ? "Too many failed attempts. Account locked temporarily." : "Invalid credentials",
      attemptsRemaining: Math.max(0, MAX_LOGIN_ATTEMPTS - failed.nextAttempts),
      lockedUntil: failed.lockedUntil,
    });
  }

  if (adminUser.mfaEnabled) {
    if (!mfaCode || !adminUser.mfaSecretHash) {
      await registerFailedAttempt(adminUser.id, adminUser.failedLoginAttempts || 0);
      return res.status(401).json({ error: "MFA code is required" });
    }

    const mfaMatch = await bcrypt.compare(mfaCode, adminUser.mfaSecretHash);
    if (!mfaMatch) {
      await registerFailedAttempt(adminUser.id, adminUser.failedLoginAttempts || 0);
      return res.status(401).json({ error: "Invalid MFA code" });
    }
  }

  await db
    .update(adminUsers)
    .set({
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(adminUsers.id, adminUser.id));

  const token = jwt.sign(
    {
      sub: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      type: "admin",
    },
    getAdminJwtSecret(),
    { expiresIn: "12h" }
  );

  res.cookie(ADMIN_JWT_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 12 * 60 * 60 * 1000,
  });

  return res.json({
    success: true,
    message: "Authenticated successfully",
    token,
    admin: {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      mfaEnabled: adminUser.mfaEnabled,
    },
  });
}

export async function adminStatusHandler(req: Request, res: Response) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return res.json({ isAuthenticated: false });
  }

  try {
    const decoded = jwt.verify(token, getAdminJwtSecret()) as { sub: number; email: string; role: string; type: string };
    if (decoded.type !== "admin") {
      return res.json({ isAuthenticated: false });
    }

    return res.json({
      isAuthenticated: true,
      admin: {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
      },
    });
  } catch {
    return res.json({ isAuthenticated: false });
  }
}

export function adminLogoutHandler(req: Request, res: Response) {
  res.clearCookie(ADMIN_JWT_COOKIE);
  return res.json({ success: true, message: "Logged out successfully" });
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ error: "Admin authentication required" });
  }

  try {
    const decoded = jwt.verify(token, getAdminJwtSecret()) as { sub: number; email: string; role: string; type: string };
    if (decoded.type !== "admin") {
      return res.status(401).json({ error: "Invalid admin token" });
    }

    (req as any).admin = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };

    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired admin token" });
  }
}
