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

interface RoofingEditRequest {
  imageBuffer: Buffer;
  selectedStyles: {
    roof?: string;
    siding?: string;
    surpriseMe?: string;
  };
}

interface RoofingEditResult {
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
 * Generates a targeted roofing design prompt that only modifies selected features
 */
async function generateRoofingPrompt(selectedStyles: any): Promise<string> {
  const modifications = [];

  // Build very specific modification instructions
  if (selectedStyles.roof) {
    let roofDetails = '';
    
    // Handle roof style and color combinations
    if (selectedStyles.roof.includes('asphalt_shingles')) {
      const color = selectedStyles.roof.split('_')[2] + '_' + selectedStyles.roof.split('_')[3];
      switch (color) {
        case 'charcoal_black':
          roofDetails = 'Replace ONLY the roof with charcoal black asphalt shingles. High-quality dimensional shingles with deep black color and subtle texture variation. Professional installation with proper alignment. Do NOT change the house structure, siding, windows, doors, trim, or landscaping.';
          break;
        case 'weathered_gray':
          roofDetails = 'Replace ONLY the roof with weathered gray asphalt shingles. Premium architectural shingles in sophisticated gray tones with natural weathered appearance. Do NOT change any other home features or landscaping.';
          break;
        case 'rustic_brown':
          roofDetails = 'Replace ONLY the roof with rustic brown asphalt shingles. Rich brown architectural shingles with natural earth tone colors and dimensional texture. Do NOT change the house structure or surroundings.';
          break;
        case 'slate_blue':
          roofDetails = 'Replace ONLY the roof with slate blue asphalt shingles. Premium shingles in sophisticated blue-gray color with architectural dimensionality. Do NOT change any other home elements.';
          break;
        case 'forest_green':
          roofDetails = 'Replace ONLY the roof with forest green asphalt shingles. Deep green architectural shingles with natural color variation. Do NOT change the house or landscape features.';
          break;
        default:
          roofDetails = 'Replace ONLY the roof with asphalt shingles. Do NOT change the house structure, siding, or landscaping.';
      }
    } else if (selectedStyles.roof.includes('steel_roof')) {
      const color = selectedStyles.roof.split('_')[2] + '_' + selectedStyles.roof.split('_')[3];
      if (color === 'charcoal_black') {
        roofDetails = 'Replace ONLY the roof with charcoal black steel roofing. Modern standing seam metal roof with clean lines and durable finish. Do NOT change any other home elements or landscaping.';
      } else {
        roofDetails = 'Replace ONLY the roof with weathered gray steel roofing. Contemporary metal roof with sophisticated gray finish and standing seam design. Do NOT change the house structure or surroundings.';
      }
    } else if (selectedStyles.roof.includes('steel_shingles')) {
      roofDetails = 'Replace ONLY the roof with charcoal black steel shingles. Premium metal shingles with traditional appearance and modern durability. Do NOT change any other home or landscape features.';
    } else {
      roofDetails = 'Replace ONLY the roof with the selected roofing material. Do NOT change the house structure, siding, or landscaping.';
    }
    modifications.push(roofDetails);
  }

  if (selectedStyles.siding) {
    let sidingDetails = '';
    switch (selectedStyles.siding) {
      case 'vinyl_siding_white':
        sidingDetails = 'Replace ONLY the house siding with clean white vinyl siding. Premium quality horizontal lap siding with smooth finish and professional installation. Bright white color with proper trim. Do NOT change the roof, windows, doors, or landscaping.';
        break;
      case 'vinyl_siding_gray':
        sidingDetails = 'Replace ONLY the house siding with modern gray vinyl siding. Contemporary gray color with horizontal lap style and professional installation. Do NOT change the roof, trim, windows, or landscape elements.';
        break;
      case 'fiber_cement_beige':
        sidingDetails = 'Replace ONLY the house siding with beige fiber cement siding. High-quality cementitious siding in warm beige tone with wood-grain texture. Do NOT change the roof or other home features.';
        break;
      case 'wood_siding_natural':
        sidingDetails = 'Replace ONLY the house siding with natural wood siding. Cedar or similar wood species with natural finish and horizontal board installation. Do NOT change the roof, windows, or landscaping.';
        break;
      case 'brick_veneer_red':
        sidingDetails = 'Replace ONLY the house siding with red brick veneer. Traditional red brick with classic mortar joints and professional masonry installation. Do NOT change the roof, trim, or landscape elements.';
        break;
      default:
        sidingDetails = 'Replace ONLY the house siding with the selected siding material. Do NOT change the roof, windows, doors, or landscaping.';
    }
    modifications.push(sidingDetails);
  }

  if (selectedStyles.surpriseMe) {
    const surpriseDetails = 'Transform this home with a complementary roof and siding combination. Choose appropriate colors and materials that work well together for a beautiful exterior renovation. Maintain all windows, doors, trim, and landscaping exactly as shown.';
    modifications.push(surpriseDetails);
  }

  // Create precise prompt that emphasizes preservation
  const specificPrompt = `
PRECISE HOME EXTERIOR RENOVATION INSTRUCTIONS:

${modifications.join('\n\n')}

CRITICAL PRESERVATION RULES:
- Keep the house structure, foundation, and framing exactly the same
- Preserve all windows, doors, and architectural trim details exactly where they are
- Maintain all existing landscaping, trees, shrubs, and yard features
- Keep the driveway, walkways, and outdoor fixtures identical
- Only modify the specific roof/siding features listed above
- Maintain the original perspective, lighting, and shadows
- Keep image dimensions at 1920x1080 pixels
- The final result must look naturally integrated and professionally installed

Make ONLY the specified changes above. Do not redesign or dramatically alter the home structure or surroundings.`;

  return specificPrompt;
}

/**
 * Processes home exterior image with Gemini AI for complete editing workflow
 */
export async function processLandscapeWithGemini({
  imageBuffer,
  selectedStyles
}: {
  imageBuffer: Buffer;
  selectedStyles: {
    roof?: string;
    siding?: string;
    surpriseMe?: string;
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

    if (selectedStyles.roof && STYLE_CONFIG[selectedStyles.roof]) {
      const styleConfig = STYLE_CONFIG[selectedStyles.roof];
      console.log(`✓ Found roof style: ${styleConfig.name}`);
      modifications.push(styleConfig.prompt);
      appliedStyles.push(selectedStyles.roof);
    } else if (selectedStyles.roof) {
      console.log(`❌ Roof style not found: ${selectedStyles.roof}`);
    }

    if (selectedStyles.siding && STYLE_CONFIG[selectedStyles.siding]) {
      const styleConfig = STYLE_CONFIG[selectedStyles.siding];
      console.log(`✓ Found siding style: ${styleConfig.name}`);
      modifications.push(styleConfig.prompt);
      appliedStyles.push(selectedStyles.siding);
    } else if (selectedStyles.siding) {
      console.log(`❌ Siding style not found: ${selectedStyles.siding}`);
    }

    if (selectedStyles.surpriseMe && STYLE_CONFIG[selectedStyles.surpriseMe]) {
      const styleConfig = STYLE_CONFIG[selectedStyles.surpriseMe];
      console.log(`✓ Found surprise style: ${styleConfig.name}`);
      modifications.push(styleConfig.prompt);
      appliedStyles.push(selectedStyles.surpriseMe);
    } else if (selectedStyles.surpriseMe) {
      console.log(`❌ Surprise style not found: ${selectedStyles.surpriseMe}`);
    }

    if (modifications.length === 0) {
      console.log('❌ No valid modifications found');
      throw new Error('No valid modifications selected');
    }

    console.log(`✓ Using ${modifications.length} style prompts`);

    // Use the actual detailed prompts from style config
    const finalPrompt = `HOME EXTERIOR RENOVATION INSTRUCTIONS:

${modifications.join('\n\n')}

CRITICAL PRESERVATION RULES:
- Keep the house structure, windows, doors, and trim exactly the same
- Preserve all existing landscaping, trees, shrubs, and plants
- Maintain the exact driveway, walkways, and yard layout  
- Keep the same property layout and overall design
- Only modify the specific roof/siding features listed above
- Maintain original lighting, shadows, and perspective
- Keep image dimensions at 1920x1080 pixels
- Result must look natural and professionally installed

Apply ONLY the specified modifications above. Do not redesign or dramatically alter the home.`;

    // Step 4: Generate edited image using Gemini
    const base64Image = processedImage.buffer.toString('base64');

    console.log("🎯 GEMINI PROMPT BEING SENT:");
    console.log("=====================================");
    console.log(finalPrompt);
    console.log("=====================================");

    // Prepare content parts with original image and reference images
    const contentParts: any[] = [
      { text: finalPrompt },
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg"
        }
      }
    ];

    // Add reference images for each applied style
    for (const styleId of appliedStyles) {
      const styleConfig = STYLE_CONFIG[styleId];
      if (styleConfig.referenceImages) {
        for (const refImageUrl of styleConfig.referenceImages) {
          try {
            // If it's a local file, read it
            if (refImageUrl.startsWith('/uploads/')) {
              const fs = await import('fs');
              const path = await import('path');
              const imagePath = path.join(process.cwd(), 'public', refImageUrl);
              if (fs.existsSync(imagePath)) {
                const refImageBuffer = fs.readFileSync(imagePath);
                const refBase64 = refImageBuffer.toString('base64');
                contentParts.push({
                  text: `Reference image for ${styleConfig.name}:`
                });
                contentParts.push({
                  inlineData: {
                    data: refBase64,
                    mimeType: "image/jpeg"
                  }
                });
              }
            }
          } catch (error) {
            console.log(`Could not load reference image: ${refImageUrl}`);
          }
        }
      }
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents: [
        { 
          role: "user", 
          parts: contentParts
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
            const rawGeneratedBuffer = Buffer.from(part.inlineData.data, 'base64');
            
            // Force the generated image to match original dimensions
            const originalMetadata = await sharp(processedImage.buffer).metadata();
            const targetWidth = originalMetadata.width || 1920;
            const targetHeight = originalMetadata.height || 1080;
            
            console.log(`📐 Resizing Gemini output to match original: ${targetWidth}x${targetHeight}`);
            
            // Resize generated image to match original dimensions exactly
            generatedImageBuffer = await sharp(rawGeneratedBuffer)
              .resize(targetWidth, targetHeight, {
                fit: 'fill', // Force exact dimensions
                background: { r: 255, g: 255, b: 255, alpha: 1 } // White background if needed
              })
              .jpeg({ quality: 95 })
              .toBuffer();
              
            console.log("✓ Gemini generated and resized roofing image successfully");
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
    console.error("Gemini roofing processing error:", error);
    throw new Error(`Roofing processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Analyzes home exterior image to suggest improvement areas
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
        "Analyze this home exterior image and identify specific areas that could benefit from roof upgrades and siding improvements. Provide professional roofing and siding recommendations based on the home's architecture and style."
      ],
    });

    return response.text || "Professional exterior analysis completed";
  } catch (error) {
    console.error("Gemini image analysis error:", error);
    return "Image analysis unavailable";
  }
}