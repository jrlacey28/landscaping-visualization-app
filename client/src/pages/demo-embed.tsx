import { type ChangeEvent, type CSSProperties, useEffect, useMemo, useState } from "react";
import { Building2, ImagePlus, Monitor, Palette, Sparkles, Upload } from "lucide-react";
import Header from "@/components/header";
import { useTenant } from "@/hooks/use-tenant";

type DemoOption = {
  value: string;
  label: string;
  color?: string;
};

type DemoOptionGroup = {
  id: string;
  label: string;
  options: DemoOption[];
};

type DemoService = {
  id: string;
  label: string;
  pageLabel: string;
  prompt: string;
  uploadLabel: string;
  groups: DemoOptionGroup[];
};

type DemoStyleCard = {
  id: string;
  label: string;
  groups: DemoOptionGroup[];
};

type BackgroundMode = "solid" | "soft-gradient" | "home-blue" | "white";

const backgroundModes: Array<{ value: BackgroundMode; label: string }> = [
  { value: "solid", label: "Solid" },
  { value: "soft-gradient", label: "Soft gradient" },
  { value: "home-blue", label: "Home blue" },
  { value: "white", label: "White" },
];

const demoServices: DemoService[] = [
  {
    id: "roofing-siding",
    label: "Roofing & Siding",
    pageLabel: "Roofing & Siding",
    prompt: "Transform your home with AI-powered roofing and siding visualization",
    uploadLabel: "Upload Your Home Photo",
    groups: [
      {
        id: "roofStyle",
        label: "Roof Style",
        options: [
          { value: "asphalt_shingles", label: "Asphalt Shingles" },
          { value: "steel_roof", label: "Steel Roof" },
          { value: "steel_shingles", label: "Steel Shingles" },
        ],
      },
      {
        id: "roofColor",
        label: "Roof Color",
        options: [
          { value: "charcoal_gray", label: "Charcoal Gray", color: "#36454F" },
          { value: "pewter_gray", label: "Pewter Gray", color: "#8C92AC" },
          { value: "weathered_wood", label: "Weathered Wood", color: "#79685D" },
          { value: "driftwood", label: "Driftwood", color: "#A7988A" },
          { value: "desert_tan", label: "Desert Tan", color: "#D2B48C" },
          { value: "slate_blue", label: "Slate Blue", color: "#6A7BA2" },
          { value: "williamsburg_gray", label: "Williamsburg Gray", color: "#B0AFAE" },
          { value: "forest_green", label: "Forest Green", color: "#014421" },
          { value: "midnight_black", label: "Midnight Black", color: "#1C1C1C" },
          { value: "moire_black", label: "Moire Black", color: "#2E2E2E" },
          { value: "merlot", label: "Merlot", color: "#73343A" },
          { value: "estate_gray", label: "Estate Gray", color: "#555555" },
          { value: "barkwood", label: "Barkwood", color: "#5C4033" },
          { value: "harbor_blue", label: "Harbor Blue", color: "#46647E" },
          { value: "onyx_black", label: "Onyx Black", color: "#0F0F0F" },
        ],
      },
      {
        id: "sidingStyle",
        label: "Siding Style",
        options: [
          { value: "vinyl_siding", label: "Vinyl Siding" },
          { value: "fiber_cement", label: "Fiber Cement" },
          { value: "wood_siding", label: "Wood Siding" },
          { value: "brick_veneer", label: "Brick Veneer" },
        ],
      },
      {
        id: "sidingColor",
        label: "Siding Color",
        options: [
          { value: "white", label: "White", color: "#FFFFFF" },
          { value: "colonial_white", label: "Colonial White", color: "#FAF9F6" },
          { value: "gray", label: "Gray", color: "#808080" },
          { value: "greige", label: "Greige", color: "#BEB6AA" },
          { value: "beige_almond", label: "Beige / Almond", color: "#F5F5DC" },
          { value: "sandstone", label: "Sandstone", color: "#C2B280" },
          { value: "navy_coastal_blue", label: "Navy / Coastal Blue", color: "#2C3E50" },
          { value: "sage_green", label: "Sage Green", color: "#9C9F84" },
          { value: "forest_green", label: "Forest Green", color: "#014421" },
          { value: "autumn_red", label: "Autumn Red", color: "#8B2E2E" },
          { value: "brown_chestnut_espresso", label: "Brown", color: "#4B3621" },
          { value: "charcoal_dark_gray", label: "Charcoal / Dark Gray", color: "#333333" },
          { value: "clay_khaki", label: "Clay / Khaki", color: "#B2A17E" },
          { value: "azure_blue", label: "Azure Blue", color: "#4A90E2" },
          { value: "savannah_wicker", label: "Savannah Wicker", color: "#D8CAB1" },
        ],
      },
      {
        id: "windows",
        label: "Windows",
        options: [
          { value: "windows_black_frames", label: "Black Frames" },
          { value: "windows_white_frames", label: "White Frames" },
          { value: "windows_bronze_frames", label: "Bronze Frames" },
          { value: "windows_modern_grid", label: "Modern Grid" },
        ],
      },
      {
        id: "surpriseMe",
        label: "Surprise Me",
        options: [{ value: "random_roof_and_siding", label: "AI Picks the Combo" }],
      },
    ],
  },
  {
    id: "landscape",
    label: "Landscape",
    pageLabel: "Landscape",
    prompt: "Turn yard photos into project previews and estimate requests",
    uploadLabel: "Upload Your Yard Photo",
    groups: [
      {
        id: "curbing",
        label: "Curbing",
        options: [
          { value: "natural_stone_curbing", label: "Natural Stone Curbing" },
          { value: "brick_curbing", label: "Brick Curbing" },
        ],
      },
      {
        id: "curbingColor",
        label: "Curbing Color",
        options: [
          { value: "gray", label: "Gray", color: "#808080" },
          { value: "tan", label: "Tan", color: "#D2B48C" },
          { value: "brown", label: "Brown", color: "#6B4F3A" },
          { value: "charcoal", label: "Charcoal", color: "#333333" },
          { value: "sandstone", label: "Sandstone", color: "#C2B280" },
        ],
      },
      {
        id: "landscape",
        label: "Landscaping",
        options: [
          { value: "fresh_mulch", label: "Fresh Mulch" },
          { value: "river_rock", label: "River Rock" },
          { value: "new_grass", label: "New Grass" },
        ],
      },
      {
        id: "patioStyle",
        label: "Patio Style",
        options: [
          { value: "stamped_concrete_patio", label: "Stamped Concrete" },
          { value: "plain_concrete_patio", label: "Plain Concrete" },
          { value: "exposed_aggregate_patio", label: "Exposed Aggregate" },
          { value: "colored_concrete_patio", label: "Colored Concrete" },
        ],
      },
      {
        id: "patioShape",
        label: "Patio Shape",
        options: [
          { value: "rectangular", label: "Rectangular" },
          { value: "curved", label: "Curved" },
          { value: "circular", label: "Circular" },
          { value: "l_shaped", label: "L-Shaped" },
        ],
      },
      {
        id: "patioSize",
        label: "Patio Size",
        options: [
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
        ],
      },
    ],
  },
  {
    id: "pools",
    label: "Pools",
    pageLabel: "Pool",
    prompt: "Preview pools, decking, landscaping, and backyard upgrades",
    uploadLabel: "Upload Your Backyard Photo",
    groups: [
      {
        id: "poolType",
        label: "Pool Type",
        options: [
          { value: "rectangular_pool", label: "Rectangular Pool" },
          { value: "kidney_shaped_pool", label: "Kidney-Shaped Pool" },
          { value: "oval_pool", label: "Oval Pool" },
          { value: "freeform_pool", label: "Freeform Pool" },
        ],
      },
      {
        id: "poolSize",
        label: "Pool Size",
        options: [
          { value: "small_pool", label: "Small Pool" },
          { value: "medium_pool", label: "Medium Pool" },
          { value: "large_pool", label: "Large Pool" },
        ],
      },
      {
        id: "decking",
        label: "Pool Decking",
        options: [
          { value: "concrete_pool_deck", label: "Concrete Pool Deck" },
          { value: "travertine_pool_deck", label: "Travertine Pool Deck" },
          { value: "brick_pool_deck", label: "Brick Pool Deck" },
        ],
      },
      {
        id: "landscaping",
        label: "Landscaping",
        options: [
          { value: "tropical_pool_landscaping", label: "Tropical Landscaping" },
          { value: "modern_pool_landscaping", label: "Modern Landscaping" },
          { value: "natural_pool_landscaping", label: "Natural Landscaping" },
        ],
      },
      {
        id: "features",
        label: "Special Features",
        options: [
          { value: "pool_with_spa", label: "Pool with Attached Spa" },
          { value: "pool_with_waterfall", label: "Pool with Waterfall" },
          { value: "pool_with_lighting", label: "Pool with LED Lighting" },
        ],
      },
      {
        id: "hotTub",
        label: "Hot Tub",
        options: [
          { value: "built_in_hottub", label: "Built-in Hot Tub" },
          { value: "portable_hottub", label: "Portable Hot Tub" },
          { value: "swim_spa", label: "Swim Spa" },
        ],
      },
      {
        id: "sauna",
        label: "Sauna",
        options: [
          { value: "outdoor_sauna", label: "Outdoor Sauna" },
          { value: "barrel_sauna", label: "Barrel Sauna" },
          { value: "modern_sauna", label: "Modern Glass Sauna" },
        ],
      },
    ],
  },
  {
    id: "painting",
    label: "Painting",
    pageLabel: "Interior Paint",
    prompt: "Preview colors and finishes before the estimate request",
    uploadLabel: "Upload Your Room Photo",
    groups: [
      {
        id: "neutrals",
        label: "Whites & Neutrals",
        options: [
          { value: "pure_white", label: "Pure White", color: "#f8f8f2" },
          { value: "warm_white", label: "Warm White", color: "#f4ead7" },
          { value: "modern_white", label: "Modern White", color: "#f2f1ec" },
          { value: "soft_greige", label: "Soft Greige", color: "#cfc6b8" },
          { value: "warm_neutral", label: "Warm Neutral", color: "#d7c9b6" },
          { value: "classic_beige", label: "Classic Beige", color: "#d9c4a6" },
          { value: "light_taupe", label: "Light Taupe", color: "#b8ab9c" },
        ],
      },
      {
        id: "greensBlues",
        label: "Greens & Blues",
        options: [
          { value: "sage_green", label: "Sage Green", color: "#9ca58d" },
          { value: "olive_green", label: "Olive Green", color: "#6f7652" },
          { value: "dusty_blue", label: "Dusty Blue", color: "#8ea3b2" },
          { value: "slate_blue", label: "Slate Blue", color: "#596f83" },
        ],
      },
      {
        id: "accentColors",
        label: "Accent Colors",
        options: [
          { value: "navy_accent", label: "Navy Accent", color: "#243957" },
          { value: "charcoal_accent", label: "Charcoal Accent", color: "#3f4448" },
        ],
      },
      {
        id: "warmColors",
        label: "Warm Colors",
        options: [
          { value: "terracotta", label: "Terracotta", color: "#b96f55" },
          { value: "soft_blush", label: "Soft Blush", color: "#e3b8b1" },
          { value: "muted_mauve", label: "Muted Mauve", color: "#a9828b" },
          { value: "buttercream", label: "Buttercream", color: "#f0dda2" },
        ],
      },
      {
        id: "customPaint",
        label: "Custom",
        options: [
          { value: "soft_color", label: "Designer Soft Color", color: "#c9b8d8" },
          { value: "custom_paint_color", label: "Custom Color", color: "#718ae1" },
        ],
      },
    ],
  },
  {
    id: "kitchen-redesign",
    label: "Kitchen",
    pageLabel: "Kitchen",
    prompt: "Preview cabinets, counters, fixtures, and finishing details",
    uploadLabel: "Upload Your Kitchen Photo",
    groups: [
      {
        id: "overall",
        label: "Overall Designs",
        options: [
          { value: "modern_white", label: "Modern White" },
          { value: "warm_wood", label: "Warm Wood" },
          { value: "two_tone", label: "Two-Tone" },
          { value: "luxury_stone", label: "Luxury Stone" },
          { value: "full_kitchen_refresh", label: "Cabinets + Counter + Sink" },
        ],
      },
      {
        id: "cabinets",
        label: "Cabinets",
        options: [
          { value: "cabinets_white_shaker", label: "White Shaker Cabinets" },
          { value: "cabinets_warm_oak", label: "Warm Oak Cabinets" },
          { value: "cabinets_sage_green", label: "Sage Green Cabinets" },
          { value: "cabinets_navy_lower", label: "Navy Lower Cabinets" },
          { value: "cabinets_black_modern", label: "Modern Black Cabinets" },
        ],
      },
      {
        id: "counters",
        label: "Counters",
        options: [
          { value: "counters_white_quartz", label: "White Quartz Counters" },
          { value: "counters_marble", label: "Marble-Look Counters" },
          { value: "counters_dark_stone", label: "Dark Stone Counters" },
          { value: "counters_butcher_block", label: "Butcher Block Counters" },
        ],
      },
      {
        id: "sinkFixtures",
        label: "Sink & Fixtures",
        options: [
          { value: "sink_farmhouse", label: "Farmhouse Sink" },
          { value: "sink_undermount", label: "Undermount Sink" },
          { value: "sink_black_workstation", label: "Black Workstation Sink" },
        ],
      },
      {
        id: "details",
        label: "Finishing Details",
        options: [
          { value: "backsplash_subway", label: "Subway Tile Backsplash" },
          { value: "backsplash_zellige", label: "Zellige Tile Backsplash" },
          { value: "pendant_lighting", label: "Pendant Lighting" },
          { value: "hardware_brass", label: "Brass Hardware" },
        ],
      },
    ],
  },
  {
    id: "bathroom-redesign",
    label: "Bathroom",
    pageLabel: "Bathroom",
    prompt: "Preview remodel concepts while keeping the room layout",
    uploadLabel: "Upload Your Bathroom Photo",
    groups: [
      {
        id: "bathroomStyle",
        label: "Bathroom Style",
        options: [
          { value: "modern_spa", label: "Modern Spa" },
          { value: "luxury_marble", label: "Luxury Marble" },
          { value: "warm_traditional", label: "Warm Traditional" },
          { value: "compact_refresh", label: "Compact Refresh" },
        ],
      },
    ],
  },
  {
    id: "living-room-design",
    label: "Living Room",
    pageLabel: "Living Room",
    prompt: "Explore furniture, color, lighting, and decor concepts",
    uploadLabel: "Upload Your Living Room Photo",
    groups: [
      {
        id: "overall",
        label: "Overall Designs",
        options: [
          { value: "modern_cozy", label: "Modern Cozy" },
          { value: "scandinavian", label: "Scandinavian" },
          { value: "classic_comfort", label: "Classic Comfort" },
          { value: "luxe_contemporary", label: "Luxe Contemporary" },
        ],
      },
      {
        id: "sofa",
        label: "Sofa Options",
        options: [
          { value: "couch_linen_sectional", label: "Linen Sectional Sofa" },
          { value: "couch_leather", label: "Leather Sofa" },
          { value: "couch_modern_curved", label: "Modern Curved Sofa" },
          { value: "couch_blue_velvet", label: "Blue Velvet Sofa" },
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
        id: "decor",
        label: "Decor & Surfaces",
        options: [
          { value: "area_rug", label: "Area Rug" },
          { value: "curtains_window_treatments", label: "Curtains" },
          { value: "lighting_refresh", label: "Lighting Refresh" },
        ],
      },
      {
        id: "builtIns",
        label: "Built-Ins & Features",
        options: [
          { value: "media_wall", label: "Media Wall" },
          { value: "fireplace_refresh", label: "Fireplace Refresh" },
          { value: "built_in_shelving", label: "Built-In Shelving" },
        ],
      },
    ],
  },
];

const hexOrFallback = (value: string, fallback: string) => (/^#[0-9a-f]{6}$/i.test(value) ? value : fallback);

const createDefaultOptions = () =>
  demoServices.reduce<Record<string, Record<string, string>>>((serviceOptions, service) => {
    serviceOptions[service.id] = service.groups.reduce<Record<string, string>>((groupOptions, group) => {
      groupOptions[group.id] = group.options[0]?.value || "";
      return groupOptions;
    }, {});
    return serviceOptions;
  }, {});

const createDefaultEnabledGroups = () =>
  demoServices.reduce<Record<string, Record<string, boolean>>>((serviceGroups, service) => {
    serviceGroups[service.id] = service.groups.reduce<Record<string, boolean>>((groups, group) => {
      groups[group.id] = false;
      return groups;
    }, {});
    return serviceGroups;
  }, {});

const buildStyleCards = (service: DemoService): DemoStyleCard[] => {
  if (service.id === "roofing-siding") {
    const groupsById = new Map(service.groups.map((group) => [group.id, group]));

    return [
      {
        id: "roof",
        label: "Roof",
        groups: [groupsById.get("roofStyle"), groupsById.get("roofColor")].filter(Boolean) as DemoOptionGroup[],
      },
      {
        id: "siding",
        label: "Siding",
        groups: [groupsById.get("sidingStyle"), groupsById.get("sidingColor")].filter(Boolean) as DemoOptionGroup[],
      },
      {
        id: "windows",
        label: "Windows",
        groups: [groupsById.get("windows")].filter(Boolean) as DemoOptionGroup[],
      },
      {
        id: "surpriseMe",
        label: "Surprise Me",
        groups: [groupsById.get("surpriseMe")].filter(Boolean) as DemoOptionGroup[],
      },
    ];
  }

  return service.groups.slice(0, 4).map((group) => ({
    id: group.id,
    label: group.label,
    groups: [group],
  }));
};

export default function DemoEmbedPage() {
  const { tenant } = useTenant();
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>("solid");
  const [backgroundColor, setBackgroundColor] = useState("#111827");
  const [accentColor, setAccentColor] = useState("#3b82f6");
  const [panelColor, setPanelColor] = useState("#1f2937");
  const [textColor, setTextColor] = useState("#ffffff");
  const [companyName, setCompanyName] = useState("DreamBuilder");
  const [selectedService, setSelectedService] = useState(demoServices[0]);
  const [selectedOptions, setSelectedOptions] = useState(createDefaultOptions);
  const [enabledGroups, setEnabledGroups] = useState(createDefaultEnabledGroups);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (logoUrl) {
        URL.revokeObjectURL(logoUrl);
      }
    };
  }, [logoUrl]);

  const effectiveTenant = tenant || {
    id: 1,
    userId: null,
    slug: "demo",
    companyName: "DreamBuilder",
    logoUrl: null,
    primaryColor: "#2563EB",
    secondaryColor: "#2563EB",
    phone: null,
    email: null,
    address: null,
    description: "Professional AI-powered visualization services",
    showPricing: true,
    requirePhone: true,
    active: true,
    monthlyGenerationLimit: 1000,
    currentMonthGenerations: 0,
    contactPhone: null,
    embedEnabled: false,
    embedCtaText: "Get Your Free Quote",
    embedCtaPhone: null,
    embedCtaUrl: null,
    embedPrimaryColor: "#2563EB",
    embedSecondaryColor: "#2563EB",
    lastResetDate: new Date(),
    createdAt: new Date(),
  };

  const safeBackgroundColor = hexOrFallback(backgroundColor, "#111827");
  const safeAccentColor = hexOrFallback(accentColor, "#3b82f6");
  const safePanelColor = hexOrFallback(panelColor, "#1f2937");
  const safeTextColor = hexOrFallback(textColor, "#ffffff");
  const displayCompanyName = companyName.trim() || "Your Company";
  const currentOptions = selectedOptions[selectedService.id] || {};
  const currentEnabledGroups = enabledGroups[selectedService.id] || {};
  const styleCards = useMemo(() => buildStyleCards(selectedService), [selectedService]);

  const previewPageStyle = useMemo<CSSProperties>(
    () => {
      if (backgroundMode === "soft-gradient") {
        return {
          background: `linear-gradient(145deg, ${safeBackgroundColor}, ${safeAccentColor})`,
          color: safeTextColor,
        };
      }

      if (backgroundMode === "home-blue") {
        return {
          background: "linear-gradient(to bottom right, #1e293b, #0f172a, #000000)",
          color: safeTextColor,
        };
      }

      if (backgroundMode === "white") {
        return {
          background: "#ffffff",
          color: safeTextColor,
        };
      }

      return {
        background: safeBackgroundColor,
        color: safeTextColor,
      };
    },
    [backgroundMode, safeAccentColor, safeBackgroundColor, safeTextColor],
  );

  const handleLogoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (logoUrl) {
      URL.revokeObjectURL(logoUrl);
    }

    setLogoUrl(URL.createObjectURL(file));
  };

  const handleOptionSelect = (groupId: string, value: string) => {
    setSelectedOptions((current) => ({
      ...current,
      [selectedService.id]: {
        ...(current[selectedService.id] || {}),
        [groupId]: value,
      },
    }));
  };

  const handleCardToggle = (card: DemoStyleCard) => {
    const isEnabled = card.groups.some((group) => currentEnabledGroups[group.id] !== false);

    setEnabledGroups((current) => ({
      ...current,
      [selectedService.id]: {
        ...(current[selectedService.id] || {}),
        ...card.groups.reduce<Record<string, boolean>>((groups, group) => {
          groups[group.id] = !isEnabled;
          return groups;
        }, {}),
      },
    }));
  };

  const shouldUseRadioList = (group: DemoOptionGroup) =>
    !group.label.toLowerCase().includes("color") && group.options.length <= 4;

  return (
    <div className="min-h-screen bg-[#111827] text-white">
      <Header tenant={effectiveTenant} />

      <main className="px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-[94rem]">
          <div className="grid gap-8 lg:grid-cols-[24rem_minmax(0,1fr)] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-200">Embedded page builder</p>
              <h1 className="mt-3 text-4xl font-bold leading-tight md:text-6xl">
                Drop a{" "}
                <span className="bg-gradient-to-r from-blue-200 via-sky-300 to-blue-500 bg-clip-text text-transparent">
                  visualizer
                </span>{" "}
                onto your site
              </h1>
              <p className="mt-5 text-lg leading-8 text-slate-300">
                Brand it preview every service start free
              </p>

              <div className="mt-8 space-y-5 rounded-xl bg-blue-950/35 p-5 ring-1 ring-blue-300/10">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-blue-100">
                    <Building2 className="h-4 w-4" />
                    Company name
                  </label>
                  <input
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                    className="mt-3 h-12 w-full rounded-xl border border-blue-300/20 bg-[#111827] px-4 text-sm text-white outline-none focus:border-blue-300"
                  />
                </div>

                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-blue-100">
                    <Palette className="h-4 w-4" />
                    Background style
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {backgroundModes.map((mode) => (
                      <button
                        key={mode.value}
                        type="button"
                        onClick={() => setBackgroundMode(mode.value)}
                        className={`rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                          backgroundMode === mode.value
                            ? "bg-blue-500 text-white"
                            : "bg-[#111827] text-slate-300 ring-1 ring-blue-300/10 hover:bg-blue-900/40"
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-blue-100">
                    <Palette className="h-4 w-4" />
                    Background color
                  </label>
                  <div className="mt-3 flex items-center gap-3">
                    <input
                      type="color"
                      value={safeBackgroundColor}
                      onChange={(event) => setBackgroundColor(event.target.value)}
                      className="h-12 w-16 rounded-lg border border-blue-300/20 bg-transparent p-1"
                    />
                    <input
                      value={backgroundColor}
                      onChange={(event) => setBackgroundColor(event.target.value)}
                      className="h-12 flex-1 rounded-xl border border-blue-300/20 bg-[#111827] px-4 font-mono text-sm text-white outline-none focus:border-blue-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-blue-100">
                    <Palette className="h-4 w-4" />
                    Button color
                  </label>
                  <div className="mt-3 flex items-center gap-3">
                    <input
                      type="color"
                      value={safeAccentColor}
                      onChange={(event) => setAccentColor(event.target.value)}
                      className="h-12 w-16 rounded-lg border border-blue-300/20 bg-transparent p-1"
                    />
                    <input
                      value={accentColor}
                      onChange={(event) => setAccentColor(event.target.value)}
                      className="h-12 flex-1 rounded-xl border border-blue-300/20 bg-[#111827] px-4 font-mono text-sm text-white outline-none focus:border-blue-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-blue-100">
                    <Palette className="h-4 w-4" />
                    Panel color
                  </label>
                  <div className="mt-3 flex items-center gap-3">
                    <input
                      type="color"
                      value={safePanelColor}
                      onChange={(event) => setPanelColor(event.target.value)}
                      className="h-12 w-16 rounded-lg border border-blue-300/20 bg-transparent p-1"
                    />
                    <input
                      value={panelColor}
                      onChange={(event) => setPanelColor(event.target.value)}
                      className="h-12 flex-1 rounded-xl border border-blue-300/20 bg-[#111827] px-4 font-mono text-sm text-white outline-none focus:border-blue-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-blue-100">
                    <Palette className="h-4 w-4" />
                    Text color
                  </label>
                  <div className="mt-3 flex items-center gap-3">
                    <input
                      type="color"
                      value={safeTextColor}
                      onChange={(event) => setTextColor(event.target.value)}
                      className="h-12 w-16 rounded-lg border border-blue-300/20 bg-transparent p-1"
                    />
                    <input
                      value={textColor}
                      onChange={(event) => setTextColor(event.target.value)}
                      className="h-12 flex-1 rounded-xl border border-blue-300/20 bg-[#111827] px-4 font-mono text-sm text-white outline-none focus:border-blue-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-blue-100">
                    <ImagePlus className="h-4 w-4" />
                    Logo
                  </label>
                  <label className="mt-3 flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-dashed border-blue-300/25 bg-[#111827] px-4 py-4 text-sm text-slate-300 transition hover:border-blue-300/60">
                    <span>{logoUrl ? "Logo loaded" : "Upload logo"}</span>
                    <Upload className="h-5 w-5 text-blue-200" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                </div>

                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-blue-100">
                    <Monitor className="h-4 w-4" />
                    Service preview
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {demoServices.map((service) => (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => setSelectedService(service)}
                        className={`rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                          selectedService.id === service.id
                            ? "bg-blue-500 text-white"
                            : "bg-[#111827] text-slate-300 ring-1 ring-blue-300/10 hover:bg-blue-900/40"
                        }`}
                      >
                        {service.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-blue-950/35 p-3 shadow-2xl shadow-black/30 ring-1 ring-blue-300/10">
              <div className="overflow-hidden rounded-lg bg-[#0b1220]">
                <div className="flex items-center gap-2 border-b border-white/10 bg-black/20 px-4 py-3">
                  <span className="h-3 w-3 rounded-full bg-blue-200" />
                  <span className="h-3 w-3 rounded-full bg-blue-300" />
                  <span className="h-3 w-3 rounded-full bg-blue-500" />
                  <div className="ml-3 h-8 flex-1 truncate rounded-md bg-black/25 px-3 py-1.5 text-sm text-white/70">
                    {displayCompanyName.toLowerCase().replace(/\s+/g, "")}.com/{selectedService.id}
                  </div>
                </div>

                <div className="min-h-[48rem] px-4 py-8 sm:px-8" style={previewPageStyle}>
                  <div className="mx-auto max-w-4xl">
                    <div className="flex min-h-12 items-center justify-start">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Uploaded logo preview" className="max-h-12 max-w-44 object-contain" />
                      ) : (
                        <span className="text-sm font-bold uppercase tracking-wide text-white">Your Logo Here</span>
                      )}
                    </div>
                    <h2 className="mt-5 text-center text-3xl font-bold leading-tight md:text-4xl" style={{ color: safeTextColor }}>
                      {displayCompanyName} {selectedService.pageLabel} Visualizer
                    </h2>
                    <p className="mt-3 text-center text-base opacity-75" style={{ color: safeTextColor }}>
                      {selectedService.prompt}
                    </p>
                  </div>

                  <div className="mx-auto mt-8 max-w-4xl space-y-5">
                    <div className="rounded-xl p-4 ring-1 ring-white/10" style={{ backgroundColor: safePanelColor }}>
                      <h3 className="text-center text-lg font-bold" style={{ color: safeTextColor }}>
                        {selectedService.uploadLabel}
                      </h3>
                      <div className="mt-4 overflow-hidden rounded-lg ring-1 ring-white/10">
                        <div className="relative flex aspect-[16/7] items-center justify-center bg-gradient-to-br from-blue-600 via-blue-800 to-blue-950">
                          <div className="text-center">
                            <Upload className="mx-auto h-10 w-10 text-blue-100" />
                            <p className="mt-3 font-semibold text-white">Project photo preview</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl p-4 ring-1 ring-white/10" style={{ backgroundColor: safePanelColor }}>
                      <h3 className="font-bold" style={{ color: safeTextColor }}>
                        Choose Your Style
                      </h3>

                      <div className="mt-4 grid items-start gap-3 lg:grid-cols-4">
                        {styleCards.map((card) => {
                          const isEnabled = card.groups.some((group) => currentEnabledGroups[group.id] !== false);

                          return (
                            <div
                              key={card.id}
                              className={`rounded-xl border transition ${
                                isEnabled
                                  ? "min-h-[15rem] border-slate-500 bg-slate-600/90 p-4 shadow-inner shadow-white/5"
                                  : "min-h-[4.75rem] border-slate-500/70 bg-slate-500/80 p-3"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <h4 className="text-xl font-bold leading-tight text-white">{card.label}</h4>
                                <button
                                  type="button"
                                  aria-label={`Toggle ${card.label}`}
                                  aria-pressed={isEnabled}
                                  onClick={() => handleCardToggle(card)}
                                  className="flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition"
                                  style={{ backgroundColor: isEnabled ? safeAccentColor : "#475569" }}
                                >
                                  <span
                                    className={`h-5 w-5 rounded-full bg-white transition-transform ${
                                      isEnabled ? "translate-x-5" : "translate-x-0"
                                    }`}
                                  />
                                </button>
                              </div>

                              {isEnabled && (
                                <div className="mt-6 space-y-5">
                                  {card.groups.map((group) => {
                                    const value = currentOptions[group.id] || group.options[0]?.value || "";

                                    return (
                                      <div key={group.id}>
                                        <p className="mb-3 text-sm font-medium text-white/80">
                                          {group.label.toLowerCase().includes("color") ? "Choose Color:" : "Choose Style:"}
                                        </p>

                                        {shouldUseRadioList(group) ? (
                                          <div className="space-y-3">
                                            {group.options.map((option) => (
                                              <label key={option.value} className="flex cursor-pointer items-start gap-3 text-sm font-semibold text-white">
                                                <input
                                                  type="radio"
                                                  name={`${selectedService.id}-${card.id}-${group.id}`}
                                                  value={option.value}
                                                  checked={value === option.value}
                                                  onChange={() => handleOptionSelect(group.id, option.value)}
                                                  className="mt-1 h-4 w-4 accent-blue-500"
                                                />
                                                <span className="leading-6">{option.label}</span>
                                              </label>
                                            ))}
                                          </div>
                                        ) : (
                                          <select
                                            value={value}
                                            onChange={(event) => handleOptionSelect(group.id, event.target.value)}
                                            className="h-12 w-full rounded-lg border border-white/10 bg-slate-100 px-3 text-sm font-semibold text-slate-600 outline-none focus:border-blue-300"
                                          >
                                            {group.options.map((option) => (
                                              <option key={option.value} value={option.value}>
                                                {option.label}
                                              </option>
                                            ))}
                                          </select>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      className="flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-bold text-white shadow-lg shadow-black/25 transition hover:opacity-90"
                      style={{ backgroundColor: safeAccentColor }}
                    >
                      <Sparkles className="h-5 w-5" />
                      Generate AI {selectedService.pageLabel} Design
                    </button>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
