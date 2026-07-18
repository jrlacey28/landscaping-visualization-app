import { useState, useEffect } from "react";
import { useTenant } from "../hooks/use-tenant";
import LandscapeStyleSelector from "../components/landscape-style-selector";
import { Button } from "../components/ui/button";
import { ArrowRight, Check, Download, Eye, Phone, RotateCcw, Sparkles, Upload, XCircle } from "lucide-react";
import { SparklesText } from "@/components/ui/sparkles-text";
import EmbedQuoteGate from "@/components/embed-quote-gate";
import EmbedQuoteLeadForm from "@/components/embed-quote-lead-form";
import EmbedPoweredBy from "@/components/embed-powered-by";
import { useEmbedVisitorLimit } from "@/hooks/use-embed-visitor-limit";
import { useDemoEmbedTrial } from "@/hooks/use-demo-embed-trial";
import { uploadLandscapeImage, checkLandscapeVisualizationStatus } from "../lib/api";
import { getEmbedQuoteButtonText, runEmbedQuoteAction } from "@/lib/embed-quote";
import {
  DEFAULT_EMBED_BACKGROUND_COLOR,
  getEmbedBackground,
  parseEmbedBackgroundScheme,
} from "@/lib/embed-theme";
import { normalizeEmbedCustomOptions } from "@/lib/embed-custom-options";
import { isEmbedServiceEnabled } from "@/lib/embed-services";

interface EmbedProps {
  tenantSlug?: string;
  primaryColor?: string;
  secondaryColor?: string;
  companyName?: string;
  showHeader?: boolean;
  width?: string;
  height?: string;
}

function getContrastTextColor(color: string) {
  const normalized = color.replace("#", "");
  const hex = normalized.length === 3
    ? normalized.split("").map((character) => `${character}${character}`).join("")
    : normalized;
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return "#ffffff";

  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  return (red * 299 + green * 587 + blue * 114) / 1000 > 160 ? "#0f172a" : "#ffffff";
}

function colorWithAlpha(color: string, alpha: number) {
  const normalized = color.replace("#", "");
  const hex = normalized.length === 3
    ? normalized.split("").map((character) => `${character}${character}`).join("")
    : normalized;
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return `rgba(37, 99, 235, ${alpha})`;

  return `rgba(${Number.parseInt(hex.slice(0, 2), 16)}, ${Number.parseInt(hex.slice(2, 4), 16)}, ${Number.parseInt(hex.slice(4, 6), 16)}, ${alpha})`;
}

export default function EmbedPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const tenantSlug = urlParams.get('tenant') || 'demo';
  const tenantIdParam = urlParams.get('tenantId') || '';
  const tenantLookup = tenantIdParam || tenantSlug;
  const accountUserIdParam = urlParams.get('accountUserId') || '';
  const primaryColorParam = urlParams.get('primaryColor') || '';
  const secondaryColorParam = urlParams.get('secondaryColor') || '';
  const primaryColor = primaryColorParam || '#10b981';
  const secondaryColor = secondaryColorParam || '#059669';
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
  const effectiveTenant = tenant || {
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
    description: "Professional AI-powered landscaping visualization services",
    showPricing: true,
    requirePhone: true,
    active: true,
    monthlyGenerationLimit: 1000,
    currentMonthGenerations: 0,
    createdAt: new Date(),
  };

  const resolvedPrimaryColor =
    primaryColorParam || (tenant ? (effectiveTenant as any).embedPrimaryColor || effectiveTenant.primaryColor || primaryColor : primaryColor);
  const resolvedSecondaryColor =
    secondaryColorParam || (tenant ? (effectiveTenant as any).embedSecondaryColor || effectiveTenant.secondaryColor || secondaryColor : secondaryColor);
  const resolvedLogoUrl = logoUrlParam || effectiveTenant.logoUrl || "";
  const displayCompanyName = companyName || effectiveTenant.companyName || "DreamBuilder";
  const embedCustomizations = (effectiveTenant as any).embedCustomizations || {};
  const landscapeCustomOptions = {
    curbing: normalizeEmbedCustomOptions(
      embedCustomizations.landscapeOptions?.curbing,
      "tenant_custom_landscape_curbing",
    ),
    landscape: normalizeEmbedCustomOptions(
      embedCustomizations.landscapeOptions?.landscape,
      "tenant_custom_landscape_landscape",
    ),
    patios: normalizeEmbedCustomOptions(
      embedCustomizations.landscapeOptions?.patios,
      "tenant_custom_landscape_patios",
    ),
  };
  const embedVisitor = useEmbedVisitorLimit({
    tenantId: tenant?.id || null,
    tenantSlug: tenant?.slug || null,
  });
  const demoTrial = useDemoEmbedTrial();
  const visitorLimitReached =
    !!embedVisitor.status?.limitEnabled && !embedVisitor.status.canGenerate;
  const quoteButtonText = getEmbedQuoteButtonText(effectiveTenant);
  const pageBackground = getEmbedBackground(
    backgroundScheme,
    resolvedPrimaryColor,
    resolvedSecondaryColor,
    backgroundColor,
  );
  const primaryButtonTextColor = getContrastTextColor(resolvedPrimaryColor);
  
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [landscapeVisualizationResult, setLandscapeVisualizationResult] = useState<any>(null);
  const [lastGeneratedImageUrl, setLastGeneratedImageUrl] = useState<string | null>(null);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showQuoteGate, setShowQuoteGate] = useState(false);
  const [showingOriginal, setShowingOriginal] = useState(false);
  
  const [selectedLandscapeStyles, setSelectedLandscapeStyles] = useState({
    curbing: "",
    landscape: "",
    patios: "",
  });
  const hasCompletedVisualization =
    landscapeVisualizationResult?.status === "completed" && Boolean(landscapeVisualizationResult?.generatedImageUrl);

  // Apply custom branding
  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', resolvedPrimaryColor);
    document.documentElement.style.setProperty('--secondary-color', resolvedSecondaryColor);
  }, [resolvedPrimaryColor, resolvedSecondaryColor]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setShowQuoteGate(false);
      setOriginalFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setLandscapeVisualizationResult(null);
      setLastGeneratedImageUrl(null);
    }
  };

  const handleQuoteClick = () => {
    setShowQuoteGate(false);
    embedVisitor.trackQuoteClick();
    runEmbedQuoteAction({
      tenant: effectiveTenant,
      contactType,
      contactPhone,
      contactLink,
      openForm: () => setShowQuoteForm(true),
    });
  };

  const handleStartOver = () => {
    setShowQuoteGate(false);
    setLandscapeVisualizationResult(null);
    setLastGeneratedImageUrl(null);
    setShowingOriginal(false);
    setSelectedLandscapeStyles({ curbing: "", landscape: "", patios: "" });
  };

  const handleDownloadDesign = () => {
    if (!landscapeVisualizationResult?.generatedImageUrl) return;

    const image = document.createElement("img");
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) return;

      canvas.width = image.width;
      canvas.height = image.height;
      context.drawImage(image, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = "landscape-design.jpg";
          anchor.click();
          URL.revokeObjectURL(url);
        },
        "image/jpeg",
        0.9,
      );
    };
    image.src = landscapeVisualizationResult.generatedImageUrl;
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

  if (effectiveTenant && !isEmbedServiceEnabled(effectiveTenant, "landscape")) {
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
    <div className="w-full p-2 sm:p-4" style={{ background: pageBackground }}>
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-2xl shadow-slate-950/15 lg:flex lg:h-[calc(100vh-2rem)] lg:max-h-[760px] lg:flex-col">
          {showHeader && (
            <header className="flex shrink-0 items-center gap-3 border-b border-slate-200 px-4 py-2 sm:px-5">
              {resolvedLogoUrl && (
                <img
                  src={resolvedLogoUrl}
                  alt={`${displayCompanyName} logo`}
                  className="max-h-11 max-w-[175px] shrink-0 object-contain object-left"
                />
              )}
              <div className={`min-w-0 flex-1 ${resolvedLogoUrl ? "border-l border-slate-200 pl-3 sm:pl-4" : ""}`}>
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <h1 className="text-base font-bold leading-tight text-slate-950 sm:text-lg">Landscape Design Visualizer</h1>
                  <EmbedPoweredBy tenant={effectiveTenant} className="shrink-0 justify-start" />
                </div>
                <p className="mt-0.5 hidden text-xs leading-relaxed text-slate-500 sm:block">
                  Upload a property photo, choose your updates, and preview a fresh outdoor design.
                </p>
              </div>
            </header>
          )}
          {!showHeader && (
            <EmbedPoweredBy
              tenant={effectiveTenant}
              className="shrink-0 justify-start border-b border-slate-200 bg-slate-50 px-4 py-1 sm:px-5"
            />
          )}

          {showQuoteForm && (
            <EmbedQuoteLeadForm
              tenant={effectiveTenant}
              service="landscape"
              selectedStyles={selectedLandscapeStyles}
              originalImageUrl={uploadedImage}
              generatedImageUrl={landscapeVisualizationResult?.generatedImageUrl || lastGeneratedImageUrl}
              primaryColor={resolvedPrimaryColor}
              secondaryColor={resolvedSecondaryColor}
              onClose={() => setShowQuoteForm(false)}
            />
          )}

          <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(220px,0.8fr)] md:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)] md:grid-rows-1">
            <section className="flex min-h-0 flex-col overflow-hidden bg-white p-3 sm:p-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              {!uploadedImage ? (
                <label
                  htmlFor="image-upload"
                  className="group relative flex min-h-0 flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-950 text-center shadow-inner"
                >
                  <div
                    className="absolute inset-0 opacity-70"
                    style={{
                      background: `radial-gradient(circle at 22% 25%, ${colorWithAlpha(resolvedPrimaryColor, 0.55)}, transparent 34%), radial-gradient(circle at 78% 72%, ${colorWithAlpha(resolvedSecondaryColor, 0.45)}, transparent 34%), linear-gradient(145deg, #0f172a, #1e293b)`,
                    }}
                  />
                  <div className="absolute inset-5 rounded-xl border border-dashed border-white/30" />
                  <div className="relative z-10 max-w-sm px-8 py-8 text-white">
                    <span
                      className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl shadow-xl transition group-hover:-translate-y-0.5"
                      style={{ backgroundColor: resolvedPrimaryColor, color: primaryButtonTextColor }}
                    >
                      <Upload className="h-6 w-6" />
                    </span>
                    <h2 className="mt-5 text-xl font-bold">Add your property photo</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-200">Use a clear, straight-on photo with the full area in view.</p>
                    <span className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-lg">
                      Choose photo <ArrowRight className="h-4 w-4" />
                    </span>
                    <p className="mt-3 text-xs font-medium text-slate-300">JPG or PNG &middot; Up to 10MB</p>
                  </div>
                </label>
              ) : (
                <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl bg-slate-100 shadow-inner">
                  {!isGenerating && !showQuoteGate && (
                    <div className="absolute right-3 top-3 z-20 flex flex-wrap justify-end gap-2">
                      {hasCompletedVisualization && (
                        <button
                          type="button"
                          onClick={() => setShowingOriginal((current) => !current)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-md backdrop-blur-sm transition hover:bg-white"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          {showingOriginal ? "View design" : "View original"}
                        </button>
                      )}
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold shadow-md backdrop-blur-sm transition hover:bg-white"
                        style={{ color: resolvedPrimaryColor }}
                      >
                        Change photo
                      </label>
                    </div>
                  )}
                  <img
                    src={hasCompletedVisualization ? (showingOriginal ? uploadedImage : landscapeVisualizationResult.generatedImageUrl) : uploadedImage}
                    alt={hasCompletedVisualization ? (showingOriginal ? "Original property" : "Enhanced landscape design") : "Uploaded property"}
                    className={`h-full w-full object-cover transition duration-300 ${showQuoteGate ? "scale-105 blur-xl" : ""}`}
                  />
                  {showQuoteGate && (
                    <EmbedQuoteGate
                      status={embedVisitor.status}
                      primaryColor={resolvedPrimaryColor}
                      secondaryColor={resolvedSecondaryColor}
                      buttonText={quoteButtonText}
                      onQuoteClick={handleQuoteClick}
                      onClose={() => setShowQuoteGate(false)}
                    />
                  )}
                  {isGenerating && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-sm">
                      <SparklesText
                        text="Designing your landscape..."
                        className="whitespace-nowrap text-sm font-bold text-white sm:text-lg"
                        sparklesCount={12}
                        colors={{ first: resolvedPrimaryColor, second: resolvedSecondaryColor }}
                      />
                    </div>
                  )}
                  {hasCompletedVisualization && !isGenerating && !showQuoteGate && (
                    <button
                      type="button"
                      onClick={handleDownloadDesign}
                      aria-label="Download design"
                      title="Download design"
                      className="absolute bottom-3 left-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-md backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
                      style={{ color: resolvedPrimaryColor }}
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </section>

            {!uploadedImage ? (
              <aside
                className="flex min-h-0 flex-col items-center justify-center overflow-hidden border-t border-slate-200 p-5 text-center md:border-l md:border-t-0 md:p-7"
                style={{ backgroundColor: colorWithAlpha(resolvedPrimaryColor, 0.065) }}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm"
                  style={{ backgroundColor: resolvedPrimaryColor, color: primaryButtonTextColor }}
                >
                  <Sparkles className="h-5 w-5" />
                </span>
                <h3 className="mt-4 max-w-sm text-xl font-bold leading-tight text-slate-950">See the possibilities before the work begins.</h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">Preview curbing, landscape finishes, and concrete patio styles on your own property.</p>
                <div className="mt-4 flex max-w-sm items-start gap-2 rounded-xl border border-white/80 bg-white/80 px-4 py-3 text-xs leading-5 text-slate-600 shadow-sm">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: resolvedPrimaryColor }} strokeWidth={3} />
                  <p className="text-left">Your original photo stays available so you can compare it with the finished concept.</p>
                </div>
              </aside>
            ) : (
              <aside className="min-h-0 overflow-y-auto border-t border-slate-200 bg-slate-50 p-3 sm:p-4 md:border-l md:border-t-0">
                {hasCompletedVisualization ? (
                  <div className="flex min-h-full flex-col items-center justify-center px-2 py-5 text-center">
                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm"
                      style={{ backgroundColor: resolvedPrimaryColor, color: primaryButtonTextColor }}
                    >
                      <Check className="h-5 w-5" strokeWidth={3} />
                    </span>
                    <h2 className="mt-4 text-xl font-bold text-slate-950">Your landscape is ready</h2>
                    <p className="mt-2 max-w-xs text-sm leading-6 text-slate-600">Send this concept to {displayCompanyName} for pricing and next steps.</p>
                    <div className="mt-6 w-full space-y-2.5">
                      <Button
                        size="lg"
                        className="w-full rounded-xl font-semibold shadow-lg transition hover:shadow-xl"
                        style={{ backgroundColor: resolvedPrimaryColor, color: primaryButtonTextColor }}
                        onClick={handleQuoteClick}
                      >
                        <Phone className="mr-2 h-4 w-4" />
                        {quoteButtonText}
                      </Button>
                      <Button
                        type="button"
                        size="lg"
                        variant="outline"
                        className="w-full rounded-xl border-slate-300 bg-white font-semibold text-slate-700"
                        onClick={handleStartOver}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Try another design
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-3">
                      <h2 className="font-semibold text-slate-950">Customize your landscape</h2>
                      <p className="mt-0.5 text-xs text-slate-500">Turn on the areas you want to preview, then choose each finish.</p>
                    </div>
                    {embedVisitor.status?.unlimitedAccountAccess && (
                      <div className="mb-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: resolvedPrimaryColor }} />
                        <p className="text-xs font-semibold text-slate-700">Unlimited team access</p>
                      </div>
                    )}
                    <LandscapeStyleSelector
                      selectedStyles={selectedLandscapeStyles}
                      onStyleChange={setSelectedLandscapeStyles}
                      primaryColor={resolvedPrimaryColor}
                      secondaryColor={resolvedSecondaryColor}
                      customOptions={landscapeCustomOptions}
                      defaultOptionVisibility={embedCustomizations.defaultOptionVisibility}
                      compact
                    />
                    <div className="sticky bottom-0 mt-3 border-t border-slate-200 bg-slate-50/95 pt-3 backdrop-blur-sm">
                      <Button
                        size="lg"
                        className="w-full rounded-xl font-semibold shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
                        style={{ backgroundColor: resolvedPrimaryColor, color: primaryButtonTextColor }}
                        disabled={
                          isGenerating ||
                          embedVisitor.isLoading ||
                          !(selectedLandscapeStyles.curbing || selectedLandscapeStyles.landscape || selectedLandscapeStyles.patios)
                        }
                        onClick={async () => {
                          if (!demoTrial.canStartGeneration()) return;
                          if (visitorLimitReached) {
                            setShowQuoteGate(true);
                            return;
                          }

                          setIsGenerating(true);
                          try {
                            if (!originalFile) {
                              alert("Please re-upload your image.");
                              return;
                            }

                            const result = await uploadLandscapeImage(
                              originalFile,
                              effectiveTenant.id,
                              selectedLandscapeStyles,
                              undefined,
                              {
                                source: "embed",
                                accountUserId: accountUserIdParam ? Number(accountUserIdParam) : null,
                                tenantId: tenant?.id || null,
                                tenantSlug: tenant?.slug || null,
                                visitorId: embedVisitor.visitorId,
                              },
                            );

                            if (result.landscapeVisualizationId) {
                              const status = await checkLandscapeVisualizationStatus(result.landscapeVisualizationId);
                              setLandscapeVisualizationResult(status);
                              if (status?.generatedImageUrl) {
                                setLastGeneratedImageUrl(status.generatedImageUrl);
                                demoTrial.recordSuccessfulGeneration();
                              }
                            }
                          } catch (error) {
                            console.error("Error generating visualization:", error);
                            const apiError = error as any;
                            if (apiError.code === "EMBED_VISITOR_LIMIT") {
                              if (demoTrial.handleServerLimitReached()) return;
                              embedVisitor.markLimitReached(apiError.details?.embedVisitorUsage);
                              setShowQuoteGate(true);
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
                            <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Creating your preview...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-5 w-5" />
                            Create my design
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </aside>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
