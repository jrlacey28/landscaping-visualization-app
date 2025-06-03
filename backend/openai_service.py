import openai
import os
import base64
import requests
from PIL import Image
import io
from typing import Dict, Any, Optional

# Initialize OpenAI client
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def generate_landscape_prompt(selected_styles: Dict[str, Any]) -> str:
    """Generate a detailed landscape prompt based on selected styles."""
    style_descriptions = []
    
    if selected_styles.get("curbing", {}).get("enabled"):
        curbing_type = selected_styles["curbing"].get("type", "concrete_curbing")
        if curbing_type == "concrete_curbing":
            style_descriptions.append("professional concrete landscape curbing with clean edges")
        elif curbing_type == "stone_curbing":
            style_descriptions.append("natural stone landscape edging with earth tones")
    
    if selected_styles.get("landscape", {}).get("enabled"):
        landscape_type = selected_styles["landscape"].get("type", "brown_mulch")
        if landscape_type == "brown_mulch":
            style_descriptions.append("brown wood mulch ground cover with organic texture")
        elif landscape_type == "red_mulch":
            style_descriptions.append("red-tinted wood mulch landscaping material")
    
    if selected_styles.get("patio", {}).get("enabled"):
        patio_type = selected_styles["patio"].get("type", "flagstone_patio")
        if patio_type == "flagstone_patio":
            style_descriptions.append("natural flagstone patio with irregular stone pattern")
        elif patio_type == "concrete_patio":
            style_descriptions.append("smooth concrete patio with modern clean lines")
    
    if not style_descriptions:
        return "Professional landscape design, high quality, realistic, beautiful outdoor space"
    
    # Use OpenAI to enhance the prompt
    try:
        prompt = f"Create a detailed, professional landscape design prompt featuring: {', '.join(style_descriptions)}. Make it suitable for AI image generation."
        
        response = client.chat.completions.create(
            model="gpt-4o",  # the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
            messages=[
                {
                    "role": "system",
                    "content": "You are a professional landscape designer. Create detailed prompts for AI image generation that will produce realistic, high-quality landscape designs."
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            max_completion_tokens=500,
            temperature=0.7,
        )
        
        return response.choices[0].message.content or f"Professional landscape design featuring {', '.join(style_descriptions)}, high quality, realistic, beautiful outdoor space"
    except Exception as e:
        print(f"OpenAI prompt generation error: {e}")
        return f"Professional landscape design featuring {', '.join(style_descriptions)}, high quality, realistic, beautiful outdoor space"

async def edit_image_with_mask(
    image_url: str,
    mask_data: str,
    prompt: str
) -> Dict[str, Any]:
    """Edit an image using OpenAI's image editing API with a mask."""
    try:
        # Download the original image
        response = requests.get(image_url)
        if response.status_code != 200:
            raise Exception(f"Failed to download image: {response.status_code}")
        
        original_image = Image.open(io.BytesIO(response.content))
        
        # Convert mask data (base64) to PIL Image
        if mask_data.startswith('data:image'):
            mask_data = mask_data.split(',')[1]
        
        mask_bytes = base64.b64decode(mask_data)
        mask_image = Image.open(io.BytesIO(mask_bytes))
        
        # Ensure both images are the same size and in RGBA format
        if original_image.size != mask_image.size:
            mask_image = mask_image.resize(original_image.size, Image.Resampling.LANCZOS)
        
        # Convert to RGBA
        if original_image.mode != 'RGBA':
            original_image = original_image.convert('RGBA')
        if mask_image.mode != 'RGBA':
            mask_image = mask_image.convert('RGBA')
        
        # Convert images to bytes for OpenAI API
        img_buffer = io.BytesIO()
        original_image.save(img_buffer, format='PNG')
        img_bytes = img_buffer.getvalue()
        
        mask_buffer = io.BytesIO()
        mask_image.save(mask_buffer, format='PNG')
        mask_bytes = mask_buffer.getvalue()
        
        # Call OpenAI image edit API
        edit_response = client.images.edit(
            image=img_bytes,
            mask=mask_bytes,
            prompt=prompt,
            n=1,
            size="1024x1024",
            response_format="url"
        )
        
        if edit_response.data and len(edit_response.data) > 0:
            return {
                "status": "completed",
                "edited_image_url": edit_response.data[0].url,
                "original_prompt": prompt
            }
        else:
            raise Exception("No edited image returned from OpenAI")
        
    except Exception as e:
        print(f"OpenAI image edit error: {e}")
        raise Exception(f"Image editing failed: {str(e)}")

async def analyze_image_content(image_url: str) -> str:
    """Analyze image content using OpenAI's vision capabilities."""
    try:
        response = client.chat.completions.create(
            model="gpt-4o",  # the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Analyze this landscape image and describe the key elements, focusing on areas suitable for curbing, mulch, and patio installations. Be specific about the current landscaping features."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": image_url
                            }
                        }
                    ],
                }
            ],
            max_completion_tokens=500,
        )
        
        return response.choices[0].message.content or "Unable to analyze image content"
        
    except Exception as e:
        print(f"OpenAI image analysis error: {e}")
        return f"Image analysis failed: {str(e)}"