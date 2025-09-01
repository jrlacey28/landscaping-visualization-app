export interface StyleConfig {
  id: string;
  name: string;
  prompt: string;
  referenceImageUrl: string;
  referenceImages?: string[]; 
  category: "roof" | "siding" | "surprise";
  regionType: "roof" | "exterior" | "random";
}

export const STYLE_CONFIG: Record<string, StyleConfig> = {
  // Roof Styles with Colors
  asphalt_shingles_charcoal_black: {
    id: "asphalt_shingles_charcoal_black",
    name: "Asphalt Shingles - Charcoal Black",
    prompt: "Replace the roof with charcoal black asphalt shingles. High-quality dimensional shingles with deep black color and subtle texture variation. Professional installation with proper alignment and weather-resistant materials. Keep all house structure, siding, windows, landscaping, and surrounding elements exactly as they are.",
    referenceImageUrl: "https://mycdn.com/asphalt-shingles-black.jpg",
    category: "roof",
    regionType: "roof",
  },
  asphalt_shingles_weathered_gray: {
    id: "asphalt_shingles_weathered_gray",
    name: "Asphalt Shingles - Weathered Gray",
    prompt: "Replace the roof with weathered gray asphalt shingles. Premium architectural shingles in sophisticated gray tones with natural weathered appearance. Keep all other home elements unchanged including siding, trim, and landscaping.",
    referenceImageUrl: "https://mycdn.com/asphalt-shingles-gray.jpg",
    category: "roof",
    regionType: "roof",
  },
  asphalt_shingles_rustic_brown: {
    id: "asphalt_shingles_rustic_brown",
    name: "Asphalt Shingles - Rustic Brown",
    prompt: "Replace the roof with rustic brown asphalt shingles. Rich brown architectural shingles with natural earth tone colors and dimensional texture. Maintain all existing house features and landscape elements unchanged.",
    referenceImageUrl: "https://mycdn.com/asphalt-shingles-brown.jpg",
    category: "roof",
    regionType: "roof",
  },
  asphalt_shingles_slate_blue: {
    id: "asphalt_shingles_slate_blue",
    name: "Asphalt Shingles - Slate Blue",
    prompt: "Replace the roof with slate blue asphalt shingles. Premium shingles in sophisticated blue-gray color with architectural dimensionality. Keep house structure, siding, and all surroundings exactly as shown.",
    referenceImageUrl: "https://mycdn.com/asphalt-shingles-blue.jpg",
    category: "roof",
    regionType: "roof",
  },
  asphalt_shingles_forest_green: {
    id: "asphalt_shingles_forest_green",
    name: "Asphalt Shingles - Forest Green",
    prompt: "Replace the roof with forest green asphalt shingles. Deep green architectural shingles with natural color variation and professional installation. Preserve all other home and landscape features unchanged.",
    referenceImageUrl: "https://mycdn.com/asphalt-shingles-green.jpg",
    category: "roof",
    regionType: "roof",
  },
  steel_roof_charcoal_black: {
    id: "steel_roof_charcoal_black",
    name: "Steel Roof - Charcoal Black",
    prompt: "Replace the roof with charcoal black steel roofing. Modern standing seam metal roof with clean lines and durable finish. Professional installation with proper fasteners and weatherproofing. Keep all other house elements and landscaping exactly unchanged.",
    referenceImageUrl: "https://mycdn.com/steel-roof-black.jpg",
    category: "roof",
    regionType: "roof",
  },
  steel_roof_weathered_gray: {
    id: "steel_roof_weathered_gray",
    name: "Steel Roof - Weathered Gray",
    prompt: "Replace the roof with weathered gray steel roofing. Contemporary metal roof with sophisticated gray finish and standing seam design. Maintain all existing home features and surroundings unchanged.",
    referenceImageUrl: "https://mycdn.com/steel-roof-gray.jpg",
    category: "roof",
    regionType: "roof",
  },
  steel_shingles_charcoal_black: {
    id: "steel_shingles_charcoal_black",
    name: "Steel Shingles - Charcoal Black",
    prompt: "Replace the roof with charcoal black steel shingles. Premium metal shingles with traditional appearance and modern durability. Deep black finish with professional installation. Keep all other home and landscape elements exactly as they are.",
    referenceImageUrl: "https://mycdn.com/steel-shingles-black.jpg",
    category: "roof",
    regionType: "roof",
  },
  
  // Siding Options
  vinyl_siding_white: {
    id: "vinyl_siding_white",
    name: "Vinyl Siding - White",
    prompt: "Replace the house siding with clean white vinyl siding. Premium quality horizontal lap siding with smooth finish and professional installation. Bright white color with proper trim and corner details. Keep roof, windows, doors, and all landscaping exactly unchanged.",
    referenceImageUrl: "https://mycdn.com/vinyl-siding-white.jpg",
    category: "siding",
    regionType: "exterior",
  },
  vinyl_siding_gray: {
    id: "vinyl_siding_gray",
    name: "Vinyl Siding - Gray",
    prompt: "Replace the house siding with modern gray vinyl siding. Contemporary gray color with horizontal lap style and professional installation. Maintain all roof, trim, windows, and landscape elements exactly as shown.",
    referenceImageUrl: "https://mycdn.com/vinyl-siding-gray.jpg",
    category: "siding",
    regionType: "exterior",
  },
  fiber_cement_beige: {
    id: "fiber_cement_beige",
    name: "Fiber Cement - Beige",
    prompt: "Replace the house siding with beige fiber cement siding. High-quality cementitious siding in warm beige tone with wood-grain texture. Professional installation with proper trim work. Keep all other home features and landscaping unchanged.",
    referenceImageUrl: "https://mycdn.com/fiber-cement-beige.jpg",
    category: "siding",
    regionType: "exterior",
  },
  wood_siding_natural: {
    id: "wood_siding_natural",
    name: "Wood Siding - Natural",
    prompt: "Replace the house siding with natural wood siding. Cedar or similar wood species with natural finish and horizontal board installation. Maintain the natural wood color and grain pattern. Keep roof, windows, and all landscaping exactly as they are.",
    referenceImageUrl: "https://mycdn.com/wood-siding-natural.jpg",
    category: "siding",
    regionType: "exterior",
  },
  brick_veneer_red: {
    id: "brick_veneer_red",
    name: "Brick Veneer - Red",
    prompt: "Replace the house siding with red brick veneer. Traditional red brick with classic mortar joints and professional masonry installation. Rich red color with natural variation. Preserve roof, trim, windows, and all landscape elements unchanged.",
    referenceImageUrl: "https://mycdn.com/brick-veneer-red.jpg",
    category: "siding",
    regionType: "exterior",
  },
  
  // Surprise Me Option
  random_roof_and_siding: {
    id: "random_roof_and_siding",
    name: "Surprise Me - Random Selection",
    prompt: "Transform this home with a randomly selected roof and siding combination that complements each other. Choose appropriate colors and materials that work well together for a beautiful exterior renovation. Maintain all windows, doors, trim, and landscaping exactly as shown.",
    referenceImageUrl: "https://mycdn.com/random-combo.jpg",
    category: "surprise",
    regionType: "random",
  },
};

export const REGION_STYLE_MAPPING = {
  roof: [
    "asphalt_shingles_charcoal_black",
    "asphalt_shingles_weathered_gray", 
    "asphalt_shingles_rustic_brown",
    "asphalt_shingles_slate_blue",
    "asphalt_shingles_forest_green",
    "steel_roof_charcoal_black",
    "steel_roof_weathered_gray",
    "steel_shingles_charcoal_black",
  ] as const,
  exterior: [
    "vinyl_siding_white",
    "vinyl_siding_gray",
    "fiber_cement_beige", 
    "wood_siding_natural",
    "brick_veneer_red",
  ] as const,
  random: ["random_roof_and_siding"] as const,
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
