import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import sharp from "sharp";
import Replicate from "replicate";
import { storage } from "./storage";
import { insertLeadSchema, insertVisualizationSchema, insertTenantSchema } from "@shared/schema";
import { z } from "zod";
import { generateLandscapePrompt } from "./openai";

const upload = multer({ storage: multer.memoryStorage() });

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_TOKEN || "",
});

export async function registerRoutes(app: Express): Promise<Server> {
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

      // Call Replicate API for AI image generation
      try {
        const modelInput: any = {
          image: base64Image,
          prompt: prompt,
          num_inference_steps: 20,
          guidance_scale: 7.5,
        };

        let prediction;

        // Use high-quality Stable Diffusion XL inpainting model
        if (maskData) {
          modelInput.mask = maskData;
          
          prediction = await replicate.predictions.create({
            model: "stability-ai/stable-diffusion-xl-inpainting",
            input: {
              image: base64Image,
              mask: maskData,
              prompt: prompt,
              negative_prompt: "blurry, low quality, distorted, unrealistic",
              num_inference_steps: 30,
              guidance_scale: 7.5,
              strength: 0.8
            },
          });
        } else {
          // Use SDXL for general image generation without mask
          prediction = await replicate.predictions.create({
            model: "stability-ai/sdxl",
            input: {
              image: base64Image,
              prompt: prompt,
              negative_prompt: "blurry, low quality, distorted, unrealistic",
              num_inference_steps: 30,
              guidance_scale: 7.5,
              strength: 0.8
            },
          });
        }

        // Update visualization with Replicate ID
        await storage.updateVisualization(visualization.id, {
          replicateId: prediction.id,
        });

        res.json({
          visualizationId: visualization.id,
          replicateId: prediction.id,
          status: "processing",
        });

      } catch (replicateError) {
        console.error("Replicate API error:", replicateError);
        await storage.updateVisualization(visualization.id, {
          status: "failed",
        });
        res.status(500).json({ error: "Failed to process image with AI" });
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

  const httpServer = createServer(app);
  return httpServer;
}
