import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Camera, Download, Eye, Phone, Sparkles, Upload, XCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../components/ui/select";
import { useTenant } from "../hooks/use-tenant";
import { checkVisualizationStatus, uploadInteriorImage } from "../lib/api";
import {
  DEFAULT_EMBED_BACKGROUND_COLOR,
  getEmbedBackground,
  getEmbedThemeClasses,
  parseEmbedBackgroundScheme,
} from "@/lib/embed-theme";

type InteriorService = "painting" | "bathroom" | "kitchen" | "living_room";

type InteriorOption = {
  value: string;
  label: string;
  swatch?: string;
  overall?: boolean;
};

type InteriorGroup = {
  id: string;
  label: string;
  options: InteriorOption[];
};

type InteriorEmbedConfig = {
  service: InteriorService;
  pageLabel: string;
  title: string;
  subtitle: string;
  uploadLabel: string;
  resultFileName: string;
  allowCombinations?: boolean;
  groups: InteriorGroup[];
};

const serviceConfigs: Record<string, InteriorEmbedConfig> = {
  "/embed-painting": {
    service: "painting",
    pageLabel: "Painting",
    title: "Painting Visualizer",
    subtitle: "Preview colors and finishes before the estimate request",
    uploadLabel: "Upload Your Room Photo",
    resultFileName: "painting-design.jpg",
    groups: [
      {
        id: "whitesNeutrals",
        label: "Whites & Neutrals",
        options: [
          { value: "pure_white", label: "Pure White", swatch: "#f8f8f2" },
          { value: "warm_white", label: "Warm White", swatch: "#f4ead7" },
          { value: "modern_white", label: "Modern White", swatch: "#f2f1ec" },
          { value: "soft_greige", label: "Soft Greige", swatch: "#cfc6b8" },
          { value: "warm_neutral", label: "Warm Neutral", swatch: "#d7c9b6" },
          { value: "classic_beige", label: "Classic Beige", swatch: "#d9c4a6" },
          { value: "light_taupe", label: "Light Taupe", swatch: "#b8ab9c" },
        ],
      },
      {
        id: "greensBlues",
        label: "Greens & Blues",
        options: [
          { value: "sage_green", label: "Sage Green", swatch: "#9ca58d" },
          { value: "olive_green", label: "Olive Green", swatch: "#6f7652" },
          { value: "dusty_blue", label: "Dusty Blue", swatch: "#8ea3b2" },
          { value: "slate_blue", label: "Slate Blue", swatch: "#596f83" },
        ],
      },
      {
        id: "accentColors",
        label: "Accent Colors",
        options: [
          { value: "navy_accent", label: "Navy Accent", swatch: "#243957" },
          { value: "charcoal_accent", label: "Charcoal Accent", swatch: "#3f4448" },
        ],
      },
      {
        id: "warmColors",
        label: "Warm Colors",
        options: [
          { value: "terracotta", label: "Terracotta", swatch: "#b96f55" },
          { value: "soft_blush", label: "Soft Blush", swatch: "#e3b8b1" },
          { value: "muted_mauve", label: "Muted Mauve", swatch: "#a9828b" },
          { value: "buttercream", label: "Buttercream", swatch: "#f0dda2" },
        ],
      },
      {
        id: "custom",
        label: "Custom",
        options: [
          { value: "soft_color", label: "Designer Soft Color", swatch: "#c9b8d8" },
          { value: "custom_paint_color", label: "Custom Color", swatch: "#718ae1" },
        ],
      },
    ],
  },
  "/embed-kitchen": {
    service: "kitchen",
    pageLabel: "Kitchen",
    title: "Kitchen Visualizer",
    subtitle: "Preview cabinets, counters, fixtures, and finishing details",
    uploadLabel: "Upload Your Kitchen Photo",
    resultFileName: "kitchen-design.jpg",
    allowCombinations: true,
    groups: [
      {
        id: "overall",
        label: "Overall Design",
        options: [
          { value: "modern_white", label: "Modern White", swatch: "#f5f3ed", overall: true },
          { value: "warm_wood", label: "Warm Wood", swatch: "#b98553", overall: true },
          { value: "two_tone", label: "Two-Tone", swatch: "linear-gradient(135deg, #f6f3ed 0%, #f6f3ed 48%, #334155 52%, #334155 100%)", overall: true },
          { value: "luxury_stone", label: "Luxury Stone", swatch: "#d8d2c8", overall: true },
        ],
      },
      {
        id: "combined",
        label: "Combined Upgrades",
        options: [
          { value: "full_kitchen_refresh", label: "Cabinets + Counter + Sink", swatch: "linear-gradient(135deg, #f7f4ed 0%, #f7f4ed 35%, #b98553 36%, #b98553 68%, #a7adb4 69%, #a7adb4 100%)", overall: true },
        ],
      },
      {
        id: "cabinets",
        label: "Cabinets",
        options: [
          { value: "cabinets_white_shaker", label: "White Shaker", swatch: "#f8f8f2" },
          { value: "cabinets_warm_oak", label: "Warm Oak", swatch: "#b98553" },
          { value: "cabinets_sage_green", label: "Sage Green", swatch: "#8d9a78" },
          { value: "cabinets_navy_lower", label: "Navy Lower", swatch: "#243957" },
          { value: "cabinets_black_modern", label: "Modern Black", swatch: "#111827" },
        ],
      },
      {
        id: "counters",
        label: "Counters",
        options: [
          { value: "counters_white_quartz", label: "White Quartz", swatch: "#f7f4ec" },
          { value: "counters_marble", label: "Marble Look", swatch: "linear-gradient(135deg, #ffffff 0%, #e7e2dc 42%, #f8f7f2 100%)" },
          { value: "counters_dark_stone", label: "Dark Stone", swatch: "#2f3437" },
          { value: "counters_butcher_block", label: "Butcher Block", swatch: "#b47b46" },
        ],
      },
      {
        id: "sinkFixtures",
        label: "Sink & Fixtures",
        options: [
          { value: "sink_farmhouse", label: "Farmhouse Sink", swatch: "#f7f5ef" },
          { value: "sink_undermount", label: "Undermount Sink", swatch: "#a7adb4" },
          { value: "sink_black_workstation", label: "Black Workstation Sink", swatch: "#111827" },
        ],
      },
      {
        id: "finishingDetails",
        label: "Finishing Details",
        options: [
          { value: "backsplash_subway", label: "Subway Tile", swatch: "#f7f7f2" },
          { value: "backsplash_zellige", label: "Zellige Tile", swatch: "#dce6de" },
          { value: "pendant_lighting", label: "Pendant Lighting" },
          { value: "hardware_brass", label: "Brass Hardware", swatch: "#b58b43" },
        ],
      },
    ],
  },
  "/embed-bathroom": {
    service: "bathroom",
    pageLabel: "Bathroom",
    title: "Bathroom Visualizer",
    subtitle: "Preview remodel concepts while keeping the room layout",
    uploadLabel: "Upload Your Bathroom Photo",
    resultFileName: "bathroom-design.jpg",
    groups: [
      {
        id: "options",
        label: "Options",
        options: [
          { value: "modern_spa", label: "Modern Spa" },
          { value: "luxury_marble", label: "Luxury Marble" },
          { value: "warm_traditional", label: "Warm Traditional" },
          { value: "compact_refresh", label: "Compact Refresh" },
        ],
      },
    ],
  },
  "/embed-living-room": {
    service: "living_room",
    pageLabel: "Living Room",
    title: "Living Room Visualizer",
    subtitle: "Explore furniture, color, lighting, and decor concepts",
    uploadLabel: "Upload Your Living Room Photo",
    resultFileName: "living-room-design.jpg",
    allowCombinations: true,
    groups: [
      {
        id: "overall",
        label: "Overall Design",
        options: [
          { value: "modern_cozy", label: "Modern Cozy", overall: true },
          { value: "scandinavian", label: "Scandinavian", overall: true },
          { value: "classic_comfort", label: "Classic Comfort", overall: true },
          { value: "luxe_contemporary", label: "Luxe Contemporary", overall: true },
        ],
      },
      {
        id: "sofaOptions",
        label: "Sofa Options",
        options: [
          { value: "couch_linen_sectional", label: "Linen Sectional", swatch: "#d8d0c4" },
          { value: "couch_leather", label: "Leather Sofa", swatch: "#9a5a2f" },
          { value: "couch_modern_curved", label: "Modern Curved", swatch: "#c7c1b8" },
          { value: "couch_blue_velvet", label: "Blue Velvet", swatch: "#1f3a5f" },
        ],
      },
      {
        id: "furniture",
        label: "Furniture",
        options: [
          { value: "accent_chairs", label: "Accent Chairs" },
          { value: "coffee_table_refresh", label: "Coffee Table" },
        ],
      },
      {
        id: "decorSurfaces",
        label: "Decor & Surfaces",
        options: [
          { value: "area_rug", label: "Area Rug", swatch: "#b8a893" },
          { value: "curtains_window_treatments", label: "Curtains", swatch: "#d9d4c9" },
          { value: "lighting_refresh", label: "Lighting Refresh" },
        ],
      },
      {
        id: "builtInsFeatures",
        label: "Built-Ins & Features",
        options: [
          { value: "media_wall", label: "Media Wall" },
          { value: "fireplace_refresh", label: "Fireplace Refresh" },
          { value: "built_in_shelving", label: "Built-In Shelving" },
        ],
      },
    ],
  },
};

const createDefaultSelections = (config: InteriorEmbedConfig) =>
  config.groups.reduce<Record<string, string>>((selections, group) => {
    selections[group.id] = group.options[0]?.value || "";
    return selections;
  }, {});

const createDefaultActiveGroups = (config: InteriorEmbedConfig) =>
  config.groups.reduce<Record<string, boolean>>((groups, group) => {
    groups[group.id] = group.id === config.groups[0]?.id;
    return groups;
  }, {});

function Swatch({ color }: { color: string }) {
  return (
    <span
      className="h-4 w-4 shrink-0 rounded-full border border-white/40 shadow-inner"
      style={{ background: color }}
      aria-hidden="true"
    />
  );
}

function OptionDisplay({ option }: { option?: InteriorOption }) {
  return (
    <span className="flex min-w-0 items-center gap-2 text-left">
      {option?.swatch && <Swatch color={option.swatch} />}
      <span className="truncate">{option?.label || "Choose an option"}</span>
    </span>
  );
}

export default function EmbedInteriorPage() {
  const [location] = useLocation();
  const config = serviceConfigs[location] || serviceConfigs["/embed-painting"];
  const urlParams = new URLSearchParams(window.location.search);
  const tenantSlug = urlParams.get("tenant") || "demo";
  const tenantIdParam = urlParams.get("tenantId") || "";
  const tenantLookup = tenantIdParam || tenantSlug;
  const primaryColor = urlParams.get("primaryColor") || "#2563eb";
  const secondaryColor = urlParams.get("secondaryColor") || "#1d4ed8";
  const companyName = urlParams.get("companyName") || "";
  const showHeader = urlParams.get("showHeader") !== "false";
  const contactType = urlParams.get("contactType") || "phone";
  const contactPhone = urlParams.get("contactPhone") || "";
  const contactLink = urlParams.get("contactLink") || "";
  const logoUrlParam = urlParams.get("logoUrl") || "";
  const backgroundScheme = parseEmbedBackgroundScheme(urlParams.get("backgroundScheme"));
  const backgroundColor = urlParams.get("backgroundColor") || DEFAULT_EMBED_BACKGROUND_COLOR;
  const { tenant, isLoading: tenantLoading, error: tenantError } = useTenant(tenantLookup);
  const isDemoLookup = tenantLookup === "demo";

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [visualizationResult, setVisualizationResult] = useState<any>(null);
  const [showingOriginal, setShowingOriginal] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState(() => createDefaultSelections(config));
  const [activeGroups, setActiveGroups] = useState(() => createDefaultActiveGroups(config));
  const [customPaintName, setCustomPaintName] = useState("");
  const [customPaintHex, setCustomPaintHex] = useState("#718ae1");

  useEffect(() => {
    setSelectedOptions(createDefaultSelections(config));
    setActiveGroups(createDefaultActiveGroups(config));
    setUploadedImage(null);
    setOriginalFile(null);
    setVisualizationResult(null);
    setShowingOriginal(false);
    setCustomPaintName("");
    setCustomPaintHex("#718ae1");
  }, [config]);

  useEffect(() => {
    document.documentElement.style.setProperty("--primary-color", primaryColor);
    document.documentElement.style.setProperty("--secondary-color", secondaryColor);
  }, [primaryColor, secondaryColor]);

  const effectiveTenant = (tenant || {
    id: 1,
    slug: "demo",
    companyName: companyName || "DreamBuilder",
    logoUrl: logoUrlParam,
    primaryColor,
    secondaryColor,
    phone: contactPhone || "(555) 123-4567",
    contactPhone,
    email: "info@dreambuilder.com",
    address: "123 Main St, Anytown USA",
    description: "Professional AI-powered visualization services",
    showPricing: true,
    requirePhone: true,
    active: true,
    monthlyGenerationLimit: 1000,
    currentMonthGenerations: 0,
    createdAt: new Date(),
  }) as any;

  const resolvedLogoUrl = logoUrlParam || effectiveTenant.logoUrl || "";
  const displayCompanyName = companyName || effectiveTenant.companyName || "DreamBuilder";
  const pageBackground = getEmbedBackground(
    backgroundScheme,
    primaryColor,
    secondaryColor,
    backgroundColor,
  );
  const themeClasses = getEmbedThemeClasses(backgroundScheme);

  const selectedStyleIds = useMemo(
    () =>
      config.groups
        .filter((group) => activeGroups[group.id])
        .map((group) => selectedOptions[group.id] || group.options[0]?.value)
        .filter(Boolean),
    [activeGroups, config.groups, selectedOptions],
  );
  const customPaintSelected = selectedStyleIds.includes("custom_paint_color");

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setOriginalFile(file);
    setVisualizationResult(null);
    setShowingOriginal(false);

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      setUploadedImage(readerEvent.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const toggleGroup = (group: InteriorGroup) => {
    const isActive = activeGroups[group.id];
    const defaultOption = group.options[0];

    if (!defaultOption) {
      return;
    }

    if (isActive) {
      setActiveGroups((current) => ({
        ...current,
        [group.id]: false,
      }));
      return;
    }

    setSelectedOptions((current) => ({
      ...current,
      [group.id]: current[group.id] || defaultOption.value,
    }));

    if (!config.allowCombinations) {
      setActiveGroups({ [group.id]: true });
      return;
    }

    if (group.options.some((option) => option.overall)) {
      setActiveGroups({ [group.id]: true });
      return;
    }

    setActiveGroups((current) => {
      const next = { ...current, [group.id]: true };
      config.groups.forEach((candidate) => {
        if (candidate.options.some((option) => option.overall)) {
          next[candidate.id] = false;
        }
      });
      return next;
    });
  };

  const selectGroupOption = (group: InteriorGroup, value: string) => {
    const selectedOption = group.options.find((option) => option.value === value);

    if (!selectedOption) {
      return;
    }

    setSelectedOptions((current) => ({
      ...current,
      [group.id]: value,
    }));

    if (!config.allowCombinations || selectedOption.overall) {
      setActiveGroups({ [group.id]: true });
      return;
    }

    setActiveGroups((current) => {
      const next = { ...current, [group.id]: true };
      config.groups.forEach((candidate) => {
        if (candidate.options.some((option) => option.overall)) {
          next[candidate.id] = false;
        }
      });
      return next;
    });
  };

  const generateDesign = async () => {
    if (!originalFile || selectedStyleIds.length === 0) {
      return;
    }

    setIsGenerating(true);
    setVisualizationResult(null);

    try {
      const result = await uploadInteriorImage(
        originalFile,
        config.service,
        selectedStyleIds,
        customPaintSelected ? { name: customPaintName, hex: customPaintHex } : undefined,
        undefined,
        {
          source: "embed",
          tenantId: effectiveTenant.id,
          tenantSlug: effectiveTenant.slug || tenantSlug,
        },
      );

      if (result.visualizationId) {
        const status = await checkVisualizationStatus(result.visualizationId);
        setVisualizationResult(status);
      } else {
        setVisualizationResult(result);
      }
    } catch (error) {
      console.error("Error generating interior embed visualization:", error);
      alert("Unable to generate the design. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const resetPhoto = () => {
    setUploadedImage(null);
    setOriginalFile(null);
    setVisualizationResult(null);
    setShowingOriginal(false);
  };

  const openQuote = () => {
    const quotePhone = contactPhone || effectiveTenant.contactPhone || effectiveTenant.phone;

    if (contactType === "link" && contactLink) {
      window.open(contactLink, "_blank");
      return;
    }

    if (quotePhone) {
      window.open(`tel:${quotePhone.replace(/[\(\)\-\s]/g, "")}`, "_self");
    }
  };

  if (!tenant && tenantLoading && !isDemoLookup) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Loading Visualizer</h1>
          <p className="text-gray-600">Connecting this embed to the client account.</p>
        </div>
      </div>
    );
  }

  if (!tenant && !tenantLoading && !isDemoLookup) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Embed Account Not Found</h1>
          <p className="mb-4 text-gray-600">
            This visualizer is not connected to a valid client account. Please update the embed code and try again.
          </p>
          {tenantError && <p className="text-xs text-gray-400">Account lookup failed.</p>}
        </div>
      </div>
    );
  }

  if (effectiveTenant && !effectiveTenant.active) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Service Temporarily Unavailable</h1>
          <p className="mb-4 text-gray-600">
            This service is currently not available. Please contact the company directly for assistance.
          </p>
          {effectiveTenant.phone && (
            <a
              href={`tel:${effectiveTenant.phone.replace(/[\(\)\-\s]/g, "")}`}
              className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
            >
              <Phone className="mr-2 h-4 w-4" />
              Call {effectiveTenant.phone}
            </a>
          )}
        </div>
      </div>
    );
  }

  const completedImage =
    visualizationResult?.status === "completed" && visualizationResult?.generatedImageUrl
      ? visualizationResult.generatedImageUrl
      : visualizationResult?.generatedImageUrl;
  const activeImage = completedImage && !showingOriginal ? completedImage : uploadedImage;

  return (
    <div className="min-h-screen p-2" style={{ background: pageBackground }}>
      <div className="mx-auto max-w-4xl">
        {showHeader && (
          <div className="mb-8 pt-4 text-center">
            {resolvedLogoUrl && (
              <img
                src={resolvedLogoUrl}
                alt={`${displayCompanyName} logo`}
                className="mx-auto mb-4 max-h-20 max-w-[220px] object-contain"
              />
            )}
            <h1 className={`mb-2 text-3xl font-bold md:text-4xl ${themeClasses.headerText}`}>
              {displayCompanyName} {config.title}
            </h1>
            <p className={`text-lg ${themeClasses.subheadingText}`}>{config.subtitle}</p>
          </div>
        )}

        <div className={`${themeClasses.panel} mb-4 rounded-2xl p-4`}>
          <h2 className={`mb-4 text-center text-xl font-semibold ${themeClasses.panelTitle}`}>
            {config.uploadLabel}
          </h2>

          {!uploadedImage ? (
            <div className={`rounded-lg border-2 border-dashed p-8 text-center ${themeClasses.uploadBorder}`}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="interior-image-upload"
              />
              <label htmlFor="interior-image-upload" className="flex cursor-pointer flex-col items-center space-y-4">
                <Upload className={`h-12 w-12 ${themeClasses.uploadIcon}`} />
                <div>
                  <p className={`${themeClasses.uploadPrimaryText} font-medium`}>Click to upload your photo</p>
                  <p className={`${themeClasses.uploadSecondaryText} text-sm`}>PNG, JPG up to 10MB</p>
                </div>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
                <img src={activeImage || ""} alt="Uploaded project" className="h-full w-full object-cover" />
                {isGenerating && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3 text-lg font-bold text-white">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Rendering your design
                    </div>
                  </div>
                )}
              </div>

              {completedImage ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      size="lg"
                      className="font-semibold text-white shadow-md transition-all hover:shadow-lg"
                      style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}
                      onClick={() => {
                        const anchor = document.createElement("a");
                        anchor.href = completedImage;
                        anchor.download = config.resultFileName;
                        anchor.click();
                      }}
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Download Image
                    </Button>
                    <Button
                      size="lg"
                      className="font-semibold text-white shadow-md transition-all hover:shadow-lg"
                      style={{ background: "linear-gradient(to right, #64748b, #475569)" }}
                      onClick={() => setShowingOriginal(!showingOriginal)}
                    >
                      <Eye className="mr-2 h-5 w-5" />
                      {showingOriginal ? "View New Design" : "View Original Photo"}
                    </Button>
                  </div>
                  <Button
                    size="lg"
                    className="w-full font-semibold text-white shadow-md transition-all hover:shadow-lg"
                    style={{ background: `linear-gradient(to right, ${secondaryColor}, ${primaryColor})` }}
                    onClick={resetPhoto}
                  >
                    <Camera className="mr-2 h-5 w-5" />
                    Try Another Photo
                  </Button>
                  <Button
                    size="lg"
                    className="w-full py-4 font-semibold text-white shadow-lg transition-all hover:shadow-xl"
                    style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor}, ${primaryColor})` }}
                    onClick={openQuote}
                  >
                    <Phone className="mr-2 h-5 w-5" />
                    Get Free Quote
                  </Button>
                </div>
              ) : (
                <Button variant="outline" onClick={resetPhoto} className="w-full">
                  Upload Different Photo
                </Button>
              )}
            </div>
          )}
        </div>

        {uploadedImage && (
          <div className={`${themeClasses.panel} mb-4 rounded-2xl p-4`}>
            <h2 className={`mb-4 text-xl font-semibold ${themeClasses.panelTitle}`}>Choose Your Style</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {config.groups.map((group) => {
                const isActive = activeGroups[group.id];
                const selectedOption =
                  group.options.find((option) => option.value === selectedOptions[group.id]) ||
                  group.options[0];

                return (
                  <div
                    key={group.id}
                    className={`rounded-xl p-4 ring-1 transition ${
                      isActive ? "bg-black/15 ring-white/15" : "bg-slate-600/25 ring-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className={`font-semibold ${themeClasses.panelTitle}`}>{group.label}</h3>
                      <button
                        type="button"
                        aria-label={`Toggle ${group.label}`}
                        aria-pressed={isActive}
                        onClick={() => toggleGroup(group)}
                        className="flex h-7 w-12 items-center rounded-full p-1 transition"
                        style={{ backgroundColor: isActive ? primaryColor : "#64748b" }}
                      >
                        <span
                          className={`h-5 w-5 rounded-full bg-white transition-transform ${
                            isActive ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                    <Select
                      value={selectedOptions[group.id] || group.options[0]?.value || ""}
                      onValueChange={(value) => selectGroupOption(group, value)}
                      disabled={!isActive}
                    >
                      <SelectTrigger className="mt-3 h-12 border-white/10 bg-[#111827] text-white focus:border-blue-300 disabled:cursor-not-allowed disabled:opacity-55">
                        <OptionDisplay option={selectedOption} />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-[#111827] text-white">
                        {group.options.map((option) => (
                          <SelectItem key={option.value} value={option.value} textValue={option.label}>
                            <OptionDisplay option={option} />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>

            {customPaintSelected && (
              <div className="mt-4 rounded-xl border border-white/10 bg-white p-4 shadow-sm">
                <h3 className="mb-3 font-semibold text-slate-800">Custom Paint Color</h3>
                <div className="grid gap-4 sm:grid-cols-[96px_1fr]">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-600">Color</span>
                    <input
                      type="color"
                      value={customPaintHex}
                      onChange={(event) => setCustomPaintHex(event.target.value)}
                      className="h-12 w-full rounded-lg border border-slate-300 bg-white p-1"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-600">Color name or notes</span>
                    <input
                      type="text"
                      value={customPaintName}
                      onChange={(event) => setCustomPaintName(event.target.value)}
                      placeholder="Example: soft sage, SW 6184, Benjamin Moore Hale Navy"
                      className="h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-800 outline-none focus:border-slate-600"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {uploadedImage && !completedImage && (
          <>
            <Button
              size="lg"
              className="mb-4 w-full py-4 font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
              style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor}, ${primaryColor})` }}
              disabled={isGenerating || selectedStyleIds.length === 0}
              onClick={generateDesign}
            >
              {isGenerating ? (
                <>
                  <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Generating Your Design
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate AI {config.pageLabel} Design
                </>
              )}
            </Button>

          </>
        )}
      </div>
    </div>
  );
}
