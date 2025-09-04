export interface PoolStyleConfig {
  id: string;
  name: string;
  prompt: string;
  referenceImageUrl: string;
  referenceImages?: string[]; 
  category: "poolType" | "poolSize" | "decking" | "landscaping" | "features";
  regionType: "pool" | "poolArea" | "landscape" | "outdoor";
}

export const POOL_STYLE_CONFIG: Record<string, PoolStyleConfig> = {
  // Pool Types
  rectangular_pool: {
    id: "rectangular_pool",
    name: "Rectangular Pool",
    prompt: "Add a beautiful rectangular swimming pool to this backyard. Modern rectangular pool with clean lines, crystal blue water, and professional concrete pool deck. The pool should be proportionally sized for the yard, maintaining all existing landscaping, trees, house structure, and surrounding elements exactly as they are.",
    referenceImageUrl: "https://mycdn.com/rectangular-pool.jpg",
    category: "poolType",
    regionType: "pool",
  },
  kidney_shaped_pool: {
    id: "kidney_shaped_pool",
    name: "Kidney-Shaped Pool",
    prompt: "Add an elegant kidney-shaped swimming pool to this backyard. Curved kidney-style pool with natural flowing lines, sparkling blue water, and matching curved pool decking. Size appropriately for the space while preserving all existing home features, landscaping, and yard elements unchanged.",
    referenceImageUrl: "https://mycdn.com/kidney-pool.jpg",
    category: "poolType",
    regionType: "pool",
  },
  oval_pool: {
    id: "oval_pool",
    name: "Oval Pool",
    prompt: "Add a classic oval swimming pool to this backyard. Smooth oval-shaped pool with gentle curves, clear blue water, and complementary oval pool deck. Position appropriately in the yard while maintaining all existing house structure, trees, landscaping, and surroundings exactly as shown.",
    referenceImageUrl: "https://mycdn.com/oval-pool.jpg",
    category: "poolType",
    regionType: "pool",
  },
  freeform_pool: {
    id: "freeform_pool",
    name: "Freeform Pool",
    prompt: "Add a natural freeform swimming pool to this backyard. Organic curved pool design with natural stone-like edges, beautiful blue water, and naturalistic pool decking. Integrate harmoniously with the landscape while keeping all existing home features and yard elements unchanged.",
    referenceImageUrl: "https://mycdn.com/freeform-pool.jpg",
    category: "poolType",
    regionType: "pool",
  },

  // Pool Sizes
  small_pool: {
    id: "small_pool",
    name: "Small Pool (12x24 ft)",
    prompt: "Add a small swimming pool (approximately 12x24 feet) perfect for this backyard space. Compact pool with crystal clear water and proportional pool deck, sized appropriately for smaller yards while maintaining all existing landscaping, house structure, and surroundings exactly as they are.",
    referenceImageUrl: "https://mycdn.com/small-pool.jpg",
    category: "poolSize",
    regionType: "pool",
  },
  medium_pool: {
    id: "medium_pool",
    name: "Medium Pool (16x32 ft)",
    prompt: "Add a medium-sized swimming pool (approximately 16x32 feet) to this backyard. Well-proportioned pool with beautiful blue water and spacious pool deck, perfect for families while preserving all existing home features, trees, and landscape elements unchanged.",
    referenceImageUrl: "https://mycdn.com/medium-pool.jpg",
    category: "poolSize",
    regionType: "pool",
  },
  large_pool: {
    id: "large_pool",
    name: "Large Pool (20x40 ft)",
    prompt: "Add a large swimming pool (approximately 20x40 feet) to this spacious backyard. Impressive pool with sparkling blue water and expansive pool deck area, perfect for entertaining while maintaining all existing house structure, landscaping, and yard features exactly as shown.",
    referenceImageUrl: "https://mycdn.com/large-pool.jpg",
    category: "poolSize",
    regionType: "pool",
  },

  // Decking Options
  concrete_pool_deck: {
    id: "concrete_pool_deck",
    name: "Concrete Pool Deck",
    prompt: "Add professional concrete pool decking around the swimming pool. Clean concrete pool deck with smooth finish, appropriate expansion joints, and proper drainage. Light gray concrete color that complements the pool while keeping all house structure, landscaping, and surroundings exactly unchanged.",
    referenceImageUrl: "https://mycdn.com/concrete-deck.jpg",
    category: "decking",
    regionType: "poolArea",
  },
  travertine_pool_deck: {
    id: "travertine_pool_deck",
    name: "Travertine Pool Deck",
    prompt: "Add elegant travertine stone pool decking around the swimming pool. Natural travertine pavers in warm cream tones with tumbled edges and professional installation. Non-slip surface perfect for pool areas while preserving all existing home features and landscaping exactly as they are.",
    referenceImageUrl: "https://mycdn.com/travertine-deck.jpg",
    category: "decking",
    regionType: "poolArea",
  },
  brick_pool_deck: {
    id: "brick_pool_deck",
    name: "Brick Pool Deck",
    prompt: "Add classic brick pool decking around the swimming pool. Traditional red brick pavers with herringbone or running bond pattern, sealed for durability and slip resistance. Timeless design that complements the pool while maintaining all house structure and landscape elements unchanged.",
    referenceImageUrl: "https://mycdn.com/brick-deck.jpg",
    category: "decking",
    regionType: "poolArea",
  },

  // Landscaping Options
  tropical_pool_landscaping: {
    id: "tropical_pool_landscaping",
    name: "Tropical Pool Landscaping",
    prompt: "Add tropical landscaping around the pool area. Palm trees, tropical plants, colorful flowering shrubs, and lush greenery creating a resort-like atmosphere around the pool. Maintain the existing house structure and all non-pool related landscaping exactly as shown.",
    referenceImageUrl: "https://mycdn.com/tropical-landscape.jpg",
    category: "landscaping",
    regionType: "landscape",
  },
  modern_pool_landscaping: {
    id: "modern_pool_landscaping",
    name: "Modern Pool Landscaping",
    prompt: "Add contemporary modern landscaping around the pool area. Clean lines with ornamental grasses, structured plantings, modern outdoor furniture, and minimalist design elements. Keep all existing house features and non-pool landscaping exactly unchanged.",
    referenceImageUrl: "https://mycdn.com/modern-landscape.jpg",
    category: "landscaping",
    regionType: "landscape",
  },
  natural_pool_landscaping: {
    id: "natural_pool_landscaping",
    name: "Natural Pool Landscaping",
    prompt: "Add natural landscaping around the pool area. Native plants, natural stone elements, flowing garden beds, and organic design that blends seamlessly with the surrounding landscape. Preserve all existing house structure and established landscaping exactly as they are.",
    referenceImageUrl: "https://mycdn.com/natural-landscape.jpg",
    category: "landscaping",
    regionType: "landscape",
  },

  // Pool Features
  pool_with_spa: {
    id: "pool_with_spa",
    name: "Pool with Attached Spa",
    prompt: "Add a swimming pool with attached spa/hot tub. Beautiful pool and spa combination with elevated spa section, spillover feature into the main pool, and coordinated pool deck. Both should have crystal clear water while maintaining all existing house structure and landscaping unchanged.",
    referenceImageUrl: "https://mycdn.com/pool-spa.jpg",
    category: "features",
    regionType: "pool",
  },
  pool_with_waterfall: {
    id: "pool_with_waterfall",
    name: "Pool with Waterfall Feature",
    prompt: "Add a swimming pool with elegant waterfall feature. Beautiful pool with natural stone waterfall or modern water feature flowing into the pool, creating movement and sound. Keep all house structure, existing landscaping, and yard elements exactly as they are.",
    referenceImageUrl: "https://mycdn.com/pool-waterfall.jpg",
    category: "features",
    regionType: "pool",
  },
  pool_with_lighting: {
    id: "pool_with_lighting",
    name: "Pool with LED Lighting",
    prompt: "Add a swimming pool with beautiful LED pool lighting. Pool with underwater LED lights creating an elegant evening ambiance, plus coordinated deck lighting around the pool area. Show the pool with lights creating a beautiful glow while preserving all existing home and landscape features unchanged.",
    referenceImageUrl: "https://mycdn.com/pool-lighting.jpg",
    category: "features",
    regionType: "poolArea",
  },
};

export const POOL_REGION_STYLE_MAPPING = {
  pool: [
    "rectangular_pool",
    "kidney_shaped_pool", 
    "oval_pool",
    "freeform_pool",
  ] as const,
  poolSize: [
    "small_pool",
    "medium_pool",
    "large_pool",
  ] as const,
  poolArea: [
    "concrete_pool_deck",
    "travertine_pool_deck",
    "brick_pool_deck",
  ] as const,
  landscape: [
    "tropical_pool_landscaping",
    "modern_pool_landscaping", 
    "natural_pool_landscaping",
  ] as const,
  outdoor: [
    "pool_with_spa",
    "pool_with_waterfall",
    "pool_with_lighting",
  ] as const,
};

export function getPoolStyleForRegion(
  regionType: keyof typeof POOL_REGION_STYLE_MAPPING,
  preferredStyleId?: string,
): PoolStyleConfig {
  const availableStyles = POOL_REGION_STYLE_MAPPING[regionType];

  // Check if preferred style is available for this region
  if (preferredStyleId) {
    for (const styleId of availableStyles) {
      if (styleId === preferredStyleId) {
        return POOL_STYLE_CONFIG[preferredStyleId];
      }
    }
  }

  // Default selections for each region type
  if (availableStyles.length > 0) {
    const defaultStyle = availableStyles[0] as string;
    return POOL_STYLE_CONFIG[defaultStyle];
  }

  // Fallback to first available style
  return Object.values(POOL_STYLE_CONFIG)[0];
}

export function getAllPoolStyles(): PoolStyleConfig[] {
  return Object.values(POOL_STYLE_CONFIG);
}

export function getPoolStylesByCategory(
  category: PoolStyleConfig["category"],
): PoolStyleConfig[] {
  return Object.values(POOL_STYLE_CONFIG).filter(
    (style) => style.category === category,
  );
}