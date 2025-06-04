import OpenAI from "openai";
import sharp from "sharp";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function processWithOpenAIOnly(
  imageBuffer: Buffer,
  selectedStyles: any,
  maskData?: string
): Promise<string> {
  try {
    // Generate prompt based on selected styles
    let prompt = "Transform this landscape image with professional improvements: ";
    
    if (selectedStyles.curbing && selectedStyles.curbing !== '') {
      prompt += `Add ${selectedStyles.curbing.replace('_', ' ')} around landscape edges. `;
    }
    if (selectedStyles.landscape && selectedStyles.landscape !== '') {
      prompt += `Replace ground cover with ${selectedStyles.landscape.replace('_', ' ')}. `;
    }
    if (selectedStyles.patio && selectedStyles.patio !== '') {
      prompt += `Add ${selectedStyles.patio.replace('_', ' ')} hardscape area. `;
    }
    
    prompt += "Keep the house, driveway, sky, and trees exactly the same. Only modify the landscaping elements. Create a realistic, professional result.";

    if (maskData) {
      // Use OpenAI image editing with mask
      const processedImage = await sharp(imageBuffer)
        .resize(1024, 1024, { fit: 'inside' })
        .png()
        .toBuffer();

      const maskBuffer = Buffer.from(maskData.split(',')[1], 'base64');
      const processedMask = await sharp(maskBuffer)
        .resize(1024, 1024, { fit: 'inside' })
        .png()
        .toBuffer();

      // Use fetch API directly with FormData for proper Buffer handling
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
    } else {
      // Use OpenAI image generation
      const response = await openai.images.generate({
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard"
      });

      if (!response.data?.[0]?.url) {
        throw new Error('OpenAI did not return generated image');
      }

      return response.data[0].url;
    }

  } catch (error: any) {
    console.error('OpenAI processing error:', error);
    throw new Error(`Image processing failed: ${error.message}`);
  }
}