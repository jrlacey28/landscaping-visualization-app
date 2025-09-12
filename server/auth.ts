import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import type { User, InsertUser } from '@shared/schema';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
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
    return jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  static verifyToken(token: string): { userId: number; email: string } | null {
    try {
      return jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
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
  }): Promise<{ user: User; token: string }> {
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const passwordHash = await this.hashPassword(userData.password);

    // Generate email verification token
    const emailVerificationToken = this.generateVerificationToken();

    // Create user
    const insertUserData: InsertUser = {
      email: userData.email,
      passwordHash,
      firstName: userData.firstName,
      lastName: userData.lastName,
      businessName: userData.businessName || null,
      phone: userData.phone || null,
      emailVerificationToken,
    };

    const user = await storage.createUser(insertUserData);

    // Generate JWT token
    const token = this.generateToken(user);

    return { user, token };
  }

  static async login(email: string, password: string): Promise<{ user: User; token: string }> {
    // Find user by email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await this.verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const token = this.generateToken(user);

    return { user, token };
  }

  static async verifyEmail(token: string): Promise<User> {
    const user = await storage.getUserByEmailVerificationToken(token);
    if (!user) {
      throw new Error('Invalid verification token');
    }

    // Mark email as verified
    const updatedUser = await storage.updateUser(user.id, {
      emailVerified: true,
      emailVerificationToken: null,
    });

    return updatedUser;
  }

  static async requestPasswordReset(email: string): Promise<string> {
    const user = await storage.getUserByEmail(email);
    if (!user) {
      throw new Error('No user found with this email');
    }

    // Generate reset token
    const resetToken = this.generateVerificationToken();
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    // Update user with reset token
    await storage.updateUser(user.id, {
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetExpires,
    });

    return resetToken;
  }

  static async resetPassword(token: string, newPassword: string): Promise<User> {
    const user = await storage.getUserByResetToken(token);
    if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    const passwordHash = await this.hashPassword(newPassword);

    // Update user
    const updatedUser = await storage.updateUser(user.id, {
      passwordHash,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });

    return updatedUser;
  }
}

// Middleware to authenticate requests
export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
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
    if (!user) {
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