from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import replicate
import os
import tempfile
import asyncio
import requests
import base64
import json
from PIL import Image
import io
from typing import Optional, Dict, Any
from pydantic import BaseModel
from openai_service import generate_landscape_prompt, edit_image_with_mask, analyze_image_content

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files - create directory if it doesn't exist
import os
os.makedirs("public/uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="public/uploads"), name="uploads")

# Initialize Replicate client
replicate_client = replicate

# SAM-2 model version from your Replicate account
SAM2_VERSION = "cd9c45fbc0f7bfbab66fc50fb985bd47a00b47683ccee5e8b26c4ba66d8f618fd"

class SegmentationResponse(BaseModel):
    prediction_id: str
    status: str
    output: Optional[Any] = None
    urls: Optional[Dict[str, str]] = None

class StyleEditRequest(BaseModel):
    image_url: str
    mask_data: str
    selected_styles: Dict[str, Any]
    prompt: str

async def run_sam2_predict(image_data: bytes) -> Dict[str, Any]:
    """Run SAM-2 segmentation with proper async handling."""
    try:
        # Convert image data to base64 for Replicate API
        base64_image = base64.b64encode(image_data).decode('utf-8')
        data_url = f"data:image/png;base64,{base64_image}"
        
        # Use direct API call to Replicate
        response = await asyncio.to_thread(
            requests.post,
            'https://api.replicate.com/v1/predictions',
            headers={
                'Authorization': f'Token {os.getenv("REPLICATE_API_TOKEN")}',
                'Content-Type': 'application/json'
            },
            json={
                "version": SAM2_VERSION,
                "input": {
                    "image": data_url,
                    "points_per_side": 32,
                    "pred_iou_thresh": 0.88,
                    "stability_score_thresh": 0.95,
                    "use_m2m": True
                }
            }
        )
        
        if not response.ok:
            error_text = response.text
            print(f'SAM-2 API error: {error_text}')
            raise HTTPException(status_code=500, detail="SAM-2 processing failed")
        
        return response.json()
    except Exception as e:
        print(f"SAM-2 prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"SAM-2 processing failed: {str(e)}")

@app.post("/api/segment")
async def segment_image(image: UploadFile = File(...)) -> SegmentationResponse:
    """Segment image using SAM-2 model."""
    try:
        # Read and validate image
        image_data = await image.read()
        if len(image_data) == 0:
            raise HTTPException(status_code=400, detail="Empty image file")
        
        # Validate image format
        try:
            with Image.open(io.BytesIO(image_data)) as img:
                # Convert to RGB if necessary
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                    
                # Save back to bytes
                img_buffer = io.BytesIO()
                img.save(img_buffer, format='PNG')
                image_data = img_buffer.getvalue()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image format: {str(e)}")
        
        # Run SAM-2 segmentation
        prediction = await run_sam2_predict(image_data)
        
        return SegmentationResponse(
            prediction_id=prediction.get("id", ""),
            status=prediction.get("status", "starting"),
            output=prediction.get("output"),
            urls=prediction.get("urls")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Segmentation error: {e}")
        raise HTTPException(status_code=500, detail=f"Segmentation failed: {str(e)}")

@app.get("/api/segment/{prediction_id}")
async def check_segmentation_status(prediction_id: str):
    """Check the status of a SAM-2 segmentation prediction."""
    try:
        prediction = await asyncio.to_thread(
            replicate_client.predictions.get,
            prediction_id
        )
        
        return {
            "id": prediction.id,
            "status": prediction.status,
            "output": prediction.output,
            "error": prediction.error
        }
        
    except Exception as e:
        print(f"Status check error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to check status: {str(e)}")

@app.post("/api/upload-image")
async def upload_image(image: UploadFile = File(...)):
    """Upload and save image to public directory."""
    try:
        # Create uploads directory if it doesn't exist
        uploads_dir = "public/uploads"
        os.makedirs(uploads_dir, exist_ok=True)
        
        # Generate unique filename
        import uuid
        file_extension = os.path.splitext(image.filename)[1] if image.filename else '.jpg'
        filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(uploads_dir, filename)
        
        # Save image
        image_data = await image.read()
        with open(file_path, "wb") as f:
            f.write(image_data)
        
        # Return URL
        return {"url": f"/uploads/{filename}"}
        
    except Exception as e:
        print(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.post("/api/style-edit")
async def apply_style_edit(request: StyleEditRequest):
    """Apply style-based edits using OpenAI image editing."""
    try:
        # Generate enhanced prompt based on selected styles
        enhanced_prompt = await generate_landscape_prompt(request.selected_styles)
        
        # Apply the style edit using OpenAI
        result = await edit_image_with_mask(
            image_url=request.image_url,
            mask_data=request.mask_data,
            prompt=enhanced_prompt
        )
        
        return result
        
    except Exception as e:
        print(f"Style edit error: {e}")
        raise HTTPException(status_code=500, detail=f"Style edit failed: {str(e)}")

@app.get("/api/styles")
async def get_all_styles():
    """Get all available landscaping styles."""
    # Style configuration from the original implementation
    styles = [
        {
            "id": "concrete_curbing",
            "name": "Concrete Curbing",
            "category": "curbing",
            "prompt": "Professional concrete landscape curbing, clean edges, gray concrete border"
        },
        {
            "id": "stone_curbing", 
            "name": "Natural Stone Curbing",
            "category": "curbing",
            "prompt": "Natural stone landscape edging, irregular stone borders, earth tones"
        },
        {
            "id": "brown_mulch",
            "name": "Brown Wood Mulch",
            "category": "mulch",
            "prompt": "Brown wood mulch ground cover, organic texture, natural landscaping material"
        },
        {
            "id": "red_mulch",
            "name": "Red Mulch",
            "category": "mulch", 
            "prompt": "Red-tinted wood mulch, vibrant color, landscaping ground cover"
        },
        {
            "id": "flagstone_patio",
            "name": "Flagstone Patio",
            "category": "patio",
            "prompt": "Natural flagstone patio, irregular stone pattern, outdoor living space"
        },
        {
            "id": "concrete_patio",
            "name": "Concrete Patio",
            "category": "patio",
            "prompt": "Smooth concrete patio, modern outdoor space, clean lines"
        }
    ]
    
    return styles

@app.get("/api/styles/{category}")
async def get_styles_by_category(category: str):
    """Get styles filtered by category."""
    all_styles = await get_all_styles()
    filtered_styles = [style for style in all_styles if style["category"] == category]
    return filtered_styles

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)