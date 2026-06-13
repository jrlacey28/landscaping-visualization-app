
import { useState, useEffect } from "react";
import { useTenant } from "../hooks/use-tenant";
import PoolStyleSelector from "../components/pool-style-selector";
import { Button } from "../components/ui/button";
import { Upload, Sparkles, Download, Eye, Camera, Phone, XCircle } from "lucide-react";
import { SparklesText } from "@/components/ui/sparkles-text";
import EmbedQuoteGate from "@/components/embed-quote-gate";
import EmbedQuoteLeadForm from "@/components/embed-quote-lead-form";
import { useEmbedVisitorLimit } from "@/hooks/use-embed-visitor-limit";
import { uploadPoolImage, checkPoolVisualizationStatus } from "../lib/api";
import { getEmbedQuoteButtonText, runEmbedQuoteAction } from "@/lib/embed-quote";
import {
  DEFAULT_EMBED_BACKGROUND_COLOR,
  getEmbedBackground,
  getEmbedThemeClasses,
  parseEmbedBackgroundScheme,
} from "@/lib/embed-theme";
import { normalizeEmbedCustomOptions } from "@/lib/embed-custom-options";
import { isEmbedServiceEnabled } from "@/lib/embed-services";

export default function EmbedPoolsPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const tenantSlug = urlParams.get('tenant') || 'demo';
  const tenantIdParam = urlParams.get('tenantId') || '';
  const tenantLookup = tenantIdParam || tenantSlug;
  const accountUserIdParam = urlParams.get('accountUserId') || '';
  const primaryColor = urlParams.get('primaryColor') || '#10b981';
  const secondaryColor = urlParams.get('secondaryColor') || '#059669';
  const companyName = urlParams.get('companyName') || '';
  const showHeader = urlParams.get('showHeader') !== 'false';
  const contactType = urlParams.get('contactType') || 'phone';
  const contactPhone = urlParams.get('contactPhone') || '';
  const contactLink = urlParams.get('contactLink') || '';
  const logoUrlParam = urlParams.get('logoUrl') || '';
  const backgroundScheme = parseEmbedBackgroundScheme(urlParams.get('backgroundScheme'));
  const backgroundColor = urlParams.get('backgroundColor') || DEFAULT_EMBED_BACKGROUND_COLOR;
  
  const { tenant, isLoading: tenantLoading, error: tenantError } = useTenant(tenantLookup);
  const isDemoLookup = tenantLookup === 'demo';
  const canUseAccountFallback = Boolean(accountUserIdParam);

  // Create fallback tenant if API call fails
  const effectiveTenant = (tenant || {
    id: 1,
    slug: "demo",
    companyName: companyName || "DreamBuilder",
    logoUrl: logoUrlParam,
    primaryColor: primaryColor,
    secondaryColor: secondaryColor,
    phone: contactPhone || "(555) 123-4567",
    contactPhone: contactPhone,
    email: "info@dreambuilder.com",
    address: "123 Main St, Anytown USA",
    description: "Professional AI-powered pool visualization services",
    showPricing: true,
    requirePhone: true,
    active: true,
    monthlyGenerationLimit: 1000,
    currentMonthGenerations: 0,
    createdAt: new Date(),
  }) as any;

  const resolvedPrimaryColor =
    tenant ? effectiveTenant.embedPrimaryColor || effectiveTenant.primaryColor || primaryColor : primaryColor;
  const resolvedSecondaryColor =
    tenant ? effectiveTenant.embedSecondaryColor || effectiveTenant.secondaryColor || secondaryColor : secondaryColor;
  const resolvedLogoUrl = tenant ? effectiveTenant.logoUrl || logoUrlParam || "" : logoUrlParam || effectiveTenant.logoUrl || "";
  const displayCompanyName = tenant
    ? effectiveTenant.companyName || companyName || "DreamBuilder"
    : companyName || effectiveTenant.companyName || "DreamBuilder";
  const embedCustomizations = effectiveTenant.embedCustomizations || {};
  const poolCustomOptions = {
    poolType: normalizeEmbedCustomOptions(embedCustomizations.poolOptions?.poolType, "tenant_custom_pool_pool_type"),
    poolSize: normalizeEmbedCustomOptions(embedCustomizations.poolOptions?.poolSize, "tenant_custom_pool_pool_size"),
    decking: normalizeEmbedCustomOptions(embedCustomizations.poolOptions?.decking, "tenant_custom_pool_decking"),
    landscaping: normalizeEmbedCustomOptions(
      embedCustomizations.poolOptions?.landscaping,
      "tenant_custom_pool_landscaping",
    ),
    features: normalizeEmbedCustomOptions(embedCustomizations.poolOptions?.features, "tenant_custom_pool_features"),
    hotTub: normalizeEmbedCustomOptions(embedCustomizations.poolOptions?.hotTub, "tenant_custom_pool_hot_tub"),
    sauna: normalizeEmbedCustomOptions(embedCustomizations.poolOptions?.sauna, "tenant_custom_pool_sauna"),
  };
  const embedVisitor = useEmbedVisitorLimit({
    tenantId: tenant?.id || null,
    tenantSlug: tenant?.slug || null,
  });
  const visitorLimitReached =
    !!embedVisitor.status?.limitEnabled && !embedVisitor.status.canGenerate;
  const quoteButtonText = getEmbedQuoteButtonText(effectiveTenant);
  const pageBackground = getEmbedBackground(
    backgroundScheme,
    resolvedPrimaryColor,
    resolvedSecondaryColor,
    backgroundColor,
  );
  const themeClasses = getEmbedThemeClasses(backgroundScheme);
  
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [poolVisualizationResult, setPoolVisualizationResult] = useState<any>(null);
  const [lastGeneratedImageUrl, setLastGeneratedImageUrl] = useState<string | null>(null);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showingOriginal, setShowingOriginal] = useState(false);
  
  const [selectedPoolStyles, setSelectedPoolStyles] = useState({
    poolType: "",
    poolSize: "",
    decking: "",
    landscaping: "",
    features: "",
    hotTub: "",
    sauna: "",
  });

  // Apply custom branding
  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', resolvedPrimaryColor);
    document.documentElement.style.setProperty('--secondary-color', resolvedSecondaryColor);
  }, [resolvedPrimaryColor, resolvedSecondaryColor]);

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
      setLastGeneratedImageUrl(null);
    }
  };

  const handleQuoteClick = () => {
    embedVisitor.trackQuoteClick();
    runEmbedQuoteAction({
      tenant: effectiveTenant,
      contactType,
      contactPhone,
      contactLink,
      openForm: () => setShowQuoteForm(true),
    });
  };

  if (!tenant && tenantLoading && !isDemoLookup && !canUseAccountFallback) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading Visualizer</h1>
          <p className="text-gray-600">Connecting this embed to the client account.</p>
        </div>
      </div>
    );
  }

  if (!tenant && !tenantLoading && !isDemoLookup && !canUseAccountFallback) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Embed Account Not Found</h1>
          <p className="text-gray-600 mb-4">
            This visualizer is not connected to a valid client account. Please update the embed code and try again.
          </p>
          {tenantError && (
            <p className="text-xs text-gray-400">Account lookup failed.</p>
          )}
        </div>
      </div>
    );
  }

  if (effectiveTenant && !effectiveTenant.active) {
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
          {effectiveTenant.phone && (
            <a
              href={`tel:${effectiveTenant.phone.replace(/[\(\)\-\s]/g, '')}`}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Phone className="h-4 w-4 mr-2" />
              Call {effectiveTenant.phone}
            </a>
          )}
        </div>
      </div>
    );
  }

  if (effectiveTenant && !isEmbedServiceEnabled(effectiveTenant, "pools")) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-slate-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Visualizer Not Available</h1>
          <p className="text-gray-600">
            This embed service is not enabled for {displayCompanyName}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-2" style={{ background: pageBackground }}>
      <div className="max-w-4xl mx-auto">
        {showHeader && (
          <div className="text-center mb-8 pt-4">
            {resolvedLogoUrl && (
              <img
                src={resolvedLogoUrl}
                alt={`${displayCompanyName} logo`}
                className="mx-auto mb-4 max-h-20 max-w-[220px] object-contain"
              />
            )}
            <h1 className={`text-3xl md:text-4xl font-bold mb-2 ${themeClasses.headerText}`}>
              {displayCompanyName} Pool Visualizer
            </h1>
            <p className={`text-lg ${themeClasses.subheadingText}`}>
              Transform your backyard with AI-powered pool design visualization
            </p>
          </div>
        )}

        {showQuoteForm && (
          <EmbedQuoteLeadForm
            tenant={effectiveTenant}
            service="pools"
            selectedStyles={selectedPoolStyles}
            originalImageUrl={uploadedImage}
            generatedImageUrl={poolVisualizationResult?.generatedImageUrl || lastGeneratedImageUrl}
            primaryColor={resolvedPrimaryColor}
            secondaryColor={resolvedSecondaryColor}
            onClose={() => setShowQuoteForm(false)}
          />
        )}

        {visitorLimitReached && (
          <EmbedQuoteGate
            status={embedVisitor.status}
            primaryColor={resolvedPrimaryColor}
            secondaryColor={resolvedSecondaryColor}
            buttonText={quoteButtonText}
            onQuoteClick={handleQuoteClick}
          />
        )}

        {/* Image Upload */}
        {!visitorLimitReached && (
        <div className={`${themeClasses.panel} rounded-2xl p-4 mb-4`}>
          <h2 className={`text-xl font-semibold mb-4 text-center ${themeClasses.panelTitle}`}>Upload Your Backyard Photo</h2>
          
          {!uploadedImage ? (
            <div className={`border-2 border-dashed ${themeClasses.uploadBorder} rounded-lg p-8 text-center`}>
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
                <Upload className={`h-12 w-12 ${themeClasses.uploadIcon}`} />
                <div>
                  <p className={`${themeClasses.uploadPrimaryText} font-medium`}>Click to upload your photo</p>
                  <p className={`${themeClasses.uploadSecondaryText} text-sm`}>PNG, JPG up to 10MB</p>
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
                        colors={{ first: resolvedPrimaryColor, second: resolvedSecondaryColor }}
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
                        background: `linear-gradient(to right, ${resolvedPrimaryColor}, ${resolvedSecondaryColor})`
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
                        background: `linear-gradient(to right, ${resolvedSecondaryColor}, ${resolvedPrimaryColor})`
                      }}
                      onClick={() => {
                        setUploadedImage(null);
                        setOriginalFile(null);
                        setPoolVisualizationResult(null);
                        setLastGeneratedImageUrl(null);
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
                      background: `linear-gradient(to right, ${resolvedPrimaryColor}, ${resolvedSecondaryColor}, ${resolvedPrimaryColor})`
                    }}
                    onClick={handleQuoteClick}
                  >
                    <Phone className="h-5 w-5 mr-2" />
                    {quoteButtonText}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    setUploadedImage(null);
                    setOriginalFile(null);
                    setPoolVisualizationResult(null);
                    setLastGeneratedImageUrl(null);
                  }}
                  className="w-full"
                >
                  Upload Different Photo
                </Button>
              )}
            </div>
          )}
        </div>
        )}

        {/* Style Selection */}
        {uploadedImage && !visitorLimitReached && (
          <div className={`${themeClasses.panel} rounded-2xl p-4 mb-4`}>
            <h2 className={`text-xl font-semibold mb-4 ${themeClasses.panelTitle}`}>Choose Your Pool Style</h2>
            <PoolStyleSelector
              selectedStyles={selectedPoolStyles}
              onStyleChange={setSelectedPoolStyles}
              primaryColor={resolvedPrimaryColor}
              secondaryColor={resolvedSecondaryColor}
              customOptions={poolCustomOptions}
            />
          </div>
        )}

        {/* Generate Button */}
        {uploadedImage && !visitorLimitReached && (
          <div className="mb-4">
            <Button
              size="lg"
              className="w-full text-white font-semibold py-4 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              style={{ 
                background: `linear-gradient(to right, ${resolvedPrimaryColor}, ${resolvedSecondaryColor}, ${resolvedPrimaryColor})`
              }}
              disabled={
                isGenerating ||
                !(
                  selectedPoolStyles.poolType ||
                  selectedPoolStyles.poolSize ||
                  selectedPoolStyles.decking ||
                  selectedPoolStyles.landscaping ||
                  selectedPoolStyles.features ||
                  selectedPoolStyles.hotTub ||
                  selectedPoolStyles.sauna
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
                    effectiveTenant.id,
                    selectedPoolStyles,
                    undefined,
                    {
                      source: "embed",
                      accountUserId: accountUserIdParam ? Number(accountUserIdParam) : null,
                      tenantId: tenant?.id || null,
                      tenantSlug: tenant?.slug || null,
                      visitorId: embedVisitor.visitorId,
                    },
                  );

                  if (result.poolVisualizationId) {
                    const status = await checkPoolVisualizationStatus(
                      result.poolVisualizationId,
                    );
                    setPoolVisualizationResult(status);
                    if (status?.generatedImageUrl) {
                      setLastGeneratedImageUrl(status.generatedImageUrl);
                    }
                  }
                } catch (error) {
                  console.error("Error generating visualization:", error);
                  const apiError = error as any;
                  if (apiError.code === "EMBED_VISITOR_LIMIT") {
                    embedVisitor.markLimitReached(apiError.details?.embedVisitorUsage);
                    return;
                  }
                  alert("Unable to generate visualization. Please try again.");
                } finally {
                  embedVisitor.refresh();
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

      </div>
    </div>
  );
}
