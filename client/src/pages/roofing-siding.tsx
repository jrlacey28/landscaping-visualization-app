import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Eye,
  Phone,
  Sparkles,
  Download,
  Camera,
  FileImage,
  Facebook,
  Youtube,
  Instagram,
  Edit,
} from "lucide-react";
import FileUpload from "@/components/ui/file-upload";
import ImageComparison from "@/components/ui/image-comparison";
import InpaintingCanvas from "@/components/ui/inpainting-canvas";
import StyleSelector from "@/components/style-selector";
import LeadCaptureForm from "@/components/lead-capture-form";
import Header from "@/components/header";
import { SparklesText } from "@/components/ui/sparkles-text";
import { useTenant } from "@/hooks/use-tenant";
import {
  uploadImage,
  checkVisualizationStatus,
  analyzeLandscapeImage,
} from "@/lib/api";

export default function RoofingSiding() {
  const { tenant, isLoading: tenantLoading } = useTenant();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState({
    roof: { enabled: false, type: "" },
    siding: { enabled: false, type: "" },
    surpriseMe: { enabled: false, type: "" },
  });
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [maskData, setMaskData] = useState<string | null>(null);
  const [showInpainting, setShowInpainting] = useState(false);
  const [showingOriginal, setShowingOriginal] = useState(false);
  const [visualizationResult, setVisualizationResult] = useState<any>(null); // Added to store visualization results
  const [isLoading, setIsLoading] = useState(false); // Added loading state for submission

  const handleAutoInpaint = async (imageUrl: string, maskData: string) => {
    // For the simplified Gemini workflow, direct users to use the main upload process
    alert(
      "Please use the 'Generate Visualization' button with your selected styles for the new streamlined AI processing.",
    );
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

  // Create fallback tenant if API call fails
  const effectiveTenant = tenant || {
    id: 1,
    userId: null,
    slug: "demo",
    companyName: "DreamBuilder",
    logoUrl: null,
    primaryColor: "#2563EB", 
    secondaryColor: "#059669",
    phone: null,
    email: null,
    address: null,
    description: "Professional AI-powered landscaping visualization services",
    showPricing: true,
    requirePhone: true,
    active: true,
    monthlyGenerationLimit: 1000,
    currentMonthGenerations: null,
    contactPhone: null,
    embedEnabled: false,
    embedCtaText: null,
    embedCtaPhone: null,
    embedCtaUrl: null,
    embedPrimaryColor: null,
    embedSecondaryColor: null,
    createdAt: new Date(),
  };

  const brandColors = {
    "--primary": effectiveTenant.primaryColor,
    "--secondary": effectiveTenant.secondaryColor,
  } as React.CSSProperties;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 flex flex-col"
      style={brandColors}
    >
      {/* Header with Services Menu */}
      <Header tenant={effectiveTenant} />

      {/* Hero Section with integrated flow */}
      <section className="py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-0">
            Visualize Your New Roof & Siding
            <span className="text-transparent bg-gradient-to-r from-blue-400 to-red-400 bg-clip-text block">
              Before You Build
            </span>
          </h2>
        </div>
      </section>

      {/* Main Application - Integrated Content */}
      <main className="flex-1 pb-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {!uploadedImage ? (
            <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-md">
              <CardContent className="p-12">
                <div className="text-center mb-8">
                  <h3 className="text-3xl font-bold text-slate-800 mb-4">
                    Upload Your Home Photo
                  </h3>
                  <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    Take or upload a clear photo of your home's exterior
                    to see amazing roofing and siding transformation possibilities
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
                    alt={
                      showingOriginal
                        ? "Original photo"
                        : "AI Generated roofing & siding design"
                    }
                    className="w-full aspect-video object-cover rounded-xl shadow-lg"
                  />
                </div>

                {/* Top row with three buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
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
                                a.download = "roofing-siding-design.jpg";
                                a.click();
                                URL.revokeObjectURL(url);
                              }
                            },
                            "image/jpeg",
                            0.9,
                          );
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
                    className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                    onClick={() => setShowingOriginal(!showingOriginal)}
                  >
                    <Eye className="h-5 w-5 mr-2" />
                    {showingOriginal
                      ? "View New Design"
                      : "View Original Photo"}
                  </Button>

                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                    onClick={() => {
                      setUploadedImage(null);
                      setGeneratedImage(null);
                      setSelectedStyles({
                        roof: { enabled: false, type: "" },
                        siding: { enabled: false, type: "" },
                        surpriseMe: { enabled: false, type: "" },
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
                  className="w-full bg-gradient-to-r from-[#718ae1] via-[#dc6d73] to-[#718ae1] hover:from-[#8299e8] hover:via-[#e67d84] hover:to-[#8299e8] text-white font-semibold py-4 shadow-lg hover:shadow-xl transition-all"
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
                {/* Just show the uploaded image at the top */}
                <div className="text-center mb-8">
                  <div className="max-w-4xl mx-auto relative">
                    <div className="relative overflow-hidden rounded-xl">
                      <img
                        src={uploadedImage}
                        alt="Uploaded house photo"
                        className="w-full aspect-video object-cover shadow-lg transition-all duration-300"
                      />
                      {isGenerating && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-xl flex items-center justify-center">
                          <div className="text-center">
                            <SparklesText
                              text="Measuring twice, rendering once..."
                              className="text-sm sm:text-lg lg:text-xl font-bold text-white whitespace-nowrap"
                              sparklesCount={12}
                              colors={{ first: "#3b82f6", second: "#ef4444" }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setUploadedImage(null);
                          setSelectedStyles({
                            roof: { enabled: false, type: "" },
                            siding: { enabled: false, type: "" },
                            surpriseMe: { enabled: false, type: "" },
                          });
                          setMaskData(null);
                        }}
                        className="border-slate-400 text-slate-600 hover:bg-slate-100"
                      >
                        <FileImage className="h-4 w-4 mr-2" />
                        Choose Different Photo
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Feature Selection Section */}
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">
                      Choose Your Features
                    </h3>
                    <p className="text-slate-600">
                      Select the roofing and siding options you'd like to see
                    </p>
                  </div>

                  <StyleSelector
                    selectedStyles={{
                      roof: selectedStyles.roof.type,
                      siding: selectedStyles.siding.type,
                      surpriseMe: selectedStyles.surpriseMe.type,
                    }}
                    onStyleChange={(styles) => {
                      setSelectedStyles({
                        roof: {
                          enabled: !!styles.roof,
                          type: styles.roof,
                        },
                        siding: {
                          enabled: !!styles.siding,
                          type: styles.siding,
                        },
                        surpriseMe: { enabled: !!styles.surpriseMe, type: styles.surpriseMe },
                      });
                    }}
                  />

                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-[#718ae1] via-[#dc6d73] to-[#718ae1] hover:from-[#8299e8] hover:via-[#e67d84] hover:to-[#8299e8] text-white font-semibold py-4 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={
                      isGenerating ||
                      !(
                        (selectedStyles.roof.enabled &&
                          selectedStyles.roof.type) ||
                        (selectedStyles.siding.enabled &&
                          selectedStyles.siding.type) ||
                        (selectedStyles.surpriseMe.enabled &&
                          selectedStyles.surpriseMe.type)
                      )
                    }
                    onClick={async () => {
                      setIsGenerating(true);
                      setVisualizationResult(null); // Clear previous results
                      try {
                        // Use original file to preserve maximum quality
                        if (!originalFile) {
                          alert(
                            "Original file not found. Please re-upload your image.",
                          );
                          setIsGenerating(false);
                          return;
                        }

                        // Upload image and generate AI visualization
                        const result = await uploadImage(
                          originalFile,
                          effectiveTenant.id,
                          selectedStyles,
                          maskData || undefined,
                        );

                        if (result.visualizationId) {
                          // Check status immediately since Gemini processes instantly
                          const status = await checkVisualizationStatus(
                            result.visualizationId,
                          );
                          setVisualizationResult(status); // Store status and URL

                          if (
                            status.status === "completed" &&
                            status.generatedImageUrl
                          ) {
                            // Gemini workflow completed immediately
                            setGeneratedImage(status.generatedImageUrl); // Set generatedImage for the other view
                            setIsGenerating(false);
                          } else if (status.status === "failed") {
                            console.error("AI generation failed");
                            setIsGenerating(false);
                            alert(
                              "Unable to generate visualization. Please check your connection and try again.",
                            );
                          } else {
                            // Fall back to polling for any edge cases
                            const pollInterval = setInterval(async () => {
                              try {
                                const polledStatus =
                                  await checkVisualizationStatus(
                                    result.visualizationId,
                                  );
                                setVisualizationResult(polledStatus); // Update visualizationResult during polling
                                if (
                                  polledStatus.status === "completed" &&
                                  polledStatus.generatedImageUrl
                                ) {
                                  setGeneratedImage(
                                    polledStatus.generatedImageUrl,
                                  ); // Set generatedImage for the other view
                                  setIsGenerating(false);
                                  clearInterval(pollInterval);
                                } else if (polledStatus.status === "failed") {
                                  console.error("AI generation failed");
                                  setIsGenerating(false);
                                  clearInterval(pollInterval);
                                  alert(
                                    "AI generation failed. Please try again or contact support if the issue persists.",
                                  );
                                }
                              } catch (error) {
                                console.error("Error checking status:", error);
                                setIsGenerating(false);
                                clearInterval(pollInterval);
                              }
                            }, 2000);

                            // Timeout after 1 minute (reduced since Gemini is fast)
                            setTimeout(() => {
                              clearInterval(pollInterval);
                              if (isGenerating) {
                                setIsGenerating(false);
                                alert(
                                  "Processing timed out. Please try again.",
                                );
                              }
                            }, 60000);
                          }
                        }
                      } catch (error) {
                        console.error("Error generating visualization:", error);
                        setIsGenerating(false);
                        alert(
                          "Unable to generate visualization. Please check that your Replicate account has billing enabled and try again.",
                        );
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

                  {(!selectedStyles.roof.enabled ||
                    !selectedStyles.roof.type) &&
                    (!selectedStyles.siding.enabled ||
                      !selectedStyles.siding.type) &&
                    (!selectedStyles.surpriseMe.enabled ||
                      !selectedStyles.surpriseMe.type) && (
                      <p className="text-sm text-slate-500 text-center">
                        Please select at least one feature option to generate
                        your design
                      </p>
                    )}
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </main>

      {/* Simplified Footer */}
      <footer className="bg-slate-900/50 border-t border-slate-700">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col space-y-6 md:flex md:flex-row md:justify-between md:items-center md:space-y-0">
            {/* Left side - Logo and company */}
            <Link 
              href="/"
              className="flex items-center justify-center md:justify-start space-x-3 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <svg
                className="w-10 h-10 text-white"
                viewBox="0 0 128.37 135.86"
                fill="currentColor"
              >
                <path fill="#fff" d="M111.98,78.77L56.63,23.24.92,78.76c-1.23,1.22-1.23,3.21,0,4.44,1.22,1.23,3.21,1.23,4.43,0l10.33-10.3v59.82c0,1.73,1.4,3.14,3.14,3.14h21.95c1.73,0,3.14-1.4,3.14-3.14v-25.09c0-3.46,2.81-6.27,6.27-6.27h12.54c3.46,0,6.27,2.81,6.27,6.27v25.09c0,1.73,1.4,3.14,3.14,3.14h21.95c1.73,0,3.14-1.4,3.14-3.14v-59.89l10.32,10.36c1.22,1.23,3.21,1.23,4.43,0,1.23-1.22,1.23-3.21,0-4.43Z"/>
                <path fill="#fff" d="M102.82,0c-2.69,20.69-4.87,22.87-25.55,25.55,20.69,2.69,22.87,4.87,25.55,25.55,2.69-20.69,4.87-22.87,25.55-25.55-20.69-2.69-22.87-4.87-25.55-25.55Z"/>
              </svg>
              <div>
                <p className="text-white font-semibold">{effectiveTenant.companyName}</p>
                <p className="text-slate-400 text-sm">
                Powered by Solst LLC
                </p>
              </div>
            </Link>


            {/* Right side - Social icons */}
            <div className="flex items-center justify-center space-x-4 md:justify-end">
              <a
                href="#"
                className="text-slate-400 hover:text-blue-400 transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-slate-400 hover:text-red-400 transition-colors"
              >
                <Youtube className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-slate-400 hover:text-blue-400 transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Lead Capture Modal */}
      {showLeadForm && (
        <LeadCaptureForm
          tenant={effectiveTenant}
          onClose={() => setShowLeadForm(false)}
          selectedStyles={selectedStyles}
          originalImageUrl={uploadedImage}
          generatedImageUrl={generatedImage}
        />
      )}
    </div>
  );
}