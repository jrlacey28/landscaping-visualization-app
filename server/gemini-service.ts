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
 * Generates a targeted landscape design prompt that only modifies selected features
 */
async function generateLandscapePrompt(selectedStyles: any): Promise<string> {
  const modifications = [];

  // Build very specific modification instructions
  if (selectedStyles.curbing) {
    let curbingDetails = '';
    switch (selectedStyles.curbing) {
      case 'natural_stone':
      case 'natural_stone_curbing':
        curbingDetails = 'Add natural stone curbing ONLY around existing flower beds and lawn edges. Use grey/beige limestone or flagstone blocks, 4-6 inches high, creating clean defined borders. Do NOT change the lawn, plants, or yard layout.';
        break;
      case 'brick_curbing':
        curbingDetails = 'Add red brick curbing ONLY around existing flower beds and lawn edges. Use traditional red clay bricks, 4-6 inches high, creating neat borders. Do NOT change the lawn, plants, or yard layout.';
        break;
      case 'concrete_curbing':
        curbingDetails = 'Add poured concrete curbing ONLY around existing flower beds and lawn edges. Use smooth grey concrete, 4-6 inches high, creating clean modern borders. Do NOT change the lawn, plants, or yard layout.';
        break;
      default:
        curbingDetails = 'Add decorative curbing ONLY around existing flower beds and lawn edges. Do NOT change the lawn, plants, or yard layout.';
    }
    modifications.push(curbingDetails);
  }

  if (selectedStyles.landscape) {
    let landscapeDetails = '';
    switch (selectedStyles.landscape) {
      case 'brown_mulch':
        landscapeDetails = 'Replace ONLY the mulch in existing flower beds with fresh brown wood mulch. Keep all existing plants, flowers, and bed shapes exactly the same. Do NOT change the lawn or add new beds.';
        break;
      case 'red_mulch':
        landscapeDetails = 'Replace ONLY the mulch in existing flower beds with red cedar mulch. Keep all existing plants, flowers, and bed shapes exactly the same. Do NOT change the lawn or add new beds.';
        break;
      case 'decorative_stone':
        landscapeDetails = 'Replace ONLY the mulch in existing flower beds with decorative river rocks or landscape stones. Keep all existing plants, flowers, and bed shapes exactly the same. Do NOT change the lawn or add new beds.';
        break;
      default:
        landscapeDetails = 'Improve ONLY the existing flower bed materials while keeping all plants and bed shapes the same. Do NOT change the lawn or add new beds.';
    }
    modifications.push(landscapeDetails);
  }

  if (selectedStyles.patio) {
    let patioDetails = '';
    switch (selectedStyles.patio) {
      case 'concrete_patio':
        patioDetails = 'Add a concrete patio ONLY in an appropriate yard area, typically near the house or in a back corner. Do NOT change existing lawn, beds, or landscaping.';
        break;
      case 'stone_patio':
        patioDetails = 'Add a natural stone patio ONLY in an appropriate yard area, typically near the house or in a back corner. Do NOT change existing lawn, beds, or landscaping.';
        break;
      case 'brick_patio':
        patioDetails = 'Add a brick patio ONLY in an appropriate yard area, typically near the house or in a back corner. Do NOT change existing lawn, beds, or landscaping.';
        break;
      default:
        patioDetails = 'Add a patio ONLY in an appropriate yard area. Do NOT change existing lawn, beds, or landscaping.';
    }
    modifications.push(patioDetails);
  }

  // Create precise prompt that emphasizes preservation
  const specificPrompt = `
PRECISE LANDSCAPE EDITING INSTRUCTIONS:

${modifications.join('\n\n')}

CRITICAL PRESERVATION RULES:
- Keep the house, driveway, sidewalks, and all hardscaping exactly the same
- Preserve all existing trees, shrubs, and mature plants
- Maintain the exact lawn areas and grass coverage  
- Keep the same yard layout, bed shapes, and overall design
- Only modify the specific features listed above
- Maintain original lighting, shadows, and perspective
- Keep image dimensions at 1920x1080 pixels
- Result must look natural and professionally installed

Make ONLY the specified changes above. Do not redesign or dramatically alter the yard.`;

  return specificPrompt;
}

/**
 * Processes landscape image with Gemini AI for complete editing workflow
 */
export async function processLandscapeWithGemini({
  imageBuffer,
  selectedStyles
}: {
  imageBuffer: Buffer;
  selectedStyles: {
    curbing?: string;
    landscape?: string;
    patio?: string;
  };
}): Promise<{
  editedImageBuffer: Buffer;
  appliedStyles: string[];
  prompt: string;
}> {
  try {
    // Step 1: Process and resize image
    const processedImage = await processImageSize(imageBuffer);

    // Step 2: Generate tailored prompt using style config
    // Import style config to get proper prompts
    const { STYLE_CONFIG } = await import('./style-config');

    // Build prompt based on selected styles using actual style config
    const modifications = [];
    const appliedStyles = [];

    console.log('🔍 PROCESSING STYLES:', selectedStyles);

    if (selectedStyles.curbing && STYLE_CONFIG[selectedStyles.curbing]) {
      const styleConfig = STYLE_CONFIG[selectedStyles.curbing];
      console.log(`✓ Found curbing style: ${styleConfig.name}`);
      modifications.push(styleConfig.prompt);
      appliedStyles.push(selectedStyles.curbing);
    } else if (selectedStyles.curbing) {
      console.log(`❌ Curbing style not found: ${selectedStyles.curbing}`);
    }

    if (selectedStyles.landscape && STYLE_CONFIG[selectedStyles.landscape]) {
      const styleConfig = STYLE_CONFIG[selectedStyles.landscape];
      console.log(`✓ Found landscape style: ${styleConfig.name}`);
      modifications.push(styleConfig.prompt);
      appliedStyles.push(selectedStyles.landscape);
    } else if (selectedStyles.landscape) {
      console.log(`❌ Landscape style not found: ${selectedStyles.landscape}`);
    }

    if (selectedStyles.patio && STYLE_CONFIG[selectedStyles.patio]) {
      const styleConfig = STYLE_CONFIG[selectedStyles.patio];
      console.log(`✓ Found patio style: ${styleConfig.name}`);
      modifications.push(styleConfig.prompt);
      appliedStyles.push(selectedStyles.patio);
    } else if (selectedStyles.patio) {
      console.log(`❌ Patio style not found: ${selectedStyles.patio}`);
    }

    if (modifications.length === 0) {
      console.log('❌ No valid modifications found');
      throw new Error('No valid modifications selected');
    }

    console.log(`✓ Using ${modifications.length} style prompts`);

    // Combine all the style-specific prompts
    const prompt = `
PRECISE LANDSCAPE EDITING INSTRUCTIONS:

${modifications.join('\n\n')}

CRITICAL PRESERVATION RULES:
- Keep the house, driveway, sidewalks, and all hardscaping exactly the same
- Preserve all existing trees, shrubs, and mature plants  
- Maintain the exact lawn areas and grass coverage
- Keep the same yard layout, bed shapes, and overall design
- Only modify the specific features listed above
- Maintain original lighting, shadows, and perspective
- Keep image dimensions at 1920x1080 pixels
- Result must look natural and professionally installed

Make ONLY the specified changes above. Do not redesign or dramatically alter the yard.
`;

    // Step 3: Use the specific prompt directly (it already includes all requirements)
    const finalPrompt = prompt;

    // Step 4: Generate edited image using Gemini
    const base64Image = processedImage.buffer.toString('base64');

    console.log("🎯 GEMINI PROMPT BEING SENT:");
    console.log("=====================================");
    console.log(finalPrompt);
    console.log("=====================================");

    const response = await ai.models.generateContent({
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

    // Extract the generated image from Gemini response
    let generatedImageBuffer = processedImage.buffer; // fallback to original

    if (response.candidates && response.candidates.length > 0) {
      const content = response.candidates[0].content;
      if (content && content.parts) {
        for (const part of content.parts) {
          if (part.inlineData && part.inlineData.data) {
            // Convert base64 to buffer for the generated image
            generatedImageBuffer = Buffer.from(part.inlineData.data, 'base64');
            console.log("✓ Gemini generated new landscape image successfully");
            break;
          }
        }
      }
    }

    return {
      editedImageBuffer: generatedImageBuffer,
      prompt: finalPrompt,
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