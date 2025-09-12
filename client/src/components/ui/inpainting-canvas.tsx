import { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import { Brush, Eraser, RotateCcw, Download, Sparkles, Edit } from "lucide-react";
import { runSAM2Segmentation, checkSAM2Status } from "../../lib/api";

interface InpaintingCanvasProps {
  imageUrl: string;
  originalFile?: File | null;
  onMaskChange: (maskData: string | null) => void;
  onAutoInpaint?: (imageUrl: string, maskData: string) => void;
}

export default function InpaintingCanvas({ imageUrl, originalFile, onMaskChange, onAutoInpaint }: InpaintingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
  const [hasMask, setHasMask] = useState(false);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const [mode, setMode] = useState<'manual' | 'auto'>('auto');
  const [showManualControls, setShowManualControls] = useState(false);
  const [autoDetectionFailed, setAutoDetectionFailed] = useState(false);
  const [hasRunAutoDetection, setHasRunAutoDetection] = useState(false);

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
      // Set canvas dimensions to match the actual image resolution
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      overlayCanvas.width = img.naturalWidth;
      overlayCanvas.height = img.naturalHeight;

      // Draw image on main canvas at full resolution
      ctx.drawImage(img, 0, 0);

      // Set up overlay canvas for mask
      overlayCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      overlayCtx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      overlayCtx.lineWidth = brushSize;
      overlayCtx.lineCap = 'round';
      overlayCtx.lineJoin = 'round';

      // Automatically trigger auto-detection on image load
      if (!hasRunAutoDetection) {
        setTimeout(() => autoDetectRegions(), 500); // Small delay to ensure canvas is ready
      }
    };
    img.src = imageUrl;
  }, [imageUrl, brushSize, hasRunAutoDetection]);

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

  const autoDetectRegions = async () => {
    setIsAutoDetecting(true);
    setHasRunAutoDetection(true);
    try {
      if (!originalFile) {
        setAutoDetectionFailed(true);
        setShowManualControls(true);
        return;
      }

      // Start SAM-2 segmentation with direct file upload
      const samResult = await runSAM2Segmentation(originalFile);
      
      if (samResult.prediction_id) {
        // Poll for completion
        const pollForResult = async () => {
          const maxAttempts = 30; // 3 minutes max
          let attempts = 0;
          
          while (attempts < maxAttempts) {
            const status = await checkSAM2Status(samResult.prediction_id);
            
            if (status.status === 'succeeded' && status.output) {
              // Use the combined_mask from SAM-2 output for region detection
              if (status.output.combined_mask) {
                const maskUrl = status.output.combined_mask;
                await applyAutoMask(maskUrl);
                setMode('auto');
                setAutoDetectionFailed(false);
                
                // Trigger auto inpainting if callback is provided
                if (onAutoInpaint) {
                  onAutoInpaint(imageUrl, maskUrl);
                }
                return;
              }
            } else if (status.status === 'failed') {
              throw new Error('SAM-2 processing failed');
            }
            
            // Wait 6 seconds before next check
            await new Promise(resolve => setTimeout(resolve, 6000));
            attempts++;
          }
          
          throw new Error('SAM-2 processing timed out');
        };
        
        await pollForResult();
      } else if (samResult.output) {
        // Direct result available
        const maskUrl = samResult.output[0];
        await applyAutoMask(maskUrl);
        setMode('auto');
        setAutoDetectionFailed(false);
        
        if (onAutoInpaint) {
          onAutoInpaint(imageUrl, maskUrl);
        }
      } else {
        setAutoDetectionFailed(true);
        setShowManualControls(true);
      }
    } catch (error) {
      console.error("Auto-detection failed:", error);
      setAutoDetectionFailed(true);
      setShowManualControls(true);
    } finally {
      setIsAutoDetecting(false);
    }
  };

  const applyAutoMask = async (maskUrl: string) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear existing mask
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Load and apply the SAM 2 mask
    const maskImg = new Image();
    maskImg.crossOrigin = 'anonymous';
    maskImg.onload = () => {
      // Draw mask with low opacity for preview
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.drawImage(maskImg, 0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1.0;
      
      setHasMask(true);
      onMaskChange(maskUrl);
    };
    maskImg.src = maskUrl;
  };

  return (
    <div className="space-y-4">
      {/* Status Messages */}
      {isAutoDetecting && (
        <div className="text-center py-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-center space-x-2">
            <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-blue-700 font-medium">Detecting landscaping areas...</span>
          </div>
        </div>
      )}

      {autoDetectionFailed && (
        <div className="text-center py-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-amber-700 font-medium">We couldn't detect any landscaping areas.</p>
          <p className="text-amber-600 text-sm mt-1">You can still draw your changes manually.</p>
        </div>
      )}

      {mode === 'auto' && !isAutoDetecting && !autoDetectionFailed && hasRunAutoDetection && (
        <div className="text-center py-2 bg-green-50 border border-green-200 rounded-lg">
          <span className="text-green-700 font-medium">✓ Areas detected automatically</span>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex items-center justify-center flex-wrap gap-2">
        {!showManualControls && !isAutoDetecting && (autoDetectionFailed || !hasRunAutoDetection) && (
          <Button
            variant="default"
            size="sm"
            onClick={autoDetectRegions}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
          >
            <Sparkles className="h-4 w-4 mr-1" />
            Auto-Detect Areas
          </Button>
        )}
        
        {(autoDetectionFailed || mode === 'manual') && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowManualControls(true);
              setMode('manual');
            }}
          >
            <Edit className="h-4 w-4 mr-1" />
            Use Manual Mode
          </Button>
        )}
      </div>

      {showManualControls && mode === 'manual' && (
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
      )}

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
        {mode === 'manual' ? (
          <>
            <p>• Paint over areas you want the AI to modify (grass, landscaping, driveways, etc.)</p>
            <p>• Use the eraser to remove painted areas</p>
            <p>• Leave buildings and structures unpainted to preserve them</p>
          </>
        ) : (
          <>
            <p>• Click "Auto-Detect" to automatically identify landscaping areas</p>
            <p>• AI will apply natural stone curbing to detected regions</p>
            <p>• Switch to Manual Mode for custom area selection</p>
          </>
        )}
      </div>
    </div>
  );
}