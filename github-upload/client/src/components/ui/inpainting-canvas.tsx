import { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import { Brush, Eraser, RotateCcw, Download } from "lucide-react";

interface InpaintingCanvasProps {
  imageUrl: string;
  onMaskChange: (maskData: string | null) => void;
}

export default function InpaintingCanvas({ imageUrl, onMaskChange }: InpaintingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
  const [hasMask, setHasMask] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas || !overlayCanvas) return;

    const ctx = canvas.getContext('2d');
    const overlayCtx = overlayCanvas.getContext('2d');
    if (!ctx || !overlayCtx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Set canvas dimensions to match image - larger for easier mask creation
      const aspectRatio = img.width / img.height;
      const canvasWidth = 800;
      const canvasHeight = canvasWidth / aspectRatio;

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      overlayCanvas.width = canvasWidth;
      overlayCanvas.height = canvasHeight;

      // Draw image on main canvas
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

      // Set up overlay canvas for mask
      overlayCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      overlayCtx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      overlayCtx.lineWidth = brushSize;
      overlayCtx.lineCap = 'round';
      overlayCtx.lineJoin = 'round';
    };
    img.src = imageUrl;
  }, [imageUrl, brushSize]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    ctx.globalCompositeOperation = tool === 'brush' ? 'source-over' : 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();

    setHasMask(true);
    generateMaskData();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearMask = () => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasMask(false);
    onMaskChange(null);
  };

  const generateMaskData = () => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    // Create a black and white mask
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const maskCtx = maskCanvas.getContext('2d');
    
    if (!maskCtx) return;

    // Fill with black background
    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    // Draw white areas where mask exists
    const overlayCtx = canvas.getContext('2d');
    if (!overlayCtx) return;

    const imageData = overlayCtx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    maskCtx.fillStyle = 'white';
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha > 0) {
        const x = (i / 4) % canvas.width;
        const y = Math.floor((i / 4) / canvas.width);
        maskCtx.fillRect(x, y, 1, 1);
      }
    }

    const maskDataUrl = maskCanvas.toDataURL('image/png');
    onMaskChange(maskDataUrl);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant={tool === 'brush' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('brush')}
          >
            <Brush className="h-4 w-4 mr-1" />
            Paint
          </Button>
          <Button
            variant={tool === 'eraser' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('eraser')}
          >
            <Eraser className="h-4 w-4 mr-1" />
            Erase
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearMask}
            disabled={!hasMask}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Brush Size:</label>
          <input
            type="range"
            min="10"
            max="80"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-24"
          />
          <span className="text-sm text-stone-600">{brushSize}px</span>
        </div>
      </div>

      <div className="relative inline-block">
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 rounded-lg"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        <canvas
          ref={overlayCanvasRef}
          className="relative rounded-lg cursor-crosshair"
          style={{ maxWidth: '100%', height: 'auto' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>

      <div className="text-sm text-stone-600 space-y-1">
        <p><strong>How to use:</strong></p>
        <p>• Paint over areas you want the AI to modify (grass, landscaping, driveways, etc.)</p>
        <p>• Use the eraser to remove painted areas</p>
        <p>• Leave buildings and structures unpainted to preserve them</p>
      </div>
    </div>
  );
}