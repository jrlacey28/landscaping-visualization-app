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
  natural_stone_curbing: {
    id: "natural_stone_curbing",
    name: "Natural Stone Curbing",
    prompt:
      "Add continuous poured decorative concrete curbing around the existing garden beds, following the current bed outline. Use a slant/mower profile, 4 inches wide × 3 inches tall: the bed side is the tall, near-vertical back, and the top slopes down toward the lawn with a smooth rounded front lip sitting just above the grass. The curb must be one seamless, monolithic strip of cast-in-place concrete, not modular units. Apply a stamped stone surface texture (texture only—still clearly concrete) in subtle gray/tan tones. Optional shallow control joints may appear every few feet but the curb still reads as one piece. Keep all plants, rock, mulch, grass, walkway, and lighting unchanged. Do not generate bricks, blocks, pavers, segmented edging, stacked stone, boulder borders, retaining walls, or loose rocks; do not alter lawn shape or bed layout; no tall walls.",
    referenceImageUrl: "../attached_assets/Untitled design - 2025-08-31T143852.517_1757033241182.png",
    referenceImages: [
      "../attached_assets/Untitled design - 2025-08-31T143852.517_1757033241182.png",
      "../attached_assets/Untitled design - 2025-08-31T143852.517_1757033992300.png"
    ],
    category: "curbing",
    regionType: "border",
  },
  concrete_curbing: {
    id: "concrete_curbing",
    name: "Concrete Curbing",
    prompt:
      "Add professional decorative concrete curbing around existing garden beds. Install continuous poured concrete edging that creates a single-level border (approximately 4-6 inches high) between lawn and landscape beds. The concrete curbing should be one continuous piece with smooth light gray finish, professionally formed to create clean garden definition. Keep all existing plants, trees, bushes, and landscape features exactly where they are.",
    referenceImageUrl: "https://mycdn.com/concrete-curbing.jpg",
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
  metal_curbing: {
    id: "metal_curbing",
    name: "Metal Curbing",
    prompt:
      "Add sleek metal curbing around existing landscape beds and garden areas. Modern steel or aluminum edging with clean lines and contemporary appearance, professionally installed for crisp garden definition. Only add metal curbing around existing planted areas while keeping all other elements unchanged.",
    referenceImageUrl: "https://mycdn.com/metal-curbing.jpg",
    category: "curbing",
    regionType: "border",
  },

  // Landscape Materials
  mulch_beds: {
    id: "mulch_beds",
    name: "Fresh Mulch Beds",
    prompt:
      "Replace existing mulch in landscape beds with fresh, dark brown organic mulch. Rich, chocolate-colored wood mulch spread evenly in all existing planted areas, creating clean garden appearance. Only replace mulch in existing beds - preserve the exact bed shapes, all plants, trees, house structure, and lawn areas unchanged.",
    referenceImageUrl: "https://mycdn.com/mulch-beds.jpg",
    category: "landscape",
    regionType: "garden",
  },
  river_rock: {
    id: "river_rock",
    name: "River Rock Landscaping",
    prompt:
      "Replace existing mulch with beautiful river rock in landscape beds. Smooth, rounded river stones in natural gray and tan colors, professionally installed in existing planted areas. Only replace ground cover in existing beds - maintain all plants, bed borders, house features, and lawn areas exactly as they are.",
    referenceImageUrl: "https://mycdn.com/river-rock.jpg",
    category: "landscape",
    regionType: "garden",
  },
  decorative_gravel: {
    id: "decorative_gravel",
    name: "Decorative Gravel",
    prompt:
      "Replace existing mulch with decorative crushed gravel in landscape beds. Beautiful crushed stone in neutral earth tones, creating low-maintenance ground cover in existing planted areas. Only replace mulch in existing beds while preserving all plants, bed shapes, house structure, and surrounding landscape unchanged.",
    referenceImageUrl: "https://mycdn.com/decorative-gravel.jpg",
    category: "landscape",
    regionType: "garden",
  },
  pine_straw: {
    id: "pine_straw",
    name: "Pine Straw Mulch",
    prompt:
      "Replace existing mulch with natural pine straw in landscape beds. Golden-brown pine needle mulch laid evenly in all existing planted areas, creating natural Southern-style landscaping. Only replace ground cover in existing beds - keep all plants, bed borders, house features, and lawn areas exactly unchanged.",
    referenceImageUrl: "https://mycdn.com/pine-straw.jpg",
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
