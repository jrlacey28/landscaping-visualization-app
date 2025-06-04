import OpenAI from "openai";
import sharp from "sharp";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function processImageWithSAM2AndGPT4o(
  imageBuffer: Buffer,
  selectedStyles: {
    curbing: { enabled: boolean; type: string };
    landscape: { enabled: boolean; type: string };
    patio: { enabled: boolean; type: string };
  }
) {
  try {
    // Step 1: Optimize image for faster SAM-2 processing
    const optimizedImage = await sharp(imageBuffer)
      .resize(512, 512, { fit: 'inside' })
      .png()
      .toBuffer();

    const base64Image = `data:image/png;base64,${optimizedImage.toString('base64')}`;
    
    // Step 2: Fast SAM-2 segmentation
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
          points_per_side: 16, // Reduced for speed
          pred_iou_thresh: 0.9,
          stability_score_thresh: 0.9,
          use_m2m: false // Disabled for speed
        }
      })
    });

    if (!sam2Response.ok) {
      throw new Error('SAM-2 segmentation failed');
    }

    return await sam2Response.json();

  } catch (error: any) {
    console.error('SAM-2 processing error:', error);
    throw new Error(`SAM-2 failed: ${error.message}`);
  }
}

export async function waitForSAM2Completion(predictionId: string, maxWaitTime = 30): Promise<any> {
  const startTime = Date.now();
  const maxWaitMs = maxWaitTime * 1000;

  while (Date.now() - startTime < maxWaitMs) {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to check SAM-2 status');
    }

    const result = await response.json();

    if (result.status === 'succeeded') {
      return result;
    } else if (result.status === 'failed') {
      throw new Error(`SAM-2 failed: ${result.error}`);
    }

    // Wait 1 second before next check
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error('SAM-2 timeout');
}

export async function generateImageWithGPT4o(
  originalImageBuffer: Buffer,
  maskUrl: string,
  selectedStyles: any
): Promise<string> {
  try {
    // Download mask
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

    // Generate prompt using GPT-4o
    const prompt = await generatePromptWithGPT4o(selectedStyles);

    // Use OpenAI image editing with proper file conversion
    const formData = new FormData();
    formData.append('image', new Blob([processedImage], { type: 'image/png' }), 'image.png');
    formData.append('mask', new Blob([processedMask], { type: 'image/png' }), 'mask.png');
    formData.append('prompt', prompt);
    formData.append('n', '1');
    formData.append('size', '1024x1024');

    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const result = await response.json();

    if (!result.data?.[0]?.url) {
      throw new Error('OpenAI did not return edited image');
    }

    return result.data[0].url;

  } catch (error: any) {
    console.error('GPT-4o image generation error:', error);
    throw new Error(`GPT-4o failed: ${error.message}`);
  }
}

async function generatePromptWithGPT4o(selectedStyles: any): Promise<string> {
  try {
    const modifications = [];
    
    if (selectedStyles.curbing.enabled) {
      modifications.push(`${selectedStyles.curbing.type.replace('_', ' ')}`);
    }
    
    if (selectedStyles.landscape.enabled) {
      modifications.push(`${selectedStyles.landscape.type.replace('_', ' ')}`);
    }
    
    if (selectedStyles.patio.enabled) {
      modifications.push(`${selectedStyles.patio.type.replace('_', ' ')}`);
    }

    const styleDescription = modifications.join(', ');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional landscape designer. Create detailed prompts for image editing that will produce realistic landscaping modifications within specific masked areas only."
        },
        {
          role: "user",
          content: `Create a detailed prompt for adding ${styleDescription} to the masked area of a residential landscape photo. The prompt should ensure only the masked region is modified while keeping the house, driveway, sky, and trees unchanged.`
        }
      ],
      max_completion_tokens: 150
    });

    return response.choices[0].message.content || 
      `Add ${styleDescription} to the masked area only. Do not modify any other parts of the image.`;

  } catch (error) {
    console.error('GPT-4o prompt generation error:', error);
    return `Add professional landscaping improvements to the masked area only. Keep all other elements unchanged.`;
  }
}