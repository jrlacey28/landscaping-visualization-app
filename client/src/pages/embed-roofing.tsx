
import { useState, useEffect } from "react";
import { useTenant } from "../hooks/use-tenant";
import StyleSelector from "../components/style-selector";
import { Button } from "../components/ui/button";
import { Upload, Sparkles, Download, Eye, Camera, Phone, XCircle } from "lucide-react";
import { SparklesText } from "@/components/ui/sparkles-text";
import { uploadImage, checkVisualizationStatus } from "../lib/api";

export default function EmbedRoofingPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const tenantSlug = urlParams.get('tenant') || 'demo';
  const primaryColor = urlParams.get('primaryColor') || '#475569';
  const secondaryColor = urlParams.get('secondaryColor') || '#64748b';
  const companyName = urlParams.get('companyName') || '';
  const showHeader = urlParams.get('showHeader') !== 'false';
  const contactType = urlParams.get('contactType') || 'phone';
  const contactLink = urlParams.get('contactLink') || '';
  
  const { tenant, isLoading: tenantLoading, error: tenantError } = useTenant(tenantSlug);

  // Check if tenant is active
  if (tenant && !tenant.active) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Service Temporarily Unavailable</h1>
          <p className="text-gray-600 mb-4">
            This service is currently not available. Please contact the company directly for assistance.
          </p>
          {tenant.phone && (
            <a 
              href={`tel:${tenant.phone.replace(/[\(\)\-\s]/g, '')}`}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Phone className="h-4 w-4 mr-2" />
              Call {tenant.phone}
            </a>
          )}
        </div>
      </div>
    );
  }
  
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [visualizationResult, setVisualizationResult] = useState<any>(null);
  const [showingOriginal, setShowingOriginal] = useState(false);
  
  const [selectedStyles, setSelectedStyles] = useState({
    roof: "",
    siding: "",
    surpriseMe: "",
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
      setVisualizationResult(null);
    }
  };

  if (tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-slate-900 to-gray-900">
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
              {companyName || tenant.companyName} Roofing & Siding Visualizer
            </h1>
            <p className="text-lg text-blue-100">
              Transform your home with AI-powered roofing and siding visualization
            </p>
          </div>
        )}

        {/* Image Upload */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 mb-4">
          <h2 className="text-xl font-semibold text-white mb-4 text-center">Upload Your Home Photo</h2>
          
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
                  src={visualizationResult?.status === "completed" && visualizationResult?.generatedImageUrl ? 
                    (showingOriginal ? uploadedImage : visualizationResult.generatedImageUrl) : 
                    uploadedImage}
                  alt={visualizationResult?.status === "completed" ? 
                    (showingOriginal ? "Original photo" : "Enhanced roofing design") : 
                    "Uploaded home"}
                  className="w-full h-full object-cover"
                />
                {isGenerating && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <SparklesText
                        text="Designing your perfect roof & siding..."
                        className="text-sm sm:text-lg lg:text-xl font-bold text-white whitespace-nowrap"
                        sparklesCount={12}
                        colors={{ first: primaryColor, second: secondaryColor }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Show buttons only after generation is complete */}
              {visualizationResult?.status === "completed" && visualizationResult?.generatedImageUrl ? (
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
                                  a.download = "roofing-design.jpg";
                                  a.click();
                                  URL.revokeObjectURL(url);
                                }
                              },
                              "image/jpeg",
                              0.9,
                            );
                          }
                        };
                        img.src = visualizationResult.generatedImageUrl;
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
                      {showingOriginal ? "View New Design" : "View Original Photo"}
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
                        setVisualizationResult(null);
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
                      if (contactType === 'link' && contactLink) {
                        window.open(contactLink, '_blank');
                      } else {
                        const contactPhone = tenant.contactPhone || tenant.phone || '(555) 123-4567';
                        const message = encodeURIComponent(`Hi! I'm interested in getting a free quote for roofing and siding. I just tried your visualizer and would like to discuss my project.`);
                        
                        if (contactPhone.startsWith('(') || contactPhone.startsWith('+')) {
                          const cleanPhone = contactPhone.replace(/[\(\)\-\s]/g, '');
                          window.open(`tel:${cleanPhone}`, '_self');
                        } else {
                          window.open(`mailto:${tenant.email || 'info@company.com'}?subject=Roofing & Siding Quote Request&body=${message}`, '_blank');
                        }
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
                    setVisualizationResult(null);
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
            <h2 className="text-xl font-semibold text-white mb-4">Choose Your Style</h2>
            <StyleSelector
              selectedStyles={selectedStyles}
              onStyleChange={setSelectedStyles}
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
                  selectedStyles.roof ||
                  selectedStyles.siding ||
                  selectedStyles.surpriseMe
                )
              }
              onClick={async () => {
                setIsGenerating(true);
                setVisualizationResult(null);
                
                try {
                  if (!originalFile) {
                    alert("Please re-upload your image.");
                    setIsGenerating(false);
                    return;
                  }

                  const result = await uploadImage(
                    originalFile,
                    tenant.id,
                    selectedStyles,
                  );

                  if (result.visualizationId) {
                    const status = await checkVisualizationStatus(
                      result.visualizationId,
                    );
                    setVisualizationResult(status);
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
                  Generate AI Roofing Design
                </>
              )}
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
