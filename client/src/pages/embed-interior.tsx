import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Check, Download, Eye, Phone, RotateCcw, Sparkles, Upload, XCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import EmbedQuoteGate from "@/components/embed-quote-gate";
import EmbedQuoteLeadForm from "@/components/embed-quote-lead-form";
import EmbedPoweredBy from "@/components/embed-powered-by";
import { useTenant } from "../hooks/use-tenant";
import { useEmbedVisitorLimit } from "@/hooks/use-embed-visitor-limit";
import { useDemoEmbedTrial } from "@/hooks/use-demo-embed-trial";
import { checkVisualizationStatus, uploadInteriorImage } from "../lib/api";
import { getEmbedQuoteButtonText, runEmbedQuoteAction } from "@/lib/embed-quote";
import {
  DEFAULT_EMBED_BACKGROUND_COLOR,
  getEmbedBackground,
  parseEmbedBackgroundScheme,
} from "@/lib/embed-theme";
import { normalizeEmbedDefaultOptionVisibility } from "@/lib/embed-default-visibility";
import { type EmbedServiceKey, isEmbedServiceEnabled } from "@/lib/embed-services";
import { getInteriorReferencePreviewUrl } from "@shared/interior-reference-options";

type InteriorService = "painting" | "bathroom" | "kitchen" | "living_room";

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

type InteriorOption = {
  value: string;
  label: string;
  swatch?: string;
  overall?: boolean;
  referenceImageUrl?: string;
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
        label: "Full Redesign",
        options: [
          { value: "modern_spa", label: "Modern Spa", overall: true },
          { value: "luxury_marble", label: "Luxury Marble", overall: true },
          { value: "warm_traditional", label: "Warm Traditional", overall: true },
          { value: "compact_refresh", label: "Compact Refresh", overall: true },
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
    groups[group.id] = false;
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

function InteriorOptionPreview({ option }: { option?: InteriorOption }) {
  if (option?.referenceImageUrl) {
    return (
      <img
        src={option.referenceImageUrl}
        alt=""
        className="h-7 w-7 shrink-0 rounded-full border border-slate-300 object-cover shadow-sm"
      />
    );
  }

  return option?.swatch ? <Swatch color={option.swatch} /> : null;
}

function OptionDisplay({ option }: { option?: InteriorOption }) {
  return (
    <span className="flex min-w-0 items-center gap-2 text-left">
      <InteriorOptionPreview option={option} />
      <span className="truncate">{option?.label || "Choose an option"}</span>
    </span>
  );
}

function toTenantCustomOption(option: any, service: InteriorService): InteriorOption | null {
  const label = String(option?.label || option?.name || option?.value || "").trim();
  if (!label) {
    return null;
  }

  const rawValue = String(option?.value || label)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return {
    value: rawValue.startsWith("tenant_custom_") ? rawValue : `tenant_custom_${rawValue}`,
    label,
    swatch: typeof option?.swatch === "string" ? option.swatch : undefined,
    referenceImageUrl: service === "bathroom" ? getInteriorReferencePreviewUrl(option) : undefined,
  };
}

function getInteriorOptionSource(customizations: any, service: InteriorService): any[] {
  const byService = customizations?.interiorOptions?.[service];
  const legacyBathroomOptions = service === "bathroom" ? customizations?.bathroomOptions : null;

  if (Array.isArray(byService)) {
    return byService;
  }

  if (Array.isArray(legacyBathroomOptions)) {
    return legacyBathroomOptions;
  }

  return [];
}

function getTenantInteriorGroups(config: InteriorEmbedConfig, tenant: any): InteriorGroup[] {
  const customizations = tenant?.embedCustomizations || {};
  const source = getInteriorOptionSource(customizations, config.service);
  const groupedOptions = new Map<string, InteriorOption[]>();

  source.forEach((option: any) => {
    const normalizedOption = toTenantCustomOption(option, config.service);
    if (!normalizedOption) {
      return;
    }

    const groupLabel = String(option?.groupLabel || option?.category || "Client Options").trim() || "Client Options";
    const groupId = groupLabel
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "client_options";

    groupedOptions.set(groupId, [...(groupedOptions.get(groupId) || []), normalizedOption]);
  });

  if (groupedOptions.size === 0) {
    return [];
  }

  return Array.from(groupedOptions.entries()).map(([id, options]) => ({
    id: `client_${id}`,
    label: source.find((option: any) => {
      const groupLabel = String(option?.groupLabel || option?.category || "Client Options").trim() || "Client Options";
      return id === groupLabel.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    })?.groupLabel || "Client Options",
    options,
  }));
}

function getInteriorDefaultVisibilityKey(service: InteriorService) {
  if (service === "living_room") return "interior.livingRoom";
  return `interior.${service}`;
}

export default function EmbedInteriorPage() {
  const [location] = useLocation();
  const baseConfig = serviceConfigs[location] || serviceConfigs["/embed-painting"];
  const urlParams = new URLSearchParams(window.location.search);
  const tenantSlug = urlParams.get("tenant") || "demo";
  const tenantIdParam = urlParams.get("tenantId") || "";
  const tenantLookup = tenantIdParam || tenantSlug;
  const accountUserIdParam = urlParams.get("accountUserId") || "";
  const primaryColorParam = urlParams.get("primaryColor") || "";
  const secondaryColorParam = urlParams.get("secondaryColor") || "";
  const primaryColor = primaryColorParam || "#2563eb";
  const secondaryColor = secondaryColorParam || "#1d4ed8";
  const companyName = urlParams.get("companyName") || "";
  const showHeader = urlParams.get("showHeader") !== "false";
  const contactType = urlParams.get("contactType") || "phone";
  const contactPhone = urlParams.get("contactPhone") || "";
  const contactLink = urlParams.get("contactLink") || "";
  const logoUrlParam = urlParams.get("logoUrl") || "";
  const backgroundScheme = parseEmbedBackgroundScheme(urlParams.get("backgroundScheme"));
  const backgroundColor = urlParams.get("backgroundColor") || DEFAULT_EMBED_BACKGROUND_COLOR;
  const { tenant, isLoading: tenantLoading, error: tenantError } = useTenant(tenantLookup, accountUserIdParam);
  const isDemoLookup = tenantLookup === "demo";
  const canUseAccountFallback = Boolean(accountUserIdParam);

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

  const resolvedPrimaryColor =
    primaryColorParam || (tenant ? effectiveTenant.embedPrimaryColor || effectiveTenant.primaryColor || primaryColor : primaryColor);
  const resolvedSecondaryColor =
    secondaryColorParam || (tenant ? effectiveTenant.embedSecondaryColor || effectiveTenant.secondaryColor || secondaryColor : secondaryColor);
  const resolvedLogoUrl = logoUrlParam || effectiveTenant.logoUrl || "";
  const displayCompanyName = companyName || effectiveTenant.companyName || "DreamBuilder";
  const embedCustomizations = effectiveTenant.embedCustomizations || {};
  const defaultOptionVisibility = normalizeEmbedDefaultOptionVisibility(
    embedCustomizations.defaultOptionVisibility,
  );

  const config = useMemo(() => {
    const tenantGroups = getTenantInteriorGroups(baseConfig, effectiveTenant);
    const showDefaultGroups =
      defaultOptionVisibility[getInteriorDefaultVisibilityKey(baseConfig.service) as keyof typeof defaultOptionVisibility];
    const defaultGroups = showDefaultGroups ? baseConfig.groups : [];

    if (tenantGroups.length === 0 && defaultGroups.length === baseConfig.groups.length) {
      return baseConfig;
    }

    return {
      ...baseConfig,
      allowCombinations: true,
      groups: [...defaultGroups, ...tenantGroups],
    };
  }, [baseConfig, tenant?.embedCustomizations]);

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [visualizationResult, setVisualizationResult] = useState<any>(null);
  const [lastGeneratedImageUrl, setLastGeneratedImageUrl] = useState<string | null>(null);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showQuoteGate, setShowQuoteGate] = useState(false);
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
    setLastGeneratedImageUrl(null);
    setShowQuoteForm(false);
    setShowingOriginal(false);
    setCustomPaintName("");
    setCustomPaintHex("#718ae1");
  }, [config]);

  useEffect(() => {
    document.documentElement.style.setProperty("--primary-color", resolvedPrimaryColor);
    document.documentElement.style.setProperty("--secondary-color", resolvedSecondaryColor);
  }, [resolvedPrimaryColor, resolvedSecondaryColor]);

  const embedVisitor = useEmbedVisitorLimit({
    tenantId: tenant?.id || null,
    tenantSlug: tenant?.slug || null,
    accountUserId: accountUserIdParam,
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

    setShowQuoteGate(false);
    setOriginalFile(file);
    setVisualizationResult(null);
    setLastGeneratedImageUrl(null);
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
    if (!demoTrial.canStartGeneration()) {
      return;
    }

    if (visitorLimitReached) {
      setShowQuoteGate(true);
      return;
    }

    if (!originalFile || selectedStyleIds.length === 0) {
      return;
    }

    setIsGenerating(true);

    try {
      const result = await uploadInteriorImage(
        originalFile,
        config.service,
        selectedStyleIds,
        customPaintSelected ? { name: customPaintName, hex: customPaintHex } : undefined,
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
        const status = await checkVisualizationStatus(result.visualizationId);
        setVisualizationResult(status);
        if (status?.generatedImageUrl) {
          setLastGeneratedImageUrl(status.generatedImageUrl);
          demoTrial.recordSuccessfulGeneration();
        }
      } else {
        setVisualizationResult(result);
        if (result?.generatedImageUrl) {
          setLastGeneratedImageUrl(result.generatedImageUrl);
          demoTrial.recordSuccessfulGeneration();
        }
      }
    } catch (error) {
      console.error("Error generating interior embed visualization:", error);
      const apiError = error as any;
      if (apiError.code === "EMBED_VISITOR_LIMIT") {
        if (demoTrial.handleServerLimitReached()) return;
        embedVisitor.markLimitReached(apiError.details?.embedVisitorUsage);
        setShowQuoteGate(true);
        return;
      }
      alert("Unable to generate the design. Please try again.");
    } finally {
      embedVisitor.refresh();
      setIsGenerating(false);
    }
  };

  const resetPhoto = () => {
    setUploadedImage(null);
    setOriginalFile(null);
    setVisualizationResult(null);
    setLastGeneratedImageUrl(null);
    setShowingOriginal(false);
  };

  const handleStartOver = () => {
    setShowQuoteGate(false);
    setVisualizationResult(null);
    setLastGeneratedImageUrl(null);
    setShowingOriginal(false);
  };

  const handleDownloadDesign = () => {
    const generatedImage = visualizationResult?.generatedImageUrl || lastGeneratedImageUrl;
    if (!generatedImage) return;

    const anchor = document.createElement("a");
    anchor.href = generatedImage;
    anchor.download = config.resultFileName;
    anchor.click();
  };

  const openQuote = () => {
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Loading Visualizer</h1>
          <p className="text-gray-600">Connecting this embed to the client account.</p>
        </div>
      </div>
    );
  }

  if (!tenant && !tenantLoading && !isDemoLookup && !canUseAccountFallback) {
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
  const serviceKey: EmbedServiceKey =
    config.service === "living_room" ? "living-room" : config.service;

  if (effectiveTenant && !isEmbedServiceEnabled(effectiveTenant, serviceKey)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <XCircle className="h-8 w-8 text-slate-600" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Visualizer Not Available</h1>
          <p className="text-gray-600">
            This embed service is not enabled for {displayCompanyName}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full p-2 sm:p-4" style={{ background: pageBackground }}>
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-2xl shadow-slate-950/15 lg:flex lg:h-[calc(100vh-2rem)] lg:max-h-[760px] lg:flex-col">
          {showHeader && (
            <header className="flex shrink-0 items-center gap-3 border-b border-slate-200 px-4 py-2 sm:px-5">
              {resolvedLogoUrl && <img src={resolvedLogoUrl} alt={`${displayCompanyName} logo`} className="max-h-11 max-w-[175px] shrink-0 object-contain object-left" />}
              <div className={`min-w-0 flex-1 ${resolvedLogoUrl ? "border-l border-slate-200 pl-3 sm:pl-4" : ""}`}>
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <h1 className="text-base font-bold leading-tight text-slate-950 sm:text-lg">{config.title}</h1>
                  <EmbedPoweredBy tenant={effectiveTenant} className="shrink-0 justify-start" />
                </div>
                <p className="mt-0.5 hidden text-xs leading-relaxed text-slate-500 sm:block">{config.subtitle}</p>
              </div>
            </header>
          )}
          {!showHeader && <EmbedPoweredBy tenant={effectiveTenant} className="shrink-0 justify-start border-b border-slate-200 bg-slate-50 px-4 py-1 sm:px-5" />}

          {showQuoteForm && (
            <EmbedQuoteLeadForm tenant={effectiveTenant} service={config.service} selectedStyles={selectedStyleIds} originalImageUrl={uploadedImage} generatedImageUrl={visualizationResult?.generatedImageUrl || lastGeneratedImageUrl} primaryColor={resolvedPrimaryColor} secondaryColor={resolvedSecondaryColor} onClose={() => setShowQuoteForm(false)} />
          )}

          <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
            <section className="flex min-h-0 flex-col overflow-hidden bg-white p-4">
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="interior-image-upload" />
              {!uploadedImage ? (
                <label htmlFor="interior-image-upload" className="group relative flex aspect-video min-h-[320px] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-950 text-center shadow-inner lg:min-h-0 lg:flex-1 lg:aspect-auto">
                  <div className="absolute inset-0 opacity-70" style={{ background: `radial-gradient(circle at 22% 25%, ${colorWithAlpha(resolvedPrimaryColor, 0.55)}, transparent 34%), radial-gradient(circle at 78% 72%, ${colorWithAlpha(resolvedSecondaryColor, 0.45)}, transparent 34%), linear-gradient(145deg, #0f172a, #1e293b)` }} />
                  <div className="absolute inset-5 rounded-xl border border-dashed border-white/30" />
                  <div className="relative z-10 max-w-sm px-8 py-8 text-white">
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl shadow-xl transition group-hover:-translate-y-0.5" style={{ backgroundColor: resolvedPrimaryColor, color: primaryButtonTextColor }}><Upload className="h-6 w-6" /></span>
                    <h2 className="mt-5 text-xl font-bold">Add your {config.pageLabel.toLowerCase()} photo</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-200">Use a bright, clear photo that shows the full room and the surfaces you want to update.</p>
                    <span className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-lg">Choose photo <ArrowRight className="h-4 w-4" /></span>
                    <p className="mt-3 text-xs font-medium text-slate-300">JPG or PNG &middot; Up to 10MB</p>
                  </div>
                </label>
              ) : (
                <div className="relative aspect-video min-h-[320px] w-full overflow-hidden rounded-xl bg-slate-100 shadow-inner lg:min-h-0 lg:flex-1 lg:aspect-auto">
                  {!isGenerating && !showQuoteGate && (
                    <div className="absolute right-3 top-3 z-20 flex flex-wrap justify-end gap-2">
                      {completedImage && <button type="button" onClick={() => setShowingOriginal((current) => !current)} className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-md backdrop-blur-sm transition hover:bg-white"><Eye className="h-3.5 w-3.5" />{showingOriginal ? "View design" : "View original"}</button>}
                      <label htmlFor="interior-image-upload" className="cursor-pointer rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold shadow-md backdrop-blur-sm transition hover:bg-white" style={{ color: resolvedPrimaryColor }}>Change photo</label>
                    </div>
                  )}
                  <img src={activeImage || ""} alt="Uploaded project" className={`h-full w-full object-cover transition duration-300 ${showQuoteGate ? "scale-105 blur-xl" : ""}`} />
                  {showQuoteGate && <EmbedQuoteGate status={embedVisitor.status} primaryColor={resolvedPrimaryColor} secondaryColor={resolvedSecondaryColor} buttonText={quoteButtonText} onQuoteClick={openQuote} onClose={() => setShowQuoteGate(false)} />}
                  {isGenerating && <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-sm"><div className="flex items-center gap-3 text-sm font-bold text-white sm:text-lg"><span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />Rendering your design</div></div>}
                  {completedImage && !isGenerating && !showQuoteGate && <button type="button" onClick={handleDownloadDesign} aria-label="Download design" title="Download design" className="absolute bottom-3 left-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-md backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg" style={{ color: resolvedPrimaryColor }}><Download className="h-4 w-4" /></button>}
                </div>
              )}
            </section>

            {!uploadedImage ? (
              <aside className="flex min-h-0 flex-col items-center justify-center border-t border-slate-200 p-6 text-center sm:p-8 lg:border-l lg:border-t-0" style={{ backgroundColor: colorWithAlpha(resolvedPrimaryColor, 0.065) }}>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm" style={{ backgroundColor: resolvedPrimaryColor, color: primaryButtonTextColor }}><Sparkles className="h-5 w-5" /></span>
                <h3 className="mt-5 max-w-sm text-2xl font-bold leading-tight text-slate-950">Picture the finished room before you begin.</h3>
                <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">Choose colors, materials, fixtures, and room details, then preview them in your own space.</p>
                <div className="mt-5 flex max-w-sm items-start gap-2 rounded-xl border border-white/80 bg-white/80 px-4 py-3 text-xs leading-5 text-slate-600 shadow-sm"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: resolvedPrimaryColor }} strokeWidth={3} /><p className="text-left">For the best result, keep the room well lit and the main surfaces fully visible.</p></div>
              </aside>
            ) : (
              <aside className="min-h-0 overflow-y-auto border-t border-slate-200 bg-slate-50 p-4 lg:border-l lg:border-t-0">
                {completedImage ? (
                  <div className="flex min-h-full flex-col items-center justify-center px-2 py-6 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm" style={{ backgroundColor: resolvedPrimaryColor, color: primaryButtonTextColor }}><Check className="h-5 w-5" strokeWidth={3} /></span>
                    <h2 className="mt-4 text-xl font-bold text-slate-950">Your {config.pageLabel.toLowerCase()} design is ready</h2>
                    <p className="mt-2 max-w-xs text-sm leading-6 text-slate-600">Send this concept to {displayCompanyName} for pricing and next steps.</p>
                    <div className="mt-6 w-full space-y-2.5">
                      <Button size="lg" className="w-full rounded-xl font-semibold shadow-lg transition hover:shadow-xl" style={{ backgroundColor: resolvedPrimaryColor, color: primaryButtonTextColor }} onClick={openQuote}><Phone className="mr-2 h-4 w-4" />{quoteButtonText}</Button>
                      <Button type="button" size="lg" variant="outline" className="w-full rounded-xl border-slate-300 bg-white font-semibold text-slate-700" onClick={handleStartOver}><RotateCcw className="mr-2 h-4 w-4" />Try another design</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-3"><h2 className="font-semibold text-slate-950">Customize your {config.pageLabel.toLowerCase()}</h2><p className="mt-0.5 text-xs text-slate-500">Turn on the areas you want to update, then choose each finish.</p></div>
                    {embedVisitor.status?.unlimitedAccountAccess && <div className="mb-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm"><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: resolvedPrimaryColor }} /><p className="text-xs font-semibold text-slate-700">Unlimited team access</p></div>}
                    {config.groups.length === 0 ? (
                      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">No style options are currently configured for this client embed.</div>
                    ) : (
                      <div className="space-y-2.5">
                        {config.groups.map((group) => {
                          const isActive = activeGroups[group.id];
                          const selectedValue = selectedOptions[group.id] || group.options[0]?.value || "";
                          const selectedOption = group.options.find((option) => option.value === selectedValue);
                          return (
                            <section key={group.id} className="rounded-xl border p-3 shadow-sm transition" style={{ borderColor: isActive ? resolvedPrimaryColor : "#dbe3ec", backgroundColor: isActive ? colorWithAlpha(resolvedPrimaryColor, 0.06) : "#ffffff" }}>
                              <div className="flex items-center justify-between gap-3">
                                <div><h3 className="font-semibold text-slate-950">{group.label}</h3><p className="text-xs text-slate-500">Choose one finish</p></div>
                                <button type="button" aria-label={`Toggle ${group.label}`} aria-pressed={isActive} onClick={() => toggleGroup(group)} className="flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition" style={{ backgroundColor: isActive ? resolvedPrimaryColor : "#cbd5e1" }}><span className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${isActive ? "translate-x-5" : "translate-x-0"}`} /></button>
                              </div>
                              {isActive && (
                                <label className="mt-3 block space-y-1">
                                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Selection</span>
                                  {config.service === "bathroom" ? (
                                    <Select value={selectedValue} onValueChange={(value) => selectGroupOption(group, value)}>
                                      <SelectTrigger className="h-12 rounded-lg border-slate-200 bg-white py-1.5 text-slate-900 [&>span]:!flex [&>span]:items-center [&>span]:gap-2">
                                        <OptionDisplay option={selectedOption} />
                                      </SelectTrigger>
                                      <SelectContent className="border-slate-200 bg-white text-slate-900">
                                        {group.options.map((option) => (
                                          <SelectItem
                                            key={option.value}
                                            value={option.value}
                                            textValue={option.label}
                                            className="focus:bg-slate-100 focus:text-slate-950"
                                          >
                                            <OptionDisplay option={option} />
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <select value={selectedValue} onChange={(event) => selectGroupOption(group, event.target.value)} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200">
                                      {group.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                    </select>
                                  )}
                                </label>
                              )}
                            </section>
                          );
                        })}
                      </div>
                    )}

                    {customPaintSelected && (
                      <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                        <h3 className="font-semibold text-slate-900">Custom paint color</h3>
                        <div className="mt-2 grid grid-cols-[64px_1fr] gap-2">
                          <input type="color" value={customPaintHex} onChange={(event) => setCustomPaintHex(event.target.value)} className="h-10 w-full rounded-lg border border-slate-300 bg-white p-1" aria-label="Custom paint color" />
                          <input type="text" value={customPaintName} onChange={(event) => setCustomPaintName(event.target.value)} placeholder="Color name or paint code" className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-slate-600" />
                        </div>
                      </div>
                    )}

                    <div className="sticky bottom-0 mt-3 border-t border-slate-200 bg-slate-50/95 pt-3 backdrop-blur-sm">
                      <Button size="lg" className="w-full rounded-xl font-semibold shadow-lg transition-all hover:shadow-xl disabled:opacity-50" style={{ backgroundColor: resolvedPrimaryColor, color: primaryButtonTextColor }} disabled={isGenerating || embedVisitor.isLoading || selectedStyleIds.length === 0} onClick={generateDesign}>
                        {isGenerating ? <><span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />Creating your preview...</> : <><Sparkles className="mr-2 h-5 w-5" />Create my design</>}
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
