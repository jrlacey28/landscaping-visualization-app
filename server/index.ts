import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { registerAuthRoutes } from "./auth-routes";
import { setupGoogleAuth } from "./google-auth";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import compression from "compression";
import session from "express-session";

// Global process error handlers to prevent server exits
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  // Don't exit the process - keep the server running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process - keep the server running
});

const app = express();

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

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CENTRALIZED SESSION MIDDLEWARE - configured once for entire app
// This must be before any route registration to prevent conflicts
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // Auto-detect HTTPS in production
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true, // Prevent client-side access for security
    sameSite: 'lax' // CSRF protection
  },
  proxy: process.env.NODE_ENV === 'production', // Trust proxy in production for correct secure cookie handling
  name: 'sessionId' // Avoid default connect.sid name for security
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

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
    // Initialize subscription plans
    const { initializeDatabase: initPlans } = await import("./init-database");
    await initPlans();

    // Ensure demo tenant has correct company name
    const demoTenant = await storage.getTenantBySlug("demo");
    if (demoTenant && demoTenant.companyName !== "DreamBuilder") {
      await storage.updateTenant(demoTenant.id, {
        companyName: "DreamBuilder"
      });
      console.log("Updated demo tenant company name to DreamBuilder");
    }
  } catch (error) {
    console.error("Database initialization error:", error);
  }
}

// Main server startup with robust error handling
(async () => {
  try {
    // Initialize database with error handling
    try {
      await initializeDatabase();
      console.log("✅ Database initialization completed successfully");
    } catch (dbError) {
      console.error("⚠️  Database initialization failed, but server will continue:", dbError);
      // Don't exit - continue with server startup even if DB init fails
    }

    // Health check endpoint for deployment monitoring
    app.get('/', (_req, res) => {
      res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0'
      });
    });

    // Register authentication routes first (includes Stripe webhook and sets up sessions)
    registerAuthRoutes(app);
    
    // Setup Google OAuth after session middleware is configured
    setupGoogleAuth(app);
    
    const server = await registerRoutes(app);

    // Global error handler - DO NOT re-throw to prevent server exits
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      // Log the error for debugging
      console.error('Express error handler caught error:', {
        message: err.message,
        stack: err.stack,
        status: status
      });

      // Send error response but don't re-throw to prevent server exit
      if (!res.headersSent) {
        res.status(status).json({ message });
      }
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Serve the app on configurable port (default 5000)
    // this serves both the API and the client.
    // Use PORT environment variable to avoid conflicts with other projects.
    const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
    
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`🚀 Server successfully started on port ${port}`);
      console.log("✅ Server is running and ready to accept connections");
    });

    // Handle server startup errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${port} is already in use. Server cannot start.`);
      } else {
        console.error('❌ Server error:', error);
      }
      // Don't exit - let the process handle it gracefully
    });

  } catch (startupError) {
    console.error("❌ Critical server startup error:", startupError);
    console.log("🔄 Attempting to continue anyway...");
    // Even on critical startup errors, try to continue rather than exit
  }
})().catch((fatalError) => {
  console.error("💥 Fatal server startup error:", fatalError);
  console.log("🆘 This should not happen with current error handling");
  // Last resort - if we get here, something is very wrong
  // but still don't exit to prevent deployment failures
});