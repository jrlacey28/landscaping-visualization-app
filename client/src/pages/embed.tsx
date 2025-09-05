
import { useState, useEffect } from "react";
import { useTenant } from "../hooks/use-tenant";
import LandscapeStyleSelector from "../components/landscape-style-selector";
import { Button } from "../components/ui/button";
import { Upload, Sparkles } from "lucide-react";
import { uploadLandscapeImage, checkLandscapeVisualizationStatus } from "../lib/api";

interface EmbedProps {
  tenantSlug?: string;
  primaryColor?: string;
  secondaryColor?: string;
  companyName?: string;
  showHeader?: boolean;
  width?: string;
  height?: string;
}

export default function EmbedPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const tenantSlug = urlParams.get('tenant') || 'demo';
  const primaryColor = urlParams.get('primaryColor') || '#10b981';
  const secondaryColor = urlParams.get('secondaryColor') || '#059669';
  const companyName = urlParams.get('companyName') || '';
  const showHeader = urlParams.get('showHeader') !== 'false';
  
  const { tenant, isLoading: tenantLoading, error: tenantError } = useTenant(tenantSlug);
  
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [landscapeVisualizationResult, setLandscapeVisualizationResult] = useState<any>(null);
  
  const [selectedLandscapeStyles, setSelectedLandscapeStyles] = useState({
    curbing: "",
    landscape: "",
    patios: "",
  });

  // Apply custom branding
  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', primaryColor);
    document.documentElement.style.setProperty('--secondary-color', secondaryColor);
  }, [primaryColor, secondaryColor]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setOriginalFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setLandscapeVisualizationResult(null);
    }
  };

  if (tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (tenantError || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-red-800 to-red-900">
        <div className="text-center">
          <p className="text-white">Service not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900 p-4">
      <div className="max-w-4xl mx-auto">
        {showHeader && (
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {companyName || tenant.companyName} Landscape Visualizer
            </h1>
            <p className="text-lg text-emerald-100">
              Transform your outdoor space with AI-powered landscape design
            </p>
          </div>
        )}

        {/* Image Upload */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4 text-center">Upload Your Property Photo</h2>
          
          {!uploadedImage ? (
            <div className="border-2 border-dashed border-white/30 rounded-lg p-8 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center space-y-4"
              >
                <Upload className="h-12 w-12 text-white/70" />
                <div>
                  <p className="text-white font-medium">Click to upload your photo</p>
                  <p className="text-white/70 text-sm">PNG, JPG up to 10MB</p>
                </div>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={uploadedImage}
                  alt="Uploaded property"
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setUploadedImage(null);
                  setOriginalFile(null);
                  setLandscapeVisualizationResult(null);
                }}
                className="w-full"
              >
                Upload Different Photo
              </Button>
            </div>
          )}
        </div>

        {/* Style Selection */}
        {uploadedImage && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Choose Your Landscape Style</h2>
            <LandscapeStyleSelector
              selectedStyles={selectedLandscapeStyles}
              onStyleChange={setSelectedLandscapeStyles}
            />
          </div>
        )}

        {/* Generate Button */}
        {uploadedImage && (
          <div className="mb-6">
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-700 hover:via-teal-600 hover:to-emerald-700 text-white font-semibold py-4 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              disabled={
                isGenerating ||
                !(
                  selectedLandscapeStyles.curbing ||
                  selectedLandscapeStyles.landscape ||
                  selectedLandscapeStyles.patios
                )
              }
              onClick={async () => {
                setIsGenerating(true);
                setLandscapeVisualizationResult(null);
                
                try {
                  if (!originalFile) {
                    alert("Please re-upload your image.");
                    setIsGenerating(false);
                    return;
                  }

                  const result = await uploadLandscapeImage(
                    originalFile,
                    tenant.id,
                    selectedLandscapeStyles,
                  );

                  if (result.landscapeVisualizationId) {
                    const status = await checkLandscapeVisualizationStatus(
                      result.landscapeVisualizationId,
                    );
                    setLandscapeVisualizationResult(status);
                  }
                } catch (error) {
                  console.error("Error generating visualization:", error);
                  alert("Unable to generate visualization. Please try again.");
                } finally {
                  setIsGenerating(false);
                }
              }}
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Generating Your Design...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate AI Landscape Design
                </>
              )}
            </Button>
          </div>
        )}

        {/* Results */}
        {landscapeVisualizationResult && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4 text-center">
              Your Landscape Design
            </h3>
            
            {landscapeVisualizationResult.status === "completed" &&
            landscapeVisualizationResult.generatedImageUrl ? (
              <div className="space-y-6">
                {/* Generated Image Display */}
                <div className="w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={landscapeVisualizationResult.generatedImageUrl}
                    alt="Enhanced landscape design"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = landscapeVisualizationResult.generatedImageUrl;
                      link.download = 'landscape-design.jpg';
                      link.click();
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Download
                  </Button>
                  <Button
                    onClick={() => {
                      setUploadedImage(null);
                      setOriginalFile(null);
                      setLandscapeVisualizationResult(null);
                    }}
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-gray-900"
                  >
                    Try Another Photo
                  </Button>
                  <Button
                    onClick={() => {
                      const modal = document.createElement('div');
                      modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
                      modal.innerHTML = `
                        <div class="relative max-w-4xl max-h-full">
                          <img src="${uploadedImage}" alt="Original Image" class="max-w-full max-h-full object-contain rounded-lg" />
                          <button class="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-75" onclick="this.parentElement.parentElement.remove()">×</button>
                        </div>
                      `;
                      modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
                      document.body.appendChild(modal);
                    }}
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-gray-900"
                  >
                    Original Image
                  </Button>
                </div>
              </div>
            ) : (
              <div className="w-full aspect-video bg-emerald-50 border-2 border-emerald-200 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-emerald-600">Generating design...</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
