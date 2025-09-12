import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";

import { storage } from "./storage";
import { insertLeadSchema, insertVisualizationSchema, insertPoolVisualizationSchema, insertLandscapeVisualizationSchema, insertTenantSchema } from "@shared/schema";
import { z } from "zod";
import { processLandscapeWithGemini, processPoolWithGemini, analyzeLandscapeImage } from "./gemini-service";
import { getAllStyles, getStylesByCategory, getStyleForRegion } from "./style-config";
import { getAllPoolStyles, getPoolStylesByCategory, getPoolStyleForRegion } from "./pool-style-config";

const upload = multer({ storage: multer.memoryStorage() });

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}



export async function registerRoutes(app: Express): Promise<Server> {
  // Admin authentication middleware
  const requireAdminAuth = (req: any, res: any, next: any) => {
    if (req.session?.isAdmin) {
      next();
    } else {
      res.status(401).json({ error: "Admin authentication required" });
    }
  };

  // Admin login endpoint
  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminPassword) {
      console.error("ADMIN_PASSWORD environment variable not found");
      return res.status(500).json({ error: "Admin password not configured" });
    }
    
    if (password === adminPassword) {
      req.session.isAdmin = true;
      res.json({ success: true, message: "Authenticated successfully" });
    } else {
      res.status(401).json({ error: "Invalid password" });
    }
  });

  // Admin logout endpoint
  app.post("/api/admin/logout", (req, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ error: "Could not log out" });
      }
      res.json({ success: true, message: "Logged out successfully" });
    });
  });

  // Check admin auth status
  app.get("/api/admin/status", (req, res) => {
    res.json({ isAuthenticated: !!req.session?.isAdmin });
  });

  // Admin: Update user plan by Stripe price ID
  app.post("/api/admin/update-user-plan", requireAdminAuth, async (req, res) => {
    try {
      const { userId, planId } = req.body;
      console.log(`[ADMIN] Update user plan request - userId: ${userId}, planId: ${planId}`);
      
      if (!userId || !planId) {
        console.log('[ADMIN] Missing required parameters');
        return res.status(400).json({ error: "User ID and Plan ID are required" });
      }

      // Check if we're in test mode based on Stripe key
      const stripeSecretKey = process.env.STRIPE_TEST_API_KEY || process.env.STRIPE_SECRET_KEY;
      const isTestMode = stripeSecretKey?.startsWith('sk_test_');

      // Map display names to correct Stripe price IDs based on mode
      const planMapping: Record<string, string> = {
        'Free': 'free',
        'Basic': isTestMode ? 'price_1S6DdkBY2SPm2HvOxI9yuZdg' : 'price_1S5X1sBY2SPm2HvOuDHNzsIp',
        'Pro': isTestMode ? 'price_1S6De0BY2SPm2HvOX1t23IUg' : 'price_1S5X2XBY2SPm2HvO2he9Unto',
        'Custom': 'custom'
      };

      // Use the mapping if it's a display name, otherwise assume it's already a Stripe price ID
      const stripePriceId = planMapping[planId] || planId;
      console.log(`[ADMIN] Using Stripe price ID: ${stripePriceId} (${isTestMode ? 'TEST' : 'PRODUCTION'} mode)`);

      // Use the new admin function that auto-creates plans if they don't exist
      const newSubscription = await storage.setUserPlanByStripeId(userId, stripePriceId);

      res.json({ 
        success: true, 
        message: `User plan updated to ${planId}`,
        subscription: newSubscription 
      });
    } catch (error) {
      console.error("Error updating user plan:", error);
      res.status(500).json({ error: "Failed to update user plan" });
    }
  });

  // Admin: Reset user monthly usage
  app.post("/api/admin/reset-user-usage", requireAdminAuth, async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      // Reset current month's usage to 0
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      
      await storage.resetUserUsage(userId, month, year);
      
      res.json({ 
        success: true, 
        message: "User monthly usage reset successfully"
      });
    } catch (error) {
      console.error("Error resetting user usage:", error);
      res.status(500).json({ error: "Failed to reset user usage" });
    }
  });

  // Admin: Set custom usage limit for user
  app.post("/api/admin/set-user-limit", requireAdminAuth, async (req, res) => {
    try {
      const { userId, limit } = req.body;
      
      if (!userId || typeof limit !== 'number') {
        return res.status(400).json({ error: "User ID and numeric limit are required" });
      }

      await storage.setUserCustomLimit(userId, limit);
      
      res.json({ 
        success: true, 
        message: `User custom limit set to ${limit}`
      });
    } catch (error) {
      console.error("Error setting user limit:", error);
      res.status(500).json({ error: "Failed to set user limit" });
    }
  });

  // Subscription plans management
  app.get("/api/subscription/plans", async (req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json({ success: true, data: plans });
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ error: "Failed to fetch subscription plans" });
    }
  });

  app.post("/api/admin/plans", requireAdminAuth, async (req, res) => {
    try {
      const planData = req.body;
      const plan = await storage.createSubscriptionPlan(planData);
      res.json({ success: true, data: plan });
    } catch (error) {
      console.error("Error creating subscription plan:", error);
      res.status(500).json({ error: "Failed to create subscription plan" });
    }
  });

  app.patch("/api/admin/plans/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const planData = req.body;
      const plan = await storage.updateSubscriptionPlan(id, planData);
      res.json({ success: true, data: plan });
    } catch (error) {
      console.error("Error updating subscription plan:", error);
      res.status(500).json({ error: "Failed to update subscription plan" });
    }
  });

  app.delete("/api/admin/plans/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSubscriptionPlan(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting subscription plan:", error);
      res.status(500).json({ error: "Failed to delete subscription plan" });
    }
  });

  // Debug endpoint to view all plans (as requested in task)
  app.get('/api/admin/plans', requireAdminAuth, async (req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get user's current subscription (as requested in task)
  app.get('/api/admin/user-subscription/:userId', requireAdminAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const subscription = await storage.getUserActiveSubscription(parseInt(userId));
      
      if (!subscription) {
        return res.status(404).json({ error: 'No subscription found for this user' });
      }

      // Get plan details
      const plan = await storage.getSubscriptionPlan(subscription.planId);
      
      res.json({
        ...subscription,
        plan_name: plan?.name,
        price: plan?.price
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Serve static files from uploads directory
  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

  // Get all tenants (admin only)
  app.get("/api/tenants", requireAdminAuth, async (req, res) => {
    try {
      const allTenants = await storage.getAllTenants();
      res.json(allTenants);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      res.status(500).json({ error: "Failed to fetch tenants" });
    }
  });

  // Get tenant by slug (for multi-tenant setup)
  app.get("/api/tenant/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      
      // Check if slug is numeric (ID) or string (slug)
      const isNumeric = /^\d+$/.test(slug);
      
      let tenant;
      if (isNumeric) {
        // Treat as ID
        tenant = await storage.getTenant(parseInt(slug));
      } else {
        // Treat as slug
        tenant = await storage.getTenantBySlug(slug);
      }

      if (!tenant) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      res.json(tenant);
    } catch (error) {
      console.error("Error fetching tenant:", error);
      res.status(500).json({ error: "Failed to fetch tenant" });
    }
  });

  // Create tenant (admin only)
  app.post("/api/tenants", requireAdminAuth, async (req, res) => {
    try {
      const tenantData = insertTenantSchema.parse(req.body);
      const tenant = await storage.createTenant(tenantData);
      res.json(tenant);
    } catch (error) {
      console.error("Error creating tenant:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid tenant data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create tenant" });
    }
  });

  // Update tenant
  app.patch("/api/tenants/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      // Convert string dates to Date objects before validation
      const requestBody = { ...req.body };
      if (requestBody.lastResetDate && typeof requestBody.lastResetDate === 'string') {
        requestBody.lastResetDate = new Date(requestBody.lastResetDate);
      }
      
      const tenantData = insertTenantSchema.partial().parse(requestBody);
      const tenant = await storage.updateTenant(parseInt(id), tenantData);
      res.json(tenant);
    } catch (error) {
      console.error("Error updating tenant:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid tenant data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update tenant" });
    }
  });

  // Upload image to public directory and return URL
  app.post("/api/upload-image", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const extension = path.extname(req.file.originalname) || '.jpg';
      const filename = `upload_${timestamp}${extension}`;
      const filepath = path.join(uploadsDir, filename);

      // Save file to public directory
      fs.writeFileSync(filepath, req.file.buffer);

      // Return public URL
      const publicUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
      res.json({ imageUrl: publicUrl });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // Helper function to check tenant usage limits
  async function checkTenantUsageLimits(tenantId: number) {
    const tenant = await storage.getTenant(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Check if tenant is active
    if (!tenant.active) {
      throw new Error('Account is suspended. Please contact support.');
    }

    // Check monthly generation limits
    const limit = tenant.monthlyGenerationLimit || 100;
    const currentUsage = tenant.currentMonthGenerations || 0;
    
    if (currentUsage >= limit) {
      throw new Error(`Monthly generation limit of ${limit} visualizations exceeded. Please upgrade your plan.`);
    }

    return tenant;
  }

  // Gemini-powered landscape editing workflow
  app.post("/api/upload", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const { tenantId, selectedRoof, selectedSiding, selectedSurpriseMe } = req.body;

      if (!tenantId) {
        return res.status(400).json({ error: "Tenant ID is required" });
      }

      // Check usage limits before processing
      try {
        await checkTenantUsageLimits(parseInt(tenantId));
      } catch (limitError: any) {
        return res.status(429).json({ error: limitError.message });
      }

      // Process image with size constraints (max 1920x1080)
      const originalImageBuffer = req.file.buffer;

      // Create base64 for storage
      const base64Image = `data:image/jpeg;base64,${originalImageBuffer.toString('base64')}`;

      // Create visualization record
      const visualization = await storage.createVisualization({
        tenantId: parseInt(tenantId),
        originalImageUrl: base64Image,
        selectedRoof: selectedRoof || null,
        selectedSiding: selectedSiding || null,
        selectedSurpriseMe: selectedSurpriseMe || null,
        status: "processing",
      });

      // Process with Gemini AI
      try {
        const selectedStyles = {
          roof: selectedRoof || undefined,
          siding: selectedSiding || undefined,
          surpriseMe: selectedSurpriseMe || undefined
        };

        const result = await processLandscapeWithGemini({
          imageBuffer: originalImageBuffer,
          selectedStyles
        });

        // Convert edited image to base64 for storage
        const editedBase64 = `data:image/jpeg;base64,${result.editedImageBuffer.toString('base64')}`;

        // Create a prediction-like object for compatibility
        const prediction = {
          id: `gemini_${Date.now()}`,
          status: 'succeeded',
          output: [editedBase64],
          appliedStyles: result.appliedStyles,
          prompt: result.prompt
        };

        // Update visualization with result
        await storage.updateVisualization(visualization.id, {
          replicateId: prediction.id,
          generatedImageUrl: editedBase64,
          status: "completed",
        });

        res.json({
          visualizationId: visualization.id,
          replicateId: prediction.id,
          status: "completed",
          appliedStyles: result.appliedStyles,
          prompt: result.prompt
        });

      } catch (geminiError: any) {
        console.error("Gemini processing error:", geminiError);
        await storage.updateVisualization(visualization.id, {
          status: "failed",
        });
        
        // Check if this is a Google service error
        const isGoogleServiceError = geminiError.message && 
          (geminiError.message.includes('Internal error encountered') || 
           geminiError.message.includes('500') ||
           geminiError.status === 500);
        
        const errorMessage = isGoogleServiceError 
          ? "Google's AI service is temporarily unavailable. Please try again in a few minutes."
          : "AI processing failed. Please try again.";
        
        res.status(500).json({ 
          error: errorMessage,
          details: geminiError.message 
        });
      }

    } catch (error) {
      console.error("Error processing upload:", error);
      res.status(500).json({ error: "Failed to process image upload" });
    }
  });

  // Check visualization status (simplified for Gemini workflow)
  app.get("/api/visualizations/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const visualization = await storage.getVisualization(parseInt(id));

      if (!visualization) {
        return res.status(404).json({ error: "Visualization not found" });
      }

      // With Gemini, processing is immediate, so just return the current status
      res.json(visualization);
    } catch (error) {
      console.error("Error checking visualization status:", error);
      res.status(500).json({ error: "Failed to check status" });
    }
  });

  // Submit lead
  app.post("/api/leads", async (req, res) => {
    try {
      const leadData = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(leadData);

      // Here you could add email notifications, webhook calls, etc.
      // based on the tenant's configuration

      res.json(lead);
    } catch (error) {
      console.error("Error creating lead:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid lead data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to submit lead" });
    }
  });

  // Get leads for tenant (admin)
  app.get("/api/tenants/:tenantId/leads", requireAdminAuth, async (req, res) => {
    try {
      const { tenantId } = req.params;
      const leads = await storage.getLeadsByTenant(parseInt(tenantId));
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  // Delete lead (admin)
  app.delete("/api/leads/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteLead(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting lead:", error);
      res.status(500).json({ error: "Failed to delete lead" });
    }
  });

  // Get visualizations for tenant
  app.get("/api/tenants/:tenantId/visualizations", async (req, res) => {
    try {
      const { tenantId } = req.params;
      const visualizations = await storage.getVisualizationsByTenant(parseInt(tenantId));
      res.json(visualizations);
    } catch (error) {
      console.error("Error fetching visualizations:", error);
      res.status(500).json({ error: "Failed to fetch visualizations" });
    }
  });

  // Pool-specific API routes - completely separate from roofing/siding
  
  // Pool visualization upload
  app.post("/api/pools/upload", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const { tenantId, selectedPoolType, selectedPoolSize, selectedDecking, selectedLandscaping, selectedFeatures } = req.body;

      if (!tenantId) {
        return res.status(400).json({ error: "Tenant ID is required" });
      }

      // Check usage limits before processing
      try {
        await checkTenantUsageLimits(parseInt(tenantId));
      } catch (limitError: any) {
        return res.status(429).json({ error: limitError.message });
      }

      // Process image with size constraints (max 1920x1080)
      const originalImageBuffer = req.file.buffer;

      // Create base64 for storage
      const base64Image = `data:image/jpeg;base64,${originalImageBuffer.toString('base64')}`;

      // Create pool visualization record
      const poolVisualization = await storage.createPoolVisualization({
        tenantId: parseInt(tenantId),
        originalImageUrl: base64Image,
        selectedPoolType: selectedPoolType || null,
        selectedPoolSize: selectedPoolSize || null,
        selectedDecking: selectedDecking || null,
        selectedLandscaping: selectedLandscaping || null,
        selectedFeatures: selectedFeatures || null,
        status: "processing",
      });

      // Process with Gemini AI using pool-specific prompts
      try {
        const selectedPoolStyles = {
          poolType: selectedPoolType || undefined,
          poolSize: selectedPoolSize || undefined,
          decking: selectedDecking || undefined,
          landscaping: selectedLandscaping || undefined,
          features: selectedFeatures || undefined
        };

        // Import the pool style config to get detailed prompts
        const { POOL_STYLE_CONFIG } = await import("./pool-style-config");
        
        // Build proper pool styles object using the configuration system
        const poolStylesForProcessing: Record<string, any> = {};
        let detailedPrompts: string[] = [];
        
        // Get detailed prompts from pool style configuration
        if (selectedPoolType && POOL_STYLE_CONFIG[selectedPoolType]) {
          poolStylesForProcessing[selectedPoolType] = POOL_STYLE_CONFIG[selectedPoolType];
          detailedPrompts.push(POOL_STYLE_CONFIG[selectedPoolType].prompt);
        }
        if (selectedPoolSize && POOL_STYLE_CONFIG[selectedPoolSize]) {
          poolStylesForProcessing[selectedPoolSize] = POOL_STYLE_CONFIG[selectedPoolSize];
          detailedPrompts.push(POOL_STYLE_CONFIG[selectedPoolSize].prompt);
        }
        if (selectedDecking && POOL_STYLE_CONFIG[selectedDecking]) {
          poolStylesForProcessing[selectedDecking] = POOL_STYLE_CONFIG[selectedDecking];
          detailedPrompts.push(POOL_STYLE_CONFIG[selectedDecking].prompt);
        }
        if (selectedLandscaping && POOL_STYLE_CONFIG[selectedLandscaping]) {
          poolStylesForProcessing[selectedLandscaping] = POOL_STYLE_CONFIG[selectedLandscaping];
          detailedPrompts.push(POOL_STYLE_CONFIG[selectedLandscaping].prompt);
        }
        if (selectedFeatures && POOL_STYLE_CONFIG[selectedFeatures]) {
          poolStylesForProcessing[selectedFeatures] = POOL_STYLE_CONFIG[selectedFeatures];
          detailedPrompts.push(POOL_STYLE_CONFIG[selectedFeatures].prompt);
        }

        // Process with Gemini using the pool-specific processing function
        const result = await processPoolWithGemini({
          imageBuffer: originalImageBuffer,
          selectedStyles: poolStylesForProcessing
        });

        // Convert edited image to base64 for storage
        const editedBase64 = `data:image/jpeg;base64,${result.editedImageBuffer.toString('base64')}`;

        // Create a prediction-like object for compatibility
        const prediction = {
          id: `pool_gemini_${Date.now()}`,
          status: 'succeeded',
          output: [editedBase64],
          appliedStyles: selectedPoolStyles,
          prompt: detailedPrompts.join(' ')
        };

        // Update pool visualization with result
        await storage.updatePoolVisualization(poolVisualization.id, {
          replicateId: prediction.id,
          generatedImageUrl: editedBase64,
          status: "completed",
        });

        res.json({
          poolVisualizationId: poolVisualization.id,
          replicateId: prediction.id,
          status: "completed",
          appliedStyles: selectedPoolStyles,
          prompt: detailedPrompts.join(' ')
        });

      } catch (geminiError: any) {
        console.error("Gemini pool processing error:", geminiError);
        await storage.updatePoolVisualization(poolVisualization.id, {
          status: "failed",
        });
        
        // Check if this is a Google service error
        const isGoogleServiceError = geminiError.message && 
          (geminiError.message.includes('Internal error encountered') || 
           geminiError.message.includes('500') ||
           geminiError.status === 500);
        
        const errorMessage = isGoogleServiceError 
          ? "Google's AI service is temporarily unavailable. Please try again in a few minutes."
          : "AI pool processing failed. Please try again.";
        
        res.status(500).json({ 
          error: errorMessage,
          details: geminiError.message 
        });
      }

    } catch (error) {
      console.error("Error processing pool upload:", error);
      res.status(500).json({ error: "Failed to process pool image upload" });
    }
  });

  // Check pool visualization status
  app.get("/api/pools/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const poolVisualization = await storage.getPoolVisualization(parseInt(id));

      if (!poolVisualization) {
        return res.status(404).json({ error: "Pool visualization not found" });
      }

      // With Gemini, processing is immediate, so just return the current status
      res.json(poolVisualization);
    } catch (error) {
      console.error("Error checking pool visualization status:", error);
      res.status(500).json({ error: "Failed to check pool status" });
    }
  });

  // Get pool visualizations for tenant
  app.get("/api/tenants/:tenantId/pool-visualizations", async (req, res) => {
    try {
      const { tenantId } = req.params;
      const poolVisualizations = await storage.getPoolVisualizationsByTenant(parseInt(tenantId));
      res.json(poolVisualizations);
    } catch (error) {
      console.error("Error fetching pool visualizations:", error);
      res.status(500).json({ error: "Failed to fetch pool visualizations" });
    }
  });



  // Get all available styles
  app.get("/api/styles", (req, res) => {
    try {
      const styles = getAllStyles();
      res.json(styles);
    } catch (error) {
      console.error("Error fetching styles:", error);
      res.status(500).json({ error: "Failed to fetch styles" });
    }
  });

  // Get styles by category
  app.get("/api/styles/:category", (req, res) => {
    try {
      const { category } = req.params;
      const styles = getStylesByCategory(category as any);
      res.json(styles);
    } catch (error) {
      console.error("Error fetching styles by category:", error);
      res.status(500).json({ error: "Failed to fetch styles by category" });
    }
  });

  // Gemini-powered image analysis endpoint
  app.post("/api/analyze", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const analysis = await analyzeLandscapeImage(req.file.buffer);

      res.json({
        success: true,
        analysis: analysis,
        recommendations: analysis
      });

    } catch (error) {
      console.error("Image analysis error:", error);
      res.status(500).json({ 
        error: "Image analysis failed",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Landscape-specific API routes
  
  // Landscape visualization upload
  app.post("/api/landscape/upload", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const { tenantId, selectedCurbing, selectedLandscape, selectedPatios } = req.body;

      if (!tenantId) {
        return res.status(400).json({ error: "Tenant ID is required" });
      }

      // Check usage limits before processing
      try {
        await checkTenantUsageLimits(parseInt(tenantId));
      } catch (limitError: any) {
        return res.status(429).json({ error: limitError.message });
      }

      // Process image with size constraints (max 1920x1080)
      const originalImageBuffer = req.file.buffer;

      // Create base64 for storage
      const base64Image = `data:image/jpeg;base64,${originalImageBuffer.toString('base64')}`;

      // Create landscape visualization record
      const landscapeVisualization = await storage.createLandscapeVisualization({
        tenantId: parseInt(tenantId),
        originalImageUrl: base64Image,
        selectedCurbing: selectedCurbing || null,
        selectedLandscape: selectedLandscape || null,
        selectedPatios: selectedPatios || null,
        status: "processing",
      });

      // Process with Gemini AI using landscape-specific prompts
      try {
        const selectedLandscapeStyles = {
          curbing: selectedCurbing || undefined,
          landscape: selectedLandscape || undefined,
          patios: selectedPatios || undefined
        };

        console.log('🌿 Processing landscape with Gemini:', selectedLandscapeStyles);

        const { processLandscapeVisualizationWithGemini } = await import("./gemini-service");
        const result = await processLandscapeVisualizationWithGemini({
          imageBuffer: originalImageBuffer,
          selectedStyles: selectedLandscapeStyles
        });

        // Convert processed image to base64 for storage
        const processedBase64 = `data:image/jpeg;base64,${result.editedImageBuffer.toString('base64')}`;

        // Update landscape visualization with result
        await storage.updateLandscapeVisualization(landscapeVisualization.id, {
          generatedImageUrl: processedBase64,
          status: "completed"
        });

        res.json({
          landscapeVisualizationId: landscapeVisualization.id,
          generatedImageUrl: processedBase64,
          appliedStyles: result.appliedStyles,
          message: "Landscape visualization completed successfully"
        });

      } catch (error: any) {
        console.error("Landscape Gemini processing error:", error);
        
        // Update record with error status
        await storage.updateLandscapeVisualization(landscapeVisualization.id, {
          status: "failed"
        });

        // Provide more specific error messages
        let errorMessage = "AI processing failed. Please try again.";
        if (error.message && error.message.includes("Internal error encountered")) {
          errorMessage = "Google's AI service is temporarily unavailable. Please try again in a moment.";
        } else if (error.message && error.message.includes("after all retries")) {
          errorMessage = "AI service is experiencing issues. Please try again in a few minutes.";
        }

        res.status(500).json({ 
          error: errorMessage,
          landscapeVisualizationId: landscapeVisualization.id
        });
      }

    } catch (error: any) {
      console.error("Landscape upload error:", error);
      res.status(500).json({ error: "Upload failed. Please try again." });
    }
  });

  // Get landscape visualization status
  app.get("/api/landscape/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const landscapeVisualization = await storage.getLandscapeVisualization(parseInt(id));

      if (!landscapeVisualization) {
        return res.status(404).json({ error: "Landscape visualization not found" });
      }

      // With Gemini, processing is immediate, so just return the current status
      res.json(landscapeVisualization);
    } catch (error) {
      console.error("Error checking landscape visualization status:", error);
      res.status(500).json({ error: "Failed to check landscape status" });
    }
  });

  // Get landscape visualizations for tenant
  app.get("/api/tenants/:tenantId/landscape-visualizations", async (req, res) => {
    try {
      const { tenantId } = req.params;
      const landscapeVisualizations = await storage.getLandscapeVisualizationsByTenant(parseInt(tenantId));
      res.json(landscapeVisualizations);
    } catch (error) {
      console.error("Error fetching landscape visualizations:", error);
      res.status(500).json({ error: "Failed to fetch landscape visualizations" });
    }
  });

  // Create subscription for tenant
  app.post("/api/tenants/:tenantId/subscription", async (req, res) => {
    try {
      const { tenantId } = req.params;
      const { plan, billingEmail, paymentMethodId } = req.body;
      
      // Here you would integrate with Stripe, Paddle, or your payment processor
      // For now, we'll just update the tenant record
      
      const subscription = {
        plan: plan, // 'basic', 'pro'
        status: 'active',
        billingEmail: billingEmail,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      };
      
      // You would store this in a subscriptions table
      res.json({ success: true, subscription });
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ error: "Failed to create subscription" });
    }
  });

  // Generate API key for tenant (for direct API access)
  app.post("/api/tenants/:tenantId/api-key", async (req, res) => {
    try {
      const { tenantId } = req.params;
      
      // Generate a unique API key
      const apiKey = `lv_${Buffer.from(`${tenantId}_${Date.now()}`).toString('base64')}`;
      
      // Store API key in database (you'd need to add an api_keys table)
      // For now, just return it
      
      res.json({ apiKey });
    } catch (error) {
      console.error("Error generating API key:", error);
      res.status(500).json({ error: "Failed to generate API key" });
    }
  });

  // Get usage statistics for tenant
  app.get("/api/tenants/:tenantId/usage", async (req, res) => {
    try {
      const { tenantId } = req.params;
      const { days } = req.query;
      
      const stats = await storage.getUsageStats(
        parseInt(tenantId), 
        days ? parseInt(days as string) : 30
      );
      
      // Calculate totals
      const totals = stats.reduce((acc, stat) => ({
        totalGenerations: acc.totalGenerations + stat.totalGenerations,
        imageGenerations: acc.imageGenerations + stat.imageGenerations,
        landscapeGenerations: acc.landscapeGenerations + stat.landscapeGenerations,
        poolGenerations: acc.poolGenerations + stat.poolGenerations,
      }), {
        totalGenerations: 0,
        imageGenerations: 0,
        landscapeGenerations: 0,
        poolGenerations: 0,
      });

      res.json({
        stats,
        totals,
        period: `${days || 30} days`
      });
    } catch (error) {
      console.error("Error fetching usage stats:", error);
      res.status(500).json({ error: "Failed to fetch usage statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
