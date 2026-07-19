import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Camera,
  Download,
  Eye,
  Facebook,
  FileImage,
  Instagram,
  Phone,
  Sparkles,
  Youtube,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import FileUpload from "@/components/ui/file-upload";
import Header from "@/components/header";
import QuoteLeadForm from "@/components/quote-lead-form";
import { InlinePromptChat } from "@/components/custom-prompt-chat";
import { SparklesText } from "@/components/ui/sparkles-text";
import { useTenant } from "@/hooks/use-tenant";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { checkVisualizationStatus, uploadInteriorImage } from "@/lib/api";
import { downloadImageWithWatermark } from "@/lib/download-utils";
import { normalizeEmbedDefaultOptionVisibility } from "@/lib/embed-default-visibility";
import { getInteriorReferencePreviewUrl } from "@shared/interior-reference-options";

type InteriorService = "painting" | "bathroom" | "kitchen" | "living_room";

interface InteriorStyleOption {
  value: string;
  label: string;
  description: string;
  group?: string;
  swatch?: string;
  overall?: boolean;
  referenceImageUrl?: string;
}

interface InteriorServiceConfig {
  service: InteriorService;
  title: string;
  accent: string;
  background: string;
  ctaGradient: string;
  sparkleColors: { first: string; second: string };
  uploadTitle: string;
  uploadDescription: string;
  resultFileName: string;
  quoteService: string;
  allowCombinations?: boolean;
  styles: InteriorStyleOption[];
}

const serviceConfigs: Record<string, InteriorServiceConfig> = {
  "/painting": {
    service: "painting",
    title: "Visualize Interior Paint",
    accent: "from-sky-300 to-rose-300",
    background: "bg-gradient-to-br from-indigo-900 via-slate-800 to-rose-800",
    ctaGradient: "from-sky-500 via-rose-500 to-indigo-500 hover:from-sky-600 hover:via-rose-600 hover:to-indigo-600",
    sparkleColors: { first: "#38bdf8", second: "#fb7185" },
    uploadTitle: "Upload Your Room Photo",
    uploadDescription: "Use a clear photo of an indoor room to preview new paint colors and finishes.",
    resultFileName: "interior-paint-design.jpg",
    quoteService: "painting",
    styles: [
      { value: "pure_white", label: "Pure White", description: "Clean bright white", group: "Whites & Neutrals", swatch: "#f8f8f2" },
      { value: "warm_white", label: "Warm White", description: "Soft creamy white", group: "Whites & Neutrals", swatch: "#f4ead7" },
      { value: "modern_white", label: "Modern White", description: "Gallery-like refresh", group: "Whites & Neutrals", swatch: "#f2f1ec" },
      { value: "soft_greige", label: "Soft Greige", description: "Warm gray-beige", group: "Whites & Neutrals", swatch: "#cfc6b8" },
      { value: "warm_neutral", label: "Warm Neutral", description: "Designer neutral", group: "Whites & Neutrals", swatch: "#d7c9b6" },
      { value: "classic_beige", label: "Classic Beige", description: "Timeless warm beige", group: "Whites & Neutrals", swatch: "#d9c4a6" },
      { value: "light_taupe", label: "Light Taupe", description: "Subtle refined taupe", group: "Whites & Neutrals", swatch: "#b8ab9c" },
      { value: "sage_green", label: "Sage Green", description: "Soft natural green", group: "Greens & Blues", swatch: "#9ca58d" },
      { value: "olive_green", label: "Olive Green", description: "Earthy saturated green", group: "Greens & Blues", swatch: "#6f7652" },
      { value: "dusty_blue", label: "Dusty Blue", description: "Muted calm blue", group: "Greens & Blues", swatch: "#8ea3b2" },
      { value: "slate_blue", label: "Slate Blue", description: "Blue with gray depth", group: "Greens & Blues", swatch: "#596f83" },
      { value: "navy_accent", label: "Navy Accent", description: "Deep focal wall", group: "Accent Colors", swatch: "#243957" },
      { value: "charcoal_accent", label: "Charcoal Accent", description: "Rich gray focal wall", group: "Accent Colors", swatch: "#3f4448" },
      { value: "terracotta", label: "Terracotta", description: "Warm clay tone", group: "Warm Colors", swatch: "#b96f55" },
      { value: "soft_blush", label: "Soft Blush", description: "Subtle warm pink", group: "Warm Colors", swatch: "#e3b8b1" },
      { value: "muted_mauve", label: "Muted Mauve", description: "Soft dusty mauve", group: "Warm Colors", swatch: "#a9828b" },
      { value: "buttercream", label: "Buttercream", description: "Gentle warm yellow", group: "Warm Colors", swatch: "#f0dda2" },
      { value: "soft_color", label: "Designer Soft Color", description: "AI picks a muted color", group: "Custom", swatch: "#c9b8d8" },
      { value: "custom_paint_color", label: "Custom Color", description: "Pick an exact color", group: "Custom", swatch: "#718ae1" },
    ],
  },
  "/bathroom-redesign": {
    service: "bathroom",
    title: "Visualize a Bathroom Redesign",
    accent: "from-cyan-200 to-blue-300",
    background: "bg-gradient-to-br from-cyan-950 via-blue-800 to-teal-700",
    ctaGradient: "from-cyan-500 via-blue-500 to-teal-500 hover:from-cyan-600 hover:via-blue-600 hover:to-teal-600",
    sparkleColors: { first: "#22d3ee", second: "#60a5fa" },
    uploadTitle: "Upload Your Bathroom Photo",
    uploadDescription: "Preview realistic bathroom remodel concepts while preserving the room layout.",
    resultFileName: "bathroom-redesign.jpg",
    quoteService: "bathroom-redesign",
    styles: [
      { value: "modern_spa", label: "Modern Spa", description: "Calm neutrals, clean tile, refined fixtures", group: "Full Redesign", overall: true },
      { value: "luxury_marble", label: "Luxury Marble", description: "Bright, polished, high-end hotel feel", group: "Full Redesign", overall: true },
      { value: "warm_traditional", label: "Warm Traditional", description: "Timeless finishes and classic warmth", group: "Full Redesign", overall: true },
      { value: "compact_refresh", label: "Compact Refresh", description: "Practical upgrades for smaller spaces", group: "Full Redesign", overall: true },
    ],
  },
  "/kitchen-redesign": {
    service: "kitchen",
    title: "Visualize a Kitchen Redesign",
    accent: "from-amber-200 to-sky-300",
    background: "bg-gradient-to-br from-emerald-950 via-slate-800 to-amber-700",
    ctaGradient: "from-emerald-600 via-amber-500 to-slate-700 hover:from-emerald-700 hover:via-amber-600 hover:to-slate-800",
    sparkleColors: { first: "#10b981", second: "#f59e0b" },
    uploadTitle: "Upload Your Kitchen Photo",
    uploadDescription: "See remodel directions for cabinets, counters, backsplash, lighting, and finishes.",
    resultFileName: "kitchen-redesign.jpg",
    quoteService: "kitchen-redesign",
    allowCombinations: true,
    styles: [
      { value: "modern_white", label: "Modern White", description: "White cabinets, stone counters, clean lines", group: "Overall Designs", overall: true, swatch: "#f5f3ed" },
      { value: "warm_wood", label: "Warm Wood", description: "Natural cabinet warmth and durable surfaces", group: "Overall Designs", overall: true, swatch: "#b98553" },
      { value: "two_tone", label: "Two-Tone", description: "Balanced light and dark cabinet palette", group: "Overall Designs", overall: true, swatch: "linear-gradient(135deg, #f6f3ed 0%, #f6f3ed 48%, #334155 52%, #334155 100%)" },
      { value: "luxury_stone", label: "Luxury Stone", description: "Premium counters, backsplash, and lighting", group: "Overall Designs", overall: true, swatch: "#d8d2c8" },
      { value: "full_kitchen_refresh", label: "Cabinets + Counter + Sink", description: "A coordinated grouped upgrade", group: "Combined Upgrades", overall: true, swatch: "linear-gradient(135deg, #f7f4ed 0%, #f7f4ed 35%, #b98553 36%, #b98553 68%, #a7adb4 69%, #a7adb4 100%)" },
      { value: "cabinets_white_shaker", label: "White Shaker Cabinets", description: "Only replace the cabinets", group: "Cabinets", swatch: "#f8f8f2" },
      { value: "cabinets_warm_oak", label: "Warm Oak Cabinets", description: "Only replace the cabinets", group: "Cabinets", swatch: "#b98553" },
      { value: "cabinets_sage_green", label: "Sage Green Cabinets", description: "Only replace the cabinets", group: "Cabinets", swatch: "#8d9a78" },
      { value: "cabinets_navy_lower", label: "Navy Lower Cabinets", description: "Lower cabinets or island only", group: "Cabinets", swatch: "#243957" },
      { value: "cabinets_black_modern", label: "Modern Black Cabinets", description: "Only replace the cabinets", group: "Cabinets", swatch: "#111827" },
      { value: "counters_white_quartz", label: "White Quartz Counters", description: "Only replace countertops", group: "Counters", swatch: "#f7f4ec" },
      { value: "counters_marble", label: "Marble-Look Counters", description: "Only replace countertops", group: "Counters", swatch: "linear-gradient(135deg, #ffffff 0%, #e7e2dc 42%, #f8f7f2 100%)" },
      { value: "counters_dark_stone", label: "Dark Stone Counters", description: "Only replace countertops", group: "Counters", swatch: "#2f3437" },
      { value: "counters_butcher_block", label: "Butcher Block Counters", description: "Only replace countertops", group: "Counters", swatch: "#b47b46" },
      { value: "sink_farmhouse", label: "Farmhouse Sink", description: "Only replace sink and faucet", group: "Sink & Fixtures", swatch: "#f7f5ef" },
      { value: "sink_undermount", label: "Undermount Sink", description: "Only replace sink and faucet", group: "Sink & Fixtures", swatch: "#a7adb4" },
      { value: "sink_black_workstation", label: "Black Workstation Sink", description: "Only replace sink and faucet", group: "Sink & Fixtures", swatch: "#111827" },
      { value: "backsplash_subway", label: "Subway Tile Backsplash", description: "Only replace backsplash", group: "Finishing Details", swatch: "#f7f7f2" },
      { value: "backsplash_zellige", label: "Zellige Tile Backsplash", description: "Only replace backsplash", group: "Finishing Details", swatch: "#dce6de" },
      { value: "pendant_lighting", label: "Pendant Lighting", description: "Only update lighting", group: "Finishing Details" },
      { value: "hardware_brass", label: "Brass Hardware", description: "Only update hardware", group: "Finishing Details", swatch: "#b58b43" },
    ],
  },
  "/living-room-design": {
    service: "living_room",
    title: "Visualize a Living Room Design",
    accent: "from-violet-200 to-emerald-200",
    background: "bg-gradient-to-br from-violet-950 via-slate-800 to-emerald-800",
    ctaGradient: "from-violet-600 via-fuchsia-500 to-emerald-500 hover:from-violet-700 hover:via-fuchsia-600 hover:to-emerald-600",
    sparkleColors: { first: "#a78bfa", second: "#34d399" },
    uploadTitle: "Upload Your Living Room Photo",
    uploadDescription: "Explore furniture, color, lighting, and decor concepts for your existing room.",
    resultFileName: "living-room-design.jpg",
    quoteService: "living-room-design",
    allowCombinations: true,
    styles: [
      { value: "modern_cozy", label: "Modern Cozy", description: "Warm neutral palette with layered comfort", group: "Overall Designs", overall: true },
      { value: "scandinavian", label: "Scandinavian", description: "Light woods, airy styling, simple forms", group: "Overall Designs", overall: true },
      { value: "classic_comfort", label: "Classic Comfort", description: "Timeless furniture and balanced decor", group: "Overall Designs", overall: true },
      { value: "luxe_contemporary", label: "Luxe Contemporary", description: "Elevated textures and polished finishes", group: "Overall Designs", overall: true },
      { value: "couch_linen_sectional", label: "Linen Sectional Sofa", description: "Only replace the main couch", group: "Sofa Options", swatch: "#d8d0c4" },
      { value: "couch_leather", label: "Leather Sofa", description: "Only replace the main couch", group: "Sofa Options", swatch: "#9a5a2f" },
      { value: "couch_modern_curved", label: "Modern Curved Sofa", description: "Only replace the main couch", group: "Sofa Options", swatch: "#c7c1b8" },
      { value: "couch_blue_velvet", label: "Blue Velvet Sofa", description: "Only replace the main couch", group: "Sofa Options", swatch: "#1f3a5f" },
      { value: "accent_chairs", label: "Accent Chairs", description: "Add or update chairs", group: "Furniture" },
      { value: "coffee_table_refresh", label: "Coffee Table", description: "Only replace the coffee table", group: "Furniture" },
      { value: "area_rug", label: "Area Rug", description: "Only add or replace rug", group: "Decor & Surfaces", swatch: "#b8a893" },
      { value: "curtains_window_treatments", label: "Curtains", description: "Only update window treatments", group: "Decor & Surfaces", swatch: "#d9d4c9" },
      { value: "lighting_refresh", label: "Lighting Refresh", description: "Only update lighting", group: "Decor & Surfaces" },
      { value: "media_wall", label: "Media Wall", description: "Only redesign the TV wall", group: "Built-Ins & Features" },
      { value: "fireplace_refresh", label: "Fireplace Refresh", description: "Only update fireplace area", group: "Built-Ins & Features" },
      { value: "built_in_shelving", label: "Built-In Shelving", description: "Add built-ins where they fit", group: "Built-Ins & Features" },
    ],
  },
};

function normalizeTenantInteriorStyle(option: any, service: InteriorService): InteriorStyleOption | null {
  const label = String(option?.label || option?.name || option?.value || "").trim();
  if (!label) return null;

  const rawValue = String(option?.value || label)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return {
    value: rawValue.startsWith("tenant_custom_") ? rawValue : `tenant_custom_${rawValue}`,
    label,
    description: String(option?.prompt || option?.instructions || `Apply the custom ${label} option.`).trim(),
    group: String(option?.groupLabel || option?.category || "Custom Options").trim() || "Custom Options",
    swatch: typeof option?.swatch === "string"
      ? option.swatch
      : typeof option?.hex === "string"
        ? option.hex
        : undefined,
    referenceImageUrl: service === "bathroom" ? getInteriorReferencePreviewUrl(option) : undefined,
  };
}

function getTenantInteriorStyles(customizations: any, service: InteriorService) {
  const byService = customizations?.interiorOptions?.[service];
  const legacyBathroomOptions = service === "bathroom" ? customizations?.bathroomOptions : null;
  const source = Array.isArray(byService)
    ? byService
    : Array.isArray(legacyBathroomOptions)
      ? legacyBathroomOptions
      : [];

  return source
    .map((option) => normalizeTenantInteriorStyle(option, service))
    .filter(Boolean) as InteriorStyleOption[];
}

function getInteriorDefaultVisibilityKey(service: InteriorService) {
  return service === "living_room" ? "interior.livingRoom" : `interior.${service}`;
}

function InteriorStylePreview({
  option,
  size = "small",
}: {
  option?: InteriorStyleOption;
  size?: "small" | "large";
}) {
  const sizeClass = size === "large" ? "h-6 w-6" : "h-5 w-5";

  if (option?.referenceImageUrl) {
    return (
      <img
        src={option.referenceImageUrl}
        alt=""
        className={`${sizeClass} shrink-0 rounded-full border border-black/15 object-cover shadow-sm`}
      />
    );
  }

  if (!option?.swatch) return null;
  return (
    <span
      className={`${sizeClass} shrink-0 rounded-full border border-black/15 shadow-inner`}
      style={{ background: option.swatch }}
    />
  );
}

export default function InteriorDesign() {
  const { tenant } = useTenant("demo");
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const baseConfig = serviceConfigs[location] || serviceConfigs["/painting"];
  const effectiveTenant = tenant || {
    id: 1,
    userId: null,
    slug: "demo",
    companyName: "DreamBuilder",
    logoUrl: null,
    primaryColor: "#2563EB",
    secondaryColor: "#059669",
    phone: null,
    email: null,
    address: null,
    description: "Professional AI-powered visualization services",
    showPricing: true,
    requirePhone: true,
    active: true,
    monthlyGenerationLimit: 1000,
    currentMonthGenerations: null,
    contactPhone: null,
    embedEnabled: false,
    embedCtaText: null,
    embedCtaPhone: null,
    embedCtaUrl: null,
    embedPrimaryColor: null,
    embedSecondaryColor: null,
    lastResetDate: new Date(),
    createdAt: new Date(),
  };
  const config = useMemo(() => {
    const customizations = (effectiveTenant as any).embedCustomizations || {};
    const defaultVisibility = normalizeEmbedDefaultOptionVisibility(
      customizations.defaultOptionVisibility,
    );
    const showDefaultStyles = defaultVisibility[
      getInteriorDefaultVisibilityKey(baseConfig.service) as keyof typeof defaultVisibility
    ];
    const customStyles = getTenantInteriorStyles(customizations, baseConfig.service);

    return {
      ...baseConfig,
      allowCombinations: baseConfig.allowCombinations || customStyles.length > 0,
      styles: [...(showDefaultStyles ? baseConfig.styles : []), ...customStyles],
    };
  }, [baseConfig, tenant?.embedCustomizations]);
  const isPaintingService = config.service === "painting";

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStyleIds, setSelectedStyleIds] = useState<string[]>([]);
  const [activeGroups, setActiveGroups] = useState<Record<string, boolean>>({});
  const [showingOriginal, setShowingOriginal] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [customPaintName, setCustomPaintName] = useState("");
  const [customPaintHex, setCustomPaintHex] = useState("#718ae1");

  useEffect(() => {
    setSelectedStyleIds([]);
    setActiveGroups({});
    setGeneratedImage(null);
    setShowingOriginal(false);
  }, [config]);

  const brandColors = useMemo(() => ({
    "--primary": effectiveTenant.primaryColor,
    "--secondary": effectiveTenant.secondaryColor,
  } as React.CSSProperties), [effectiveTenant.primaryColor, effectiveTenant.secondaryColor]);

  const selectedStyleLabel =
    config.styles
      .filter((style) => selectedStyleIds.includes(style.value))
      .map((style) => style.label)
      .join(", ") || "No option selected";

  const stylesByValue = useMemo(() => {
    return new Map(config.styles.map((style) => [style.value, style]));
  }, [config.styles]);

  const styleGroups = useMemo(() => {
    return config.styles.reduce<Record<string, InteriorStyleOption[]>>((groups, style) => {
      const group = style.group || "Options";
      groups[group] = groups[group] || [];
      groups[group].push(style);
      return groups;
    }, {});
  }, [config.styles]);

  const customPaintSelected = selectedStyleIds.includes("custom_paint_color");
  const pageContainerClass = isPaintingService
    ? "max-w-4xl mx-auto px-2 sm:px-6 lg:px-8"
    : "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8";
  const heroSectionClass = isPaintingService ? "py-4 sm:py-8 md:py-10" : "py-10";
  const heroTitleClass = isPaintingService
    ? "text-3xl sm:text-4xl md:text-5xl leading-tight font-bold text-white mb-0"
    : "text-4xl md:text-5xl font-bold text-white mb-0";
  const uploadCardContentClass = isPaintingService ? "p-5 sm:p-8 md:p-12" : "p-12";
  const resultCardContentClass = isPaintingService ? "p-3 sm:p-6 md:p-8" : "p-8";
  const previewImageClass = isPaintingService
    ? "w-full max-h-[75vh] object-contain rounded-lg bg-slate-100 shadow-lg"
    : "mx-auto block h-auto w-auto max-h-[72vh] max-w-full object-contain rounded-xl bg-slate-100 shadow-lg";
  const uploadedPreviewImageClass = isPaintingService
    ? "w-full max-h-[75vh] object-contain bg-slate-100 shadow-lg transition-all duration-300"
    : "mx-auto block h-auto w-auto max-h-[72vh] max-w-full object-contain bg-slate-100 shadow-lg transition-all duration-300";

  const handleGroupToggle = (group: string, enabled: boolean) => {
    const groupStyles = styleGroups[group] || [];
    const defaultStyle = groupStyles[0];

    if (!defaultStyle) {
      return;
    }

    if (!enabled) {
      setActiveGroups((current) => ({ ...current, [group]: false }));
      setSelectedStyleIds((current) =>
        current.filter((styleId) => !groupStyles.some((style) => style.value === styleId)),
      );
      return;
    }

    if (!config.allowCombinations) {
      setActiveGroups({ [group]: true });
      setSelectedStyleIds([defaultStyle.value]);
      return;
    }

    if (defaultStyle.overall) {
      setActiveGroups({ [group]: true });
      setSelectedStyleIds([defaultStyle.value]);
      return;
    }

    setActiveGroups((current) => {
      const next = { ...current, [group]: true };
      Object.entries(styleGroups).forEach(([groupName, styles]) => {
        if (styles.some((style) => style.overall)) {
          next[groupName] = false;
        }
      });
      return next;
    });

    setSelectedStyleIds((current) => {
      const withoutOverall = current.filter((styleId) => !stylesByValue.get(styleId)?.overall);
      const hasSelectionInGroup = groupStyles.some((style) => withoutOverall.includes(style.value));

      return hasSelectionInGroup ? withoutOverall : [...withoutOverall, defaultStyle.value];
    });
  };

  const handleGroupSelect = (group: string, value: string) => {
    const selectedStyle = stylesByValue.get(value);
    const groupStyles = styleGroups[group] || [];

    if (!selectedStyle) {
      return;
    }

    if (!config.allowCombinations) {
      setActiveGroups({ [group]: true });
      setSelectedStyleIds([value]);
      return;
    }

    if (selectedStyle.overall) {
      setActiveGroups({ [group]: true });
      setSelectedStyleIds([value]);
      return;
    }

    setActiveGroups((current) => {
      const next = { ...current, [group]: true };
      Object.entries(styleGroups).forEach(([groupName, styles]) => {
        if (styles.some((style) => style.overall)) {
          next[groupName] = false;
        }
      });
      return next;
    });

    setSelectedStyleIds((current) => {
      const withoutOverall = current.filter((styleId) => !stylesByValue.get(styleId)?.overall);
      const withoutCurrentGroup = withoutOverall.filter(
        (styleId) => !groupStyles.some((style) => style.value === styleId),
      );

      return [...withoutCurrentGroup, value];
    });
  };

  const resetPhoto = () => {
    setUploadedImage(null);
    setOriginalFile(null);
    setGeneratedImage(null);
    setShowingOriginal(false);
    setCustomPrompt("");
    setSelectedStyleIds([]);
    setActiveGroups({});
  };

  const generateDesign = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in and choose a plan to use AI visualization features.",
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

    if (!originalFile) {
      toast({
        title: "Photo Required",
        description: "Please upload a room photo first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await uploadInteriorImage(
        originalFile,
        config.service,
        selectedStyleIds,
        customPaintSelected ? { name: customPaintName, hex: customPaintHex } : undefined,
        customPrompt,
        {
          source: "site",
          tenantId: effectiveTenant.id,
          tenantSlug: effectiveTenant.slug,
        },
      );

      const visualizationId = result.visualizationId;
      if (visualizationId) {
        const status = await checkVisualizationStatus(visualizationId);
        if (status.status === "completed" && status.generatedImageUrl) {
          setGeneratedImage(status.generatedImageUrl);
        } else if (result.generatedImageUrl) {
          setGeneratedImage(result.generatedImageUrl);
        } else {
          throw new Error("Interior visualization did not complete.");
        }
      }
    } catch (error) {
      console.error("Error generating interior visualization:", error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate the design. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      className={`min-h-screen ${config.background} flex flex-col`}
      style={brandColors}
    >
      <Header tenant={effectiveTenant} compactMobile={isPaintingService} />

      <section className={heroSectionClass}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className={heroTitleClass}>
            {config.title}
            <span className={`text-transparent bg-gradient-to-r ${config.accent} bg-clip-text block ${isPaintingService ? "mt-1 sm:mt-0" : ""}`}>
              Before You Build
            </span>
          </h2>
        </div>
      </section>

      <main className="flex-1 pb-32">
        <div className={pageContainerClass}>
          {!uploadedImage ? (
            <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-md">
              <CardContent className={uploadCardContentClass}>
                <div className={`text-center ${isPaintingService ? "mb-5 sm:mb-8" : "mb-8"}`}>
                  <h3 className={`${isPaintingService ? "text-2xl sm:text-3xl" : "text-3xl"} font-bold text-slate-800 mb-4`}>
                    {config.uploadTitle}
                  </h3>
                  <p className={`${isPaintingService ? "text-base sm:text-lg" : "text-lg"} text-slate-600 max-w-2xl mx-auto`}>
                    {config.uploadDescription}
                  </p>
                </div>
                <FileUpload
                  onFileSelect={(file, previewUrl) => {
                    setOriginalFile(file);
                    setUploadedImage(previewUrl);
                  }}
                  uploadedImage={uploadedImage}
                  theme="interior"
                  uploadButtonClassName={`bg-gradient-to-r ${config.ctaGradient}`}
                />
              </CardContent>
            </Card>
          ) : generatedImage ? (
            <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-md">
              <CardContent className={resultCardContentClass}>
                <div className={isPaintingService ? "mb-4 sm:mb-6" : "mb-6"}>
                  <img
                    src={showingOriginal ? uploadedImage : generatedImage}
                    alt={showingOriginal ? "Original room photo" : `${selectedStyleLabel} design`}
                    className={previewImageClass}
                  />
                </div>

                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${isPaintingService ? "gap-3 sm:gap-4 mb-3 sm:mb-4" : "gap-4 mb-4"}`}>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                    onClick={() => {
                      if (generatedImage) {
                        downloadImageWithWatermark({
                          imageUrl: generatedImage,
                          fileName: config.resultFileName,
                          user,
                          subscription: user?.subscription,
                        });
                      }
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
                    {showingOriginal ? "View New Design" : "View Original Photo"}
                  </Button>

                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                    onClick={resetPhoto}
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    Try Another Photo
                  </Button>
                </div>

                <Button
                  size="lg"
                  className={`w-full bg-gradient-to-r ${config.ctaGradient} text-white font-semibold py-4 shadow-lg hover:shadow-xl transition-all`}
                  onClick={() => setShowLeadForm(true)}
                >
                  <Phone className="h-5 w-5 mr-2" />
                  Get Free Quote
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-md">
              <CardContent className={resultCardContentClass}>
                <div className={`text-center ${isPaintingService ? "mb-5 sm:mb-8" : "mb-8"}`}>
                  <div className="max-w-4xl mx-auto relative">
                    <div className="relative overflow-hidden rounded-xl">
                      <img
                        src={uploadedImage}
                        alt="Uploaded room photo"
                        className={uploadedPreviewImageClass}
                      />
                      {isGenerating && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-xl flex items-center justify-center">
                          <SparklesText
                            text="Rendering your room design..."
                            className="text-sm sm:text-lg lg:text-xl font-bold text-white whitespace-nowrap"
                            sparklesCount={12}
                            colors={config.sparkleColors}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex justify-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        onClick={resetPhoto}
                        className="border-slate-400 text-slate-600 hover:bg-slate-100"
                      >
                        <FileImage className="h-4 w-4 mr-2" />
                        Choose Different Photo
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">
                      Choose Your Direction
                    </h3>
                    <p className="text-slate-600">
                      {config.allowCombinations
                        ? "Pick an overall design or combine individual upgrades"
                        : "Select the design style you want to preview"}
                    </p>
                  </div>

                  <div className="grid items-start gap-4 md:grid-cols-2">
                    {Object.entries(styleGroups).map(([group, styles]) => {
                      const selectedInGroup = styles.filter((style) =>
                        selectedStyleIds.includes(style.value),
                      );
                      const selectedOption = selectedInGroup[0];
                      const isActive = !!activeGroups[group] || selectedInGroup.length > 0;

                      return (
                        <div
                          key={group}
                          className="rounded-xl border-2 p-5 transition-all cursor-pointer"
                          style={{
                            borderColor: isActive ? config.sparkleColors.first : `${config.sparkleColors.first}cc`,
                            background: isActive
                              ? `linear-gradient(to bottom right, ${config.sparkleColors.first}, ${config.sparkleColors.second})`
                              : `linear-gradient(to bottom right, ${config.sparkleColors.first}cc, ${config.sparkleColors.second}cc)`,
                          }}
                          onClick={() => handleGroupToggle(group, !isActive)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <InteriorStylePreview option={selectedOption} size="large" />
                                <h4 className="text-lg font-semibold text-white drop-shadow-sm">
                                  {group}
                                </h4>
                              </div>
                              <p className="mt-1 truncate text-sm text-white/80">
                                {selectedOption ? selectedOption.label : "Choose an option"}
                              </p>
                            </div>
                            <Switch
                              checked={isActive}
                              onCheckedChange={(checked) => handleGroupToggle(group, checked)}
                              onClick={(event) => event.stopPropagation()}
                              className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-600"
                            />
                          </div>

                          {isActive && (
                            <div className="mt-4 space-y-3" onClick={(event) => event.stopPropagation()}>
                              <Select
                                value={selectedOption?.value || ""}
                                onValueChange={(value) => handleGroupSelect(group, value)}
                              >
                                <SelectTrigger className="bg-white/95 border-white/40 text-slate-800">
                                  <span className="flex min-w-0 items-center gap-2 text-left">
                                    <InteriorStylePreview option={selectedOption} />
                                    <span className="truncate">
                                      {selectedOption?.label || "Choose an option"}
                                    </span>
                                  </span>
                                </SelectTrigger>
                                <SelectContent>
                                  {styles.map((style) => (
                                    <SelectItem key={style.value} value={style.value} textValue={style.label}>
                                      <span className="flex items-center gap-2">
                                        <InteriorStylePreview option={style} />
                                        <span>{style.label}</span>
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {selectedOption && (
                                <p className="text-sm text-white/85">
                                  {selectedOption.description}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {customPaintSelected && (
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                      <h4 className="font-semibold text-slate-800 mb-3">Custom Paint Color</h4>
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

                  <InlinePromptChat
                    isBusinessPro={user?.hasBusinessProAccess || false}
                    customPrompt={customPrompt}
                    onPromptChange={setCustomPrompt}
                    buttonClassName="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0"
                  />

                  <Button
                    size="lg"
                    className={`w-full bg-gradient-to-r ${config.ctaGradient} text-white font-semibold py-4 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                    disabled={isGenerating || selectedStyleIds.length === 0}
                    onClick={generateDesign}
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
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <footer className="bg-slate-900/50 border-t border-slate-700">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col space-y-6 md:flex md:flex-row md:justify-between md:items-center md:space-y-0">
            <Link
              href="/"
              className="flex items-center justify-center md:justify-start space-x-3 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <svg
                className="w-10 h-10 text-white"
                viewBox="0 0 128.37 135.86"
                fill="currentColor"
              >
                <path fill="#fff" d="M111.98,78.77L56.63,23.24.92,78.76c-1.23,1.22-1.23,3.21,0,4.44,1.22,1.23,3.21,1.23,4.43,0l10.33-10.3v59.82c0,1.73,1.4,3.14,3.14,3.14h21.95c1.73,0,3.14-1.4,3.14-3.14v-25.09c0-3.46,2.81-6.27,6.27-6.27h12.54c3.46,0,6.27,2.81,6.27,6.27v25.09c0,1.73,1.4,3.14,3.14,3.14h21.95c1.73,0,3.14-1.4,3.14-3.14v-59.89l10.32,10.36c1.22,1.23,3.21,1.23,4.43,0,1.23-1.22,1.23-3.21,0-4.43Z"/>
                <path fill="#fff" d="M102.82,0c-2.69,20.69-4.87,22.87-25.55,25.55,20.69,2.69,22.87,4.87,25.55,25.55,2.69-20.69,4.87-22.87,25.55-25.55-20.69-2.69-22.87-4.87-25.55-25.55Z"/>
              </svg>
              <div>
                <p className="text-white font-semibold">{effectiveTenant.companyName}</p>
                <p className="text-slate-400 text-sm">Powered by Solst LLC</p>
              </div>
            </Link>

            <div className="flex items-center justify-center space-x-4 md:justify-end">
              <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-red-400 transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>

      {showLeadForm && (
        <QuoteLeadForm
          service={config.quoteService}
          onClose={() => setShowLeadForm(false)}
          selectedStyles={{ service: config.service, styles: selectedStyleIds }}
          originalImageUrl={uploadedImage}
          generatedImageUrl={generatedImage}
        />
      )}
    </div>
  );
}
