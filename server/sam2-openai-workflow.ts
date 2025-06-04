import { processWithOpenAIOnly } from "./openai-only";

export interface SAM2Response {
  id: string;
  status: string;
  output?: {
    masks: string[];
    scores: number[];
  };
}

export async function runSAM2Segmentation(imageBuffer: Buffer): Promise<SAM2Response> {
  const base64Image = imageBuffer.toString('base64');

  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: "fe97b453a6455861e3bac769b441ca1f1086110da7466dbb65cf1eecfd60dc83",
      input: {
        image: `data:image/jpeg;base64,${base64Image}`,
        point_coords: "[[512,512]]",
        point_labels: "[1]", 
        multimask_output: true,
        return_logits: false,
        normalize_coords: true
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SAM-2 API error: ${errorText}`);
  }

  return await response.json();
}

export async function checkSAM2Status(predictionId: string): Promise<SAM2Response> {
  const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
    headers: {
      'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to check SAM-2 status');
  }

  return await response.json();
}

export async function processImageWithSAM2AndOpenAI(
  imageBuffer: Buffer,
  selectedStyles: any,
  maskUrl?: string
): Promise<{ segmentationId: string; generatedImageUrl?: string }> {
  
  // Step 1: Run SAM-2 segmentation
  const sam2Response = await runSAM2Segmentation(imageBuffer);
  
  if (sam2Response.status === 'succeeded' && sam2Response.output?.masks?.[0]) {
    // Step 2: Use the best mask with OpenAI for final generation
    const maskData = sam2Response.output.masks[0];
    const generatedImageUrl = await processWithOpenAIOnly(imageBuffer, selectedStyles, maskData);
    
    return {
      segmentationId: sam2Response.id,
      generatedImageUrl: generatedImageUrl
    };
  }
  
  return {
    segmentationId: sam2Response.id
  };
}