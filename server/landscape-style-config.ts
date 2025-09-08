export interface LandscapeStyleConfig {
  id: string;
  name: string;
  prompt: string;
  referenceImageUrl: string;
  referenceImages?: string[];
  category: "curbing" | "landscape" | "patios";
  regionType: "border" | "garden" | "outdoor";
}

export const LANDSCAPE_STYLE_CONFIG: Record<string, LandscapeStyleConfig> = {
  // Curbing Options
  natural_stone_curbing_gray: {
    id: "natural_stone_curbing_gray",
    name: "Natural Stone Curbing - Gray",
    prompt:
      "Add LOW continuous poured decorative concrete curbing around existing garden beds. CRITICAL: Curbing must be ONLY 2-3 inches tall maximum with a sloped mower-friendly profile - COMPLETELY IGNORE the height shown in reference images. DO NOT make tall curbing like in the reference photos. Create a low slant profile where the bed side is ONLY 2-3 inches tall and slopes down at a 45-degree angle to a rounded lip that sits just 1 inch above grass level. Reference images show TEXTURE AND COLOR ONLY - use specified low dimensions, not the tall heights in images. Apply stamped natural stone texture in subtle gray tones. Must be one continuous monolithic strip, not blocks. Keep all existing plants, mulch, grass unchanged. Do not create tall walls, stacked stone, or boulder borders. The curbing MUST be low and mower-friendly.",
    referenceImageUrl:
      "../attached_assets/Untitled design - 2025-08-31T143852.517_1757033241182.png",
    referenceImages: [
      "../attached_assets/Untitled design - 2025-08-31T143852.517_1757033241182.png",
      "../attached_assets/Untitled design - 2025-08-31T143852.517_1757033992300.png",
    ],
    category: "curbing",
    regionType: "border",
  },
  natural_stone_curbing_tan: {
    id: "natural_stone_curbing_tan",
    name: "Natural Stone Curbing - Tan",
    prompt:
      "Add LOW continuous poured decorative concrete curbing around existing garden beds. CRITICAL: Curbing must be ONLY 2-3 inches tall maximum with a sloped mower-friendly profile - COMPLETELY IGNORE the height shown in reference images. DO NOT make tall curbing like in the reference photos. Create a low slant profile where the bed side is ONLY 2-3 inches tall and slopes down at a 45-degree angle to a rounded lip that sits just 1 inch above grass level. Reference images show TEXTURE AND COLOR ONLY - use specified low dimensions, not the tall heights in images. Apply stamped natural stone texture in warm tan/beige tones. Must be one continuous monolithic strip, not blocks. Keep all existing plants, mulch, grass unchanged. Do not create tall walls, stacked stone, or boulder borders. The curbing MUST be low and mower-friendly.",
    referenceImageUrl:
      "../attached_assets/Untitled design - 2025-08-31T143852.517_1757033241182.png",
    referenceImages: [
      "../attached_assets/Untitled design - 2025-08-31T143852.517_1757033241182.png",
      "../attached_assets/Untitled design - 2025-08-31T143852.517_1757033992300.png",
    ],
    category: "curbing",
    regionType: "border",
  },
  natural_stone_curbing_brown: {
    id: "natural_stone_curbing_brown",
    name: "Natural Stone Curbing - Brown",
    prompt:
      "Add LOW continuous poured decorative concrete curbing around existing garden beds. CRITICAL: Curbing must be ONLY 2-3 inches tall maximum with a sloped mower-friendly profile - COMPLETELY IGNORE the height shown in reference images. DO NOT make tall curbing like in the reference photos. Create a low slant profile where the bed side is ONLY 2-3 inches tall and slopes down at a 45-degree angle to a rounded lip that sits just 1 inch above grass level. Reference images show TEXTURE AND COLOR ONLY - use specified low dimensions, not the tall heights in images. Apply stamped natural stone texture in rich brown/earth tones. Must be one continuous monolithic strip, not blocks. Keep all existing plants, mulch, grass unchanged. Do not create tall walls, stacked stone, or boulder borders. The curbing MUST be low and mower-friendly.",
    referenceImageUrl: "../uploads/IMG_2129.jpg",
    referenceImages: ["../uploads/IMG_2129.jpg"],
    category: "curbing",
    regionType: "border",
  },
  natural_stone_curbing_charcoal: {
    id: "natural_stone_curbing_charcoal",
    name: "Natural Stone Curbing - Charcoal",
    prompt:
      "Add LOW continuous poured decorative concrete curbing around existing garden beds. CRITICAL: Curbing must be ONLY 2-3 inches tall maximum with a sloped mower-friendly profile - COMPLETELY IGNORE the height shown in reference images. DO NOT make tall curbing like in the reference photos. Create a low slant profile where the bed side is ONLY 2-3 inches tall and slopes down at a 45-degree angle to a rounded lip that sits just 1 inch above grass level. Reference images show TEXTURE AND COLOR ONLY - use specified low dimensions, not the tall heights in images. Apply stamped natural stone texture in dark charcoal/anthracite tones. Must be one continuous monolithic strip, not blocks. Keep all existing plants, mulch, grass unchanged. Do not create tall walls, stacked stone, or boulder borders. The curbing MUST be low and mower-friendly.",
    referenceImageUrl:
      "../attached_assets/Untitled design - 2025-08-31T143852.517_1757033241182.png",
    referenceImages: [
      "../attached_assets/Untitled design - 2025-08-31T143852.517_1757033241182.png",
      "../attached_assets/Untitled design - 2025-08-31T143852.517_1757033992300.png",
    ],
    category: "curbing",
    regionType: "border",
  },
  natural_stone_curbing_sandstone: {
    id: "natural_stone_curbing_sandstone",
    name: "Natural Stone Curbing - Sandstone",
    prompt:
      "Add LOW continuous poured decorative concrete curbing around existing garden beds. CRITICAL: Curbing must be ONLY 2-3 inches tall maximum with a sloped mower-friendly profile - COMPLETELY IGNORE the height shown in reference images. DO NOT make tall curbing like in the reference photos. Create a low slant profile where the bed side is ONLY 2-3 inches tall and slopes down at a 45-degree angle to a rounded lip that sits just 1 inch above grass level. Reference images show TEXTURE AND COLOR ONLY - use specified low dimensions, not the tall heights in images. Apply stamped natural stone texture in warm sandstone/buff tones. Must be one continuous monolithic strip, not blocks. Keep all existing plants, mulch, grass unchanged. Do not create tall walls, stacked stone, or boulder borders. The curbing MUST be low and mower-friendly.",
    referenceImageUrl:
      "../attached_assets/Untitled design - 2025-08-31T143852.517_1757033241182.png",
    referenceImages: [
      "../attached_assets/Untitled design - 2025-08-31T143852.517_1757033241182.png",
      "../attached_assets/Untitled design - 2025-08-31T143852.517_1757033992300.png",
    ],
    category: "curbing",
    regionType: "border",
  },
  brick_curbing: {
    id: "brick_curbing",
    name: "Brick Curbing",
    prompt:
      "Add professional decorative concrete curbing around existing garden beds with brick texture. Install continuous poured concrete edging that is textured and colored to mimic traditional brick appearance, creating a single-level border (approximately 4-6 inches high) between lawn and landscape beds. The concrete curbing should have a brick-like finish with red clay coloring and texture molded into the surface, appearing as one continuous piece. Keep all existing plants, trees, bushes, and landscape features exactly where they are.",
    referenceImageUrl: "https://mycdn.com/brick-curbing.jpg",
    category: "curbing",
    regionType: "border",
  },

  // Landscaping
  fresh_mulch: {
    id: "fresh_mulch",
    name: "Fresh Mulch",
    prompt:
      "Replace existing mulch in landscape beds with fresh, dark brown organic mulch. Rich, chocolate-colored wood mulch spread evenly in all existing planted areas, creating clean garden appearance. Only replace mulch in existing beds - preserve the exact bed shapes, all plants, trees, house structure, and lawn areas unchanged.",
    referenceImageUrl: "https://mycdn.com/mulch-beds.jpg",
    category: "landscape",
    regionType: "garden",
  },
  river_rock: {
    id: "river_rock",
    name: "River Rock",
    prompt:
      "Replace existing mulch with beautiful river rock in landscape beds. Smooth, rounded river stones in natural gray and tan colors, professionally installed in existing planted areas. Only replace ground cover in existing beds - maintain all plants, bed borders, house features, and lawn areas exactly as they are.",
    referenceImageUrl: "https://mycdn.com/river-rock.jpg",
    category: "landscape",
    regionType: "garden",
  },
  new_grass: {
    id: "new_grass",
    name: "New Grass",
    prompt:
      "Install fresh, lush green sod or seed to create beautiful new grass areas where appropriate. Add vibrant, healthy grass to enhance the existing lawn areas or create new grassy sections that complement the landscape design. The new grass should appear thick, green, and professionally maintained. Only add grass in logical areas while preserving all existing plants, trees, bed borders, house structure, and hardscaping unchanged. Get rid of any weeds or other excess plants that shouldn't be there for the new grass.",
    referenceImageUrl: "https://mycdn.com/new-grass.jpg",
    category: "landscape",
    regionType: "garden",
  },

  // Concrete Patios
  stamped_concrete_patio: {
    id: "stamped_concrete_patio",
    name: "Stamped Concrete Patio",
    prompt:
      "Add a beautiful stamped concrete patio in an appropriate area of the yard. Decorative stamped concrete with stone or brick pattern, neutral earth-tone color, and professional finish. Position the patio in a logical outdoor living space while preserving all house features, existing landscaping, trees, and overall yard layout unchanged.",
    referenceImageUrl: "https://mycdn.com/stamped-concrete-patio.jpg",
    category: "patios",
    regionType: "outdoor",
  },
  plain_concrete_patio: {
    id: "plain_concrete_patio",
    name: "Plain Concrete Patio",
    prompt:
      "Add a clean, simple concrete patio in an appropriate area of the yard. Smooth finished concrete in light gray color with expansion joints, creating functional outdoor space. Position appropriately for outdoor living while maintaining all existing house structure, landscaping, trees, and yard features exactly as they are.",
    referenceImageUrl: "https://mycdn.com/plain-concrete-patio.jpg",
    category: "patios",
    regionType: "outdoor",
  },
  exposed_aggregate_patio: {
    id: "exposed_aggregate_patio",
    name: "Exposed Aggregate Patio",
    prompt:
      "Add an attractive exposed aggregate concrete patio in an appropriate area of the yard. Textured concrete surface with decorative stone aggregate exposed, creating slip-resistant and visually appealing outdoor space. Position thoughtfully while preserving all house features, existing landscaping, and yard layout unchanged.",
    referenceImageUrl: "https://mycdn.com/exposed-aggregate-patio.jpg",
    category: "patios",
    regionType: "outdoor",
  },
  colored_concrete_patio: {
    id: "colored_concrete_patio",
    name: "Colored Concrete Patio",
    prompt:
      "Add a beautiful colored concrete patio in an appropriate area of the yard. Integrally colored concrete in warm earth tone (tan, terracotta, or gray), professionally finished for outdoor entertaining. Position the patio logically while maintaining all existing house structure, landscaping, trees, and overall property layout exactly unchanged.",
    referenceImageUrl: "https://mycdn.com/colored-concrete-patio.jpg",
    category: "patios",
    regionType: "outdoor",
  },

  // Curved Patio Options
  curved_concrete_patio_small: {
    id: "curved_concrete_patio_small",
    name: "Small Curved Concrete Patio",
    prompt:
      "Add a small curved concrete patio (approximately 10x10 feet) in an appropriate area of the yard. Smooth curved concrete with flowing organic edges, professionally finished in light gray. Design with gentle curves that complement the natural landscape while maintaining all existing house structure, landscaping, trees, and yard features exactly as they are.",
    referenceImageUrl: "https://mycdn.com/curved-concrete-patio-small.jpg",
    category: "patios",
    regionType: "outdoor",
  },
  curved_concrete_patio_medium: {
    id: "curved_concrete_patio_medium",
    name: "Medium Curved Concrete Patio",
    prompt:
      "Add a medium curved concrete patio (approximately 15x15 feet) in an appropriate area of the yard. Smooth curved concrete with flowing organic edges, professionally finished in light gray. Design with gentle curves that create elegant outdoor living space while preserving all existing house structure, landscaping, trees, and yard layout unchanged.",
    referenceImageUrl: "https://mycdn.com/curved-concrete-patio-medium.jpg",
    category: "patios",
    regionType: "outdoor",
  },
  curved_concrete_patio_large: {
    id: "curved_concrete_patio_large",
    name: "Large Curved Concrete Patio",
    prompt:
      "Add a large curved concrete patio (approximately 20x20 feet) in an appropriate area of the yard. Smooth curved concrete with flowing organic edges, professionally finished in light gray. Design with sweeping curves that create spacious outdoor entertaining area while maintaining all existing house structure, landscaping, trees, and overall property layout exactly unchanged.",
    referenceImageUrl: "https://mycdn.com/curved-concrete-patio-large.jpg",
    category: "patios",
    regionType: "outdoor",
  },

  // Straight/Rectangular Patio Options
  rectangular_concrete_patio_small: {
    id: "rectangular_concrete_patio_small",
    name: "Small Rectangular Concrete Patio",
    prompt:
      "Add a small rectangular concrete patio (approximately 10x12 feet) in an appropriate area of the yard. Clean straight edges with smooth finished concrete in light gray, professionally installed with expansion joints. Position logically for outdoor seating while preserving all existing house structure, landscaping, trees, and yard features exactly as they are.",
    referenceImageUrl: "https://mycdn.com/rectangular-concrete-patio-small.jpg",
    category: "patios",
    regionType: "outdoor",
  },
  rectangular_concrete_patio_medium: {
    id: "rectangular_concrete_patio_medium",
    name: "Medium Rectangular Concrete Patio",
    prompt:
      "Add a medium rectangular concrete patio (approximately 15x18 feet) in an appropriate area of the yard. Clean straight edges with smooth finished concrete in light gray, professionally installed with expansion joints. Position thoughtfully for outdoor dining and entertaining while maintaining all existing house structure, landscaping, trees, and yard layout unchanged.",
    referenceImageUrl:
      "https://mycdn.com/rectangular-concrete-patio-medium.jpg",
    category: "patios",
    regionType: "outdoor",
  },
  rectangular_concrete_patio_large: {
    id: "rectangular_concrete_patio_large",
    name: "Large Rectangular Concrete Patio",
    prompt:
      "Add a large rectangular concrete patio (approximately 20x24 feet) in an appropriate area of the yard. Clean straight edges with smooth finished concrete in light gray, professionally installed with expansion joints. Position strategically for spacious outdoor entertaining and gatherings while preserving all existing house structure, landscaping, trees, and overall property layout exactly unchanged.",
    referenceImageUrl: "https://mycdn.com/rectangular-concrete-patio-large.jpg",
    category: "patios",
    regionType: "outdoor",
  },

  // Specialty Patio Shapes
  circular_concrete_patio: {
    id: "circular_concrete_patio",
    name: "Circular Concrete Patio",
    prompt:
      "Add a circular concrete patio (approximately 16 feet diameter) in an appropriate area of the yard. Perfect round shape with smooth finished concrete in light gray, professionally installed as a unique focal point. Position thoughtfully to create intimate outdoor space while maintaining all existing house structure, landscaping, trees, and yard features exactly as they are.",
    referenceImageUrl: "https://mycdn.com/circular-concrete-patio.jpg",
    category: "patios",
    regionType: "outdoor",
  },
  l_shaped_concrete_patio: {
    id: "l_shaped_concrete_patio",
    name: "L-Shaped Concrete Patio",
    prompt:
      "Add an L-shaped concrete patio in an appropriate area of the yard. Modern L-shaped design with clean edges and smooth finished concrete in light gray, professionally installed to maximize corner space utilization. Position strategically to work with existing landscape features while preserving all house structure, landscaping, trees, and overall yard layout exactly unchanged.",
    referenceImageUrl: "https://mycdn.com/l-shaped-concrete-patio.jpg",
    category: "patios",
    regionType: "outdoor",
  },
};

export function getAllLandscapeStyles(): LandscapeStyleConfig[] {
  return Object.values(LANDSCAPE_STYLE_CONFIG);
}

export function getLandscapeStylesByCategory(
  category: LandscapeStyleConfig["category"],
): LandscapeStyleConfig[] {
  return Object.values(LANDSCAPE_STYLE_CONFIG).filter(
    (style) => style.category === category,
  );
}

export function getLandscapeStyleConfig(
  id: string,
): LandscapeStyleConfig | undefined {
  return LANDSCAPE_STYLE_CONFIG[id];
}
