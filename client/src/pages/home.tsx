import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Phone, Sparkles, Download, Camera, FileImage, Facebook, Twitter, Instagram, Edit } from "lucide-react";
import FileUpload from "@/components/ui/file-upload";
import ImageComparison from "@/components/ui/image-comparison";
import InpaintingCanvas from "@/components/ui/inpainting-canvas";
import StyleSelector from "@/components/style-selector";
import LeadCaptureForm from "@/components/lead-capture-form";
import { useTenant } from "@/hooks/use-tenant";
import { uploadImage, checkVisualizationStatus, analyzeLandscapeImage } from "@/lib/api";

export default function Home() {
  const { tenant, isLoading: tenantLoading } = useTenant();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState({
    curbing: { enabled: false, type: "" },
    landscape: { enabled: false, type: "" },
    patio: { enabled: false, type: "" },
  });
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [maskData, setMaskData] = useState<string | null>(null);
  const [showInpainting, setShowInpainting] = useState(false);
  const [showingOriginal, setShowingOriginal] = useState(false);

  const handleAutoInpaint = async (imageUrl: string, maskData: string) => {
    // For the simplified Gemini workflow, direct users to use the main upload process
    alert("Please use the 'Generate Visualization' button with your selected styles for the new streamlined AI processing.");
    setIsGenerating(false);
  };

  if (tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold text-destructive mb-2">Service Unavailable</h1>
            <p className="text-muted-foreground">
              This landscaping visualization service is not available at this domain.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const brandColors = {
    '--primary': tenant.primaryColor,
    '--secondary': tenant.secondaryColor,
  } as React.CSSProperties;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-800 via-stone-700 to-stone-900" style={brandColors}>
      {/* Integrated Header */}
      <header className="relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              {/* Logo */}
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{tenant.companyName}</h1>
                <p className="text-sm text-stone-300">Powered by YardVision Pro</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#services" className="text-stone-300 hover:text-amber-400 transition-colors">Services</a>
              <a href="#gallery" className="text-stone-300 hover:text-amber-400 transition-colors">Gallery</a>
              <a href="#contact" className="text-stone-300 hover:text-amber-400 transition-colors">Contact</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section with integrated flow */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Visualize Your Dream Landscape
            <span className="text-transparent bg-gradient-to-r from-amber-400 to-green-400 bg-clip-text block">Before You Build</span>
          </h2>
          <p className="text-xl text-stone-300 mb-8 max-w-3xl mx-auto">
            Upload a photo of your home and see exactly how our professional landscaping, concrete, and curbing services will transform your property using advanced AI visualization.
          </p>
        </div>
      </section>

      {/* Main Application - Integrated Content */}
      <main className="pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {!uploadedImage ? (
            <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-md">
              <CardContent className="p-12">
                <div className="text-center mb-8">
                  <h3 className="text-3xl font-bold text-stone-800 mb-4">Upload Your Home Photo</h3>
                  <p className="text-lg text-stone-600 max-w-2xl mx-auto">
                    Take or upload a clear photo of your home's front or back yard to see amazing transformation possibilities
                  </p>
                </div>
                <FileUpload 
                  onFileSelect={(file, previewUrl) => {
                    setOriginalFile(file);
                    setUploadedImage(previewUrl);
                  }} 
                  uploadedImage={uploadedImage} 
                />


            </CardContent>
          </Card>
          ) : generatedImage ? (
            <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-md">
              <CardContent className="p-8">
                <div className="mb-6">
                  <img
                    src={showingOriginal ? uploadedImage : generatedImage}
                    alt={showingOriginal ? "Original photo" : "AI Generated landscape design"}
                    className="w-full aspect-video object-cover rounded-xl shadow-lg"
                  />
                </div>

                {/* Top row with three buttons */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                    onClick={() => {
                      const img = document.createElement('img');
                      img.crossOrigin = 'anonymous';
                      img.onload = function() {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                          canvas.width = img.width;
                          canvas.height = img.height;
                          ctx.drawImage(img, 0, 0);
                          canvas.toBlob((blob) => {
                            if (blob) {
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = 'landscape-design.jpg';
                              a.click();
                              URL.revokeObjectURL(url);
                            }
                          }, 'image/jpeg', 0.9);
                        }
                      };
                      img.src = generatedImage;
                    }}
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download Image
                  </Button>

                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-stone-500 to-stone-600 hover:from-stone-600 hover:to-stone-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                    onClick={() => setShowingOriginal(!showingOriginal)}
                  >
                    <Eye className="h-5 w-5 mr-2" />
                    {showingOriginal ? "View New Design" : "View Original Photo"}
                  </Button>

                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                    onClick={() => {
                      setUploadedImage(null);
                      setGeneratedImage(null);
                      setSelectedStyles({
                        curbing: { enabled: false, type: "" },
                        landscape: { enabled: false, type: "" },
                        patio: { enabled: false, type: "" },
                      });
                    }}
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    Try Another Photo
                  </Button>
                </div>

                {/* Get Free Quote button */}
                <Button 
                  size="lg" 
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-4 shadow-lg hover:shadow-xl transition-all"
                  onClick={() => setShowLeadForm(true)}
                >
                  <Phone className="h-5 w-5 mr-2" />
                  Get Free Quote
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-md">
              <CardContent className="p-8">
                {/* Center Image with Inpainting */}
                <div className="text-center mb-8">
                  <div className="max-w-4xl mx-auto">
                    <InpaintingCanvas
                      imageUrl={uploadedImage}
                      originalFile={originalFile}
                      onMaskChange={setMaskData}
                      onAutoInpaint={handleAutoInpaint}
                    />
                    <div className="flex justify-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setUploadedImage(null);
                          setSelectedStyles({
                            curbing: { enabled: false, type: "" },
                            landscape: { enabled: false, type: "" },
                            patio: { enabled: false, type: "" },
                          });
                          setMaskData(null);
                        }}
                        className="border-stone-400 text-stone-600 hover:bg-stone-100"
                      >
                        <FileImage className="h-4 w-4 mr-2" />
                        Choose Different Photo
                      </Button>
                    </div>
                    {maskData && (
                      <Badge variant="secondary" className="mt-2">
                        Areas selected for modification ✓
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Feature Selection Section */}
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-stone-800 mb-2">Choose Your Features</h3>
                    <p className="text-stone-600">Select the landscaping options you'd like to see</p>
                  </div>

                  <StyleSelector
                    selectedStyles={{
                      curbing: selectedStyles.curbing.type,
                      landscape: selectedStyles.landscape.type,
                      patio: selectedStyles.patio.type,
                    }}
                    onStyleChange={(styles) => {
                      setSelectedStyles({
                        curbing: { enabled: !!styles.curbing, type: styles.curbing },
                        landscape: { enabled: !!styles.landscape, type: styles.landscape },
                        patio: { enabled: !!styles.patio, type: styles.patio },
                      });
                    }}
                  />

                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-amber-600 to-green-600 hover:from-amber-700 hover:to-green-700 text-white font-semibold py-4 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isGenerating || !(
                      (selectedStyles.curbing.enabled && selectedStyles.curbing.type) ||
                      (selectedStyles.landscape.enabled && selectedStyles.landscape.type) ||
                      (selectedStyles.patio.enabled && selectedStyles.patio.type)
                    )}
                    onClick={async () => {
                      setIsGenerating(true);
                      try {
                        // Use original file to preserve maximum quality
                        if (!originalFile) {
                          alert("Original file not found. Please re-upload your image.");
                          setIsGenerating(false);
                          return;
                        }

                        // Upload image and generate AI visualization
                        const result = await uploadImage(originalFile, tenant.id, selectedStyles, maskData || undefined);

                        if (result.visualizationId) {
                          // Poll for completion
                          const pollInterval = setInterval(async () => {
                            try {
                              const status = await checkVisualizationStatus(result.visualizationId);
                              if (status.status === "completed" && status.generatedImageUrl) {
                                setGeneratedImage(status.generatedImageUrl);
                                setIsGenerating(false);
                                clearInterval(pollInterval);
                              } else if (status.status === "failed") {
                                console.error("AI generation failed");
                                setIsGenerating(false);
                                clearInterval(pollInterval);
                                alert("AI generation failed. Please try again or contact support if the issue persists.");
                              }
                            } catch (error) {
                              console.error("Error checking status:", error);
                              setIsGenerating(false);
                              clearInterval(pollInterval);
                            }
                          }, 2000);

                          // Timeout after 2 minutes
                          setTimeout(() => {
                            clearInterval(pollInterval);
                            if (isGenerating) {
                              setIsGenerating(false);
                              setGeneratedImage("https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600");
                            }
                          }, 120000);
                        }
                      } catch (error) {
                        console.error("Error generating visualization:", error);
                        setIsGenerating(false);
                        alert("Unable to generate visualization. Please check that your Replicate account has billing enabled and try again.");
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
                        Generate AI Design
                      </>
                    )}
                  </Button>

                  {(!selectedStyles.curbing.enabled || !selectedStyles.curbing.type) &&
                   (!selectedStyles.landscape.enabled || !selectedStyles.landscape.type) &&
                   (!selectedStyles.patio.enabled || !selectedStyles.patio.type) && (
                    <p className="text-sm text-stone-500 text-center">
                      Please select at least one feature option to generate your design
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Simplified Footer */}
      <footer className="bg-stone-900/50 border-t border-stone-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Left side - Logo and company */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-green-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold">{tenant.companyName}</p>
                <p className="text-stone-400 text-sm">Professional Landscaping</p>
              </div>
            </div>

            {/* Center - Links */}
            <div className="flex items-center space-x-6">
              <a href="#pricing" className="text-stone-300 hover:text-amber-400 transition-colors">Pricing</a>
              <a href="#terms" className="text-stone-300 hover:text-amber-400 transition-colors">Terms</a>
              <a href="#contact" className="text-stone-300 hover:text-amber-400 transition-colors">Contact</a>
              <a href="#privacy" className="text-stone-300 hover:text-amber-400 transition-colors">Privacy</a>
            </div>

            {/* Right side - Social icons */}
            <div className="flex items-center space-x-4">
              <a href="#" className="text-stone-400 hover:text-amber-400 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-stone-400 hover:text-amber-400 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-stone-400 hover:text-amber-400 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Lead Capture Modal */}
      {showLeadForm && (
        <LeadCaptureForm
          tenant={tenant}
          onClose={() => setShowLeadForm(false)}
          selectedStyles={selectedStyles}
          originalImageUrl={uploadedImage}
          generatedImageUrl={generatedImage}
        />
      )}


    </div>
  );
}