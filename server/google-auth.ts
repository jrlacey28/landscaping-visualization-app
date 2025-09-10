import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import type { Express } from 'express';
import { storage } from './storage';
import { AuthService } from './auth';

const GOOGLE_CLIENT_ID = '1030203908186-q8d4tl9vdd28pu6gt68jff7jqo0t259f.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!GOOGLE_CLIENT_SECRET) {
  throw new Error('GOOGLE_CLIENT_SECRET environment variable is required');
}

export function setupGoogleAuth(app: Express) {
  // Note: Passport middleware should be initialized after session middleware
  // which is set up in auth-routes.ts
  
  // Serialize and deserialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user);
  });
  
  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });

  // Debug logging
  const callbackUrl = process.env.REPLIT_DOMAINS 
    ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}/api/auth/google/callback`
    : 'http://localhost:5000/api/auth/google/callback';
  
  console.log('🔧 Google OAuth Config:');
  console.log('  Client ID:', GOOGLE_CLIENT_ID);
  console.log('  Client Secret exists:', !!GOOGLE_CLIENT_SECRET);
  console.log('  Callback URL:', callbackUrl);

  // Configure Google OAuth strategy
  passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET!,
    callbackURL: callbackUrl
  },
  async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error('No email found in Google profile'), null);
      }

      // Check if user already exists
      let user = await storage.getUserByEmail(email);
      
      if (user) {
        // Update Google ID if not set
        if (!user.googleId) {
          user = await storage.updateUser(user.id, {
            googleId: profile.id,
            profileImageUrl: profile.photos?.[0]?.value || null
          });
        }
      } else {
        // Create new user
        const userData = {
          email: email,
          googleId: profile.id,
          firstName: profile.name?.givenName || 'Unknown',
          lastName: profile.name?.familyName || 'User',
          profileImageUrl: profile.photos?.[0]?.value || null,
          emailVerified: true, // Google accounts are pre-verified
        };

        user = await storage.createUser(userData);
        
        // Auto-assign free plan to new Google OAuth users
        try {
          await storage.createFreeSubscription(user.id);
          console.log('✅ Assigned free plan to new Google OAuth user:', user.email);
        } catch (subError) {
          console.error('⚠️ Failed to assign free plan to user:', subError);
          // Don't fail authentication, just log the error
        }
      }

      return done(null, user);
    } catch (error) {
      console.error('Google auth error:', error);
      return done(error, null);
    }
  }));

  // Google OAuth routes
  app.get('/api/auth/google', (req, res, next) => {
    console.log('🔑 Google OAuth initiated');
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
  });

  app.get('/api/auth/google/callback', (req, res, next) => {
    console.log('🔄 Google OAuth callback received');
    console.log('  Query params:', JSON.stringify(req.query, null, 2));
    console.log('  Headers host:', req.headers.host);
    
    if (req.query.error) {
      console.log('❌ Google sent error:', req.query.error);
      console.log('  Error description:', req.query.error_description);
      return res.redirect('/auth?error=google_oauth_error');
    }
    
    passport.authenticate('google', { 
      failureRedirect: '/auth?error=google_auth_failed',
      session: true 
    })(req, res, next);
  }, async (req, res) => {
      try {
        console.log('🚀 Google OAuth final callback handler executing...');
        const user = req.user as any;
        console.log('  User from req.user:', user ? `${user.email} (ID: ${user.id})` : 'null');
        
        if (!user) {
          console.log('❌ No user found in req.user, redirecting to error');
          return res.redirect('/auth?error=authentication_failed');
        }

        // Generate JWT token for the user
        const token = AuthService.generateToken(user);
        console.log('✅ Generated JWT token for user:', user.email);
        
        // Redirect to frontend auth page with token
        const redirectUrl = `/auth?token=${encodeURIComponent(token)}`;
        console.log('🔄 Redirecting to:', redirectUrl);
        res.redirect(redirectUrl);
      } catch (error) {
        console.error('Google callback error:', error);
        res.redirect('/auth?error=callback_failed');
      }
    }
  );
}