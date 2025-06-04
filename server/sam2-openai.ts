import OpenAI from "openai";
import sharp from "sharp";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function processImageWithSAM2AndOpenAI(
  imageBuffer: Buffer,
  selectedStyles: {
    curbing: { enabled: boolean; type: string };
    landscape: { enabled: boolean; type: string };
    patio: { enabled: boolean; type: string };
  }
) {
  try {
    // Step 1: Run SAM-2 segmentation
    const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;
    
    const sam2Response = await globalThis.fetch('https://api.replicate.com/v1/predictions', {
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

    if (!sam2Response.ok) {
      throw new Error('SAM-2 segmentation failed');
    }

    const sam2Prediction = await sam2Response.json();

    // Step 2: Wait for SAM-2 completion
    let segmentationResult = sam2Prediction;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max

    while (segmentationResult.status === 'starting' || segmentationResult.status === 'processing') {
      if (attempts >= maxAttempts) {
        throw new Error('SAM-2 segmentation timeout');
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${segmentationResult.id}`, {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
        }
      });
      
      segmentationResult = await statusResponse.json();
      attempts++;
    }

    if (segmentationResult.status !== 'succeeded' || !segmentationResult.output) {
      throw new Error('SAM-2 segmentation did not produce valid masks');
    }

    // Step 3: Process each enabled style with targeted OpenAI edits
    let currentImage = imageBuffer;
    const results = [];

    for (const [styleCategory, styleConfig] of Object.entries(selectedStyles)) {
      if (!styleConfig.enabled) continue;

      // Find appropriate mask from SAM-2 output
      const masks = segmentationResult.output.masks || [];
      if (masks.length === 0) {
        console.log(`No masks available for ${styleCategory}`);
        continue;
      }

      // Use the first available mask for now - in production, you'd implement region classification
      const maskUrl = masks[0];
      
      // Download the mask
      const maskResponse = await fetch(maskUrl);
      const maskBuffer = Buffer.from(await maskResponse.arrayBuffer());

      // Generate style-specific prompt
      const prompt = generateStylePrompt(styleCategory, styleConfig.type);

      // Step 4: Use OpenAI image editing with the mask
      const editedImageUrl = await editImageWithOpenAI(currentImage, maskBuffer, prompt);
      
      // Download the edited image for the next iteration
      const editedResponse = await fetch(editedImageUrl);
      currentImage = Buffer.from(await editedResponse.arrayBuffer());

      results.push({
        style: styleCategory,
        type: styleConfig.type,
        editedImageUrl
      });
    }

    return {
      success: true,
      originalSegments: segmentationResult.output.masks?.length || 0,
      edits: results,
      finalImageUrl: results.length > 0 ? results[results.length - 1].editedImageUrl : null
    };

  } catch (error) {
    console.error('SAM-2 + OpenAI processing error:', error);
    throw error;
  }
}

function generateStylePrompt(category: string, type: string): string {
  const prompts = {
    curbing: {
      concrete_curbing: "Add clean concrete landscape curbing along the edge only. Keep the existing landscape and structures unchanged.",
      stone_curbing: "Add natural stone landscape edging along the border only. Preserve all other elements in the image."
    },
    landscape: {
      brown_mulch: "Replace the ground cover with brown wood mulch in this area only. Do not modify surrounding elements.",
      red_mulch: "Replace the ground cover with red-tinted mulch in this specific region only. Keep everything else identical."
    },
    patio: {
      flagstone_patio: "Transform this area into a natural flagstone patio only. Leave the rest of the image completely unchanged.",
      concrete_patio: "Convert this specific area to a smooth concrete patio only. Preserve all other parts of the image."
    }
  };

  return prompts[category]?.[type] || `Modify this specific area with ${type.replace('_', ' ')} only. Do not change any other part of the image.`;
}

async function editImageWithOpenAI(imageBuffer: Buffer, maskBuffer: Buffer, prompt: string): Promise<string> {
  try {
    // Ensure images are in PNG format and proper size
    const processedImage = await sharp(imageBuffer)
      .png()
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .toBuffer();

    const processedMask = await sharp(maskBuffer)
      .png()
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .toBuffer();

    const response = await openai.images.edit({
      image: processedImage,
      mask: processedMask,
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      response_format: "url"
    });

    if (!response.data?.[0]?.url) {
      throw new Error('OpenAI did not return an edited image URL');
    }

    return response.data[0].url;

  } catch (error) {
    console.error('OpenAI image edit error:', error);
    throw new Error(`OpenAI image editing failed: ${error.message}`);
  }
}