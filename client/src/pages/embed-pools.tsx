
import { useState, useEffect } from "react";
import { useTenant } from "../hooks/use-tenant";
import PoolStyleSelector from "../components/pool-style-selector";
import { Button } from "../components/ui/button";
import { Upload, Sparkles, Download, Eye, Camera, Phone } from "lucide-react";
import { SparklesText } from "@/components/ui/sparkles-text";
import { uploadPoolImage, checkPoolVisualizationStatus } from "../lib/api";

export default function EmbedPoolsPage() {
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
  const [poolVisualizationResult, setPoolVisualizationResult] = useState<any>(null);
  const [showingOriginal, setShowingOriginal] = useState(false);
  
  const [selectedPoolStyles, setSelectedPoolStyles] = useState({
    poolType: "",
    poolSize: "",
    decking: "",
    landscaping: "",
    features: "",
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
      setPoolVisualizationResult(null);
    }
  };

  if (tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-900 via-blue-900 to-indigo-900">
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
    <div className="min-h-screen p-4" style={{ background: `linear-gradient(to bottom right, ${primaryColor}dd, ${secondaryColor}dd, ${primaryColor}cc)` }}>
      <div className="max-w-4xl mx-auto">
        {showHeader && (
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {companyName || tenant.companyName} Pool Visualizer
            </h1>
            <p className="text-lg text-cyan-100">
              Transform your backyard with AI-powered pool design visualization
            </p>
          </div>
        )}

        {/* Image Upload */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4 text-center">Upload Your Backyard Photo</h2>
          
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
                  src={poolVisualizationResult?.status === "completed" && poolVisualizationResult?.generatedImageUrl ? 
                    (showingOriginal ? uploadedImage : poolVisualizationResult.generatedImageUrl) : 
                    uploadedImage}
                  alt={poolVisualizationResult?.status === "completed" ? 
                    (showingOriginal ? "Original photo" : "Enhanced pool design") : 
                    "Uploaded backyard"}
                  className="w-full h-full object-cover"
                />
                {isGenerating && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <SparklesText
                        text="Designing your perfect pool area..."
                        className="text-sm sm:text-lg lg:text-xl font-bold text-white whitespace-nowrap"
                        sparklesCount={12}
                        colors={{ first: primaryColor, second: secondaryColor }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Show buttons only after generation is complete */}
              {poolVisualizationResult?.status === "completed" && poolVisualizationResult?.generatedImageUrl ? (
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
                                  a.download = "pool-design.jpg";
                                  a.click();
                                  URL.revokeObjectURL(url);
                                }
                              },
                              "image/jpeg",
                              0.9,
                            );
                          }
                        };
                        img.src = poolVisualizationResult.generatedImageUrl;
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
                      {showingOriginal ? "View Pool Design" : "View Original Photo"}
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
                        setPoolVisualizationResult(null);
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
                      const message = encodeURIComponent(`Hi! I'm interested in getting a free quote for pool installation. I just tried your pool visualizer and would like to discuss my project.`);
                      
                      if (contactPhone.startsWith('(') || contactPhone.startsWith('+')) {
                        const cleanPhone = contactPhone.replace(/[\(\)\-\s]/g, '');
                        window.open(`tel:${cleanPhone}`, '_self');
                      } else {
                        window.open(`mailto:${tenant.email || 'info@company.com'}?subject=Pool Installation Quote Request&body=${message}`, '_blank');
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
                    setPoolVisualizationResult(null);
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
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Choose Your Pool Style</h2>
            <PoolStyleSelector
              selectedStyles={selectedPoolStyles}
              onStyleChange={setSelectedPoolStyles}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
            />
          </div>
        )}

        {/* Generate Button */}
        {uploadedImage && (
          <div className="mb-6">
            <Button
              size="lg"
              className="w-full text-white font-semibold py-4 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              style={{ 
                background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor}, ${primaryColor})`
              }}
              disabled={
                isGenerating ||
                !(
                  selectedPoolStyles.poolType ||
                  selectedPoolStyles.poolSize ||
                  selectedPoolStyles.decking ||
                  selectedPoolStyles.landscaping ||
                  selectedPoolStyles.features
                )
              }
              onClick={async () => {
                setIsGenerating(true);
                setPoolVisualizationResult(null);
                
                try {
                  if (!originalFile) {
                    alert("Please re-upload your image.");
                    setIsGenerating(false);
                    return;
                  }

                  const result = await uploadPoolImage(
                    originalFile,
                    tenant.id,
                    selectedPoolStyles,
                  );

                  if (result.poolVisualizationId) {
                    const status = await checkPoolVisualizationStatus(
                      result.poolVisualizationId,
                    );
                    setPoolVisualizationResult(status);
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
                  Generating Your Pool Design...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate AI Pool Design
                </>
              )}
            </Button>
          </div>
        )}

        {/* Processing Status - only show when generating */}
        {isGenerating && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
            <div className="w-full aspect-video bg-cyan-50 border-2 border-cyan-200 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-cyan-600">Generating design...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
