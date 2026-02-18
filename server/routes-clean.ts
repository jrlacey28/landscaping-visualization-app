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

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_UPLOAD_FILES = 1;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);
const FORMAT_TO_EXTENSION: Record<string, string> = {
  jpeg: "jpg",
  png: "png",
  webp: "webp",
  avif: "avif",
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_SIZE_BYTES,
    files: MAX_UPLOAD_FILES,
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error("Unsupported file type. Please upload a JPG, PNG, WEBP, or AVIF image."));
    }
    cb(null, true);
  },
});

async function sanitizeUploadedImage(file: Express.Multer.File) {
  const image = sharp(file.buffer, { failOn: "error" });
  const metadata = await image.metadata();
  const format = metadata.format?.toLowerCase();

  if (!format || !(format in FORMAT_TO_EXTENSION)) {
    throw new Error("Unsupported or invalid image content.");
  }

  // Decode + re-encode so we persist only clean raster image bytes.
  let sanitizedBuffer: Buffer;
  switch (format) {
    case "jpeg":
      sanitizedBuffer = await image.rotate().jpeg({ quality: 92 }).toBuffer();
      break;
    case "png":
      sanitizedBuffer = await image.rotate().png().toBuffer();
      break;
    case "webp":
      sanitizedBuffer = await image.rotate().webp({ quality: 92 }).toBuffer();
      break;
    case "avif":
      sanitizedBuffer = await image.rotate().avif({ quality: 50 }).toBuffer();
      break;
    default:
      throw new Error("Unsupported or invalid image format.");
  }

  return {
    buffer: sanitizedBuffer,
    extension: FORMAT_TO_EXTENSION[format],
  };
}

const uploadSingleImage = (req: any, res: any, next: any) => {
  upload.single("image")(req, res, (err: any) => {
    if (!err) {
      return next();
    }

    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: `File too large. Max size is ${Math.round(MAX_UPLOAD_SIZE_BYTES / 1024 / 1024)}MB.` });
      }
      if (err.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({ error: "Only one image file is allowed." });
      }
    }

    return res.status(400).json({ error: err.message || "Invalid upload." });
  });
};

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
  app.post("/api/upload-image", uploadSingleImage, async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const sanitizedImage = await sanitizeUploadedImage(req.file);

      // Generate unique filename with normalized extension
      const timestamp = Date.now();
      const filename = `${timestamp}.${sanitizedImage.extension}`;
      const filepath = path.join(uploadsDir, filename);

      // Save file locally for now. Consider moving uploads to object storage (S3/GCS)
      // and serving through a dedicated assets domain/CDN.
      fs.writeFileSync(filepath, sanitizedImage.buffer);

      // Return URL
      const imageUrl = `/uploads/${filename}`;
      res.json({ imageUrl });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // SAM-2 + OpenAI GPT-4o workflow
  app.post("/api/upload", uploadSingleImage, async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const { tenantId, selectedCurbing, selectedLandscape, selectedPatio } = req.body;

      if (!tenantId) {
        return res.status(400).json({ error: "Tenant ID is required" });
      }

      const sanitizedImage = await sanitizeUploadedImage(req.file);
      const originalImageBuffer = sanitizedImage.buffer;
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

  // Server will be started by index.ts - don't start here
  return Promise.resolve({} as Server);
}
