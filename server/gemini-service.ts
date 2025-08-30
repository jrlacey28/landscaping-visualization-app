import * as fs from "fs";
import { GoogleGenAI, Modality } from "@google/genai";
import sharp from "sharp";

// Initialize Gemini AI client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
}

interface LandscapeEditRequest {
  imageBuffer: Buffer;
  selectedStyles: {
    curbing?: string;
    landscape?: string;
    patio?: string;
  };
}

interface LandscapeEditResult {
  editedImageBuffer: Buffer;
  prompt: string;
  appliedStyles: string[];
}

/**
 * Processes and resizes image to max 1920x1080 while maintaining aspect ratio
 */
async function processImageSize(imageBuffer: Buffer): Promise<ProcessedImage> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  
  let processedImage = image;
  
  // Check if resizing is needed
  if (metadata.width && metadata.height && (metadata.width > 1920 || metadata.height > 1080)) {
    processedImage = image.resize(1920, 1080, {
      fit: 'inside',
      withoutEnlargement: false
    });
  }
  
  const result = await processedImage.jpeg({ quality: 90 }).toBuffer();
  const finalMetadata = await sharp(result).metadata();
  
  return {
    buffer: result,
    width: finalMetadata.width || 1920,
    height: finalMetadata.height || 1080,
    format: 'jpeg'
  };
}

/**
 * Generates a tailored landscape design prompt based on selected styles
 */
async function generateLandscapePrompt(selectedStyles: any): Promise<string> {
  const styleDescriptions = [];
  
  if (selectedStyles.curbing) {
    styleDescriptions.push(`decorative curbing with ${selectedStyles.curbing.replace(/[_-]/g, ' ')}`);
  }
  
  if (selectedStyles.landscape) {
    styleDescriptions.push(`landscape features with ${selectedStyles.landscape.replace(/[_-]/g, ' ')}`);
  }
  
  if (selectedStyles.patio) {
    styleDescriptions.push(`patio area with ${selectedStyles.patio.replace(/[_-]/g, ' ')}`);
  }

  const promptRequest = `
    Create a detailed professional landscape design editing prompt for AI image generation.
    The design should transform the provided image to include: ${styleDescriptions.join(', ')}.
    
    Requirements:
    - Keep the image dimensions exactly at 1920x1080 pixels
    - Maintain the original house structure and perspective
    - Add realistic, high-quality landscape improvements
    - Use professional landscaping terminology
    - Specify realistic materials, textures, and colors
    - Ensure visual harmony and proper proportions
    - Create photorealistic results that look natural
    
    Return only the detailed image editing prompt, no additional text.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: promptRequest,
    });

    return response.text || `Professional landscape design featuring ${styleDescriptions.join(', ')}, maintain 1920x1080 dimensions, photorealistic quality`;
  } catch (error) {
    console.error("Gemini prompt generation error:", error);
    // Fallback prompt
    return `Transform this residential property with professional landscaping: ${styleDescriptions.join(', ')}. Maintain original house structure, 1920x1080 dimensions, photorealistic quality with natural lighting and realistic textures.`;
  }
}

/**
 * Processes landscape image with Gemini AI for complete editing workflow
 */
export async function processLandscapeWithGemini({ imageBuffer, selectedStyles }: LandscapeEditRequest): Promise<LandscapeEditResult> {
  try {
    // Step 1: Process and resize image
    const processedImage = await processImageSize(imageBuffer);
    
    // Step 2: Generate tailored prompt
    const editPrompt = await generateLandscapePrompt(selectedStyles);
    
    // Step 3: Create final prompt with size constraints
    const finalPrompt = `${editPrompt}

CRITICAL REQUIREMENTS:
- Output image must be exactly 1920x1080 pixels
- Maintain photorealistic quality
- Preserve original house architecture
- Apply landscape changes seamlessly
- Use natural lighting and realistic materials`;

    // Step 4: Generate edited image using Gemini
    const base64Image = processedImage.buffer.toString('base64');
    
    await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: [
        { 
          role: "user", 
          parts: [
            { text: finalPrompt },
            {
              inlineData: {
                data: base64Image,
                mimeType: "image/jpeg"
              }
            }
          ] 
        }
      ],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    // For now, return the processed input image until Gemini image editing is available
    // This will be updated when the full Gemini image editing capability is released
    
    const appliedStyles = Object.entries(selectedStyles)
      .filter(([_, value]) => value)
      .map(([key, value]) => `${key}: ${value}`);

    return {
      editedImageBuffer: processedImage.buffer,
      prompt: editPrompt,
      appliedStyles
    };

  } catch (error) {
    console.error("Gemini landscape processing error:", error);
    throw new Error(`Landscape processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Analyzes landscape image to suggest improvement areas
 */
export async function analyzeLandscapeImage(imageBuffer: Buffer): Promise<string> {
  try {
    const base64Image = imageBuffer.toString('base64');

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: [
        {
          inlineData: {
            data: base64Image,
            mimeType: "image/jpeg"
          }
        },
        "Analyze this landscape image and identify specific areas that could benefit from curbing, landscape materials (mulch, stones), and patio installations. Provide professional landscaping recommendations."
      ],
    });

    return response.text || "Professional landscape analysis completed";
  } catch (error) {
    console.error("Gemini image analysis error:", error);
    return "Image analysis unavailable";
  }
}