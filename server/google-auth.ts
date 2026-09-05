import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Express } from "express";
import { storage } from "./storage";

export function setupGoogleAuth(app: Express) {
  passport.serializeUser((user: any, done) => done(null, { id: user.id, authVersion: user.authVersion }));
  passport.deserializeUser(async (sessionUser: any, done) => {
    try {
      const user = await storage.getUser(sessionUser.id);
      done(null, user && user.authVersion === (sessionUser.authVersion ?? 0) ? user : false);
    } catch (error) { done(error); }
  });
  app.use(passport.initialize());
  app.use(passport.session());
  const clientID = process.env.GOOGLE_CLIENT_ID || (process.env.NODE_ENV === "test" ? "" : "1030203908186-q8d4tl9vdd28pu6gt68jff7jqo0t259f.apps.googleusercontent.com");
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientID || !clientSecret) {
    app.get("/api/auth/google", (_req, res) => res.redirect("/auth?error=google_unavailable"));
    return;
  }
  const base = process.env.APP_URL || process.env.PRODUCTION_URL ||
    (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}` : `http://localhost:${process.env.PORT || 5000}`);
  const callbackURL = `${base.replace(/\/$/, "")}/api/auth/google/callback`;
  passport.use(new GoogleStrategy({ clientID, clientSecret, callbackURL, state: true }, async (_access, _refresh, profile, done) => {
    try {
      const email = profile.emails?.find(value => value.verified)?.value?.trim().toLowerCase();
      if (!email) return done(new Error("Verified Google email required"));
      let user = await storage.getUserByEmail(email);
      if (user) {
        if ((!user.googleId && !user.emailVerified) || (user.googleId && user.googleId !== profile.id)) {
          return done(new Error("Verify the existing account before linking Google"));
        }
        user = await storage.updateUser(user.id, { googleId: profile.id, emailVerified: true } as any);
      } else {
        user = await storage.createUser({ email, googleId: profile.id, firstName: profile.name?.givenName || "", lastName: profile.name?.familyName || "", emailVerified: true, onboarding: { requiresSetup: true } } as any);
        await storage.createFreeSubscription(user.id);
      }
      done(null, user);
    } catch (error) { done(error as Error); }
  }));
  app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
  app.get("/api/auth/google/callback", passport.authenticate("google", { failureRedirect: "/auth?error=google_auth_failed" }), (_req, res) => res.redirect("/setup"));
}
