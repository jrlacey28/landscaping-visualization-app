import { registerOnboardingRoutes } from "./onboarding-routes";
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import path from "path";
import { registerRoutes } from "./routes";
import { registerAuthRoutes } from "./auth-routes";
import { setupGoogleAuth } from "./google-auth";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import compression from "compression";
import {
  ensureSecuritySchema,
  databaseUrl,
  ensureEnterpriseVisualizationRolloverSchema,
  pool,
} from "./db";
import {
  ensurePublicImagesSchema,
  importLegacyPublicImages,
} from "./public-image-store";

import { requestSecurity, productionSecret, securityErrorHandler } from "./security";
const app = express();
app.disable("x-powered-by");
app.use(requestSecurity);

// Configure trust proxy for production (required for secure sessions behind load balancer)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Add compression middleware for better performance
app.use(compression());

// Add caching headers for static assets
app.use((req, res, next) => {
  if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
  } else if (req.url.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  next();
});

app.use((req, res, next) => {
  if (req.originalUrl === '/api/stripe/webhook') {
    return next();
  }
  return express.json({ limit: '2mb' })(req, res, next);
});
app.use((req, res, next) => {
  if (req.originalUrl === '/api/stripe/webhook') {
    return next();
  }
  return express.urlencoded({ extended: false, limit: '100kb', parameterLimit: 100 })(req, res, next);
});

// Enforce SESSION_SECRET in production for security
if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is required in production');
}

// Configure session middleware BEFORE any routes that need session access
// This must happen before registerAuthRoutes() and registerRoutes()
const PgSession = connectPgSimple(session);

const sessionConfig: any = {
  secret: productionSecret("SESSION_SECRET"),
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    sameSite: 'lax' as const
  }
};

// Use PostgreSQL session store in production
if (process.env.NODE_ENV === 'production' && databaseUrl && pool) {
  sessionConfig.store = new PgSession({
    pool,
    tableName: 'session',
    createTableIfMissing: true,
  });
}

app.use(session(sessionConfig));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

async function initializeDatabase() {
  try {
    // The homepage demo is a protected platform tenant, not a customer account.
    await storage.ensureDemoTenant();
    console.log("DreamBuilder homepage demo tenant verified");

    // Ensure subscription plans have correct visualization limits
    await storage.ensureSubscriptionPlanLimits();
    console.log("Subscription plan limits verified/updated");
  } catch (error) {
    console.error("Database initialization error:", error);
  }
}

async function initializeDatabaseInBackground() {
  const timeoutMs = 15_000;
  let timeout: NodeJS.Timeout | undefined;

  try {
    await Promise.race([
      initializeDatabase(),
      new Promise((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error(`Database initialization timed out after ${timeoutMs}ms`)),
          timeoutMs,
        );
      }),
    ]);
  } catch (error) {
    console.error("Database initialization did not complete during startup:", error);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

(async () => {
  await ensureSecuritySchema();
  // Apply additive feature columns before any route can query the tenants table.
  await ensureEnterpriseVisualizationRolloverSchema();
  console.log("Enterprise visualization rollover schema verified");
  await ensurePublicImagesSchema();
  const importedPublicImageCount = await importLegacyPublicImages(
    path.resolve(process.cwd(), "public", "uploads"),
  );
  console.log(`Durable public image storage verified (${importedPublicImageCount} legacy images available)`);

  // Register authentication routes first (includes Stripe webhook and sets up sessions)
  setupGoogleAuth(app);
  registerAuthRoutes(app);
  registerOnboardingRoutes(app);
  

  
  const server = await registerRoutes(app);

  app.use(securityErrorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Serve the app on port 5000 (frontend requirement)
  const port = Number(process.env.PORT) || 5000;
  
  server.once('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} in use; exiting.`);
      process.exit(1);
    } else {
      console.error(err);
      process.exit(1);
    }
  });
  
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
    void initializeDatabaseInBackground();
  });
})();
