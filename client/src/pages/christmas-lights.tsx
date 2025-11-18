import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Eye,
  Sparkles,
  Download,
  Camera,
  FileImage,
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
  uploadChristmasLightsImage,
  checkChristmasLightsVisualizationStatus,
} from "@/lib/api";
import { downloadImageWithWatermark } from "@/lib/download-utils";

export default function ChristmasLights() {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showingOriginal, setShowingOriginal] = useState(false);
  const [selectedLightType, setSelectedLightType] = useState<string>("c9-rope");
  const [selectedColor, setSelectedColor] = useState<string>("warm-white");
  const [addSnow, setAddSnow] = useState(false);

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
    description: "Professional AI-powered Christmas lights visualization services",
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

  const lightTypes = [
    { id: "c9-rope", name: "C9 Rope Lights", description: "Classic large bulb style" },
    { id: "c7-rope", name: "C7 Rope Lights", description: "Medium bulb classic style" },
    { id: "icicle", name: "Icicle Lights", description: "Hanging dripping effect" },
    { id: "mini-lights", name: "Mini Lights", description: "Small traditional bulbs" },
    { id: "led-rope", name: "LED Rope Lights", description: "Modern continuous glow" },
  ];

  const lightColors = [
    { id: "warm-white", name: "Warm White (2700K)", color: "#FFE4B5" },
    { id: "pure-white", name: "Pure White (4000K)", color: "#F5F5F5" },
    { id: "cool-white", name: "Cool White (8000K)", color: "#E0F4FF" },
    { id: "rgb-multicolor", name: "RGB Multicolor", color: "linear-gradient(90deg, #FF0000, #00FF00, #0000FF, #FFFF00)" },
  ];

  const handleShare = async () => {
    if (navigator.share && generatedImage) {
      try {
        const response = await fetch(generatedImage);
        const blob = await response.blob();
        const file = new File([blob], "christmas-lights.jpg", {
          type: "image/jpeg",
        });

        await navigator.share({
          title: "My Christmas Lights Display",
          text: "Check out my festive Christmas lights design!",
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

    await downloadImageWithWatermark({
      imageUrl: generatedImage,
      fileName: "christmas-lights.jpg",
      user: user as any,
      subscription: user?.subscription
    });
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-red-900 via-green-900 to-blue-950 flex flex-col"
      style={brandColors}
    >
      <Header tenant={effectiveTenant} />

      <section className="py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-0">
            Christmas Lights Visualization
            <span className="text-transparent bg-gradient-to-r from-red-400 to-green-400 bg-clip-text block font-extrabold drop-shadow-lg">
              Festive & Bright
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
                    Christmas lights possibilities
                  </p>
                </div>
                <FileUpload
                  onFileSelect={(file, previewUrl) => {
                    setOriginalFile(file);
                    setUploadedImage(previewUrl);
                  }}
                  uploadedImage={uploadedImage}
                  theme="christmas"
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
                        : "AI Generated Christmas lights"
                    }
                    className="w-full aspect-video object-cover rounded-xl shadow-lg"
                    loading="lazy"
                    decoding="async"
                    style={{ willChange: "transform" }}
                    data-testid="img-result"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                    onClick={handleDownload}
                    data-testid="button-download-christmas"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download Image
                  </Button>

                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                    onClick={() => setShowingOriginal(!showingOriginal)}
                    data-testid="button-toggle-view"
                  >
                    <Eye className="h-5 w-5 mr-2" />
                    {showingOriginal
                      ? "View Christmas Lights"
                      : "View Original Photo"}
                  </Button>

                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-red-600 to-green-600 hover:from-red-700 hover:to-green-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
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
                  className="w-full bg-gradient-to-r from-red-600 via-green-500 to-red-600 hover:from-red-700 hover:via-green-600 hover:to-red-700 text-white font-semibold py-4 shadow-lg hover:shadow-xl transition-all"
                  onClick={handleShare}
                  data-testid="button-share-christmas"
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
                        data-testid="img-uploaded"
                      />
                      {isGenerating && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-xl flex items-center justify-center">
                          <div className="text-center">
                            <SparklesText
                              text="Creating your festive lights..."
                              className="text-sm sm:text-lg lg:text-xl font-bold text-white whitespace-nowrap"
                              sparklesCount={12}
                              colors={{ first: "#dc2626", second: "#16a34a" }}
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
                      Design Your Christmas Lights
                    </h3>
                    <p className="text-sm sm:text-base text-slate-600">
                      Choose your light color and add festive touches
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg font-semibold text-slate-800 mb-3">
                        Light Type
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {lightTypes.map((type) => (
                          <button
                            key={type.id}
                            onClick={() => setSelectedLightType(type.id)}
                            className={`p-4 rounded-lg border-2 transition-all text-left ${
                              selectedLightType === type.id
                                ? "border-green-600 bg-green-50 shadow-md"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                            data-testid={`button-type-${type.id}`}
                          >
                            <p className="text-slate-700 font-medium">{type.name}</p>
                            <p className="text-sm text-slate-600">{type.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-slate-800 mb-3">
                        Light Color
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {lightColors.map((color) => (
                          <button
                            key={color.id}
                            onClick={() => setSelectedColor(color.id)}
                            className={`p-4 rounded-lg border-2 transition-all text-left ${
                              selectedColor === color.id
                                ? "border-green-600 bg-green-50 shadow-md"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                            data-testid={`button-color-${color.id}`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-full border-2 border-slate-300"
                                style={{
                                  background: color.id === "rgb-multicolor" 
                                    ? color.color 
                                    : color.color
                                }}
                              />
                              <span className="font-medium text-slate-800">
                                {color.name}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-slate-800 mb-3">
                        Additional Effects
                      </h4>
                      <div className="flex items-center space-x-3 bg-slate-50 p-4 rounded-lg border-2 border-slate-300">
                        <Checkbox
                          id="snow-effect"
                          checked={addSnow}
                          onCheckedChange={(checked) => setAddSnow(checked as boolean)}
                          className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                          data-testid="checkbox-snow"
                        />
                        <Label
                          htmlFor="snow-effect"
                          className="text-slate-800 font-medium cursor-pointer"
                        >
                          Add Snow Effect
                        </Label>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-red-600 via-green-500 to-red-600 hover:from-red-700 hover:via-green-600 hover:to-red-700 text-white font-semibold py-4 sm:py-6 text-base sm:text-lg md:text-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

                        const result = await uploadChristmasLightsImage(
                          originalFile,
                          effectiveTenant.id,
                          selectedLightType,
                          selectedColor,
                          addSnow
                        );

                        if (result.christmasLightsVisualizationId) {
                          const status = await checkChristmasLightsVisualizationStatus(
                            result.christmasLightsVisualizationId
                          );

                          if (
                            status.status === "completed" &&
                            status.generatedImageUrl
                          ) {
                            setGeneratedImage(status.generatedImageUrl);
                            setIsGenerating(false);
                          } else if (status.status === "failed") {
                            console.error("Christmas lights AI generation failed");
                            setIsGenerating(false);
                            alert(
                              "Unable to generate Christmas lights visualization. Please check your connection and try again."
                            );
                          } else {
                            const pollInterval = setInterval(async () => {
                              try {
                                const polledStatus =
                                  await checkChristmasLightsVisualizationStatus(
                                    result.christmasLightsVisualizationId
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
                                    "Christmas lights AI generation failed"
                                  );
                                  setIsGenerating(false);
                                  clearInterval(pollInterval);
                                  alert(
                                    "Christmas lights AI generation failed. Please try again or contact support if the issue persists."
                                  );
                                }
                              } catch (error) {
                                console.error(
                                  "Error checking Christmas lights status:",
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
                          "Error generating Christmas lights visualization:",
                          error
                        );
                        setIsGenerating(false);
                        alert(
                          "Unable to generate Christmas lights visualization. Please check your connection and try again."
                        );
                      }
                    }}
                    data-testid="button-create-lights"
                  >
                    <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 mr-2 flex-shrink-0" />
                    Create Christmas Lights
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
