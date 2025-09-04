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
import LandscapeStyleSelector from "@/components/landscape-style-selector";
import LeadCaptureForm from "@/components/lead-capture-form";
import Header from "@/components/header";
import { SparklesText } from "@/components/ui/sparkles-text";
import { useTenant } from "@/hooks/use-tenant";
import {
  uploadLandscapeImage,
  checkLandscapeVisualizationStatus,
} from "@/lib/api";

export default function Landscape() {
  const { tenant, isLoading: tenantLoading } = useTenant();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedLandscapeStyles, setSelectedLandscapeStyles] = useState({
    curbing: "",
    landscape: "",
    patios: "",
  });
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [showingOriginal, setShowingOriginal] = useState(false);
  const [landscapeVisualizationResult, setLandscapeVisualizationResult] = useState<any>(null);
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
              This landscape visualization service is not available at this
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

  const handleFileSelect = (file: File, previewUrl: string) => {
    setOriginalFile(file);
    setUploadedImage(previewUrl);
    setGeneratedImage(null);
    setLandscapeVisualizationResult(null);
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setOriginalFile(null);
    setGeneratedImage(null);
    setLandscapeVisualizationResult(null);
    setSelectedLandscapeStyles({
      curbing: "",
      landscape: "",
      patios: "",
    });
  };

  const hasSelectedStyles = () => {
    return Object.values(selectedLandscapeStyles).some(style => style !== "");
  };

  const handleGenerateVisualization = async () => {
    if (!originalFile || !hasSelectedStyles()) return;

    setIsGenerating(true);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("image", originalFile);
      formData.append("selectedCurbing", selectedLandscapeStyles.curbing);
      formData.append("selectedLandscape", selectedLandscapeStyles.landscape);
      formData.append("selectedPatios", selectedLandscapeStyles.patios);

      console.log("Uploading landscape visualization with styles:", selectedLandscapeStyles);

      const result = await uploadLandscapeImage(formData);
      const visualizationId = result.landscapeVisualizationId;

      if (result.generatedImageUrl) {
        setGeneratedImage(result.generatedImageUrl);
        setLandscapeVisualizationResult(result);
        setIsGenerating(false);
        setIsLoading(false);
      } else {
        // Poll for completion
        const pollForCompletion = async () => {
          let attempts = 0;
          const maxAttempts = 60; // 5 minutes max

          const poll = async () => {
            try {
              attempts++;
              const status = await checkLandscapeVisualizationStatus(visualizationId);
              
              if (status.generatedImageUrl) {
                setGeneratedImage(status.generatedImageUrl);
                setLandscapeVisualizationResult(status);
                setIsGenerating(false);
                setIsLoading(false);
                return;
              }

              if (status.status === "failed") {
                throw new Error("Landscape visualization failed");
              }

              if (attempts < maxAttempts) {
                setTimeout(poll, 5000); // Poll every 5 seconds
              } else {
                throw new Error("Landscape visualization timed out");
              }
            } catch (error) {
              console.error("Error polling landscape status:", error);
              setIsGenerating(false);
              setIsLoading(false);
            }
          };

          poll();
        };

        pollForCompletion();
      }
    } catch (error) {
      console.error("Error generating landscape visualization:", error);
      setIsGenerating(false);
      setIsLoading(false);
    }
  };

  const downloadImage = () => {
    const imageUrl = showingOriginal ? uploadedImage : generatedImage;
    if (!imageUrl) return;

    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = showingOriginal ? "original-landscape.jpg" : "landscape-visualization.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shareToSocial = (platform: string) => {
    const imageUrl = generatedImage;
    if (!imageUrl) return;

    const text = encodeURIComponent(`Check out my new landscape design created with ${tenant.companyName}!`);
    let shareUrl = "";

    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(imageUrl)}&quote=${text}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(imageUrl)}`;
        break;
      case "instagram":
        // Instagram doesn't support direct sharing, so we'll just copy the image URL
        navigator.clipboard.writeText(imageUrl);
        alert("Image URL copied! You can paste it in Instagram.");
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-green-800 via-emerald-700 to-teal-700"
      style={brandColors}
    >
      {/* Header with Services Menu */}
      <Header tenant={tenant} />

      {/* Hero Section with integrated flow */}
      <section className="py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-0">
            Visualize Your Dream Landscape
            <span className="text-transparent bg-gradient-to-r from-emerald-200 to-teal-200 bg-clip-text block font-extrabold drop-shadow-lg">
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
                    Upload Your Home Photo
                  </h3>
                  <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    Take or upload a clear photo of your home's front or back yard to see amazing
                    transformation possibilities
                  </p>
                </div>

                <FileUpload
                  onFileSelect={handleFileSelect}
                  uploadedImage={uploadedImage}
                  theme="default"
                />

                <div className="text-center mt-6">
                  <p className="text-sm text-slate-500">
                    Clear and well lit images work the best
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Image and Style Selection */}
              <div className="grid lg:grid-cols-2 gap-8 mb-8">
                {/* Image Preview */}
                <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-md">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-slate-800">
                        {showingOriginal ? "Original Photo" : generatedImage ? "Landscape Design" : "Your Photo"}
                      </h3>
                      <div className="flex gap-2">
                        {generatedImage && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowingOriginal(!showingOriginal)}
                            className="flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            {showingOriginal ? "Show Design" : "Show Original"}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveImage}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                    
                    <div className="relative rounded-lg overflow-hidden bg-slate-100">
                      <img
                        src={showingOriginal ? uploadedImage! : generatedImage || uploadedImage!}
                        alt={showingOriginal ? "Original" : "Landscape Design"}
                        className="w-full h-auto"
                      />
                      {isGenerating && !generatedImage && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="text-center text-white">
                            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            <p className="text-sm">Creating your landscape design...</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {generatedImage && (
                      <div className="mt-4 flex gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={downloadImage}
                          className="flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => shareToSocial("facebook")}
                          className="flex items-center gap-2"
                        >
                          <Facebook className="w-4 h-4" />
                          Facebook
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => shareToSocial("twitter")}
                          className="flex items-center gap-2"
                        >
                          <Twitter className="w-4 h-4" />
                          Twitter
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => shareToSocial("instagram")}
                          className="flex items-center gap-2"
                        >
                          <Instagram className="w-4 h-4" />
                          Instagram
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Style Selection */}
                <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-md">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">
                      Choose Your Landscape Features
                    </h3>
                    
                    <LandscapeStyleSelector
                      selectedStyles={selectedLandscapeStyles}
                      onStyleChange={setSelectedLandscapeStyles}
                    />

                    <div className="mt-6">
                      <Button
                        onClick={handleGenerateVisualization}
                        disabled={!hasSelectedStyles() || isGenerating}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-3 text-lg font-semibold"
                      >
                        {isGenerating ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Creating Design...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5" />
                            Generate Landscape Design
                          </div>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Lead Capture */}
              {generatedImage && !showLeadForm && (
                <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-md">
                  <CardContent className="p-8 text-center">
                    <h3 className="text-2xl font-bold text-slate-800 mb-4">
                      Love Your New Landscape Design?
                    </h3>
                    <p className="text-lg text-slate-600 mb-6">
                      Get a free consultation with {tenant.companyName} to make this vision a reality!
                    </p>
                    <Button
                      onClick={() => setShowLeadForm(true)}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-3 text-lg font-semibold"
                    >
                      <Phone className="w-5 h-5 mr-2" />
                      Get Free Consultation
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Lead Capture Form */}
              {showLeadForm && (
                <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-md">
                  <CardContent className="p-8">
                    <LeadCaptureForm
                      tenant={tenant}
                      selectedStyles={selectedLandscapeStyles}
                      originalImageUrl={uploadedImage}
                      generatedImageUrl={generatedImage}
                      onClose={() => {
                        setShowLeadForm(false);
                        // Optionally show success message
                      }}
                    />
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}