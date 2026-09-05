import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import type { User, InsertUser } from '@shared/schema';

import { securitySecret, hashToken } from "./security";
import { TERMS_VERSION } from "@shared/legal";
const JWT_SECRET = securitySecret;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthRequest extends Request {
  user?: User;
  userId?: number;
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  static generateToken(user: User): string {
    const payload = { userId: user.id, email: user.email, version: user.authVersion };
    const options = { expiresIn: JWT_EXPIRES_IN };
    return (jwt.sign as any)(payload, JWT_SECRET, options);
  }

  static verifyToken(token: string): { userId: number; email: string; version?: number } | null {
    try {
      return jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }) as { userId: number; email: string; version?: number };
    } catch {
      return null;
    }
  }

  static generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    businessName?: string;
    phone?: string;
    termsAccepted: true;
  }): Promise<{ user: User; token: string }> {
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(userData.email.trim().toLowerCase());
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const passwordHash = await this.hashPassword(userData.password);

    // Create user with manual object to include all needed fields
    const insertUserData = {
      email: userData.email.trim().toLowerCase(),
      passwordHash,
      firstName: userData.firstName,
      lastName: userData.lastName,
      businessName: userData.businessName || null,
      phone: userData.phone || null,
      emailVerified: false,
      onboarding: { requiresSetup: true },
      termsVersion: TERMS_VERSION,
      termsAcceptedAt: new Date(),
    } as any;

    const user = await storage.createUser(insertUserData);

    // Auto-assign free plan to new email/password users (matching Google OAuth behavior)
    try {
      await storage.createFreeSubscription(user.id);
      console.log('✅ Assigned free plan to new email signup user:', user.email);
    } catch (subError) {
      console.error('⚠️ Failed to assign free plan to user:', subError);
      // Don't fail registration, just log the error
    }

    // Generate JWT token
    const token = this.generateToken(user);

    return { user, token };
  }

  static async login(email: string, password: string): Promise<{ user: User; token: string }> {
    // Find user by email
    const user = await storage.getUserByEmail(email.trim().toLowerCase());
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password (handle Google OAuth users with no password)
    if (!user.passwordHash) {
      throw new Error('Please use Google sign-in for this account');
    }
    const isValidPassword = await this.verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const token = this.generateToken(user);

    return { user, token };
  }

  static async verifyEmail(token: string): Promise<User> {
    const user = await storage.getUserByEmailVerificationToken(hashToken(token));
    if (!user || !user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
      throw new Error('Invalid or expired verification token');
    }

    // Mark email as verified
    const updatedUser = await storage.updateUser(user.id, {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    } as any);

    return updatedUser;
  }

  static async requestPasswordReset(email: string): Promise<string> {
    const user = await storage.getUserByEmail(email.trim().toLowerCase());
    if (!user) {
      throw new Error('No user found with this email');
    }

    // Generate reset token
    const resetToken = this.generateVerificationToken();
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    // Update user with reset token
    await storage.updateUser(user.id, {
      resetPasswordToken: hashToken(resetToken),
      resetPasswordExpires: resetExpires,
    } as any);

    return resetToken;
  }

  static async resetPassword(token: string, newPassword: string): Promise<User> {
    const user = await storage.getUserByResetToken(hashToken(token));
    if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    const passwordHash = await this.hashPassword(newPassword);

    // Update user
    const updatedUser = await storage.updateUser(user.id, {
      passwordHash,
      authVersion: user.authVersion + 1,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    } as any);

    return updatedUser;
  }
}

// Middleware to authenticate requests (supports both JWT and session auth)
export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // First check if user is authenticated via Passport session (primary method)
    if (req.isAuthenticated && req.isAuthenticated() && (req as any).user) {
      const sessionUser = (req as any).user;
      // Get full user from database
      const user = await storage.getUser(sessionUser.id);
      if (user && user.authVersion === (sessionUser.authVersion ?? 0)) {
        req.user = user;
        req.userId = user.id;
        return next();
      }
    }

    // Fallback to JWT Bearer token (for API compatibility)
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = AuthService.verifyToken(token);
    if (!decoded) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // Get user from database
    const user = await storage.getUser(decoded.userId);
    if (!user || user.authVersion !== (decoded.version ?? 0)) {
      return res.status(403).json({ error: 'User not found' });
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(403).json({ error: 'Invalid token' });
  }
};

// Best-effort auth for public flows, such as embedded visualizers.
// Sets req.user when a valid session/JWT exists, then always continues.
export const optionalAuthenticateToken = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    if (req.isAuthenticated && req.isAuthenticated() && (req as any).user) {
      const sessionUser = (req as any).user;
      const user = await storage.getUser(sessionUser.id);
      if (user && user.authVersion === (sessionUser.authVersion ?? 0)) {
        req.user = user;
        req.userId = user.id;
        return next();
      }
    }

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = AuthService.verifyToken(token);
      if (decoded) {
        const user = await storage.getUser(decoded.userId);
        if (user && user.authVersion === (decoded.version ?? 0)) {
          req.user = user;
          req.userId = user.id;
        }
      }
    }
  } catch (error) {
    console.error('Optional authentication error:', error);
  }

  next();
};

// Middleware to check if user has an active subscription
export const requireSubscription = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const subscription = await storage.getUserActiveSubscription(req.user.id);
    if (!subscription || subscription.status !== 'active') {
      return res.status(403).json({ error: 'Active subscription required' });
    }

    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    res.status(500).json({ error: 'Failed to verify subscription' });
  }
};

// Middleware to check if user has Pro plan access
export const requireProPlan = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const subscription = await storage.getUserActiveSubscription(req.user.id);
    if (!subscription || subscription.planId !== 'pro' || subscription.status !== 'active') {
      return res.status(403).json({ error: 'Pro plan subscription required' });
    }

    next();
  } catch (error) {
    console.error('Pro plan check error:', error);
    res.status(500).json({ error: 'Failed to verify Pro plan access' });
  }
};
