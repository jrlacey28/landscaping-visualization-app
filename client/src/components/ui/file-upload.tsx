import { useState, useRef } from "react";
import { Upload, X, Camera } from "lucide-react";
import { Button } from "./button";
import { StarBorder } from "./star-border";

interface FileUploadProps {
  onFileSelect: (file: File, previewUrl: string) => void;
  uploadedImage: string | null;
  theme?: "default" | "pool";
}

export default function FileUpload({ onFileSelect, uploadedImage, theme = "default" }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            <StarBorder className={`mt-4 ${
              theme === "pool" 
                ? "bg-gradient-to-r from-blue-600 via-green-500 to-blue-600 hover:from-blue-700 hover:via-green-600 hover:to-blue-700"
                : ""
            }`}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </StarBorder>
          </div>
          <div className="flex justify-center space-x-4 text-sm text-muted-foreground mb-6">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>Clear and well-lit images of house work best</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-secondary rounded-full"></div>
            
            </div>
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
    </>
  );
}