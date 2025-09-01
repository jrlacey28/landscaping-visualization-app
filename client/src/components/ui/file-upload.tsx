import { useState, useRef } from "react";
import { Upload, X, Camera, Image as CameraIcon } from "lucide-react";
import { Button } from "./button";

interface FileUploadProps {
  onFileSelect: (file: File, previewUrl: string) => void;
  uploadedImage: string | null;
}

export default function FileUpload({ onFileSelect, uploadedImage }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    // Create preview URL for display without modifying original file
    const previewUrl = URL.createObjectURL(file);
    
    // Pass both original file and preview URL
    onFileSelect(file, previewUrl);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      setStream(mediaStream);
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please use file upload instead.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
            const previewUrl = URL.createObjectURL(blob);
            onFileSelect(file, previewUrl);
            stopCamera();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const handleCameraInput = () => {
    cameraInputRef.current?.click();
  };

  if (uploadedImage) {
    return (
      <div className="relative">
        <img
          src={uploadedImage}
          alt="Uploaded home photo"
          className="w-full h-64 object-cover rounded-lg"
        />
        <Button
          variant="destructive"
          size="sm"
          className="absolute top-2 right-2"
          onClick={() => onFileSelect(new File([], ""), "")}
        >
          <X className="h-4 w-4" />
        </Button>
        <div className="absolute bottom-2 left-2 flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="h-4 w-4 mr-2" />
            Change photo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`border-3 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer min-h-[400px] flex items-center justify-center ${
          isDragging 
            ? 'border-primary bg-gradient-to-br from-primary/20 to-secondary/10 scale-105' 
            : 'border-primary/40 hover:border-primary hover:bg-gradient-to-br hover:from-primary/10 hover:to-secondary/5 hover:scale-102'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="space-y-6">
          <div className="w-24 h-24 bg-gradient-to-br from-stone-600 to-stone-800 rounded-full flex items-center justify-center mx-auto shadow-xl">
            <Camera className="h-12 w-12 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-stone-800 mb-2">Drop your photo here</p>
            <p className="text-lg text-stone-600 mb-4">or click to browse files</p>
            <div className="inline-flex items-center space-x-2 bg-stone-700/20 px-4 py-2 rounded-full border border-stone-400">
              <Upload className="h-4 w-4 text-stone-700" />
              <span className="text-sm font-medium text-stone-700">PNG, JPG up to 10MB</span>
            </div>
          </div>
          <div className="flex justify-center space-x-4 text-sm text-muted-foreground mb-6">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>Front yard photos work best</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-secondary rounded-full"></div>
              <span>Clear, well-lit images</span>
            </div>
          </div>
          
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowOptions(true)}
              className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 px-8 py-3"
            >
              <Camera className="h-5 w-5 mr-2" />
              Add Photo
            </Button>
          </div>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleFileInputChange}
      />
      
      <input
        ref={cameraInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={handleFileInputChange}
      />
      
      {showOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-2">Add Your Photo</h3>
              <p className="text-gray-600">Choose how you'd like to add your home photo</p>
            </div>
            
            <div className="space-y-4">
              <Button
                onClick={() => {
                  setShowOptions(false);
                  fileInputRef.current?.click();
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg"
              >
                <Upload className="h-5 w-5 mr-3" />
                Upload from Device
              </Button>
              
              <Button
                onClick={() => {
                  setShowOptions(false);
                  startCamera();
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg"
              >
                <Camera className="h-5 w-5 mr-3" />
                Take Photo Now
              </Button>
              
              <Button
                onClick={() => {
                  setShowOptions(false);
                  handleCameraInput();
                }}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 text-lg"
              >
                <CameraIcon className="h-5 w-5 mr-3" />
                Choose from Camera Roll
              </Button>
            </div>
            
            <Button
              onClick={() => setShowOptions(false)}
              variant="outline"
              className="w-full mt-4"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold">Take a Photo</h3>
              <p className="text-sm text-gray-600">Position your home in the viewfinder</p>
            </div>
            
            <div className="relative mb-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-64 object-cover rounded-lg bg-gray-100"
              />
            </div>
            
            <div className="flex justify-center space-x-4">
              <Button
                onClick={capturePhoto}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Camera className="h-4 w-4 mr-2" />
                Capture
              </Button>
              <Button
                onClick={stopCamera}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <canvas ref={canvasRef} className="hidden" />
    </>
  );
}
