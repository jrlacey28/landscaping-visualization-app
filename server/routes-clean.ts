import type { Express } from "express";
import type { Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { fileURLToPath } from "url";
import { storage } from "./storage";
import { z } from "zod";
import { generateLandscapePrompt } from "./openai";
import { processImageWithSAM2AndGPT4o, waitForSAM2Completion, generateImageWithGPT4o } from "./clean-sam2-gpt4o";

const upload = multer({ storage: multer.memoryStorage() });

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export async function registerRoutes(app: Express): Promise<Server> {
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

  // SAM-2 + OpenAI GPT-4o workflow
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

      // Step 1: Start SAM-2 segmentation
      const selectedStyles = {
        curbing: { enabled: !!selectedCurbing, type: selectedCurbing || "" },
        landscape: { enabled: !!selectedLandscape, type: selectedLandscape || "" },
        patio: { enabled: !!selectedPatio, type: selectedPatio || "" }
      };

      const sam2Prediction = await processImageWithSAM2AndGPT4o(originalImageBuffer, selectedStyles);

      // Update visualization with SAM-2 prediction ID
      await storage.updateVisualization(visualization.id, {
        replicateId: sam2Prediction.id,
      });

      res.json({
        visualizationId: visualization.id,
        replicateId: sam2Prediction.id,
        status: "processing",
      });

    } catch (error: any) {
      console.error("SAM-2 + GPT-4o processing error:", error);
      res.status(500).json({ 
        error: "Failed to process image with AI",
        details: error.message || "Unknown error",
      });
    }
  });

  // Check status of SAM-2 + OpenAI processing
  app.get("/api/check-status/:predictionId", async (req, res) => {
    try {
      const { predictionId } = req.params;
      
      // Check SAM-2 status
      const sam2Result = await waitForSAM2Completion(predictionId, 1); // Quick check
      
      if (sam2Result.status === 'succeeded' && sam2Result.output) {
        // Find visualization by prediction ID
        const visualizations = await storage.getVisualizationsByTenant(1); // Get all for now
        const visualization = visualizations.find(v => v.replicateId === predictionId);
        
        if (visualization) {
          // Generate final image with OpenAI GPT-4o
          const selectedStyles = {
            curbing: { enabled: !!visualization.selectedCurbing, type: visualization.selectedCurbing || "" },
            landscape: { enabled: !!visualization.selectedLandscape, type: visualization.selectedLandscape || "" },
            patio: { enabled: !!visualization.selectedPatio, type: visualization.selectedPatio || "" }
          };

          const finalImageUrl = await generateImageWithGPT4o(
            Buffer.from(visualization.originalImageUrl.split(',')[1], 'base64'),
            sam2Result.output[0], // Use first mask from SAM-2
            selectedStyles
          );

          // Update visualization with final result
          await storage.updateVisualization(visualization.id, {
            generatedImageUrl: finalImageUrl,
            status: "completed"
          });

          res.json({
            status: 'succeeded',
            output: [finalImageUrl]
          });
        } else {
          res.json({ status: 'processing' });
        }
      } else {
        res.json({ status: sam2Result.status });
      }

    } catch (error: any) {
      console.error("Status check error:", error);
      res.json({ status: 'failed', error: error.message });
    }
  });

  // Create lead
  app.post("/api/leads", async (req, res) => {
    try {
      const leadData = z.object({
        tenantId: z.number(),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().min(1),
        address: z.string().min(1),
        visualizationId: z.number().optional(),
      }).parse(req.body);

      const lead = await storage.createLead(leadData);
      res.json(lead);
    } catch (error) {
      console.error("Error creating lead:", error);
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

  // Get visualizations by tenant
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

  const httpServer = app.listen(5000, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:5000`);
  });

  return httpServer;
}