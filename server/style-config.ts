export interface StyleConfig {
  id: string;
  name: string;
  prompt: string;
  referenceImageUrl: string;
  category: 'curbing' | 'mulch' | 'patio' | 'gravel' | 'grass';
  regionType: 'edge' | 'central' | 'hardscape' | 'lawn';
}

export const STYLE_CONFIG: Record<string, StyleConfig> = {
  natural_stone_curbing: {
    id: 'natural_stone_curbing',
    name: 'Natural Stone Curbing',
    prompt: 'Replace with professional natural stone landscape edging and curbing. Clean, stacked stone border with natural gray and beige tones. Crisp edge definition between lawn and landscape beds.',
    referenceImageUrl: 'https://mycdn.com/natural-stone-curbing.jpg',
    category: 'curbing',
    regionType: 'edge'
  },
  brown_mulch: {
    id: 'brown_mulch',
    name: 'Brown Colored Mulch',
    prompt: 'Replace with fresh, rich brown colored mulch. Deep chocolate brown organic mulch covering landscape beds. Clean, even coverage with natural texture and depth.',
    referenceImageUrl: 'https://mycdn.com/brown-mulch.jpg',
    category: 'mulch',
    regionType: 'central'
  },
  concrete_patio: {
    id: 'concrete_patio',
    name: 'Stamped Concrete Patio',
    prompt: 'Replace with professional stamped concrete patio. Clean, modern concrete surface with subtle pattern and neutral gray tones. Smooth finish with defined edges.',
    referenceImageUrl: 'https://mycdn.com/concrete-patio.jpg',
    category: 'patio',
    regionType: 'hardscape'
  },
  river_rock: {
    id: 'river_rock',
    name: 'River Rock Landscaping',
    prompt: 'Replace with natural river rock landscaping. Smooth, rounded stones in mixed earth tones. Clean drainage and low-maintenance ground cover.',
    referenceImageUrl: 'https://mycdn.com/river-rock.jpg',
    category: 'gravel',
    regionType: 'central'
  },
  red_mulch: {
    id: 'red_mulch',
    name: 'Red Cedar Mulch',
    prompt: 'Replace with vibrant red cedar mulch. Rich reddish-brown organic mulch with natural wood texture. Fresh appearance with good coverage depth.',
    referenceImageUrl: 'https://mycdn.com/red-mulch.jpg',
    category: 'mulch',
    regionType: 'central'
  },
  brick_curbing: {
    id: 'brick_curbing',
    name: 'Brick Landscape Edging',
    prompt: 'Replace with classic brick landscape edging. Traditional red brick border with clean mortar lines. Professional installation with straight edges.',
    referenceImageUrl: 'https://mycdn.com/brick-curbing.jpg',
    category: 'curbing',
    regionType: 'edge'
  }
};

export const REGION_STYLE_MAPPING = {
  edge: ['natural_stone_curbing', 'brick_curbing'] as const,
  central: ['brown_mulch', 'red_mulch', 'river_rock'] as const,
  hardscape: ['concrete_patio'] as const,
  lawn: [] as const // Grass/lawn typically wouldn't be replaced
};

export function getStyleForRegion(regionType: keyof typeof REGION_STYLE_MAPPING, preferredStyleId?: string): StyleConfig {
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

export function getStylesByCategory(category: StyleConfig['category']): StyleConfig[] {
  return Object.values(STYLE_CONFIG).filter(style => style.category === category);
}