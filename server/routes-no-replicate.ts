import type { Express } from "express";
import express from "express";
import type { Server } from "http";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { insertLeadSchema, insertVisualizationSchema, insertTenantSchema } from "@shared/schema";
import { z } from "zod";
import { generateLandscapePrompt } from "./openai";

const upload = multer({ storage: multer.memoryStorage() });

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static files from uploads directory
  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Get tenant by slug
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

  // Simple image upload without processing
  app.post("/api/upload-image", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${timestamp}-${req.file.originalname}`;
      const filepath = path.join(uploadsDir, filename);

      // Save file
      fs.writeFileSync(filepath, req.file.buffer);

      // Return URL
      const imageUrl = `/uploads/${filename}`;
      res.json({ imageUrl });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // OpenAI-only image generation workflow
  app.post("/api/upload", upload.single("image"), async (req, res) => {
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

      // Generate enhanced prompt using OpenAI
      let prompt: string;
      try {
        const selectedStyles = {
          curbing: selectedCurbing || "",
          landscape: selectedLandscape || "",
          patio: selectedPatio || ""
        };
        
        prompt = await generateLandscapePrompt(selectedStyles);
      } catch (error) {
        console.error("OpenAI prompt generation failed, using fallback:", error);
        prompt = "Transform this residential property photo with professional landscaping improvements. ";
        
        if (selectedCurbing) {
          prompt += `Add ${selectedCurbing} curbing around landscape areas. `;
        }
        if (selectedLandscape) {
          prompt += `Replace existing landscaping with ${selectedLandscape}. `;
        }
        if (selectedPatio) {
          prompt += `Add a ${selectedPatio} patio or hardscape area. `;
        }
        
        prompt += "Maintain the original house structure and perspective. Create a realistic, professional result that shows clear improvements while preserving the home's architecture.";
      }

      // Use OpenAI DALL-E 3 for direct image generation
      try {
        const openaiResponse = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
            quality: "standard"
          }),
        });

        if (!openaiResponse.ok) {
          const errorText = await openaiResponse.text();
          console.error('OpenAI API error:', errorText);
          throw new Error(`OpenAI API error: ${errorText}`);
        }

        const openaiResult = await openaiResponse.json();
        
        // Update visualization with completed result
        const updatedVisualization = await storage.updateVisualization(visualization.id, {
          generatedImageUrl: openaiResult.data[0].url,
          status: "completed",
          replicateId: `openai_${Date.now()}`, // Keep for compatibility
        });

        res.json({
          visualizationId: updatedVisualization.id,
          status: "completed",
          generatedImageUrl: openaiResult.data[0].url
        });

      } catch (error: any) {
        console.error("OpenAI generation error:", error);
        
        await storage.updateVisualization(visualization.id, {
          status: "failed",
        });

        res.status(500).json({
          error: "Failed to generate image with AI",
          details: error.message || "Unknown error",
        });
      }

    } catch (error: any) {
      console.error("Upload processing error:", error);
      res.status(500).json({ 
        error: "Failed to process upload",
        details: error.message || "Unknown error",
      });
    }
  });

  // Check visualization status (no external polling needed)
  app.get("/api/visualizations/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const visualization = await storage.getVisualization(parseInt(id));
      
      if (!visualization) {
        return res.status(404).json({ error: "Visualization not found" });
      }

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
      res.status(500).json({ error: "Failed to create lead" });
    }
  });

  // Get leads by tenant
  app.get("/api/leads/:tenantId", async (req, res) => {
    try {
      const tenantId = parseInt(req.params.tenantId);
      const leads = await storage.getLeadsByTenant(tenantId);
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  // Get all visualizations by tenant
  app.get("/api/visualizations/:tenantId", async (req, res) => {
    try {
      const tenantId = parseInt(req.params.tenantId);
      const visualizations = await storage.getVisualizationsByTenant(tenantId);
      res.json(visualizations);
    } catch (error) {
      console.error("Error fetching visualizations:", error);
      res.status(500).json({ error: "Failed to fetch visualizations" });
    }
  });

  // Server will be started by index.ts - don't start here
  return Promise.resolve({} as Server);
}