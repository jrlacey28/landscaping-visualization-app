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
  // Serve static files from uploads directory
  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

  // Get tenant by slug (for multi-tenant setup)
  app.get("/api/tenant/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const tenant = await storage.getTenantBySlug(slug);

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
  app.post("/api/tenants", async (req, res) => {
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
  app.patch("/api/tenants/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const tenantData = insertTenantSchema.partial().parse(req.body);
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
        res.status(500).json({ 
          error: "AI processing failed. Please try again.",
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
  app.get("/api/tenants/:tenantId/leads", async (req, res) => {
    try {
      const { tenantId } = req.params;
      const leads = await storage.getLeadsByTenant(parseInt(tenantId));
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ error: "Failed to fetch leads" });
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
        res.status(500).json({ 
          error: "AI pool processing failed. Please try again.",
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

        res.status(500).json({ 
          error: "AI processing failed. Please try again.",
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

  const httpServer = createServer(app);
  return httpServer;
}
