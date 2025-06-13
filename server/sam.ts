import Replicate from "replicate";
import { getStyleForRegion, StyleConfig } from "./style-config";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_TOKEN || "",
});

export async function runSAM2(imageUrl: string) {
  try {
    const prediction = await replicate.predictions.create({
      version: "fb8b0a8fec9eb8d7e70c0cb0c355e02f0fdb4a3cd6a0d7c06ec8a08d6d4b3b3e",
      input: {
        image: imageUrl
      }
    });

    return prediction;
  } catch (error) {
    console.error("SAM 2 API error:", error);
    throw error;
  }
}

export async function runStyleBasedInpainting(
  imageUrl: string,
  maskUrl: string,
  regionType: 'edge' | 'central' | 'hardscape' | 'lawn',
  preferredStyleId?: string
) {
  try {
    const style = getStyleForRegion(regionType, preferredStyleId);
    
    // Use direct API call to match working patterns in codebase
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: "95b7223104132402a9ae91cc677285bc5eb997834bd2349fa486f53910fd68b3",
        input: {
          image: imageUrl,
          mask: maskUrl,
          prompt: style.prompt,
          negative_prompt: "blurry, low quality, distorted, unrealistic, artificial",
          num_inference_steps: 30,
          guidance_scale: 7.5,
          strength: 0.8
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Inpainting API error:', errorText);
      throw new Error(`Inpainting API error: ${errorText}`);
    }

    const prediction = await response.json();

    return {
      prediction,
      appliedStyle: style
    };
  } catch (error) {
    console.error("Style-based inpainting error:", error);
    throw error;
  }
}