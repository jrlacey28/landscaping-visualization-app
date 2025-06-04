import { Express, Request, Response, NextFunction } from "express";
import { createServer, Server } from "http";
import express from "express";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { insertLeadSchema, insertVisualizationSchema, insertTenantSchema } from "@shared/schema";
import { z } from "zod";
import { generateLandscapePrompt } from "./openai";
import { getAllStyles, getStylesByCategory, getStyleForRegion } from "./style-config";
import { processWithOpenAIOnly } from "./openai-only";

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

  // Create tenant
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

  // Upload image only (for preview purposes)
  app.post("/api/upload-image", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      // Generate unique filename
      const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.jpg`;
      const filepath = path.join(uploadsDir, filename);

      // Process and save image
      await sharp(req.file.buffer)
        .jpeg({ quality: 80 })
        .toFile(filepath);

      const imageUrl = `/uploads/${filename}`;
      res.json({ imageUrl });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // Pure OpenAI GPT-4o image processing (replaces old Replicate workflow)
  app.post("/api/upload", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const { tenantId, selectedCurbing, selectedLandscape, selectedPatio, maskData } = req.body;

      if (!tenantId) {
        return res.status(400).json({ error: "Tenant ID is required" });
      }

      // Keep original image quality - no resizing or compression
      const originalImageBuffer = req.file.buffer;
      const base64Image = `data:image/jpeg;base64,${originalImageBuffer.toString('base64')}`;

      // Create visualization record
      const visualization = await storage.createVisualization({
        tenantId: parseInt(tenantId),
        originalImageUrl: base64Image,
        selectedCurbing: selectedCurbing || null,
        selectedLandscape: selectedLandscape || null,
        selectedPatio: selectedPatio || null,
        status: "processing",
      });

      // Process with pure OpenAI GPT-4o
      try {
        const selectedStyles = {
          curbing: selectedCurbing || "",
          landscape: selectedLandscape || "",
          patio: selectedPatio || ""
        };

        const generatedImageUrl = await processWithOpenAIOnly(originalImageBuffer, selectedStyles, maskData);

        // Update visualization with result
        await storage.updateVisualization(visualization.id, {
          generatedImageUrl: generatedImageUrl,
          status: "completed",
        });

        res.json({
          success: true,
          visualizationId: visualization.id,
          generatedImageUrl: generatedImageUrl,
          originalImageUrl: base64Image,
          status: "completed"
        });
      } catch (openaiError: any) {
        console.error("OpenAI processing failed:", openaiError);
        
        await storage.updateVisualization(visualization.id, {
          status: "failed",
        });

        res.status(500).json({
          error: "Failed to process image with OpenAI",
          details: openaiError.message || "Unknown error"
        });
      }
    } catch (error) {
      console.error("Error processing upload:", error);
      res.status(500).json({ error: "Failed to process image upload" });
    }
  });

  // Check visualization status
  app.get("/api/visualizations/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const visualization = await storage.getVisualization(parseInt(id));
      
      if (!visualization) {
        return res.status(404).json({ error: "Visualization not found" });
      }

      // Return visualization status (OpenAI processing is synchronous)
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

  // Get all landscaping styles
  app.get("/api/styles", async (req, res) => {
    try {
      const styles = getAllStyles();
      res.json(styles);
    } catch (error) {
      console.error("Error fetching styles:", error);
      res.status(500).json({ error: "Failed to fetch styles" });
    }
  });

  // Get styles by category
  app.get("/api/styles/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const styles = getStylesByCategory(category as any);
      res.json(styles);
    } catch (error) {
      console.error("Error fetching styles by category:", error);
      res.status(500).json({ error: "Failed to fetch styles" });
    }
  });

  // Fast edit endpoint with pure OpenAI processing
  app.post("/api/fast-edit", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const { tenantId, selectedCurbing, selectedLandscape, selectedPatio } = req.body;

      if (!tenantId) {
        return res.status(400).json({ error: "Tenant ID is required" });
      }

      const originalImageBuffer = req.file.buffer;
      const base64Image = `data:image/jpeg;base64,${originalImageBuffer.toString('base64')}`;

      // Create visualization record
      const visualization = await storage.createVisualization({
        tenantId: parseInt(tenantId),
        originalImageUrl: base64Image,
        selectedCurbing: selectedCurbing || null,
        selectedLandscape: selectedLandscape || null,
        selectedPatio: selectedPatio || null,
        status: "processing",
      });

      // Process with pure OpenAI GPT-4o (no Replicate)
      const selectedStyles = {
        curbing: selectedCurbing || "",
        landscape: selectedLandscape || "",
        patio: selectedPatio || ""
      };

      const generatedImageUrl = await processWithOpenAIOnly(originalImageBuffer, selectedStyles);

      // Update visualization with result
      await storage.updateVisualization(visualization.id, {
        generatedImageUrl: generatedImageUrl,
        status: "completed",
      });

      res.json({
        success: true,
        visualizationId: visualization.id,
        generatedImageUrl: generatedImageUrl,
        originalImageUrl: base64Image,
        status: "completed"
      });

    } catch (error) {
      console.error("Fast edit error:", error);
      res.status(500).json({ error: "Failed to process image" });
    }
  });

  const server = createServer(app);
  return server;
}