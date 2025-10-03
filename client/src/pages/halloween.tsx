import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Eye,
  Phone,
  Sparkles,
  Download,
  Camera,
  FileImage,
  Ghost,
  Skull,
  Facebook,
  Twitter,
  Instagram,
} from "lucide-react";
import FileUpload from "@/components/ui/file-upload";
import QuoteLeadForm from "@/components/quote-lead-form";
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

interface DecorationCategory {
  id: string;
  name: string;
  icon: typeof Ghost;
  options: { value: string; label: string }[];
}

const decorationCategories: DecorationCategory[] = [
  {
    id: "pumpkins",
    name: "Pumpkins",
    icon: Sparkles,
    options: [
      { value: "classic_pumpkins", label: "Classic Pumpkins" },
      { value: "pumpkin_pathway", label: "Pumpkin Pathway" },
      { value: "pumpkin_display", label: "Pumpkin Display" },
    ],
  },
  {
    id: "ghosts",
    name: "Ghosts",
    icon: Ghost,
    options: [
      { value: "hanging_ghosts", label: "Hanging Ghosts" },
      { value: "ghost_family", label: "Ghost Family" },
    ],
  },
  {
    id: "skeletons",
    name: "Skeletons",
    icon: Skull,
    options: [
      { value: "skeleton_yard_display", label: "Skeleton Yard Display" },
      { value: "skeleton_graveyard_scene", label: "Skeleton Graveyard Scene" },
      { value: "giant_skeleton", label: "Giant Skeleton (12ft)" },
    ],
  },
  {
    id: "witches",
    name: "Witches",
    icon: Sparkles,
    options: [
      { value: "witch_crash", label: "Witch Crash" },
      { value: "witch_silhouettes", label: "Witch Silhouettes" },
    ],
  },
  {
    id: "bats",
    name: "Bats",
    icon: Ghost,
    options: [
      { value: "bat_swarm", label: "Bat Swarm" },
      { value: "hanging_bats", label: "Hanging Bats" },
    ],
  },
  {
    id: "spiders",
    name: "Spiders",
    icon: Skull,
    options: [
      { value: "giant_spider", label: "Giant Spider" },
      { value: "spider_web_display", label: "Spider Web Display" },
    ],
  },
  {
    id: "graveyard",
    name: "Graveyard",
    icon: Skull,
    options: [
      { value: "tombstone_graveyard", label: "Tombstone Graveyard" },
      { value: "graveyard_fence", label: "Graveyard Fence" },
    ],
  },
  {
    id: "inflatables",
    name: "Inflatables",
    icon: Sparkles,
    options: [
      { value: "inflatable_giant_pumpkin", label: "Giant Pumpkin" },
      { value: "inflatable_grim_reaper", label: "Grim Reaper" },
      { value: "inflatable_haunted_tree", label: "Haunted Tree" },
    ],
  },
  {
    id: "animated",
    name: "Animated Props",
    icon: Ghost,
    options: [
      { value: "animated_heads", label: "Talking Heads" },
      { value: "animated_talking_pumpkin", label: "Talking Pumpkin" },
      { value: "animated_jumping_spider", label: "Jumping Spider" },
    ],
  },
  {
    id: "lights",
    name: "Pathway Lights",
    icon: Sparkles,
    options: [
      { value: "skull_torch_lights", label: "LED Skull Torches" },
      { value: "flickering_lanterns", label: "Flickering Lanterns" },
    ],
  },
  {
    id: "clowns",
    name: "Clowns",
    icon: Ghost,
    options: [
      { value: "creepy_carnival_clowns", label: "Creepy Clowns" },
      { value: "circus_tent_display", label: "Circus Tent" },
    ],
  },
  {
    id: "zombies",
    name: "Zombies",
    icon: Skull,
    options: [
      { value: "groundbreaker_zombies", label: "Groundbreaker Zombies" },
      { value: "zombie_horde", label: "Zombie Horde" },
    ],
  },
  {
    id: "mummies",
    name: "Mummies",
    icon: Skull,
    options: [
      { value: "wrapped_mummy_figures", label: "Wrapped Mummies" },
      { value: "mummy_tomb_display", label: "Mummy Tomb" },
    ],
  },
  {
    id: "vampires",
    name: "Vampires",
    icon: Ghost,
    options: [
      { value: "vampire_coffin_display", label: "Vampire Coffin" },
      { value: "vampire_silhouettes", label: "Vampire Silhouettes" },
    ],
  },
];

export default function Halloween() {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDecorations, setSelectedDecorations] = useState<string[]>([]);
  const [nightMode, setNightMode] = useState(false);
  const [spookyMode, setSpookyMode] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
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

  const toggleDecoration = (value: string) => {
    setSelectedDecorations((prev) =>
      prev.includes(value)
        ? prev.filter((d) => d !== value)
        : [...prev, value]
    );
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
                                a.download = "halloween-decorations.jpg";
                                a.click();
                                URL.revokeObjectURL(url);
                              }
                            },
                            "image/jpeg",
                            0.9
                          );
                        }
                      };
                      img.src = generatedImage || "";
                    }}
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download Image
                  </Button>

                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                    onClick={() => setShowingOriginal(!showingOriginal)}
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
                      setSelectedDecorations([]);
                      setSpookyMode(false);
                    }}
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    Try Another Photo
                  </Button>
                </div>

                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-orange-600 via-purple-500 to-orange-600 hover:from-orange-700 hover:via-purple-600 hover:to-orange-700 text-white font-semibold py-4 shadow-lg hover:shadow-xl transition-all"
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
                          setSelectedDecorations([]);
                          setNightMode(false);
                          setSpookyMode(false);
                        }}
                        className="border-slate-400 text-slate-600 hover:bg-slate-100"
                      >
                        <FileImage className="h-4 w-4 mr-2" />
                        Choose Different Photo
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">
                      Choose Your Halloween Decorations
                    </h3>
                    <p className="text-slate-600">
                      Select the spooky decorations you'd like to see on your
                      home
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-xl shadow-lg mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Sparkles className="h-8 w-8 text-white" />
                        <div>
                          <h4 className="text-xl font-bold text-white">
                            Night Mode
                          </h4>
                          <p className="text-white/80 text-sm">
                            See your decorations at night (simple day-to-night conversion)
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={nightMode}
                        onCheckedChange={setNightMode}
                        className="data-[state=checked]:bg-indigo-400 data-[state=unchecked]:bg-gray-400"
                      />
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-600 to-orange-600 p-6 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Ghost className="h-8 w-8 text-white" />
                        <div>
                          <h4 className="text-xl font-bold text-white">
                            Really Spooky Mode
                          </h4>
                          <p className="text-white/80 text-sm">
                            Add dramatic spooky atmosphere with fog, blood moon & effects!
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={spookyMode}
                        onCheckedChange={setSpookyMode}
                        className="data-[state=checked]:bg-orange-500 data-[state=unchecked]:bg-gray-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {decorationCategories.map((category) => {
                      const Icon = category.icon;
                      return (
                        <div
                          key={category.id}
                          className="bg-gradient-to-br from-purple-100 to-orange-100 p-4 rounded-lg border-2 border-purple-300 hover:border-orange-400 transition-all hover:shadow-lg"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <Icon className="h-5 w-5 text-purple-700" />
                            <h4 className="font-bold text-slate-800">
                              {category.name}
                            </h4>
                          </div>
                          <div className="space-y-2">
                            {category.options.map((option) => (
                              <label
                                key={option.value}
                                className="flex items-center space-x-2 cursor-pointer group"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedDecorations.includes(
                                    option.value
                                  )}
                                  onChange={() =>
                                    toggleDecoration(option.value)
                                  }
                                  className="w-4 h-4 text-orange-600 border-purple-300 rounded focus:ring-orange-500 focus:ring-2"
                                />
                                <span className="text-sm text-slate-700 group-hover:text-purple-700 transition-colors">
                                  {option.label}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-orange-600 via-purple-500 to-orange-600 hover:from-orange-700 hover:via-purple-600 hover:to-orange-700 text-white font-semibold py-4 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isGenerating || selectedDecorations.length === 0}
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
                          selectedDecorations,
                          nightMode,
                          spookyMode
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
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Generating Your Spooky Scene...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        Generate AI Halloween Design
                      </>
                    )}
                  </Button>

                  {selectedDecorations.length === 0 && (
                    <p className="text-sm text-slate-500 text-center">
                      Please select at least one decoration to generate your
                      Halloween design
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {showLeadForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <QuoteLeadForm
              service="halloween"
              originalImageUrl={uploadedImage}
              generatedImageUrl={generatedImage}
              selectedStyles={{ decorations: selectedDecorations, nightMode, spookyMode }}
              onClose={() => setShowLeadForm(false)}
            />
          </div>
        </div>
      )}

      <footer className="bg-slate-900/50 border-t border-slate-700">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col space-y-6 md:flex md:flex-row md:justify-between md:items-center md:space-y-0">
            <div className="flex items-center justify-center md:justify-start space-x-3">
              <svg
                className="w-10 h-10 text-white"
                viewBox="0 0 128.37 135.86"
                fill="currentColor"
              >
                <path
                  fill="#fff"
                  d="M111.98,78.77L56.63,23.24.92,78.76c-1.23,1.22-1.23,3.21,0,4.44,1.22,1.23,3.21,1.23,4.43,0l10.33-10.3v59.82c0,1.73,1.4,3.14,3.14,3.14h21.95c1.73,0,3.14-1.4,3.14-3.14v-25.09c0-3.46,2.81-6.27,6.27-6.27h12.54c3.46,0,6.27,2.81,6.27,6.27v25.09c0,1.73,1.4,3.14,3.14,3.14h21.95c1.73,0,3.14-1.4,3.14-3.14v-59.89l10.32,10.36c1.22,1.23,3.21,1.23,4.43,0,1.23-1.22,1.23-3.21,0-4.43Z"
                />
                <path
                  fill="#fff"
                  d="M102.82,0c-2.69,20.69-4.87,22.87-25.55,25.55,20.69,2.69,22.87,4.87,25.55,25.55,2.69-20.69,4.87-22.87,25.55-25.55-20.69-2.69-22.87-4.87-25.55-25.55Z"
                />
              </svg>
              <div>
                <p className="text-white font-semibold">
                  {effectiveTenant.companyName}
                </p>
                <p className="text-slate-400 text-sm">Powered by Solst LLC</p>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-4 md:justify-end">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
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
