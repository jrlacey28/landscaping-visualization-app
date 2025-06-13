import OpenAI from "openai";

// the newest OpenAI model is "o3-mini" which was released December 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateLandscapePrompt(
  selectedStyles: {
    curbing: string;
    landscape: string; 
    patio: string;
  }
): Promise<string> {
  const styleDescriptions = [];
  
  if (selectedStyles.curbing) {
    styleDescriptions.push(`decorative curbing with ${selectedStyles.curbing.replace('-', ' ')}`);
  }
  
  if (selectedStyles.landscape) {
    styleDescriptions.push(`landscape features with ${selectedStyles.landscape.replace('-', ' ')}`);
  }
  
  if (selectedStyles.patio) {
    styleDescriptions.push(`patio area with ${selectedStyles.patio.replace('-', ' ')}`);
  }

  const prompt = `
    Generate a detailed, professional landscape design prompt for AI image generation. 
    The design should include: ${styleDescriptions.join(', ')}.
    
    Create a comprehensive description that includes:
    - Professional landscaping terminology
    - Specific materials and textures
    - Color schemes and visual harmony
    - Realistic proportions and placement
    - High-quality finish details
    
    The result should be suitable for AI image generation and create a beautiful, realistic landscape transformation.
    
    Return only the image generation prompt, no additional text.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "o3-mini", // the newest OpenAI model is "o3-mini" which was released December 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a professional landscape architect creating detailed prompts for AI image generation. Focus on realistic, high-quality landscape designs."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 500,
    });

    return response.choices[0].message.content || "Professional landscape design with selected features";
  } catch (error) {
    console.error("OpenAI API error:", error);
    // Fallback to basic prompt
    return `Professional landscape design featuring ${styleDescriptions.join(', ')}, high quality, realistic, beautiful outdoor space`;
  }
}

export async function analyzeImage(base64Image: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "o3-mini", // the newest OpenAI model is "o3-mini" which was released December 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this landscape image and describe the current features, potential improvement areas, and suggest professional landscaping enhancements."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      max_tokens: 300,
    });

    return response.choices[0].message.content || "Professional landscape analysis completed";
  } catch (error) {
    console.error("OpenAI vision API error:", error);
    return "Image analysis unavailable";
  }
}