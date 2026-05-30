import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Express, Request } from "express";
import { storage } from "./storage";
import { AuthService } from "./auth";

const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ||
  "1030203908186-q8d4tl9vdd28pu6gt68jff7jqo0t259f.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!GOOGLE_CLIENT_SECRET) {
  throw new Error("GOOGLE_CLIENT_SECRET environment variable is required");
}
const googleClientSecret = GOOGLE_CLIENT_SECRET;

function getGoogleCallbackUrl(req?: Request) {
  const configuredBaseUrl =
    process.env.APP_URL ||
    process.env.PRODUCTION_URL ||
    process.env.GOOGLE_CALLBACK_URL?.replace(/\/api\/auth\/google\/callback\/?$/, "");

  if (configuredBaseUrl) {
    return `${configuredBaseUrl.replace(/\/$/, "")}/api/auth/google/callback`;
  }

  const forwardedHost = req?.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || req?.get("host");
  if (host) {
    const forwardedProto = req?.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const protocol = forwardedProto || (host.includes("localhost") ? "http" : "https");
    return `${protocol}://${host}/api/auth/google/callback`;
  }

  if (process.env.REPLIT_DOMAINS) {
    return `https://${process.env.REPLIT_DOMAINS.split(",")[0]}/api/auth/google/callback`;
  }

  return `http://localhost:${process.env.PORT || 5000}/api/auth/google/callback`;
}

export function setupGoogleAuth(app: Express) {
  // Note: Passport middleware should be initialized after session middleware
  // which is set up in auth-routes.ts

  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });

  const callbackUrl = getGoogleCallbackUrl();

  console.log("Google OAuth Config:");
  console.log("  Client ID:", GOOGLE_CLIENT_ID);
  console.log("  Client Secret exists:", !!GOOGLE_CLIENT_SECRET);
  console.log("  Callback URL:", callbackUrl);
  if (GOOGLE_CLIENT_SECRET === GOOGLE_CLIENT_ID) {
    console.warn(
      "  Warning: GOOGLE_CLIENT_SECRET is set to the client ID. Add the real Google client secret in .env.",
    );
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: googleClientSecret,
        callbackURL: callbackUrl,
      },
      async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("No email found in Google profile"), null);
          }

          let user = await storage.getUserByEmail(email);

          if (user) {
            if (!user.googleId) {
              user = await storage.updateUser(user.id, {
                googleId: profile.id,
                profileImageUrl: profile.photos?.[0]?.value || null,
              });
            }
          } else {
            user = await storage.createUser({
              email,
              googleId: profile.id,
              firstName: profile.name?.givenName || "Unknown",
              lastName: profile.name?.familyName || "User",
              profileImageUrl: profile.photos?.[0]?.value || null,
              emailVerified: true,
            } as any);

            try {
              await storage.createFreeSubscription(user.id);
              console.log("Assigned free plan to new Google OAuth user:", user.email);
            } catch (subError) {
              console.error("Failed to assign free plan to user:", subError);
            }
          }

          return done(null, user);
        } catch (error) {
          console.error("Google auth error:", error);
          return done(error, null);
        }
      },
    ),
  );

  app.get("/api/auth/google", (req, res, next) => {
    console.log("Google OAuth initiated");
    console.log("  Plan parameter:", req.query.plan);

    const state = req.query.plan
      ? JSON.stringify({ planId: req.query.plan })
      : undefined;

    passport.authenticate("google", {
      scope: ["profile", "email"],
      state,
      callbackURL: getGoogleCallbackUrl(req),
    } as any)(req, res, next);
  });

  app.get(
    "/api/auth/google/callback",
    (req, res, next) => {
      console.log("Google OAuth callback received");
      console.log("  Query params:", JSON.stringify(req.query, null, 2));
      console.log("  Headers host:", req.headers.host);

      if (req.query.error) {
        console.log("Google sent error:", req.query.error);
        console.log("  Error description:", req.query.error_description);
        return res.redirect("/auth?error=google_oauth_error");
      }

      passport.authenticate("google", {
        failureRedirect: "/auth?error=google_auth_failed",
        session: true,
        callbackURL: getGoogleCallbackUrl(req),
      } as any)(req, res, next);
    },
    async (req, res) => {
      try {
        const user = req.user as any;
        if (!user) {
          return res.redirect("/auth?error=authentication_failed");
        }

        const token = AuthService.generateToken(user);
        const planId = req.query.state
          ? JSON.parse(decodeURIComponent(req.query.state as string)).planId
          : null;
        const redirectUrl = planId
          ? `/auth?token=${encodeURIComponent(token)}&plan=${encodeURIComponent(planId)}`
          : `/auth?token=${encodeURIComponent(token)}`;

        console.log("Redirecting to:", redirectUrl);
        res.redirect(redirectUrl);
      } catch (error) {
        console.error("Google callback error:", error);
        res.redirect("/auth?error=callback_failed");
      }
    },
  );
}
