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
    
    const prediction = await replicate.predictions.create({
      model: "stability-ai/stable-diffusion-xl-inpainting",
      input: {
        image: imageUrl,
        mask: maskUrl,
        prompt: style.prompt,
        reference_image: style.referenceImageUrl,
        negative_prompt: "blurry, low quality, distorted, unrealistic, artificial",
        num_inference_steps: 30,
        guidance_scale: 7.5,
        strength: 0.8
      }
    });

    return {
      prediction,
      appliedStyle: style
    };
  } catch (error) {
    console.error("Style-based inpainting error:", error);
    throw error;
  }
}