import { useState, useEffect } from "react";
import { useTenant } from "../hooks/use-tenant";
import LandscapeStyleSelector from "../components/landscape-style-selector";
import { Button } from "../components/ui/button";
import { Upload, Sparkles, Download, Eye, Camera, Phone, Save } from "lucide-react";
import { SparklesText } from "@/components/ui/sparkles-text";
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
  
  // Check for saved colors first, then fall back to URL params
  const savedColors = JSON.parse(localStorage.getItem(`embed-colors-${tenantSlug}`) || '{}');
  const [primaryColor, setPrimaryColor] = useState(savedColors.primaryColor || urlParams.get('primaryColor') || '#10b981');
  const [secondaryColor, setSecondaryColor] = useState(savedColors.secondaryColor || urlParams.get('secondaryColor') || '#059669');
  
  const companyName = urlParams.get('companyName') || '';
  const showHeader = urlParams.get('showHeader') !== 'false';
  
  // Save colors to localStorage
  const saveColors = () => {
    localStorage.setItem(`embed-colors-${tenantSlug}`, JSON.stringify({
      primaryColor,
      secondaryColor
    }));
  };
  
  const { tenant, isLoading: tenantLoading, error: tenantError } = useTenant(tenantSlug);
  
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [landscapeVisualizationResult, setLandscapeVisualizationResult] = useState<any>(null);
  const [showingOriginal, setShowingOriginal] = useState(false);
  
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
    <div className="min-h-screen p-2" style={{ background: `linear-gradient(to bottom right, ${primaryColor}dd, ${secondaryColor}dd, ${primaryColor}cc)` }}>
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

        {/* Color Customization */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 mb-4">
          <h2 className="text-lg font-semibold text-white mb-3">Customize Colors</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Primary Color</label>
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-full h-10 rounded-md border-0 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Secondary Color</label>
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-full h-10 rounded-md border-0 cursor-pointer"
              />
            </div>
            <Button
              onClick={saveColors}
              className="text-white font-semibold shadow-md hover:shadow-lg transition-all"
              style={{ 
                background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`
              }}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Colors
            </Button>
          </div>
        </div>

        {/* Image Upload */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 mb-4">
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
              <div className="w-full aspect-video bg-gray-100 rounded-lg overflow-hidden relative">
                <img
                  src={landscapeVisualizationResult?.status === "completed" && landscapeVisualizationResult?.generatedImageUrl ? 
                    (showingOriginal ? uploadedImage : landscapeVisualizationResult.generatedImageUrl) : 
                    uploadedImage}
                  alt={landscapeVisualizationResult?.status === "completed" ? 
                    (showingOriginal ? "Original photo" : "Enhanced landscape design") : 
                    "Uploaded property"}
                  className="w-full h-full object-cover"
                />
                {isGenerating && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <SparklesText
                        text="Designing your perfect landscape..."
                        className="text-sm sm:text-lg lg:text-xl font-bold text-white whitespace-nowrap"
                        sparklesCount={12}
                        colors={{ first: primaryColor, second: secondaryColor }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Show buttons only after generation is complete */}
              {landscapeVisualizationResult?.status === "completed" && landscapeVisualizationResult?.generatedImageUrl ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button
                      size="lg"
                      className="text-white font-semibold shadow-md hover:shadow-lg transition-all"
                      style={{ 
                        background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`
                      }}
                      onClick={() => {
                        const img = document.createElement("img");
                        img.crossOrigin = "anonymous";
                        img.onload = function () {
                          const canvas = document.createElement("canvas");
                          const ctx = canvas.getContext("2d");
                          if (ctx) {
                            canvas.width = img.width;
                            canvas.height = img.height;
                            ctx.drawImage(img, 0, 0);
                            canvas.toBlob(
                              (blob) => {
                                if (blob) {
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement("a");
                                  a.href = url;
                                  a.download = "landscape-design.jpg";
                                  a.click();
                                  URL.revokeObjectURL(url);
                                }
                              },
                              "image/jpeg",
                              0.9,
                            );
                          }
                        };
                        img.src = landscapeVisualizationResult.generatedImageUrl;
                      }}
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Download Image
                    </Button>

                    <Button
                      size="lg"
                      className="text-white font-semibold shadow-md hover:shadow-lg transition-all"
                      style={{ 
                        background: `linear-gradient(to right, #64748b, #475569)`
                      }}
                      onClick={() => setShowingOriginal(!showingOriginal)}
                    >
                      <Eye className="h-5 w-5 mr-2" />
                      {showingOriginal ? "View Landscape Design" : "View Original Photo"}
                    </Button>

                  </div>
                  
                  <div className="w-full">
                    <Button
                      size="lg"
                      className="w-full text-white font-semibold shadow-md hover:shadow-lg transition-all py-3"
                      style={{ 
                        background: `linear-gradient(to right, ${secondaryColor}, ${primaryColor})`
                      }}
                      onClick={() => {
                        setUploadedImage(null);
                        setOriginalFile(null);
                        setLandscapeVisualizationResult(null);
                        setShowingOriginal(false);
                      }}
                    >
                      <Camera className="h-5 w-5 mr-2" />
                      Try Another Photo
                    </Button>
                  </div>
                  
                  {/* Get Free Quote button */}
                  <Button
                    size="lg"
                    className="w-full text-white font-semibold py-4 shadow-lg hover:shadow-xl transition-all"
                    style={{ 
                      background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor}, ${primaryColor})`
                    }}
                    onClick={() => {
                      const contactPhone = tenant.contactPhone || tenant.phone || '(555) 123-4567';
                      const message = encodeURIComponent(`Hi! I'm interested in getting a free quote for landscape design. I just tried your landscape visualizer and would like to discuss my project.`);
                      
                      if (contactPhone.startsWith('(') || contactPhone.startsWith('+')) {
                        // Phone number format - open phone app
                        const cleanPhone = contactPhone.replace(/[\(\)\-\s]/g, '');
                        window.open(`tel:${cleanPhone}`, '_self');
                      } else {
                        // Email or other contact method
                        window.open(`mailto:${tenant.email || 'info@company.com'}?subject=Landscape Design Quote Request&body=${message}`, '_blank');
                      }
                    }}
                  >
                    <Phone className="h-5 w-5 mr-2" />
                    Get Free Quote
                  </Button>
                </div>
              ) : (
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
              )}
            </div>
          )}
        </div>

        {/* Style Selection */}
        {uploadedImage && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 mb-4">
            <h2 className="text-xl font-semibold text-white mb-4">Choose Your Landscape Style</h2>
            <LandscapeStyleSelector
              selectedStyles={selectedLandscapeStyles}
              onStyleChange={setSelectedLandscapeStyles}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
            />
          </div>
        )}

        {/* Generate Button */}
        {uploadedImage && (
          <div className="mb-4">
            <Button
              size="lg"
              className="w-full text-white font-semibold py-4 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              style={{ 
                background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor}, ${primaryColor})`
              }}
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

      </div>
    </div>
  );
}