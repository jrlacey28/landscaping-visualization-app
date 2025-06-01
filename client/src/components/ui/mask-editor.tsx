
import { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import { Brush, Eraser, RotateCcw, Download } from "lucide-react";

interface MaskEditorProps {
  image: string;
  onMaskChange: (maskDataUrl: string) => void;
  onClose: () => void;
}

export default function MaskEditor({ image, onMaskChange, onClose }: MaskEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [isErasing, setIsErasing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the background image with reduced opacity
      ctx.globalAlpha = 0.5;
      ctx.drawImage(img, 0, 0);
      
      // Reset alpha for mask drawing
      ctx.globalAlpha = 1;
    };
    img.src = image;
  }, [image]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    ctx.globalCompositeOperation = isErasing ? 'destination-out' : 'source-over';
    ctx.fillStyle = isErasing ? 'rgba(0,0,0,1)' : 'rgba(255,255,255,0.8)';
    
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearMask = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Redraw background image
    const img = new Image();
    img.onload = () => {
      ctx.globalAlpha = 0.5;
      ctx.drawImage(img, 0, 0);
      ctx.globalAlpha = 1;
    };
    img.src = image;
  };

  const saveMask = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a new canvas for just the mask (black and white)
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return;

    // Fill with black background
    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    // Draw white where the mask was drawn
    const imageData = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height);
    if (!imageData) return;

    const maskImageData = maskCtx.createImageData(canvas.width, canvas.height);
    
    for (let i = 0; i < imageData.data.length; i += 4) {
      const alpha = imageData.data[i + 3];
      // If there's significant alpha (mask was drawn), make it white
      if (alpha > 128) {
        maskImageData.data[i] = 255;     // R
        maskImageData.data[i + 1] = 255; // G
        maskImageData.data[i + 2] = 255; // B
        maskImageData.data[i + 3] = 255; // A
      } else {
        maskImageData.data[i] = 0;       // R
        maskImageData.data[i + 1] = 0;   // G
        maskImageData.data[i + 2] = 0;   // B
        maskImageData.data[i + 3] = 255; // A
      }
    }

    maskCtx.putImageData(maskImageData, 0, 0);
    const maskDataUrl = maskCanvas.toDataURL('image/png');
    onMaskChange(maskDataUrl);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Select Areas to Modify</h3>
          <p className="text-sm text-gray-600 mb-4">
            Draw over the areas you want to change (curbing, landscape, or patio areas). 
            White areas will be modified, black areas will remain unchanged.
          </p>
          
          <div className="flex gap-2 mb-4">
            <Button
              variant={!isErasing ? "default" : "outline"}
              size="sm"
              onClick={() => setIsErasing(false)}
            >
              <Brush className="h-4 w-4 mr-2" />
              Draw
            </Button>
            <Button
              variant={isErasing ? "default" : "outline"}
              size="sm"
              onClick={() => setIsErasing(true)}
            >
              <Eraser className="h-4 w-4 mr-2" />
              Erase
            </Button>
            <Button variant="outline" size="sm" onClick={clearMask}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Brush Size: {brushSize}px
            </label>
            <input
              type="range"
              min="5"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden mb-4">
          <canvas
            ref={canvasRef}
            className="max-w-full h-auto cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={saveMask}>
            <Download className="h-4 w-4 mr-2" />
            Use This Mask
          </Button>
        </div>
      </div>
    </div>
  );
}
