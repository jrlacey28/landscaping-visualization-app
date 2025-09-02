import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  Phone,
  Sparkles,
  Download,
  Camera,
  FileImage,
  Facebook,
  Twitter,
  Instagram,
  Edit,
} from "lucide-react";
import FileUpload from "@/components/ui/file-upload";
import ImageComparison from "@/components/ui/image-comparison";
import InpaintingCanvas from "@/components/ui/inpainting-canvas";
import StyleSelector from "@/components/style-selector";
import LeadCaptureForm from "@/components/lead-capture-form";
import { SparklesText } from "@/components/ui/sparkles-text";
import { useTenant } from "@/hooks/use-tenant";
import {
  uploadImage,
  checkVisualizationStatus,
  analyzeLandscapeImage,
} from "@/lib/api";

export default function Home() {
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

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold text-destructive mb-2">
              Service Unavailable
            </h1>
            <p className="text-muted-foreground">
              This roofing and siding visualization service is not available at this
              domain.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const brandColors = {
    "--primary": tenant.primaryColor,
    "--secondary": tenant.secondaryColor,
  } as React.CSSProperties;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900"
      style={brandColors}
    >
      {/* Integrated Header */}
      <header className="relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              {/* Logo */}
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 21l9-18 9 18H3z M12 2v19"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {tenant.companyName}
                </h1>
                <p className="text-sm text-slate-300">Powered by Solst LLC</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a
                href="#services"
                className="text-slate-300 hover:text-blue-400 transition-colors"
              >
                Services
              </a>
              <a
                href="#gallery"
                className="text-slate-300 hover:text-blue-400 transition-colors"
              >
                Gallery
              </a>
              <a
                href="#contact"
                className="text-slate-300 hover:text-blue-400 transition-colors"
              >
                Contact
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section with integrated flow */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Visualize Your New Roof & Siding
            <span className="text-transparent bg-gradient-to-r from-blue-400 to-red-400 bg-clip-text block">
              Before You Build
            </span>
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
            Upload a photo of your home and see exactly how our professional
            roofing, siding, and exterior services will transform your
            property using advanced AI visualization.
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
                <div className="grid grid-cols-3 gap-4 mb-4">
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
                  className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold py-4 shadow-lg hover:shadow-xl transition-all"
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
                              className="text-xl font-bold text-white whitespace-nowrap"
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
                <div className="space-y-6">
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
                          tenant.id,
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

          {/* Render visualization results */}
          {visualizationResult && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4 text-center text-white">
                Your Roofing & Siding Design
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-2 text-white">
                    Original
                  </h4>
                  <img
                    src={uploadedImage || ""}
                    alt="Original"
                    className="w-full h-auto rounded-lg shadow-md"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2 text-white">
                    Enhanced Design
                  </h4>
                  {visualizationResult.status === "completed" &&
                  visualizationResult.generatedImageUrl ? (
                    <img
                      src={visualizationResult.generatedImageUrl}
                      alt="Enhanced roofing & siding design"
                      className="w-full h-auto rounded-lg shadow-md"
                      onError={(e) => {
                        console.error(
                          "Image failed to load:",
                          visualizationResult.generatedImageUrl,
                        );
                        e.currentTarget.style.display = "none";
                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                        if (nextElement) nextElement.style.display = "flex";
                      }}
                    />
                  ) : visualizationResult.status === "failed" ? (
                    <div className="w-full h-64 bg-red-50 border-2 border-red-200 rounded-lg flex items-center justify-center">
                      <p className="text-red-600">
                        Generation failed. Please try again.
                      </p>
                    </div>
                  ) : (
                    <div className="w-full h-64 bg-slate-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-slate-600">
                          Generating your roofing & siding design...
                        </p>
                      </div>
                    </div>
                  )}
                  <div
                    className="w-full h-64 bg-yellow-50 border-2 border-yellow-200 rounded-lg flex-col items-center justify-center text-center p-4"
                    style={{ display: "none" }}
                  >
                    <p className="text-yellow-700 mb-2">
                      Image failed to display
                    </p>
                    <p className="text-xs text-yellow-600">
                      URL: {visualizationResult.generatedImageUrl}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() =>
                        window.open(
                          visualizationResult.generatedImageUrl,
                          "_blank",
                        )
                      }
                    >
                      Open in New Tab
                    </Button>
                  </div>
                </div>
              </div>

              {visualizationResult.status === "completed" && (
                <div className="text-center mt-6">
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      Applied styles:{" "}
                      {(() => {
                        const appliedStyles = [];
                        if (
                          selectedStyles.roof.enabled &&
                          selectedStyles.roof.type
                        ) {
                          appliedStyles.push(
                            "Roof: " + selectedStyles.roof.type
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase()),
                          );
                        }
                        if (
                          selectedStyles.siding.enabled &&
                          selectedStyles.siding.type
                        ) {
                          appliedStyles.push(
                            "Siding: " + selectedStyles.siding.type
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase()),
                          );
                        }
                        if (
                          selectedStyles.surpriseMe.enabled &&
                          selectedStyles.surpriseMe.type
                        ) {
                          appliedStyles.push(
                            "Surprise Me: Random roof and siding selection"
                          );
                        }
                        return appliedStyles.length > 0
                          ? appliedStyles.join(", ")
                          : "No styles applied";
                      })()}
                    </p>
                    {visualizationResult.prompt && (
                      <details className="mt-2">
                        <summary className="text-xs text-blue-600 cursor-pointer">
                          View Prompt Details
                        </summary>
                        <p className="text-xs text-blue-600 mt-1 whitespace-pre-wrap">
                          {visualizationResult.prompt}
                        </p>
                      </details>
                    )}
                  </div>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold py-4 px-8 shadow-lg hover:shadow-xl transition-all"
                    onClick={() => setShowLeadForm(true)}
                  >
                    <Phone className="h-5 w-5 mr-2" />
                    Get Free Quote for This Design
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Simplified Footer */}
      <footer className="bg-slate-900/50 border-t border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Left side - Logo and company */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-red-500 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 21l9-18 9 18H3z M12 2v19"
                  />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold">{tenant.companyName}</p>
                <p className="text-slate-400 text-sm">
                Powered by Solst LLC
                </p>
              </div>
            </div>

            {/* Center - Links */}
            <div className="flex items-center space-x-6">
              <a
                href="#pricing"
                className="text-slate-300 hover:text-blue-400 transition-colors"
              >
                Pricing
              </a>
              <a
                href="#terms"
                className="text-slate-300 hover:text-blue-400 transition-colors"
              >
                Terms
              </a>
              <a
                href="#contact"
                className="text-slate-300 hover:text-blue-400 transition-colors"
              >
                Contact
              </a>
              <a
                href="#privacy"
                className="text-slate-300 hover:text-blue-400 transition-colors"
              >
                Privacy
              </a>
            </div>

            {/* Right side - Social icons */}
            <div className="flex items-center space-x-4">
              <a
                href="#"
                className="text-slate-400 hover:text-blue-400 transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-slate-400 hover:text-blue-400 transition-colors"
              >
                <Twitter className="h-5 w-5" />
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
