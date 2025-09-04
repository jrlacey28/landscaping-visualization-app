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
    prompt: "Add natural stone curbing around existing landscape beds and garden areas. Beautiful natural stone edging with irregular shapes and earth-tone colors, professionally installed to define bed borders. Only add curbing around existing planted areas - do not change the house, lawn, trees, or overall landscape design.",
    referenceImageUrl: "https://mycdn.com/natural-stone-curbing.jpg",
    category: "curbing",
    regionType: "border",
  },
  concrete_curbing: {
    id: "concrete_curbing", 
    name: "Concrete Curbing",
    prompt: "Add decorative concrete curbing around existing landscape beds and garden areas. Clean, continuous concrete border with smooth finish in neutral gray color, professionally poured to create defined garden edges. Only add curbing around existing planted areas while preserving all house features and landscaping unchanged.",
    referenceImageUrl: "https://mycdn.com/concrete-curbing.jpg",
    category: "curbing",
    regionType: "border",
  },
  brick_curbing: {
    id: "brick_curbing",
    name: "Brick Curbing", 
    prompt: "Add classic brick curbing around existing landscape beds and garden areas. Traditional red clay brick edging laid in a soldier course pattern, creating timeless garden borders. Only add brick curbing around existing planted areas - maintain all house structure, lawn, trees, and landscape features exactly as they are.",
    referenceImageUrl: "https://mycdn.com/brick-curbing.jpg",
    category: "curbing",
    regionType: "border",
  },
  metal_curbing: {
    id: "metal_curbing",
    name: "Metal Curbing",
    prompt: "Add sleek metal curbing around existing landscape beds and garden areas. Modern steel or aluminum edging with clean lines and contemporary appearance, professionally installed for crisp garden definition. Only add metal curbing around existing planted areas while keeping all other elements unchanged.",
    referenceImageUrl: "https://mycdn.com/metal-curbing.jpg", 
    category: "curbing",
    regionType: "border",
  },

  // Landscape Materials
  mulch_beds: {
    id: "mulch_beds",
    name: "Fresh Mulch Beds",
    prompt: "Replace existing mulch in landscape beds with fresh, dark brown organic mulch. Rich, chocolate-colored wood mulch spread evenly in all existing planted areas, creating clean garden appearance. Only replace mulch in existing beds - preserve the exact bed shapes, all plants, trees, house structure, and lawn areas unchanged.",
    referenceImageUrl: "https://mycdn.com/mulch-beds.jpg",
    category: "landscape", 
    regionType: "garden",
  },
  river_rock: {
    id: "river_rock",
    name: "River Rock Landscaping",
    prompt: "Replace existing mulch with beautiful river rock in landscape beds. Smooth, rounded river stones in natural gray and tan colors, professionally installed in existing planted areas. Only replace ground cover in existing beds - maintain all plants, bed borders, house features, and lawn areas exactly as they are.",
    referenceImageUrl: "https://mycdn.com/river-rock.jpg",
    category: "landscape",
    regionType: "garden", 
  },
  decorative_gravel: {
    id: "decorative_gravel",
    name: "Decorative Gravel",
    prompt: "Replace existing mulch with decorative crushed gravel in landscape beds. Beautiful crushed stone in neutral earth tones, creating low-maintenance ground cover in existing planted areas. Only replace mulch in existing beds while preserving all plants, bed shapes, house structure, and surrounding landscape unchanged.",
    referenceImageUrl: "https://mycdn.com/decorative-gravel.jpg", 
    category: "landscape",
    regionType: "garden",
  },
  pine_straw: {
    id: "pine_straw",
    name: "Pine Straw Mulch",
    prompt: "Replace existing mulch with natural pine straw in landscape beds. Golden-brown pine needle mulch laid evenly in all existing planted areas, creating natural Southern-style landscaping. Only replace ground cover in existing beds - keep all plants, bed borders, house features, and lawn areas exactly unchanged.",
    referenceImageUrl: "https://mycdn.com/pine-straw.jpg",
    category: "landscape", 
    regionType: "garden",
  },

  // Concrete Patios
  stamped_concrete_patio: {
    id: "stamped_concrete_patio",
    name: "Stamped Concrete Patio",
    prompt: "Add a beautiful stamped concrete patio in an appropriate area of the yard. Decorative stamped concrete with stone or brick pattern, neutral earth-tone color, and professional finish. Position the patio in a logical outdoor living space while preserving all house features, existing landscaping, trees, and overall yard layout unchanged.",
    referenceImageUrl: "https://mycdn.com/stamped-concrete-patio.jpg",
    category: "patios",
    regionType: "outdoor",
  },
  plain_concrete_patio: {
    id: "plain_concrete_patio", 
    name: "Plain Concrete Patio",
    prompt: "Add a clean, simple concrete patio in an appropriate area of the yard. Smooth finished concrete in light gray color with expansion joints, creating functional outdoor space. Position appropriately for outdoor living while maintaining all existing house structure, landscaping, trees, and yard features exactly as they are.",
    referenceImageUrl: "https://mycdn.com/plain-concrete-patio.jpg",
    category: "patios",
    regionType: "outdoor",
  },
  exposed_aggregate_patio: {
    id: "exposed_aggregate_patio",
    name: "Exposed Aggregate Patio", 
    prompt: "Add an attractive exposed aggregate concrete patio in an appropriate area of the yard. Textured concrete surface with decorative stone aggregate exposed, creating slip-resistant and visually appealing outdoor space. Position thoughtfully while preserving all house features, existing landscaping, and yard layout unchanged.",
    referenceImageUrl: "https://mycdn.com/exposed-aggregate-patio.jpg",
    category: "patios", 
    regionType: "outdoor",
  },
  colored_concrete_patio: {
    id: "colored_concrete_patio",
    name: "Colored Concrete Patio",
    prompt: "Add a beautiful colored concrete patio in an appropriate area of the yard. Integrally colored concrete in warm earth tone (tan, terracotta, or gray), professionally finished for outdoor entertaining. Position the patio logically while maintaining all existing house structure, landscaping, trees, and overall property layout exactly unchanged.",
    referenceImageUrl: "https://mycdn.com/colored-concrete-patio.jpg",
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

export function getLandscapeStyleConfig(id: string): LandscapeStyleConfig | undefined {
  return LANDSCAPE_STYLE_CONFIG[id];
}