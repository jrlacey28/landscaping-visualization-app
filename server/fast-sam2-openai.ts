import OpenAI from "openai";
import sharp from "sharp";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function processFastSAM2(imageBuffer: Buffer, selectedStyles: any) {
  try {
    // Optimize image size for faster SAM-2 processing
    const optimizedImage = await sharp(imageBuffer)
      .resize(512, 512, { fit: 'inside' }) // Smaller size for faster processing
      .png()
      .toBuffer();

    const base64Image = `data:image/png;base64,${optimizedImage.toString('base64')}`;
    
    // Fast SAM-2 segmentation with optimized parameters
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
          points_per_side: 16, // Reduced from 32 for speed
          pred_iou_thresh: 0.9, // Higher threshold for fewer, better segments
          stability_score_thresh: 0.9, // Higher threshold for speed
          use_m2m: false // Disabled for speed
        }
      })
    });

    if (!sam2Response.ok) {
      throw new Error('SAM-2 segmentation failed');
    }

    return await sam2Response.json();

  } catch (error: any) {
    console.error('Fast SAM-2 error:', error);
    throw new Error(`SAM-2 processing failed: ${error.message}`);
  }
}

export async function applyOpenAIEdit(
  originalImageBuffer: Buffer,
  maskUrl: string,
  selectedStyles: any
): Promise<string> {
  try {
    // Download mask from URL
    const maskResponse = await fetch(maskUrl);
    const maskBuffer = Buffer.from(await maskResponse.arrayBuffer());

    // Prepare images for OpenAI
    const processedImage = await sharp(originalImageBuffer)
      .resize(1024, 1024, { fit: 'inside' })
      .png()
      .toBuffer();

    const processedMask = await sharp(maskBuffer)
      .resize(1024, 1024, { fit: 'inside' })
      .png()
      .toBuffer();

    // Generate targeted prompt for selected styles
    const prompt = generateEditPrompt(selectedStyles);

    // Use OpenAI image editing API
    const response = await openai.images.edit({
      image: processedImage,
      mask: processedMask,
      prompt: prompt,
      n: 1,
      size: "1024x1024"
    });

    if (!response.data?.[0]?.url) {
      throw new Error('OpenAI did not return edited image');
    }

    return response.data[0].url;

  } catch (error: any) {
    console.error('OpenAI edit error:', error);
    throw new Error(`Image editing failed: ${error.message}`);
  }
}

function generateEditPrompt(selectedStyles: any): string {
  const modifications = [];
  
  if (selectedStyles.curbing.enabled) {
    const type = selectedStyles.curbing.type.replace('_', ' ');
    modifications.push(`Add ${type} in this masked area only`);
  }
  
  if (selectedStyles.landscape.enabled) {
    const type = selectedStyles.landscape.type.replace('_', ' ');
    modifications.push(`Replace with ${type} in this region only`);
  }
  
  if (selectedStyles.patio.enabled) {
    const type = selectedStyles.patio.type.replace('_', ' ');
    modifications.push(`Create ${type} in this specific area only`);
  }

  const basePrompt = modifications.join(', ');
  return `${basePrompt}. Do not modify any other parts of the image. Keep the house, driveway, sky, and trees exactly the same.`;
}