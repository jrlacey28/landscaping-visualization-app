export interface StyleConfig {
  id: string;
  name: string;
  prompt: string;
  referenceImageUrl: string;
  referenceImages?: string[]; 
  category: "roof" | "siding" | "surprise";
  regionType: "roof" | "exterior" | "random";
}

// Base style templates for dynamic prompt generation
interface StyleTemplate {
  id: string;
  name: string;
  basePrompt: string;
  referenceImageUrl: string;
  category: "roof" | "siding";
  regionType: "roof" | "exterior";
}

// Color descriptors for each color option
interface ColorDescriptor {
  value: string;
  label: string;
  hex: string;
  promptDescription: string;
}

export const ROOF_COLORS: Record<string, ColorDescriptor> = {
  charcoal_gray: { value: "charcoal_gray", label: "Charcoal Gray", hex: "#36454F", promptDescription: "charcoal gray color with sophisticated dark tones" },
  pewter_gray: { value: "pewter_gray", label: "Pewter Gray", hex: "#8C92AC", promptDescription: "pewter gray with subtle blue undertones" },
  weathered_wood: { value: "weathered_wood", label: "Weathered Wood", hex: "#79685D", promptDescription: "weathered wood brown with natural earth tones" },
  driftwood: { value: "driftwood", label: "Driftwood", hex: "#A7988A", promptDescription: "driftwood gray-brown with weathered appearance" },
  desert_tan: { value: "desert_tan", label: "Desert Tan", hex: "#D2B48C", promptDescription: "desert tan with warm sandy coloration" },
  slate_blue: { value: "slate_blue", label: "Slate Blue", hex: "#6A7BA2", promptDescription: "slate blue with sophisticated blue-gray tones" },
  williamsburg_gray: { value: "williamsburg_gray", label: "Williamsburg Gray", hex: "#B0AFAE", promptDescription: "Williamsburg gray with classic neutral tones" },
  forest_green: { value: "forest_green", label: "Forest Green", hex: "#014421", promptDescription: "deep forest green with rich natural coloration" },
  midnight_black: { value: "midnight_black", label: "Midnight Black", hex: "#1C1C1C", promptDescription: "midnight black with deep, rich darkness" },
  moire_black: { value: "moire_black", label: "Moire Black", hex: "#2E2E2E", promptDescription: "moire black with subtle texture variation" },
  merlot: { value: "merlot", label: "Merlot", hex: "#73343A", promptDescription: "merlot red-brown with wine-inspired tones" },
  estate_gray: { value: "estate_gray", label: "Estate Gray", hex: "#555555", promptDescription: "estate gray with classic medium-tone coloration" },
  barkwood: { value: "barkwood", label: "Barkwood", hex: "#5C4033", promptDescription: "barkwood brown with natural wood-like appearance" },
  harbor_blue: { value: "harbor_blue", label: "Harbor Blue", hex: "#46647E", promptDescription: "harbor blue with coastal blue-gray tones" },
  onyx_black: { value: "onyx_black", label: "Onyx Black", hex: "#0F0F0F", promptDescription: "onyx black with premium deep black finish" },
};

export const SIDING_COLORS: Record<string, ColorDescriptor> = {
  white: { value: "white", label: "White", hex: "#FFFFFF", promptDescription: "crisp white with clean, bright appearance" },
  colonial_white: { value: "colonial_white", label: "Colonial White", hex: "#FAF9F6", promptDescription: "colonial white with warm, off-white tones" },
  gray: { value: "gray", label: "Gray", hex: "#808080", promptDescription: "classic gray with neutral medium tones" },
  greige: { value: "greige", label: "Greige", hex: "#BEB6AA", promptDescription: "greige with warm gray-beige blend" },
  beige_almond: { value: "beige_almond", label: "Beige / Almond", hex: "#F5F5DC", promptDescription: "beige almond with warm, creamy tones" },
  sandstone: { value: "sandstone", label: "Sandstone", hex: "#C2B280", promptDescription: "sandstone with natural tan-brown coloration" },
  navy_coastal_blue: { value: "navy_coastal_blue", label: "Navy / Coastal Blue", hex: "#2C3E50", promptDescription: "navy coastal blue with deep maritime tones" },
  sage_green: { value: "sage_green", label: "Sage Green", hex: "#9C9F84", promptDescription: "sage green with muted natural green tones" },
  forest_green: { value: "forest_green", label: "Forest Green", hex: "#014421", promptDescription: "deep forest green with rich natural coloration" },
  autumn_red: { value: "autumn_red", label: "Autumn Red", hex: "#8B2E2E", promptDescription: "autumn red with warm brick-like tones" },
  brown_chestnut_espresso: { value: "brown_chestnut_espresso", label: "Brown (Chestnut / Espresso)", hex: "#4B3621", promptDescription: "rich brown with chestnut and espresso undertones" },
  charcoal_dark_gray: { value: "charcoal_dark_gray", label: "Charcoal / Dark Gray", hex: "#333333", promptDescription: "charcoal dark gray with contemporary deep tones" },
  clay_khaki: { value: "clay_khaki", label: "Clay / Khaki", hex: "#B2A17E", promptDescription: "clay khaki with earthy tan-brown coloration" },
  azure_blue: { value: "azure_blue", label: "Azure Blue", hex: "#4A90E2", promptDescription: "azure blue with vibrant sky-inspired tones" },
  savannah_wicker: { value: "savannah_wicker", label: "Savannah Wicker", hex: "#D8CAB1", promptDescription: "savannah wicker with warm natural beige tones" },
};

export const STYLE_TEMPLATES: Record<string, StyleTemplate> = {
  asphalt_shingles: {
    id: "asphalt_shingles",
    name: "Asphalt Shingles",
    basePrompt: "Replace the roof with {COLOR_DESCRIPTION} asphalt shingles. High-quality dimensional architectural shingles with {COLOR_DESCRIPTION} and professional installation with proper alignment and weather-resistant materials. Keep all house structure, siding, windows, landscaping, and surrounding elements exactly as they are.",
    referenceImageUrl: "https://mycdn.com/asphalt-shingles.jpg",
    category: "roof",
    regionType: "roof",
  },
  steel_roof: {
    id: "steel_roof", 
    name: "Steel Roof",
    basePrompt: "Replace the roof with {COLOR_DESCRIPTION} steel roofing. Modern standing seam metal roof with {COLOR_DESCRIPTION} and durable finish. Professional installation with proper fasteners and weatherproofing. Keep all other house elements and landscaping exactly unchanged.",
    referenceImageUrl: "https://mycdn.com/steel-roof.jpg",
    category: "roof",
    regionType: "roof",
  },
  steel_shingles: {
    id: "steel_shingles",
    name: "Steel Shingles", 
    basePrompt: "Replace the roof with {COLOR_DESCRIPTION} steel shingles. Premium metal shingles with traditional appearance, modern durability, and {COLOR_DESCRIPTION}. Professional installation with proper fasteners. Keep all other home and landscape elements exactly as they are.",
    referenceImageUrl: "https://mycdn.com/steel-shingles.jpg",
    category: "roof",
    regionType: "roof",
  },
  vinyl_siding: {
    id: "vinyl_siding",
    name: "Vinyl Siding",
    basePrompt: "Replace the house siding with {COLOR_DESCRIPTION} vinyl siding. Premium quality horizontal lap siding with {COLOR_DESCRIPTION} and professional installation with proper trim and corner details. Keep roof, windows, doors, and all landscaping exactly unchanged.",
    referenceImageUrl: "https://mycdn.com/vinyl-siding.jpg",
    category: "siding",
    regionType: "exterior",
  },
  fiber_cement: {
    id: "fiber_cement",
    name: "Fiber Cement",
    basePrompt: "Replace the house siding with {COLOR_DESCRIPTION} fiber cement siding. High-quality cementitious siding with {COLOR_DESCRIPTION} and wood-grain texture. Professional installation with proper trim work. Keep all other home features and landscaping unchanged.",
    referenceImageUrl: "https://mycdn.com/fiber-cement.jpg",
    category: "siding", 
    regionType: "exterior",
  },
  wood_siding: {
    id: "wood_siding",
    name: "Wood Siding",
    basePrompt: "Replace the house siding with {COLOR_DESCRIPTION} wood siding. Cedar or similar wood species with {COLOR_DESCRIPTION} and horizontal board installation. Natural wood grain pattern with professional finish. Keep roof, windows, and all landscaping exactly as they are.",
    referenceImageUrl: "https://mycdn.com/wood-siding.jpg",
    category: "siding",
    regionType: "exterior",
  },
  brick_veneer: {
    id: "brick_veneer", 
    name: "Brick Veneer",
    basePrompt: "Replace the house siding with {COLOR_DESCRIPTION} brick veneer. Traditional brick with classic mortar joints, professional masonry installation, and {COLOR_DESCRIPTION} with natural variation. Preserve roof, trim, windows, and all landscape elements unchanged.",
    referenceImageUrl: "https://mycdn.com/brick-veneer.jpg",
    category: "siding",
    regionType: "exterior",
  },
};

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

// Dynamic prompt generation function
export function generateStyleConfig(styleType: string, colorValue: string): StyleConfig {
  const template = STYLE_TEMPLATES[styleType];
  if (!template) {
    throw new Error(`Unknown style type: ${styleType}`);
  }

  const colorDescriptor = template.category === "roof" 
    ? ROOF_COLORS[colorValue] 
    : SIDING_COLORS[colorValue];
    
  if (!colorDescriptor) {
    throw new Error(`Unknown color: ${colorValue} for ${template.category}`);
  }

  const prompt = template.basePrompt.replace(/{COLOR_DESCRIPTION}/g, colorDescriptor.promptDescription);
  
  return {
    id: `${styleType}_${colorValue}`,
    name: `${template.name} - ${colorDescriptor.label}`,
    prompt: prompt,
    referenceImageUrl: template.referenceImageUrl,
    category: template.category,
    regionType: template.regionType,
  };
}

// Helper function to get style config for combined style+color selection
export function getStyleConfig(styleAndColor: string): StyleConfig {
  // Handle legacy static configurations first
  if (STYLE_CONFIG[styleAndColor]) {
    return STYLE_CONFIG[styleAndColor];
  }
  
  // Parse dynamic style_color format
  const parts = styleAndColor.split('_');
  if (parts.length >= 2) {
    // Find the best split point - look for known style types
    for (const styleType of Object.keys(STYLE_TEMPLATES)) {
      if (styleAndColor.startsWith(styleType + '_')) {
        const colorValue = styleAndColor.substring(styleType.length + 1);
        try {
          return generateStyleConfig(styleType, colorValue);
        } catch (error) {
          console.warn(`Failed to generate config for ${styleType} + ${colorValue}:`, error);
        }
      }
    }
  }
  
  // Fallback to first available style
  const fallback = Object.values(STYLE_CONFIG)[0];
  if (fallback) {
    return fallback;
  }
  
  // Generate a default config if no static configs exist
  return generateStyleConfig('asphalt_shingles', 'charcoal_gray');
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
