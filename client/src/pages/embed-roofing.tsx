
import { useState, useEffect } from "react";
import { useTenant } from "../hooks/use-tenant";
import StyleSelector from "../components/style-selector";
import { Button } from "../components/ui/button";
import { ArrowLeftRight, ArrowRight, Upload, Sparkles, Download, Eye, Camera, Phone, XCircle, Check } from "lucide-react";
import { SparklesText } from "@/components/ui/sparkles-text";
import EmbedQuoteGate from "@/components/embed-quote-gate";
import EmbedQuoteLeadForm from "@/components/embed-quote-lead-form";
import { useEmbedVisitorLimit } from "@/hooks/use-embed-visitor-limit";
import { uploadImage, checkVisualizationStatus } from "../lib/api";
import { getEmbedQuoteButtonText, runEmbedQuoteAction } from "@/lib/embed-quote";
import {
  DEFAULT_EMBED_BACKGROUND_COLOR,
  getEmbedBackground,
  parseEmbedBackgroundScheme,
} from "@/lib/embed-theme";
import { isEmbedServiceEnabled } from "@/lib/embed-services";
import { getExteriorSelectorCustomizations } from "@/lib/exterior-custom-options";
import roofingBeforeImage from "@assets/roofing-before.jpg";
import roofingAfterImage from "@assets/roofing-after.jpg";

function getContrastTextColor(color: string) {
  const normalized = color.trim().replace("#", "");
  const expanded = normalized.length === 3
    ? normalized.split("").map((character) => `${character}${character}`).join("")
    : normalized;

  if (!/^[0-9a-f]{6}$/i.test(expanded)) return "#ffffff";

  const value = Number.parseInt(expanded, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000;
  return luminance > 165 ? "#0f172a" : "#ffffff";
}

function colorWithAlpha(color: string, alpha: number) {
  const normalized = color.trim().replace("#", "");
  const expanded = normalized.length === 3
    ? normalized.split("").map((character) => `${character}${character}`).join("")
    : normalized;

  if (!/^[0-9a-f]{6}$/i.test(expanded)) return `rgba(15, 118, 110, ${alpha})`;

  const value = Number.parseInt(expanded, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export default function EmbedRoofingPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const tenantSlug = urlParams.get('tenant') || 'demo';
  const tenantIdParam = urlParams.get('tenantId') || '';
  const tenantLookup = tenantIdParam || tenantSlug;
  const accountUserIdParam = urlParams.get('accountUserId') || '';
  const primaryColorParam = urlParams.get('primaryColor') || '';
  const secondaryColorParam = urlParams.get('secondaryColor') || '';
  const primaryColor = primaryColorParam || '#475569';
  const secondaryColor = secondaryColorParam || '#64748b';
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
    description: "Professional AI-powered roofing and siding visualization services",
    showPricing: true,
    requirePhone: true,
    active: true,
    monthlyGenerationLimit: 1000,
    currentMonthGenerations: 0,
    createdAt: new Date(),
  };

  const embedCustomizations = (effectiveTenant as any).embedCustomizations || {};
  const exteriorSelectorCustomizations = getExteriorSelectorCustomizations(embedCustomizations);

  const resolvedPrimaryColor =
    primaryColorParam || (tenant ? (effectiveTenant as any).embedPrimaryColor || effectiveTenant.primaryColor || primaryColor : primaryColor);
  const resolvedSecondaryColor =
    secondaryColorParam || (tenant ? (effectiveTenant as any).embedSecondaryColor || effectiveTenant.secondaryColor || secondaryColor : secondaryColor);
  const resolvedLogoUrl = tenant ? effectiveTenant.logoUrl || logoUrlParam || "" : logoUrlParam || effectiveTenant.logoUrl || "";
  const displayCompanyName = tenant
    ? effectiveTenant.companyName || companyName || "DreamBuilder"
    : companyName || effectiveTenant.companyName || "DreamBuilder";
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
  const primaryButtonTextColor = getContrastTextColor(resolvedPrimaryColor);
  
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [comparisonPosition, setComparisonPosition] = useState(50);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [visualizationResult, setVisualizationResult] = useState<any>(null);
  const [lastGeneratedImageUrl, setLastGeneratedImageUrl] = useState<string | null>(null);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showQuoteGate, setShowQuoteGate] = useState(false);
  const [showingOriginal, setShowingOriginal] = useState(false);
  
  const [selectedStyles, setSelectedStyles] = useState({
    roof: { enabled: false, type: "" },
    siding: { enabled: false, type: "" },
    windows: { enabled: false, type: "" },
    surpriseMe: { enabled: false, type: "" },
  });
  const [styleSelectionStatus, setStyleSelectionStatus] = useState({
    hasEnabledCategories: false,
    allEnabledCategoriesComplete: false,
  });

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
      setVisualizationResult(null);
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

  if (effectiveTenant && !isEmbedServiceEnabled(effectiveTenant, "roofing")) {
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
        <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-2xl shadow-slate-950/15 lg:flex lg:h-[calc(100vh-2rem)] lg:max-h-[760px] lg:flex-col">
        {showHeader && (
          <header className="flex shrink-0 flex-col gap-2.5 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:px-5">
            {resolvedLogoUrl && (
              <img
                src={resolvedLogoUrl}
                alt={`${displayCompanyName} logo`}
                className="max-h-14 max-w-[190px] shrink-0 object-contain object-left"
              />
            )}
            <div className={`min-w-0 ${resolvedLogoUrl ? "sm:border-l sm:border-slate-200 sm:pl-4" : ""}`}>
              <h1 className="text-lg font-bold leading-tight text-slate-950 sm:text-xl">
                Exterior Design Visualizer
              </h1>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-sm">
                Upload a photo, choose your finishes, and preview a fresh look for your home.
              </p>
            </div>
          </header>
        )}

        {showQuoteForm && (
          <EmbedQuoteLeadForm
            tenant={effectiveTenant}
            service="roofing-siding"
            selectedStyles={selectedStyles}
            originalImageUrl={uploadedImage}
            generatedImageUrl={visualizationResult?.generatedImageUrl || lastGeneratedImageUrl}
            primaryColor={resolvedPrimaryColor}
            secondaryColor={resolvedSecondaryColor}
            onClose={() => setShowQuoteForm(false)}
          />
        )}

        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
        {/* Image Upload */}
        <section className="flex min-h-0 flex-col overflow-hidden bg-white p-4">
          {!uploadedImage ? (
            <>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-100 shadow-inner lg:min-h-0 lg:flex-1 lg:aspect-auto">
                <img
                  src={roofingAfterImage}
                  alt="Exterior design after visualization"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <img
                  src={roofingBeforeImage}
                  alt="Exterior before visualization"
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ clipPath: `inset(0 ${100 - comparisonPosition}% 0 0)` }}
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={comparisonPosition}
                  onChange={(event) => setComparisonPosition(Number(event.target.value))}
                  aria-label="Adjust the before and after comparison"
                  className="peer absolute inset-0 z-30 h-full w-full cursor-col-resize opacity-0"
                />
                <div
                  className="pointer-events-none absolute inset-y-0 z-20 w-px -translate-x-1/2 bg-white shadow-[0_0_14px_rgba(15,23,42,0.65)]"
                  style={{ left: `${comparisonPosition}%` }}
                />
                <span
                  className="pointer-events-none absolute top-1/2 z-20 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white shadow-xl transition-shadow peer-focus-visible:ring-4 peer-focus-visible:ring-white/80"
                  style={{ left: `${comparisonPosition}%`, backgroundColor: resolvedPrimaryColor, color: primaryButtonTextColor }}
                >
                  <ArrowLeftRight className="h-4 w-4" strokeWidth={2.5} />
                </span>
                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center bg-gradient-to-b from-slate-950/55 to-transparent px-4 pb-10 pt-4">
                  <span className="rounded-full border border-white/30 bg-slate-950/45 px-3 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur-md">
                    Drag to compare
                  </span>
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between bg-gradient-to-t from-slate-950/70 to-transparent px-4 pb-4 pt-14 sm:px-5">
                  <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-slate-800 shadow-md">Before</span>
                  <span
                    className="rounded-full px-3 py-1.5 text-xs font-bold shadow-md"
                    style={{ backgroundColor: resolvedPrimaryColor, color: primaryButtonTextColor }}
                  >
                    After
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <div className={`relative w-full overflow-hidden rounded-xl bg-slate-100 shadow-inner ${showQuoteGate ? "min-h-[300px] lg:min-h-0 lg:flex-1" : "aspect-video lg:min-h-0 lg:flex-1 lg:aspect-auto"}`}>
                {!isGenerating && !showQuoteGate && (
                  <label
                    htmlFor="image-upload"
                    className="absolute right-3 top-3 z-20 cursor-pointer rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold shadow-md backdrop-blur-sm transition hover:bg-white"
                    style={{ color: resolvedPrimaryColor }}
                  >
                    Change photo
                  </label>
                )}
                <img
                  src={visualizationResult?.status === "completed" && visualizationResult?.generatedImageUrl ? 
                    (showingOriginal ? uploadedImage : visualizationResult.generatedImageUrl) : 
                    uploadedImage}
                  alt={visualizationResult?.status === "completed" ? 
                    (showingOriginal ? "Original photo" : "Enhanced roofing design") : 
                    "Uploaded home"}
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
                    <div className="text-center">
                      <SparklesText
                        text="Designing your perfect roof & siding..."
                        className="text-sm sm:text-lg lg:text-xl font-bold text-white whitespace-nowrap"
                        sparklesCount={12}
                        colors={{ first: resolvedPrimaryColor, second: resolvedSecondaryColor }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Action buttons when generation is complete */}
              {visualizationResult?.status === "completed" && visualizationResult?.generatedImageUrl && (
                <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-3">
                    <Button
                      className="font-semibold shadow-sm"
                      style={{ 
                        backgroundColor: resolvedPrimaryColor,
                        color: primaryButtonTextColor,
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
                                  a.download = "roofing-design.jpg";
                                  a.click();
                                  URL.revokeObjectURL(url);
                                }
                              },
                              "image/jpeg",
                              0.9,
                            );
                          }
                        };
                        img.src = visualizationResult.generatedImageUrl;
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>

                    <Button
                      variant="outline"
                      className="border-slate-300 bg-white font-semibold text-slate-700"
                      onClick={() => setShowingOriginal(!showingOriginal)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      {showingOriginal ? "View design" : "View original"}
                    </Button>

                    <Button
                      variant="outline"
                      className="col-span-2 border-slate-300 bg-white font-semibold text-slate-700 sm:col-span-1"
                      onClick={() => {
                        setUploadedImage(null);
                        setOriginalFile(null);
                        setVisualizationResult(null);
                        setLastGeneratedImageUrl(null);
                        setShowingOriginal(false);
                        setSelectedStyles({
                          roof: { enabled: false, type: "" },
                          siding: { enabled: false, type: "" },
                          windows: { enabled: false, type: "" },
                          surpriseMe: { enabled: false, type: "" },
                        });
                        setStyleSelectionStatus({
                          hasEnabledCategories: false,
                          allEnabledCategoriesComplete: false,
                        });
                      }}
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Start over
                    </Button>
                  
                  {/* Get Free Quote button */}
                  <Button
                    className="col-span-2 min-w-0 font-semibold shadow-sm sm:col-span-3"
                    style={{ 
                      backgroundColor: resolvedPrimaryColor,
                      color: primaryButtonTextColor,
                    }}
                    onClick={handleQuoteClick}
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    {quoteButtonText}
                  </Button>
                </div>
              )}
            </div>
          )}
        </section>

        {!uploadedImage && (
          <aside
            className="flex min-h-0 flex-col items-center justify-center border-t border-slate-200 p-6 text-center sm:p-8 lg:border-l lg:border-t-0"
            style={{ backgroundColor: colorWithAlpha(resolvedPrimaryColor, 0.065) }}
          >
            <span
              className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm"
              style={{ backgroundColor: resolvedPrimaryColor, color: primaryButtonTextColor }}
            >
              <Sparkles className="h-5 w-5" />
            </span>
            <h3 className="max-w-sm text-2xl font-bold leading-tight text-slate-950">
              Now picture it on your home.
            </h3>
            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">
              Upload one exterior photo and explore new roofing, siding, and window combinations in minutes.
            </p>
            <label
              htmlFor="image-upload"
              className="group mt-6 flex w-full max-w-xs cursor-pointer items-center justify-center gap-2.5 rounded-xl px-5 py-3.5 text-sm font-semibold shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
              style={{ backgroundColor: resolvedPrimaryColor, color: primaryButtonTextColor }}
            >
              <Upload className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
              Upload my home photo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </label>
            <p className="mt-3 text-xs font-medium text-slate-500">JPG or PNG · Up to 10MB</p>
            <div className="mt-5 flex max-w-sm items-start justify-center gap-2 rounded-xl border border-white/80 bg-white/70 px-4 py-3 text-xs leading-5 text-slate-600 shadow-sm">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: resolvedPrimaryColor }} strokeWidth={3} />
              <p className="text-left">Use a straight-on daylight photo with the full exterior in frame.</p>
            </div>
          </aside>
        )}

        {/* Style Selection */}
        {uploadedImage && (
          <aside className="min-h-0 overflow-y-auto border-t border-slate-200 bg-slate-50 p-4 lg:border-l lg:border-t-0">
            <div className="mb-3">
              <h2 className="font-semibold text-slate-950">Customize your design</h2>
              <p className="mt-0.5 text-xs text-slate-500">Turn on an area, then choose both its style and color.</p>
            </div>
            {embedVisitor.status?.unlimitedAccountAccess && (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: resolvedPrimaryColor }} />
                <p className="text-xs font-semibold text-slate-700">Unlimited team access</p>
              </div>
            )}
            <StyleSelector
              selectedStyles={{
                roof: selectedStyles.roof.type,
                siding: selectedStyles.siding.type,
                windows: selectedStyles.windows.type,
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
                  windows: {
                    enabled: !!styles.windows,
                    type: styles.windows,
                  },
                  surpriseMe: { enabled: !!styles.surpriseMe, type: styles.surpriseMe },
                });
              }}
              primaryColor={resolvedPrimaryColor}
              secondaryColor={resolvedSecondaryColor}
              showWindows
              {...exteriorSelectorCustomizations}
              defaultOptionVisibility={embedCustomizations.defaultOptionVisibility}
              compact
              onSelectionStatusChange={setStyleSelectionStatus}
            />

            {/* Generate Button */}
          <div className="sticky bottom-0 mt-3 border-t border-slate-200 bg-slate-50/95 pt-3 backdrop-blur-sm">
            <Button
              size="lg"
              className="w-full rounded-xl font-semibold shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
              style={{ 
                backgroundColor: resolvedPrimaryColor,
                color: primaryButtonTextColor,
              }}
              disabled={
                isGenerating ||
                embedVisitor.isLoading ||
                !styleSelectionStatus.hasEnabledCategories ||
                !styleSelectionStatus.allEnabledCategoriesComplete
              }
              onClick={async () => {
                if (visitorLimitReached) {
                  setShowQuoteGate(true);
                  return;
                }

                setIsGenerating(true);
                
                try {
                  if (!originalFile) {
                    alert("Please re-upload your image.");
                    setIsGenerating(false);
                    return;
                  }

                  const result = await uploadImage(
                    originalFile,
                    effectiveTenant.id,
                    selectedStyles,
                    undefined,
                    undefined,
                    {
                      source: "embed",
                      accountUserId: accountUserIdParam ? Number(accountUserIdParam) : null,
                      tenantId: tenant?.id || null,
                      tenantSlug: tenant?.slug || null,
                      visitorId: embedVisitor.visitorId,
                    },
                  );

                  if (result.visualizationId) {
                    const status = await checkVisualizationStatus(
                      result.visualizationId,
                    );
                    setVisualizationResult(status);
                    if (status?.generatedImageUrl) {
                      setLastGeneratedImageUrl(status.generatedImageUrl);
                    }
                  }
                } catch (error) {
                  console.error("Error generating visualization:", error);
                  const apiError = error as any;
                  if (apiError.code === "EMBED_VISITOR_LIMIT") {
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
                  {styleSelectionStatus.hasEnabledCategories && !styleSelectionStatus.allEnabledCategoriesComplete
                    ? "Choose style and color"
                    : "Create my design"}
                </>
              )}
            </Button>
          </div>
          </aside>
        )}

        </div>
        </div>
      </div>
    </div>
  );
}
