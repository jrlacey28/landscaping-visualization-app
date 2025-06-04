import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import Replicate from "replicate";
import { storage } from "./storage";
import { insertLeadSchema, insertVisualizationSchema, insertTenantSchema } from "@shared/schema";
import { z } from "zod";
import { generateLandscapePrompt } from "./openai";
// Removed inpainting imports - using SAM-2 + OpenAI only
import { getAllStyles, getStylesByCategory, getStyleForRegion } from "./style-config";
import { processFastSAM2, applyOpenAIEdit } from "./fast-sam2-openai";

const upload = multer({ storage: multer.memoryStorage() });

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_TOKEN || "",
});

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

  // Upload image and process with AI
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

      // Call OpenAI API for AI image generation
      try {
        // Use OpenAI DALL-E for image editing
        let openaiResult;
        
        if (maskData) {
          // Use DALL-E image editing with mask
          const formData = new FormData();
          
          // Convert base64 image to buffer and create blob
          const imageBuffer = Buffer.from(base64Image.split(',')[1], 'base64');
          const imageBlob = new Blob([imageBuffer], { type: 'image/png' });
          formData.append('image', imageBlob, 'image.png');
          
          // Convert mask to buffer and create blob
          const maskBuffer = Buffer.from(maskData.split(',')[1], 'base64');
          const maskBlob = new Blob([maskBuffer], { type: 'image/png' });
          formData.append('mask', maskBlob, 'mask.png');
          
          formData.append('prompt', prompt);
          formData.append('n', '1');
          formData.append('size', '1024x1024');
          
          const openaiResponse = await fetch('https://api.openai.com/v1/images/edits', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: formData,
          });

          if (!openaiResponse.ok) {
            const errorText = await openaiResponse.text();
            console.error('OpenAI API error:', errorText);
            throw new Error(`OpenAI API error: ${errorText}`);
          }

          openaiResult = await openaiResponse.json();
        } else {
          // Use DALL-E image variation without mask
          const formData = new FormData();
          
          const imageBuffer = Buffer.from(base64Image.split(',')[1], 'base64');
          const imageBlob = new Blob([imageBuffer], { type: 'image/png' });
          formData.append('image', imageBlob, 'image.png');
          
          formData.append('n', '1');
          formData.append('size', '1024x1024');
          
          const openaiResponse = await fetch('https://api.openai.com/v1/images/variations', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: formData,
          });

          if (!openaiResponse.ok) {
            const errorText = await openaiResponse.text();
            console.error('OpenAI API error:', errorText);
            throw new Error(`OpenAI API error: ${errorText}`);
          }

          openaiResult = await openaiResponse.json();
        }
        
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

  // Check visualization status
  app.get("/api/visualizations/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const visualization = await storage.getVisualization(parseInt(id));
      
      if (!visualization) {
        return res.status(404).json({ error: "Visualization not found" });
      }

      // If processing, check Replicate status
      if (visualization.status === "processing" && visualization.replicateId) {
        try {
          const prediction = await replicate.predictions.get(visualization.replicateId);
          
          if (prediction.status === "succeeded") {
            // Update with generated image
            const updatedVisualization = await storage.updateVisualization(visualization.id, {
              generatedImageUrl: prediction.output?.[0] || null,
              status: "completed",
            });
            res.json(updatedVisualization);
          } else if (prediction.status === "failed") {
            await storage.updateVisualization(visualization.id, {
              status: "failed",
            });
            res.json({ ...visualization, status: "failed" });
          } else {
            res.json(visualization);
          }
        } catch (replicateError) {
          console.error("Error checking Replicate status:", replicateError);
          res.json(visualization);
        }
      } else {
        res.json(visualization);
      }
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

  // SAM-2 segmentation endpoint
  app.post("/api/segment", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Image file is required" });
      }

      // Convert image to base64 with proper prefix
      const imageBuffer = req.file.buffer;
      const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;

      // Call Replicate's SAM-2 API
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          version: "fe97b453a6455861e3bac769b441ca1f1086110da7466dbb65cf1eecfd60dc83",
          input: {
            image: base64Image,
            points_per_side: 32,
            pred_iou_thresh: 0.88,
            stability_score_thresh: 0.95,
            use_m2m: true
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('SAM-2 API error:', errorText);
        return res.status(500).json({ error: "SAM-2 processing failed" });
      }

      const prediction = await response.json();
      
      // Return prediction ID for polling or direct result if available
      res.json({ 
        prediction_id: prediction.id,
        status: prediction.status,
        output: prediction.output,
        urls: prediction.urls
      });

    } catch (error) {
      console.error("SAM-2 processing error:", error);
      res.status(500).json({ error: "Failed to process image with SAM-2" });
    }
  });

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

      // Step 1: Fast SAM-2 segmentation
      const sam2Prediction = await processFastSAM2(originalImageBuffer, selectedStyles);

      // Return prediction ID for client to poll status
      res.json({
        success: true,
        visualizationId: visualization.id,
        segmentationId: sam2Prediction.id,
        status: sam2Prediction.status,
        selectedStyles: selectedStyles
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
