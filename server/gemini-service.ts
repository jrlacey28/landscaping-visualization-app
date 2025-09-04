import * as fs from "fs";
import { GoogleGenAI, Modality } from "@google/genai";
import sharp from "sharp";

// Initialize Gemini AI client
const getGeminiApiKey = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  
  if (apiKey && apiKey.trim()) {
    console.log("✓ Found Gemini API key");
    return apiKey.trim();
  }
  
  console.log("⚠️ No Gemini API key found - will be checked when needed");
  return "";
};

const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });

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
    // Check API key at runtime
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || !apiKey.trim()) {
      throw new Error("GEMINI_API_KEY not found in secrets. Please add your Google Gemini API key to the Secrets tool.");
    }
    // Step 1: Process and resize image
    const processedImage = await processImageSize(imageBuffer);

    // Step 2: Generate tailored prompt using style config
    // Import style config to get proper prompts
    const { getStyleConfig } = await import('./style-config');

    // Build prompt based on selected styles using actual style config
    const modifications: string[] = [];
    const appliedStyles: string[] = [];

    console.log('🔍 PROCESSING STYLES:', selectedStyles);

    if (selectedStyles.roof) {
      try {
        const styleConfig = getStyleConfig(selectedStyles.roof);
        console.log(`✓ Found roof style: ${styleConfig.name}`);
        modifications.push(styleConfig.prompt);
        appliedStyles.push(selectedStyles.roof);
      } catch (error) {
        console.log(`❌ Roof style not found: ${selectedStyles.roof}`);
      }
    }

    if (selectedStyles.siding) {
      try {
        const styleConfig = getStyleConfig(selectedStyles.siding);
        console.log(`✓ Found siding style: ${styleConfig.name}`);
        modifications.push(styleConfig.prompt);
        appliedStyles.push(selectedStyles.siding);
      } catch (error) {
        console.log(`❌ Siding style not found: ${selectedStyles.siding}`);
      }
    }

    if (selectedStyles.surpriseMe) {
      try {
        const styleConfig = getStyleConfig(selectedStyles.surpriseMe);
        console.log(`✓ Found surprise style: ${styleConfig.name}`);
        modifications.push(styleConfig.prompt);
        appliedStyles.push(selectedStyles.surpriseMe);
      } catch (error) {
        console.log(`❌ Surprise style not found: ${selectedStyles.surpriseMe}`);
      }
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
      const styleConfig = getStyleConfig(styleId);
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
 * Processes pool visualization requests - completely separate from roofing/siding
 */
export async function processPoolWithGemini({
  imageBuffer,
  selectedStyles
}: {
  imageBuffer: Buffer;
  selectedStyles: Record<string, any>;
}): Promise<{
  editedImageBuffer: Buffer;
  appliedStyles: string[];
  prompt: string;
}> {
  try {
    // Check API key at runtime
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || !apiKey.trim()) {
      throw new Error("GEMINI_API_KEY not found in secrets. Please add your Google Gemini API key to the Secrets tool.");
    }

    // Step 1: Process and resize image
    const processedImage = await processImageSize(imageBuffer);

    // Step 2: Generate pool-specific prompt using POOL style config
    const { POOL_STYLE_CONFIG } = await import('./pool-style-config');

    // Build prompt based on selected pool styles
    const modifications: string[] = [];
    const appliedStyles: string[] = [];

    console.log('🏊 PROCESSING POOL STYLES:', selectedStyles);

    // Process each selected pool style
    Object.keys(selectedStyles).forEach(styleKey => {
      const styleConfig = selectedStyles[styleKey];
      if (styleConfig && styleConfig.prompt) {
        console.log(`✓ Found pool style: ${styleConfig.name || styleKey}`);
        modifications.push(styleConfig.prompt);
        appliedStyles.push(styleKey);
      } else if (selectedStyles[styleKey]) {
        console.log(`❌ Pool style not found: ${styleKey}`);
      }
    });

    if (modifications.length === 0) {
      console.log('❌ No valid pool modifications found');
      throw new Error('No valid pool modifications selected');
    }

    console.log(`✓ Using ${modifications.length} pool style prompts`);

    // Pool-specific final prompt
    const finalPrompt = `POOL INSTALLATION INSTRUCTIONS:

${modifications.join('\n\n')}

CRITICAL PRESERVATION RULES:
- Keep the house structure, windows, doors, and all architecture exactly the same
- Preserve all existing non-pool landscaping, trees, shrubs, and plants
- Maintain the exact driveway, walkways, and existing hardscaping
- Keep the same property layout and overall yard design
- Only add the pool and related features as specified above
- Maintain original lighting, shadows, and perspective
- Keep image dimensions at 1920x1080 pixels
- Result must look natural and professionally installed
- Pool should fit harmoniously in the available yard space

Apply ONLY the pool installations specified above. Do not redesign the yard or dramatically alter existing features.`;

    // Step 3: Generate edited image using Gemini
    const base64Image = processedImage.buffer.toString('base64');

    console.log("🏊 POOL GEMINI PROMPT BEING SENT:");
    console.log("=====================================");
    console.log(finalPrompt);
    console.log("=====================================");

    const contentParts: any[] = [
      { text: finalPrompt },
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg"
        }
      }
    ];

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
            
            console.log(`🏊 Resizing pool image to match original: ${targetWidth}x${targetHeight}`);
            
            // Resize generated image to match original dimensions exactly
            generatedImageBuffer = await sharp(rawGeneratedBuffer)
              .resize(targetWidth, targetHeight, {
                fit: 'fill', // Force exact dimensions
                background: { r: 255, g: 255, b: 255, alpha: 1 } // White background if needed
              })
              .jpeg({ quality: 95 })
              .toBuffer();
              
            console.log("✓ Gemini generated and resized pool image successfully");
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
    console.error("Gemini pool processing error:", error);
    throw new Error(`Pool processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

/**
 * Processes landscape visualization requests - curbing, landscape materials, and patios
 */
export async function processLandscapeVisualizationWithGemini({
  imageBuffer,
  selectedStyles
}: {
  imageBuffer: Buffer;
  selectedStyles: {
    curbing?: string;
    landscape?: string;
    patios?: string;
  };
}): Promise<{
  editedImageBuffer: Buffer;
  appliedStyles: string[];
  prompt: string;
}> {
  try {
    // Check API key at runtime
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || !apiKey.trim()) {
      throw new Error("GEMINI_API_KEY not found in secrets. Please add your Google Gemini API key to the Secrets tool.");
    }

    // Step 1: Process and resize image
    const processedImage = await processImageSize(imageBuffer);

    // Step 2: Generate landscape-specific prompt using landscape style config
    const { LANDSCAPE_STYLE_CONFIG } = await import("./landscape-style-config");

    // Build prompt based on selected landscape styles
    const modifications: string[] = [];
    const appliedStyles: string[] = [];

    console.log("🌿 PROCESSING LANDSCAPE STYLES:", selectedStyles);

    if (selectedStyles.curbing) {
      try {
        const styleConfig = LANDSCAPE_STYLE_CONFIG[selectedStyles.curbing];
        if (styleConfig) {
          console.log(`✓ Found curbing style: ${styleConfig.name}`);
          modifications.push(styleConfig.prompt);
          appliedStyles.push(selectedStyles.curbing);
        }
      } catch (error) {
        console.log(`❌ Curbing style not found: ${selectedStyles.curbing}`);
      }
    }

    if (selectedStyles.landscape) {
      try {
        const styleConfig = LANDSCAPE_STYLE_CONFIG[selectedStyles.landscape];
        if (styleConfig) {
          console.log(`✓ Found landscape style: ${styleConfig.name}`);
          modifications.push(styleConfig.prompt);
          appliedStyles.push(selectedStyles.landscape);
        }
      } catch (error) {
        console.log(`❌ Landscape style not found: ${selectedStyles.landscape}`);
      }
    }

    if (selectedStyles.patios) {
      try {
        // Handle new patio spec format: "style|shape|size"
        const patioSpec = selectedStyles.patios;
        let styleConfig;
        let shape = 'rectangular';
        let size = 'medium';
        
        if (patioSpec.includes('|')) {
          // Parse combined specification
          const [styleId, shapeSpec, sizeSpec] = patioSpec.split('|');
          shape = shapeSpec || 'rectangular';
          size = sizeSpec || 'medium';
          styleConfig = LANDSCAPE_STYLE_CONFIG[styleId];
        } else {
          // Legacy single ID format
          styleConfig = LANDSCAPE_STYLE_CONFIG[patioSpec];
        }
        
        if (styleConfig) {
          console.log(`✓ Found patio style: ${styleConfig.name} (${shape}, ${size})`);
          
          // Modify the prompt to include shape and size specifications
          let enhancedPrompt = styleConfig.prompt;
          
          // Add shape specifications
          if (shape === 'curved') {
            enhancedPrompt = enhancedPrompt.replace(
              'in an appropriate area of the yard',
              `in an appropriate area of the yard. Design with flowing curved edges and organic shapes`
            );
          } else if (shape === 'circular') {
            enhancedPrompt = enhancedPrompt.replace(
              'in an appropriate area of the yard',
              `in an appropriate area of the yard. Create a perfect circular design`
            );
          } else if (shape === 'l_shaped') {
            enhancedPrompt = enhancedPrompt.replace(
              'in an appropriate area of the yard',
              `in an appropriate area of the yard. Design in an L-shaped configuration to maximize corner space`
            );
          } else if (shape === 'rectangular') {
            enhancedPrompt = enhancedPrompt.replace(
              'in an appropriate area of the yard',
              `in an appropriate area of the yard. Create clean rectangular design with straight edges`
            );
          }
          
          // Add size specifications
          if (size === 'small') {
            enhancedPrompt = enhancedPrompt.replace(
              'patio',
              'small patio (approximately 10x12 feet)'
            );
          } else if (size === 'large') {
            enhancedPrompt = enhancedPrompt.replace(
              'patio',
              'large patio (approximately 20x24 feet)'
            );
          } else {
            enhancedPrompt = enhancedPrompt.replace(
              'patio',
              'medium patio (approximately 15x18 feet)'
            );
          }
          
          modifications.push(enhancedPrompt);
          appliedStyles.push(patioSpec);
        }
      } catch (error) {
        console.log(`❌ Patio style not found: ${selectedStyles.patios}`);
      }
    }

    if (modifications.length === 0) {
      console.log("❌ No valid landscape modifications found");
      throw new Error("No valid landscape modifications selected");
    }

    console.log(`✓ Using ${modifications.length} landscape style prompts`);

    // Landscape-specific final prompt
    const finalPrompt = `LANDSCAPE TRANSFORMATION INSTRUCTIONS:

${modifications.join("\n\n")}

CRITICAL PRESERVATION RULES:
- Keep the house structure, windows, doors, and all architecture exactly the same
- Preserve all existing trees, large shrubs, and established landscaping not being modified
- Maintain the exact driveway, walkways, and existing hardscaping unless adding patios
- Keep the same property layout and overall yard design
- Only add or modify the specific landscape features listed above
- Maintain original lighting, shadows, and perspective
- Keep image dimensions at 1920x1080 pixels
- Result must look natural and professionally installed
- Landscape changes should enhance the existing property

Apply ONLY the landscape modifications specified above. Do not redesign the entire yard or dramatically alter existing features.`;

    // Step 3: Generate edited image using Gemini
    const base64Image = processedImage.buffer.toString("base64");

    console.log("🌿 LANDSCAPE GEMINI PROMPT BEING SENT:");
    console.log("=====================================");
    console.log(finalPrompt);
    console.log("=====================================");

    const contentParts: any[] = [
      { text: finalPrompt },
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg"
        }
      }
    ];

    // Add retry logic for Gemini API failures
    let response;
    let lastError;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🌿 Gemini API attempt ${attempt}/${maxRetries}`);
        
        response = await ai.models.generateContent({
          model: "gemini-2.0-flash-exp",
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
        
        console.log(`✓ Gemini API succeeded on attempt ${attempt}`);
        break; // Success, exit retry loop
        
      } catch (error: any) {
        lastError = error;
        console.log(`❌ Gemini API attempt ${attempt} failed:`, error.message || error);
        
        if (attempt === maxRetries) {
          console.log(`❌ All ${maxRetries} Gemini API attempts failed`);
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Ensure response exists after retry logic
    if (!response) {
      throw new Error("Failed to get response from Gemini API after all retries");
    }

    // Extract the generated image from Gemini response
    let generatedImageBuffer = processedImage.buffer; // fallback to original

    if (response.candidates && response.candidates.length > 0) {
      const content = response.candidates[0].content;
      if (content && content.parts) {
        for (const part of content.parts) {
          if (part.inlineData && part.inlineData.data) {
            // Convert base64 to buffer for the generated image
            const rawGeneratedBuffer = Buffer.from(part.inlineData.data, "base64");
            
            // Force the generated image to match original dimensions
            const originalMetadata = await sharp(processedImage.buffer).metadata();
            const targetWidth = originalMetadata.width || 1920;
            const targetHeight = originalMetadata.height || 1080;
            
            console.log(`🌿 Resizing landscape image to match original: ${targetWidth}x${targetHeight}`);
            
            // Resize generated image to match original dimensions exactly
            generatedImageBuffer = await sharp(rawGeneratedBuffer)
              .resize(targetWidth, targetHeight, { 
                fit: "fill",
                withoutEnlargement: false 
              })
              .jpeg({ quality: 85 })
              .toBuffer();
            
            console.log("✓ Gemini generated and resized landscape image successfully");
            break;
          }
        }
      }
    }

    return {
      editedImageBuffer: generatedImageBuffer,
      appliedStyles: appliedStyles,
      prompt: finalPrompt
    };

  } catch (error) {
    console.error("Gemini landscape processing error:", error);
    throw new Error(`Landscape processing failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
