import OpenAI from "openai";
import { getStyleForRegion, StyleConfig } from "./style-config";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface TargetedEditRequest {
  imageUrl: string;
  maskUrl: string;
  feature: 'curbing' | 'mulch' | 'patio';
  specificStyle?: string;
}

interface SAM2Region {
  mask: string;
  confidence: number;
  area: number;
  regionType: 'edge' | 'central' | 'hardscape' | 'lawn';
}

// Feature-specific prompts for precise edits
const FEATURE_PROMPTS = {
  curbing: {
    prompt: "Add professional landscape curbing to the masked edge areas only. Use clean concrete or natural stone edging that follows the existing landscape bed borders. Preserve all other elements including house, driveway, plants, and background completely unchanged.",
    regionType: 'edge' as const
  },
  mulch: {
    prompt: "Replace the existing ground cover in the masked areas with premium mulch. Use natural brown wood mulch or decorative stone that complements the landscape. Keep all plants, structures, and surrounding areas exactly as they are.",
    regionType: 'central' as const
  },
  patio: {
    prompt: "Transform the masked area into an elegant patio using flagstone, concrete, or pavers. Create a natural outdoor living space that fits the existing landscape. Do not modify the house, surrounding lawn, or any other elements.",
    regionType: 'hardscape' as const
  }
};

export async function analyzeRegionsForFeature(
  imageUrl: string, 
  feature: 'curbing' | 'mulch' | 'patio'
): Promise<SAM2Region[]> {
  try {
    // Download image for SAM-2 processing
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }
    
    const imageBuffer = await response.arrayBuffer();
    const base64Image = `data:image/png;base64,${Buffer.from(imageBuffer).toString('base64')}`;

    // Call SAM-2 with feature-specific parameters
    const sam2Response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: "fe97b453a6455861e3bac769b441ca1f1086110da7466dbb65cf1eecfd60dc83",
        input: {
          image: base64Image,
          points_per_side: feature === 'curbing' ? 64 : 32, // Higher resolution for edge detection
          pred_iou_thresh: feature === 'curbing' ? 0.95 : 0.88, // Higher threshold for curbing
          stability_score_thresh: 0.95,
          use_m2m: true
        }
      })
    });

    if (!sam2Response.ok) {
      throw new Error(`SAM-2 API error: ${sam2Response.status}`);
    }

    const prediction = await sam2Response.json();
    
    // Poll for completion
    let result = prediction;
    while (result.status === 'starting' || result.status === 'processing') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
        }
      });
      
      if (!statusResponse.ok) {
        throw new Error(`Status check failed: ${statusResponse.status}`);
      }
      
      result = await statusResponse.json();
    }

    if (result.status !== 'succeeded' || !result.output) {
      throw new Error('SAM-2 segmentation failed');
    }

    // Filter and classify regions based on feature type
    return classifyRegionsForFeature(result.output, feature);
    
  } catch (error) {
    console.error(`SAM-2 analysis error for ${feature}:`, error);
    throw error;
  }
}

function classifyRegionsForFeature(
  sam2Output: any, 
  feature: 'curbing' | 'mulch' | 'patio'
): SAM2Region[] {
  if (!sam2Output || !sam2Output.masks) {
    return [];
  }

  const regions: SAM2Region[] = [];
  
  sam2Output.masks.forEach((mask: any, index: number) => {
    const area = calculateMaskArea(mask);
    const confidence = mask.stability_score || 0.8;
    
    // Feature-specific filtering
    let isRelevant = false;
    let regionType: SAM2Region['regionType'] = 'central';
    
    switch (feature) {
      case 'curbing':
        // Look for edge regions - thin, linear shapes
        isRelevant = isEdgeRegion(mask, area);
        regionType = 'edge';
        break;
      case 'mulch':
        // Look for central landscaped areas
        isRelevant = isCentralRegion(mask, area);
        regionType = 'central';
        break;
      case 'patio':
        // Look for potential hardscape areas
        isRelevant = isHardscapeRegion(mask, area);
        regionType = 'hardscape';
        break;
    }
    
    if (isRelevant && confidence > 0.7) {
      regions.push({
        mask: mask.url || mask,
        confidence,
        area,
        regionType
      });
    }
  });
  
  // Sort by confidence and area relevance
  return regions.sort((a, b) => (b.confidence * b.area) - (a.confidence * a.area));
}

function calculateMaskArea(mask: any): number {
  // Estimate area based on mask dimensions or pixel count
  return mask.area || 1000; // Fallback value
}

function isEdgeRegion(mask: any, area: number): boolean {
  // Check if mask represents an edge/border region
  // This would analyze the mask shape for linear, boundary-like characteristics
  return area > 100 && area < 5000; // Typical edge region size
}

function isCentralRegion(mask: any, area: number): boolean {
  // Check if mask represents a central landscaped area
  return area > 500 && area < 20000; // Typical mulch/plant bed size
}

function isHardscapeRegion(mask: any, area: number): boolean {
  // Check if mask represents a potential patio/hardscape area
  return area > 1000 && area < 50000; // Typical patio size
}

export async function applyTargetedEdit(request: TargetedEditRequest): Promise<string> {
  try {
    const featureConfig = FEATURE_PROMPTS[request.feature];
    
    // Get style-specific enhancement if provided
    let enhancedPrompt = featureConfig.prompt;
    if (request.specificStyle) {
      const styleConfig = getStyleForRegion(featureConfig.regionType, request.specificStyle);
      enhancedPrompt = `${featureConfig.prompt} Use this specific style: ${styleConfig.prompt}`;
    }

    // Use GPT-4o vision to understand the image and apply targeted edits
    const visionAnalysis = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this landscape image and the provided mask. The mask indicates the specific area to modify. ${enhancedPrompt} Provide detailed instructions for the edit.`
            },
            {
              type: "image_url",
              image_url: { url: request.imageUrl }
            }
          ]
        }
      ],
      max_completion_tokens: 300
    });

    const analysisResult = visionAnalysis.choices[0].message.content;
    
    // Download images for OpenAI edit API
    const [imageResponse, maskResponse] = await Promise.all([
      fetch(request.imageUrl),
      fetch(request.maskUrl)
    ]);

    if (!imageResponse.ok || !maskResponse.ok) {
      throw new Error('Failed to download images for editing');
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const maskBuffer = await maskResponse.arrayBuffer();

    // Convert buffers to File objects for OpenAI API
    const imageFile = new File([imageBuffer], "image.png", { type: "image/png" });
    const maskFile = new File([maskBuffer], "mask.png", { type: "image/png" });

    // Apply the edit using OpenAI's image editing API
    const editResponse = await openai.images.edit({
      image: imageFile,
      mask: maskFile,
      prompt: `${enhancedPrompt} Based on this analysis: ${analysisResult}`,
      n: 1,
      size: "1024x1024",
      response_format: "url"
    });

    if (!editResponse.data || editResponse.data.length === 0) {
      throw new Error('No edited image returned from OpenAI');
    }

    return editResponse.data[0].url!;
    
  } catch (error: any) {
    console.error('Targeted edit error:', error);
    throw new Error(`Failed to apply ${request.feature} edit: ${error?.message || 'Unknown error'}`);
  }
}

export async function processFeatureRequest(
  imageUrl: string,
  feature: 'curbing' | 'mulch' | 'patio',
  specificStyle?: string
): Promise<{ success: boolean; editedImageUrl?: string; error?: string }> {
  try {
    // Step 1: Analyze regions for the specific feature
    console.log(`Analyzing regions for ${feature}...`);
    const regions = await analyzeRegionsForFeature(imageUrl, feature);
    
    if (regions.length === 0) {
      return {
        success: false,
        error: `No suitable ${feature} regions detected in the image. Please try manual selection.`
      };
    }

    // Step 2: Use the best region for editing
    const bestRegion = regions[0];
    console.log(`Found ${regions.length} regions, using best match with confidence ${bestRegion.confidence}`);
    
    // Step 3: Apply targeted edit
    const editedImageUrl = await applyTargetedEdit({
      imageUrl,
      maskUrl: bestRegion.mask,
      feature,
      specificStyle
    });

    return {
      success: true,
      editedImageUrl
    };
    
  } catch (error: any) {
    console.error(`Feature processing error for ${feature}:`, error);
    return {
      success: false,
      error: error?.message || 'Unknown error'
    };
  }
}