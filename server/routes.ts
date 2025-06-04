import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
// Removed Replicate import - using OpenAI only
import { storage } from "./storage";
import { insertLeadSchema, insertVisualizationSchema, insertTenantSchema } from "@shared/schema";
import { z } from "zod";
import { generateLandscapePrompt } from "./openai";
// Removed inpainting imports - using SAM-2 + OpenAI only
import { getAllStyles, getStylesByCategory, getStyleForRegion } from "./style-config";
// Removed Replicate imports - using OpenAI only

const upload = multer({ storage: multer.memoryStorage() });

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Removed Replicate initialization - using OpenAI only

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

  // Pure SAM-2 + GPT-4o workflow (NO REPLICATE INPAINTING)
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

      // Convert to base64 for Replicate API
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

      // Generate enhanced prompt using OpenAI o3-mini model
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
        // Fallback to basic prompt if OpenAI fails
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

      // Use OpenAI GPT-4o for direct image generation (no masks)
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
        
        // Create a prediction object compatible with existing flow
        const prediction = {
          id: `openai_${Date.now()}`,
          status: 'succeeded',
          output: [openaiResult.data[0].url],
          urls: {
            get: `https://api.openai.com/v1/images/status/${Date.now()}`
          }
        };

        // Update visualization with Replicate ID
        await storage.updateVisualization(visualization.id, {
          replicateId: prediction.id,
        });

        res.json({
          visualizationId: visualization.id,
          replicateId: prediction.id,
          status: "processing",
        });

      } catch (replicateError: any) {
        console.error("Replicate API error details:", {
          message: replicateError.message,
          status: replicateError.response?.status,
          data: replicateError.response?.data,
          full_error: replicateError
        });
        await storage.updateVisualization(visualization.id, {
          status: "failed",
        });
        res.status(500).json({ 
          error: "Failed to process image with AI",
          details: replicateError.message 
        });
      }

    } catch (error) {
      console.error("Error processing upload:", error);
      res.status(500).json({ error: "Failed to process image upload" });
    }
  });

  // Check visualization status (OpenAI only - no Replicate)
  app.get("/api/visualizations/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const visualization = await storage.getVisualization(parseInt(id));
      
      if (!visualization) {
        return res.status(404).json({ error: "Visualization not found" });
      }

      // For OpenAI-generated predictions, they complete immediately
      // No need to poll external APIs since OpenAI returns results synchronously
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

  // REMOVED: SAM-2 segmentation endpoint - using OpenAI only

  // Check SAM-2 prediction status
  app.get("/api/segment/:predictionId", async (req, res) => {
    try {
      const { predictionId } = req.params;
      
      const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
        }
      });

      if (!response.ok) {
        return res.status(500).json({ error: "Failed to check prediction status" });
      }

      const prediction = await response.json();
      res.json(prediction);

    } catch (error) {
      console.error("Prediction status check error:", error);
      res.status(500).json({ error: "Failed to check prediction status" });
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

  // Fast SAM-2 + OpenAI workflow (no inpainting)
  app.post("/api/fast-edit", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Image file is required" });
      }

      const { tenantId, selectedCurbing, selectedLandscape, selectedPatio } = req.body;

      if (!tenantId) {
        return res.status(400).json({ error: "Tenant ID is required" });
      }

      // Parse selected styles
      const selectedStyles = {
        curbing: { 
          enabled: selectedCurbing ? true : false, 
          type: selectedCurbing || '' 
        },
        landscape: { 
          enabled: selectedLandscape ? true : false, 
          type: selectedLandscape || '' 
        },
        patio: { 
          enabled: selectedPatio ? true : false, 
          type: selectedPatio || '' 
        }
      };

      // Check if any styles are selected
      const hasEnabledStyles = Object.values(selectedStyles).some(style => style.enabled);
      if (!hasEnabledStyles) {
        return res.status(400).json({ error: "No landscaping features selected" });
      }

      // Create visualization record
      const originalImageBuffer = req.file.buffer;
      const base64Image = `data:image/png;base64,${originalImageBuffer.toString('base64')}`;
      
      const visualization = await storage.createVisualization({
        tenantId: parseInt(tenantId),
        originalImageUrl: base64Image,
        selectedCurbing: selectedCurbing || null,
        selectedLandscape: selectedLandscape || null,
        selectedPatio: selectedPatio || null,
        status: "processing",
      });

      // Direct OpenAI image generation (no SAM-2 or Replicate)
      // selectedStyles already defined above

      // Generate enhanced prompt
      let prompt: string;
      try {
        const promptStyles = {
          curbing: selectedCurbing || "",
          landscape: selectedLandscape || "",
          patio: selectedPatio || ""
        };
        prompt = await generateLandscapePrompt(promptStyles);
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
        throw new Error(`OpenAI API error: ${errorText}`);
      }

      const openaiResult = await openaiResponse.json();

      // Update visualization with completed result
      const updatedVisualization = await storage.updateVisualization(visualization.id, {
        generatedImageUrl: openaiResult.data[0].url,
        status: "completed",
        replicateId: `openai_${Date.now()}`,
      });

      res.json({
        success: true,
        visualizationId: visualization.id,
        status: "completed",
        generatedImageUrl: openaiResult.data[0].url
      });

    } catch (error) {
      console.error("Fast edit error:", error);
      res.status(500).json({ error: "Failed to process image" });
    }
  });

  // Check SAM-2 status and apply OpenAI edits
  app.get("/api/fast-edit/:segmentationId", async (req, res) => {
    try {
      const { segmentationId } = req.params;
      
      const response = await fetch(`https://api.replicate.com/v1/predictions/${segmentationId}`, {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
        }
      });

      if (!response.ok) {
        return res.status(500).json({ error: "Failed to check segmentation status" });
      }

      const prediction = await response.json();
      
      if (prediction.status === 'succeeded' && prediction.output?.masks?.length > 0) {
        res.json({
          status: 'ready_for_edit',
          masks: prediction.output.masks,
          message: 'SAM-2 completed. Ready for OpenAI editing.'
        });
      } else if (prediction.status === 'failed') {
        res.json({
          status: 'failed',
          error: prediction.error || 'Region detection failed'
        });
      } else {
        res.json({
          status: prediction.status,
          message: 'Processing regions...'
        });
      }

    } catch (error) {
      console.error("Status check error:", error);
      res.status(500).json({ error: "Failed to check status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
