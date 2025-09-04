import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import FileUpload from "@/components/ui/file-upload";
import PoolStyleSelector from "@/components/pool-style-selector";
import LeadCaptureForm from "@/components/lead-capture-form";
import Header from "@/components/header";
import { SparklesText } from "@/components/ui/sparkles-text";
import { useTenant } from "@/hooks/use-tenant";
import {
  uploadPoolImage,
  checkPoolVisualizationStatus,
} from "@/lib/api";

export default function Pools() {
  const { tenant, isLoading: tenantLoading } = useTenant();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPoolStyles, setSelectedPoolStyles] = useState({
    poolType: "",
    poolSize: "",
    decking: "",
    landscaping: "",
    features: "",
  });
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [showingOriginal, setShowingOriginal] = useState(false);
  const [poolVisualizationResult, setPoolVisualizationResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

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
              This pool visualization service is not available at this
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
      className="min-h-screen bg-gradient-to-br from-blue-800 via-cyan-700 to-green-700"
      style={brandColors}
    >
      {/* Header with Services Menu */}
      <Header tenant={tenant} />

      {/* Hero Section with integrated flow */}
      <section className="py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-0">
            Visualize Your New Pool
            <span className="text-transparent bg-gradient-to-r from-cyan-200 to-green-200 bg-clip-text block font-extrabold drop-shadow-lg">
              Before You Build
            </span>
          </h2>
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
                    Upload Your Backyard Photo
                  </h3>
                  <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    Take or upload a clear photo of your backyard
                    to see amazing pool design possibilities
                  </p>
                </div>
                <FileUpload
                  onFileSelect={(file, previewUrl) => {
                    setOriginalFile(file);
                    setUploadedImage(previewUrl);
                  }}
                  uploadedImage={uploadedImage}
                  theme="pool"
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
                        : "AI Generated pool design"
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
                      ? "View Pool Design"
                      : "View Original Photo"}
                  </Button>

                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                    onClick={() => {
                      setUploadedImage(null);
                      setGeneratedImage(null);
                      setSelectedPoolStyles({
                        poolType: "",
                        poolSize: "",
                        decking: "",
                        landscaping: "",
                        features: "",
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
                  className="w-full bg-gradient-to-r from-blue-600 via-green-500 to-blue-600 hover:from-blue-700 hover:via-green-600 hover:to-blue-700 text-white font-semibold py-4 shadow-lg hover:shadow-xl transition-all"
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
                        alt="Uploaded backyard photo"
                        className="w-full aspect-video object-cover shadow-lg transition-all duration-300"
                      />
                      {isGenerating && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-xl flex items-center justify-center">
                          <div className="text-center">
                            <SparklesText
                              text="Designing your perfect pool oasis..."
                              className="text-sm sm:text-lg lg:text-xl font-bold text-white whitespace-nowrap"
                              sparklesCount={12}
                              colors={{ first: "#3b82f6", second: "#06b6d4" }}
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
                          setSelectedPoolStyles({
                            poolType: "",
                            poolSize: "",
                            decking: "",
                            landscaping: "",
                            features: "",
                          });
                        }}
                        className="border-slate-400 text-slate-600 hover:bg-slate-100"
                      >
                        <FileImage className="h-4 w-4 mr-2" />
                        Choose Different Photo
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Pool Feature Selection Section */}
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">
                      Choose Your Pool Features
                    </h3>
                    <p className="text-slate-600">
                      Select the pool options you'd like to see in your backyard
                    </p>
                  </div>

                  <PoolStyleSelector
                    selectedStyles={selectedPoolStyles}
                    onStyleChange={setSelectedPoolStyles}
                  />

                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-blue-600 via-green-500 to-blue-600 hover:from-blue-700 hover:via-green-600 hover:to-blue-700 text-white font-semibold py-4 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                        // Use original file to preserve maximum quality
                        if (!originalFile) {
                          alert(
                            "Original file not found. Please re-upload your image.",
                          );
                          setIsGenerating(false);
                          return;
                        }

                        // Upload image and generate pool AI visualization
                        const result = await uploadPoolImage(
                          originalFile,
                          tenant.id,
                          selectedPoolStyles,
                        );

                        if (result.poolVisualizationId) {
                          // Check status immediately since Gemini processes instantly
                          const status = await checkPoolVisualizationStatus(
                            result.poolVisualizationId,
                          );
                          setPoolVisualizationResult(status);

                          if (
                            status.status === "completed" &&
                            status.generatedImageUrl
                          ) {
                            // Gemini workflow completed immediately
                            setGeneratedImage(status.generatedImageUrl);
                            setIsGenerating(false);
                          } else if (status.status === "failed") {
                            console.error("Pool AI generation failed");
                            setIsGenerating(false);
                            alert(
                              "Unable to generate pool visualization. Please check your connection and try again.",
                            );
                          } else {
                            // Fall back to polling for any edge cases
                            const pollInterval = setInterval(async () => {
                              try {
                                const polledStatus =
                                  await checkPoolVisualizationStatus(
                                    result.poolVisualizationId,
                                  );
                                setPoolVisualizationResult(polledStatus);
                                if (
                                  polledStatus.status === "completed" &&
                                  polledStatus.generatedImageUrl
                                ) {
                                  setGeneratedImage(
                                    polledStatus.generatedImageUrl,
                                  );
                                  setIsGenerating(false);
                                  clearInterval(pollInterval);
                                } else if (polledStatus.status === "failed") {
                                  console.error("Pool AI generation failed");
                                  setIsGenerating(false);
                                  clearInterval(pollInterval);
                                  alert(
                                    "Pool AI generation failed. Please try again or contact support if the issue persists.",
                                  );
                                }
                              } catch (error) {
                                console.error("Error checking pool status:", error);
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
                        console.error("Error generating pool visualization:", error);
                        setIsGenerating(false);
                        alert(
                          "Unable to generate pool visualization. Please check your connection and try again.",
                        );
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

                  {!selectedPoolStyles.poolType &&
                    !selectedPoolStyles.poolSize &&
                    !selectedPoolStyles.decking &&
                    !selectedPoolStyles.landscaping &&
                    !selectedPoolStyles.features && (
                      <p className="text-sm text-slate-500 text-center">
                        Please select at least one pool feature option to generate
                        your design
                      </p>
                    )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Render pool visualization results */}
          {poolVisualizationResult && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4 text-center text-white">
                Your Pool Design
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
                    Pool Design
                  </h4>
                  {poolVisualizationResult.status === "completed" &&
                  poolVisualizationResult.generatedImageUrl ? (
                    <img
                      src={poolVisualizationResult.generatedImageUrl}
                      alt="Enhanced pool design"
                      className="w-full h-auto rounded-lg shadow-md"
                      onError={(e) => {
                        console.error(
                          "Image failed to load:",
                          poolVisualizationResult.generatedImageUrl,
                        );
                        e.currentTarget.style.display = "none";
                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                        if (nextElement) nextElement.style.display = "flex";
                      }}
                    />
                  ) : poolVisualizationResult.status === "failed" ? (
                    <div className="w-full h-64 bg-red-50 border-2 border-red-200 rounded-lg flex items-center justify-center">
                      <p className="text-red-600">
                        Pool design generation failed
                      </p>
                    </div>
                  ) : (
                    <div className="w-full h-64 bg-blue-50 border-2 border-blue-200 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-blue-600">Generating pool design...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Lead Capture Form Modal */}
      {showLeadForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <LeadCaptureForm
              tenant={tenant}
              originalImageUrl={uploadedImage}
              generatedImageUrl={generatedImage}
              selectedStyles={selectedPoolStyles}
              onClose={() => setShowLeadForm(false)}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-900/50 border-t border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col space-y-6 md:grid md:grid-cols-3 md:items-center md:space-y-0">
            {/* Left side - Logo and company */}
            <div className="flex items-center justify-center space-x-3 md:justify-start">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  viewBox="0 0 128.37 135.86"
                  fill="currentColor"
                  style={{ transform: 'translate(0.5px, -0.5px)' }}
                >
                  <path fill="#fff" d="M111.98,78.77L56.63,23.24.92,78.76c-1.23,1.22-1.23,3.21,0,4.44,1.22,1.23,3.21,1.23,4.43,0l10.33-10.3v59.82c0,1.73,1.4,3.14,3.14,3.14h21.95c1.73,0,3.14-1.4,3.14-3.14v-25.09c0-3.46,2.81-6.27,6.27-6.27h12.54c3.46,0,6.27,2.81,6.27,6.27v25.09c0,1.73,1.4,3.14,3.14,3.14h21.95c1.73,0,3.14-1.4,3.14-3.14v-59.89l10.32,10.36c1.22,1.23,3.21,1.23,4.43,0,1.23-1.22,1.23-3.21,0-4.43Z"/>
                  <path fill="#fff" d="M102.82,0c-2.69,20.69-4.87,22.87-25.55,25.55,20.69,2.69,22.87,4.87,25.55,25.55,2.69-20.69,4.87-22.87,25.55-25.55-20.69-2.69-22.87-4.87-25.55-25.55Z"/>
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold">{tenant.companyName}</p>
                <p className="text-slate-400 text-sm">
                  Powered by Solst LLC
                </p>
              </div>
            </div>

            {/* Center - Business Info */}
            <div className="flex flex-col items-center space-y-2 text-center md:flex-row md:justify-center md:space-y-0 md:space-x-6">
              {tenant.address && (
                <p className="text-slate-300 text-sm">
                  {tenant.address}
                </p>
              )}
              {tenant.phone && (
                <p className="text-slate-300 text-sm">
                  {tenant.phone}
                </p>
              )}
            </div>

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
    </div>
  );
}