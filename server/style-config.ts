export interface StyleConfig {
  id: string;
  name: string;
  prompt: string;
  referenceImageUrl: string;
  category: "curbing" | "mulch" | "patio" | "gravel" | "grass";
  regionType: "edge" | "central" | "hardscape" | "lawn";
}

export const STYLE_CONFIG: Record<string, StyleConfig> = {
  natural_stone_curbing: {
    id: "natural_stone_curbing",
    name: "Natural Stone Curbing",
    prompt:
      "Add natural stone curbing along the existing lawn edges and walkways with irregularly shaped fieldstone or stacked stone blocks in earth tones (gray, tan, brown). Keep all existing plants, trees, bushes, rock bed, mulch and landscape features exactly where they are and how they are. The stone curbing should follow the natural contours of the landscape and appear professionally installed with clean, defined edges.",
    referenceImageUrl: "https://mycdn.com/natural-stone-curbing.jpg",
    category: "curbing",
    regionType: "edge",
  },
  brown_mulch: {
    id: "brown_mulch",
    name: "Brown Colored Mulch",
    prompt:
      "Replace only the ground cover areas with fresh brown hardwood mulch. Keep all existing trees, bushes, shrubs, flowers, and plants exactly how they are and unchanged. The mulch should be evenly distributed around plant bases with a 2-3 inch depth, creating clean edges against lawn areas and walkways. Use rich, dark brown organic mulch texture.",
    referenceImageUrl: "https://mycdn.com/brown-mulch.jpg",
    category: "mulch",
    regionType: "central",
  },
  concrete_patio: {
    id: "concrete_patio",
    name: "Concrete",
    prompt:
      "Install a clean, modern concrete patio with a smooth or lightly textured finish. Use light gray concrete with subtle expansion joints for a professional appearance. The patio should be appropriately sized for the space, include proper drainage slopes, and blend naturally with the existing landscape. Preserve all surrounding vegetation and landscape elements exactly as shown.",
    referenceImageUrl: "https://mycdn.com/concrete-patio.jpg",
    category: "patio",
    regionType: "hardscape",
  },
  river_rock: {
    id: "river_rock",
    name: "River Rock Landscaping",
    prompt:
      "Replace ground cover areas with natural river rock landscaping. Use mixed-size smooth river rocks in earth tones (gray, brown, tan). Preserve all existing vegetation, trees, bushes, and plants exactly as they appear. The river rock should be evenly distributed around plant bases and landscape beds, creating attractive low-maintenance ground cover.",
    referenceImageUrl: "https://mycdn.com/river-rock.jpg",
    category: "gravel",
    regionType: "central",
  },
  red_mulch: {
    id: "red_mulch",
    name: "Red Cedar Mulch",
    prompt:
      "Replace with vibrant red cedar mulch. Rich reddish-brown organic mulch with natural wood texture. Fresh appearance with good coverage depth.",
    referenceImageUrl: "https://mycdn.com/red-mulch.jpg",
    category: "mulch",
    regionType: "central",
  },
  brick_curbing: {
    id: "brick_curbing",
    name: "Brick Landscape Edging",
    prompt:
      "Replace with classic brick landscape edging. Traditional red brick border with clean mortar lines. Professional installation with straight edges.",
    referenceImageUrl: "https://mycdn.com/brick-curbing.jpg",
    category: "curbing",
    regionType: "edge",
  },
  premium_mulch: {
    id: "premium_mulch",
    name: "Premium Mulch",
    prompt:
      "Replace only the ground cover areas with fresh brown hardwood mulch. Keep all existing trees, bushes, shrubs, flowers, and plants exactly unchanged. The mulch should be evenly distributed around plant bases with a 2-3 inch depth, creating clean edges against lawn areas and walkways. Use rich, dark brown organic mulch texture.",
    referenceImageUrl: "https://mycdn.com/premium-mulch.jpg",
    category: "mulch",
    regionType: "central",
  },
  fresh_sod: {
    id: "fresh_sod",
    name: "Fresh Sod",
    prompt:
      "what would my yard look like with hyoerrealistic natural looking grass as an established yard.",
    referenceImageUrl: "/uploads/fresh-sod-reference.jpg",
    category: "grass",
    regionType: "lawn",
  },
  stamped_concrete: {
    id: "stamped_concrete",
    name: "Stamped Concrete",
    prompt:
      "Create a stamped concrete patio with decorative patterns that complement the homes style. Use popular stamped patterns like ashlar slate, cobblestone, or brick texture in earth tone colors (tan, gray, or sandstone). The concrete should have realistic texture and color variation with proper scoring lines. Include a subtle border pattern around the edges and ensure the patio is appropriately sized for the space with proper drainage slopes. Preserve all existing trees, shrubs, plants, and landscape features exactly as shown. The stamped concrete should blend naturally with surrounding lawn and garden areas.",
    referenceImageUrl: "https://mycdn.com/stamped-concrete.jpg",
    category: "patio",
    regionType: "hardscape",
  },
  designer_pavers: {
    id: "designer_pavers",
    name: "Designer Pavers",
    prompt:
      "Install designer paver patio with interlocking stone pavers. Premium quality pavers in coordinated colors with tight joints and professional installation.",
    referenceImageUrl: "https://mycdn.com/designer-pavers.jpg",
    category: "patio",
    regionType: "hardscape",
  },
  river_rock_curbing: {
    id: "river_rock_curbing",
    name: "River Rock Curbing",
    prompt:
      "Install river rock curbing along all lawn borders and pathways. Use smooth, rounded river rocks in mixed natural colors (gray, brown, tan, black) sized 2-4 inches. Maintain all existing vegetation, trees, shrubs, and plantings unchanged. The river rock should create clean, defined borders that follow the existing landscape curves and transitions.",
    referenceImageUrl: "https://mycdn.com/river-rock-curbing.jpg",
    category: "curbing",
    regionType: "edge",
  },
  concrete: {
    id: "concrete",
    name: "Concrete",
    prompt:
      "Install a clean, modern concrete patio with a smooth or lightly textured finish. Use light gray concrete with subtle expansion joints for a professional appearance. The patio should be appropriately sized for the space, include proper drainage slopes, and blend naturally with the existing landscape. Preserve all surrounding vegetation and landscape elements exactly as shown.",
    referenceImageUrl: "https://mycdn.com/concrete-patio.jpg",
    category: "patio",
    regionType: "hardscape",
  },
};

export const REGION_STYLE_MAPPING = {
  edge: [
    "natural_stone_curbing",
    "river_rock_curbing",
    "brick_curbing",
  ] as const,
  central: ["brown_mulch", "red_mulch", "river_rock", "premium_mulch"] as const,
  hardscape: ["concrete", "stamped_concrete", "designer_pavers"] as const,
  lawn: ["fresh_sod"] as const,
};

export function getStyleForRegion(
  regionType: keyof typeof REGION_STYLE_MAPPING,
  preferredStyleId?: string,
): StyleConfig {
  const availableStyles = REGION_STYLE_MAPPING[regionType];

  // Check if preferred style is available for this region
  if (preferredStyleId) {
    for (const styleId of availableStyles) {
      if (styleId === preferredStyleId) {
        return STYLE_CONFIG[preferredStyleId];
      }
    }
  }

  // Default selections for each region type
  if (availableStyles.length > 0) {
    const defaultStyle = availableStyles[0] as string;
    return STYLE_CONFIG[defaultStyle];
  }

  // Fallback to first available style
  return Object.values(STYLE_CONFIG)[0];
}

export function getAllStyles(): StyleConfig[] {
  return Object.values(STYLE_CONFIG);
}

export function getStylesByCategory(
  category: StyleConfig["category"],
): StyleConfig[] {
  return Object.values(STYLE_CONFIG).filter(
    (style) => style.category === category,
  );
}
