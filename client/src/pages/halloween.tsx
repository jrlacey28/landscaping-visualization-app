import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Sparkles,
  Download,
  Camera,
  FileImage,
  Ghost,
  Share2,
} from "lucide-react";
import FileUpload from "@/components/ui/file-upload";
import Header from "@/components/header";
import { SparklesText } from "@/components/ui/sparkles-text";
import { useTenant } from "@/hooks/use-tenant";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  uploadHalloweenImage,
  checkHalloweenVisualizationStatus,
} from "@/lib/api";

export default function Halloween() {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showingOriginal, setShowingOriginal] = useState(false);

  const effectiveTenant = tenant || {
    id: 1,
    slug: "demo",
    companyName: "DreamBuilder",
    logoUrl: null,
    primaryColor: "#7c3aed",
    secondaryColor: "#ea580c",
    phone: "(555) 123-4567",
    contactPhone: null,
    email: "info@dreambuilder.com",
    address: "123 Main St, Anytown USA",
    description: "Professional AI-powered Halloween visualization services",
    showPricing: true,
    requirePhone: true,
    active: true,
    userId: null,
    embedEnabled: false,
    embedCtaText: null,
    embedCtaPhone: null,
    embedCtaUrl: null,
    embedPrimaryColor: null,
    embedSecondaryColor: null,
    monthlyGenerationLimit: 1000,
    currentMonthGenerations: 0,
    lastResetDate: null,
    createdAt: new Date(),
  };

  const brandColors = useMemo(
    () =>
      ({
        "--primary": effectiveTenant.primaryColor,
        "--secondary": effectiveTenant.secondaryColor,
      }) as React.CSSProperties,
    [effectiveTenant.primaryColor, effectiveTenant.secondaryColor]
  );

  const handleShare = async () => {
    if (navigator.share && generatedImage) {
      try {
        const response = await fetch(generatedImage);
        const blob = await response.blob();
        const file = new File([blob], "halloween-decorations.jpg", {
          type: "image/jpeg",
        });

        await navigator.share({
          title: "My Halloween Home Transformation",
          text: "Check out my spooky Halloween home design!",
          files: [file],
        });
      } catch (error) {
        console.error("Error sharing:", error);
        toast({
          title: "Sharing failed",
          description: "Could not share the image. Try downloading instead.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Sharing not supported",
        description: "Your browser doesn't support sharing. Try downloading the image instead.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;

    const img = document.createElement("img");
    img.crossOrigin = "anonymous";
    img.onload = async function () {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.drawImage(img, 0, 0);
        
        // Check if user has a paid subscription (Contractor, Business Pro, or Enterprise)
        const hasPaidPlan = user?.subscription && 
          user.subscription.status === 'active' && 
          user.subscription.planId !== 'free';
        
        if (!hasPaidPlan) {
          // Add watermark for free users
          const logo = new Image();
          logo.crossOrigin = "anonymous";
          logo.onload = function () {
            // Larger watermark for free users (15% of image width)
            const logoWidth = img.width * 0.15;
            const logoHeight = (logo.height / logo.width) * logoWidth;
            
            // Center the watermark
            const x = (img.width - logoWidth) / 2;
            const y = (img.height - logoHeight) / 2;
            
            // Add semi-transparent background
            ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
            ctx.fillRect(x - 20, y - 20, logoWidth + 40, logoHeight + 60);
            
            // Draw logo
            ctx.drawImage(logo, x, y, logoWidth, logoHeight);
            
            // Add "DreamBuilder AI" text below logo
            ctx.font = `bold ${logoWidth * 0.12}px Arial`;
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText("DreamBuilder AI", x + logoWidth / 2, y + logoHeight + 30);
            
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "halloween-decorations.jpg";
                  a.click();
                  URL.revokeObjectURL(url);
                }
              },
              "image/jpeg",
              0.9
            );
          };
          logo.src = "/dreambuilder-logo.png";
        } else {
          // No watermark for paid users
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "halloween-decorations.jpg";
                a.click();
                URL.revokeObjectURL(url);
              }
            },
            "image/jpeg",
            0.9
          );
        }
      }
    };
    img.src = generatedImage;
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-purple-900 via-orange-900 to-black flex flex-col"
      style={brandColors}
    >
      <Header tenant={effectiveTenant} />

      <section className="py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-0">
            Transform Your Home for Halloween
            <span className="text-transparent bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text block font-extrabold drop-shadow-lg">
              Spooky & Spectacular
            </span>
          </h2>
        </div>
      </section>

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
                    Take or upload a clear photo of your home to see amazing
                    Halloween decoration possibilities
                  </p>
                </div>
                <FileUpload
                  onFileSelect={(file, previewUrl) => {
                    setOriginalFile(file);
                    setUploadedImage(previewUrl);
                  }}
                  uploadedImage={uploadedImage}
                  theme="halloween"
                />
              </CardContent>
            </Card>
          ) : generatedImage ? (
            <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-md">
              <CardContent className="p-8">
                <div className="mb-6">
                  <img
                    src={
                      showingOriginal
                        ? uploadedImage || ""
                        : generatedImage || ""
                    }
                    alt={
                      showingOriginal
                        ? "Original photo"
                        : "AI Generated Halloween decoration"
                    }
                    className="w-full aspect-video object-cover rounded-xl shadow-lg"
                    loading="lazy"
                    decoding="async"
                    style={{ willChange: "transform" }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                    onClick={handleDownload}
                    data-testid="button-download-halloween"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download Image
                  </Button>

                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                    onClick={() => setShowingOriginal(!showingOriginal)}
                    data-testid="button-toggle-view"
                  >
                    <Eye className="h-5 w-5 mr-2" />
                    {showingOriginal
                      ? "View Halloween Design"
                      : "View Original Photo"}
                  </Button>

                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-orange-600 to-purple-600 hover:from-orange-700 hover:to-purple-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                    onClick={() => {
                      setUploadedImage(null);
                      setGeneratedImage(null);
                    }}
                    data-testid="button-try-another"
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    Try Another Photo
                  </Button>
                </div>

                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-orange-600 via-purple-500 to-orange-600 hover:from-orange-700 hover:via-purple-600 hover:to-orange-700 text-white font-semibold py-4 shadow-lg hover:shadow-xl transition-all"
                  onClick={handleShare}
                  data-testid="button-share-halloween"
                >
                  <Share2 className="h-5 w-5 mr-2" />
                  Share Your Design
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-md">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="max-w-4xl mx-auto relative">
                    <div className="relative overflow-hidden rounded-xl">
                      <img
                        src={uploadedImage}
                        alt="Uploaded home photo"
                        className="w-full aspect-video object-cover shadow-lg transition-all duration-300"
                        loading="lazy"
                        decoding="async"
                        style={{ willChange: "transform" }}
                      />
                      {isGenerating && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-xl flex items-center justify-center">
                          <div className="text-center">
                            <SparklesText
                              text="Creating your spooky scene..."
                              className="text-sm sm:text-lg lg:text-xl font-bold text-white whitespace-nowrap"
                              sparklesCount={12}
                              colors={{ first: "#ea580c", second: "#7c3aed" }}
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
                        }}
                        className="border-slate-400 text-slate-600 hover:bg-slate-100"
                        data-testid="button-choose-different"
                      >
                        <FileImage className="h-4 w-4 mr-2" />
                        Choose Different Photo
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">
                      Create Your Spooky Scene
                    </h3>
                    <p className="text-sm sm:text-base text-slate-600">
                      Transform your home with a scary Halloween atmosphere
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-purple-600 to-orange-600 p-4 sm:p-8 rounded-xl shadow-lg">
                    <div className="text-center space-y-2 sm:space-y-3">
                      <Ghost className="h-12 w-12 sm:h-16 sm:w-16 text-white mx-auto" />
                      <h4 className="text-xl sm:text-2xl font-bold text-white">
                        Spooky Halloween Mode
                      </h4>
                      <p className="text-white/90 text-sm sm:text-base md:text-lg">
                        Generate a terrifying Halloween scene with random spooky decorations, blood moon, fog, and eerie lighting!
                      </p>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-orange-600 via-purple-500 to-orange-600 hover:from-orange-700 hover:via-purple-600 hover:to-orange-700 text-white font-semibold py-4 sm:py-6 text-base sm:text-lg md:text-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isGenerating}
                    onClick={async () => {
                      if (!user) {
                        toast({
                          title: "Authentication Required",
                          description:
                            "Please sign in and choose a plan to use AI visualization features.",
                          variant: "destructive",
                        });
                        navigate("/pricing");
                        return;
                      }

                      if (!user.usage.canUse) {
                        toast({
                          title: "Usage Limit Reached",
                          description: `You've reached your monthly limit of ${user.usage.limit} visualizations. Please upgrade your plan to continue.`,
                          variant: "destructive",
                        });
                        navigate("/pricing");
                        return;
                      }

                      setIsGenerating(true);
                      try {
                        if (!originalFile) {
                          alert(
                            "Original file not found. Please re-upload your image."
                          );
                          setIsGenerating(false);
                          return;
                        }

                        const result = await uploadHalloweenImage(
                          originalFile,
                          effectiveTenant.id,
                          [], // No specific decorations - backend will generate random ones
                          false, // nightMode
                          true // spookyMode - always true for this simplified version
                        );

                        if (result.halloweenVisualizationId) {
                          const status = await checkHalloweenVisualizationStatus(
                            result.halloweenVisualizationId
                          );

                          if (
                            status.status === "completed" &&
                            status.generatedImageUrl
                          ) {
                            setGeneratedImage(status.generatedImageUrl);
                            setIsGenerating(false);
                          } else if (status.status === "failed") {
                            console.error("Halloween AI generation failed");
                            setIsGenerating(false);
                            alert(
                              "Unable to generate Halloween visualization. Please check your connection and try again."
                            );
                          } else {
                            const pollInterval = setInterval(async () => {
                              try {
                                const polledStatus =
                                  await checkHalloweenVisualizationStatus(
                                    result.halloweenVisualizationId
                                  );
                                if (
                                  polledStatus.status === "completed" &&
                                  polledStatus.generatedImageUrl
                                ) {
                                  setGeneratedImage(
                                    polledStatus.generatedImageUrl
                                  );
                                  setIsGenerating(false);
                                  clearInterval(pollInterval);
                                } else if (polledStatus.status === "failed") {
                                  console.error(
                                    "Halloween AI generation failed"
                                  );
                                  setIsGenerating(false);
                                  clearInterval(pollInterval);
                                  alert(
                                    "Halloween AI generation failed. Please try again or contact support if the issue persists."
                                  );
                                }
                              } catch (error) {
                                console.error(
                                  "Error checking Halloween status:",
                                  error
                                );
                                setIsGenerating(false);
                                clearInterval(pollInterval);
                              }
                            }, 2000);

                            setTimeout(() => {
                              clearInterval(pollInterval);
                              if (isGenerating) {
                                setIsGenerating(false);
                                alert("Processing timed out. Please try again.");
                              }
                            }, 60000);
                          }
                        }
                      } catch (error) {
                        console.error(
                          "Error generating Halloween visualization:",
                          error
                        );
                        setIsGenerating(false);
                        alert(
                          "Unable to generate Halloween visualization. Please check your connection and try again."
                        );
                      }
                    }}
                    data-testid="button-create-spooky"
                  >
                    <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 mr-2 flex-shrink-0" />
                    Spookify
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
