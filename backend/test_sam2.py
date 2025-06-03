import requests
import base64
import os
from PIL import Image
import io

# Test SAM-2 integration with the correct model version
def test_sam2_segmentation():
    """Test SAM-2 segmentation with a sample image."""
    
    # Create a simple test image
    test_image = Image.new('RGB', (512, 512), color='green')
    # Add some simple shapes for segmentation
    from PIL import ImageDraw
    draw = ImageDraw.Draw(test_image)
    draw.rectangle([50, 50, 200, 200], fill='brown')  # Simulate mulch area
    draw.rectangle([300, 300, 450, 450], fill='gray')  # Simulate patio area
    
    # Convert to bytes
    img_buffer = io.BytesIO()
    test_image.save(img_buffer, format='PNG')
    img_bytes = img_buffer.getvalue()
    
    # Convert to base64 for API
    base64_image = base64.b64encode(img_bytes).decode('utf-8')
    data_url = f"data:image/png;base64,{base64_image}"
    
    # Test the SAM-2 API directly
    replicate_token = os.getenv('REPLICATE_API_TOKEN')
    if not replicate_token:
        print("REPLICATE_API_TOKEN not found")
        return False
    
    try:
        response = requests.post(
            'https://api.replicate.com/v1/predictions',
            headers={
                'Authorization': f'Token {replicate_token}',
                'Content-Type': 'application/json'
            },
            json={
                "version": "fe97b453a6455861e3bac769b441ca1f1086110da7466dbb65cf1eecfd60dc83",
                "input": {
                    "image": data_url,
                    "points_per_side": 32,
                    "pred_iou_thresh": 0.88,
                    "stability_score_thresh": 0.95,
                    "use_m2m": True
                }
            }
        )
        
        if response.ok:
            result = response.json()
            print(f"SAM-2 Test Success: {result.get('status', 'unknown')}")
            print(f"Prediction ID: {result.get('id', 'none')}")
            return True
        else:
            print(f"SAM-2 Test Failed: {response.status_code}")
            print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"SAM-2 Test Error: {e}")
        return False

if __name__ == "__main__":
    test_sam2_segmentation()