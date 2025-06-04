import OpenAI from "openai";
import sharp from "sharp";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function createTargetedEdit(
  originalImageBuffer: Buffer,
  maskBuffer: Buffer,
  styleType: string,
  category: string
): Promise<string> {
  try {
    // Prepare images for OpenAI
    const processedImage = await sharp(originalImageBuffer)
      .png()
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .toBuffer();

    const processedMask = await sharp(maskBuffer)
      .png()
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .toBuffer();

    // Generate targeted prompt
    const prompt = generateTargetedPrompt(category, styleType);

    // Use OpenAI image editing
    const response = await openai.images.edit({
      image: processedImage,
      mask: processedMask,
      prompt: prompt,
      n: 1,
      size: "1024x1024"
    });

    if (!response.data?.[0]?.url) {
      throw new Error('OpenAI did not return an edited image');
    }

    return response.data[0].url;

  } catch (error: any) {
    console.error('OpenAI edit error:', error);
    throw new Error(`Image editing failed: ${error.message}`);
  }
}

function generateTargetedPrompt(category: string, styleType: string): string {
  const prompts: Record<string, Record<string, string>> = {
    curbing: {
      concrete_curbing: "Add clean concrete landscape curbing in this specific area only. Keep all other parts of the image unchanged.",
      stone_curbing: "Add natural stone landscape edging in this area only. Do not modify anything else in the image."
    },
    landscape: {
      brown_mulch: "Replace the ground cover with brown wood mulch in this masked area only. Preserve everything else.",
      red_mulch: "Replace with red-tinted mulch in this specific region only. Leave the rest identical."
    },
    patio: {
      flagstone_patio: "Convert this masked area to flagstone patio only. Keep all surrounding elements unchanged.",
      concrete_patio: "Transform this specific area into concrete patio only. Do not alter other parts."
    }
  };

  return prompts[category]?.[styleType] || 
    `Modify this specific masked area with ${styleType.replace('_', ' ')} only. Do not change any other part of the image.`;
}