export type EmbedDefaultOptionKey =
  | "roofing.roofStyles"
  | "roofing.roofColors"
  | "roofing.sidingStyles"
  | "roofing.sidingColors"
  | "roofing.windowStyles"
  | "roofing.windowColors"
  | "roofing.surpriseMe"
  | "landscape.curbing"
  | "landscape.curbingColors"
  | "landscape.landscape"
  | "landscape.mulchColors"
  | "landscape.patios"
  | "landscape.patioShapes"
  | "landscape.patioSizes"
  | "pools.poolType"
  | "pools.poolSize"
  | "pools.decking"
  | "pools.landscaping"
  | "pools.features"
  | "pools.hotTub"
  | "pools.sauna"
  | "interior.painting"
  | "interior.kitchen"
  | "interior.bathroom"
  | "interior.livingRoom";

export type EmbedDefaultOptionVisibility = Record<EmbedDefaultOptionKey, boolean>;

export const EMBED_DEFAULT_OPTION_GROUPS: Array<{
  label: string;
  items: Array<{ key: EmbedDefaultOptionKey; label: string; description: string }>;
}> = [
  {
    label: "Roofing & Siding",
    items: [
      { key: "roofing.roofStyles", label: "Original roof categories", description: "Asphalt, steel roof, and steel shingle choices." },
      { key: "roofing.roofColors", label: "Original roof colors", description: "Built-in roof color swatches." },
      { key: "roofing.sidingStyles", label: "Original siding categories", description: "Vinyl, fiber cement, wood, and brick choices." },
      { key: "roofing.sidingColors", label: "Original siding colors", description: "Built-in siding color swatches." },
      { key: "roofing.windowStyles", label: "Original window categories", description: "Built-in window frame and grid designs." },
      { key: "roofing.windowColors", label: "Original window colors", description: "Built-in black, white, and bronze window colors." },
      { key: "roofing.surpriseMe", label: "Original surprise me category", description: "The default AI-picked roof and siding option." },
    ],
  },
  {
    label: "Landscape",
    items: [
      { key: "landscape.curbing", label: "Original curbing category", description: "Built-in curbing choices." },
      { key: "landscape.curbingColors", label: "Original curbing colors", description: "Built-in natural stone curbing colors." },
      { key: "landscape.landscape", label: "Original landscape category", description: "Built-in mulch, rock, and grass choices." },
      { key: "landscape.mulchColors", label: "Original mulch colors", description: "Built-in mulch color choices." },
      { key: "landscape.patios", label: "Original patio category", description: "Built-in patio style choices." },
      { key: "landscape.patioShapes", label: "Original patio shapes", description: "Built-in patio shape choices." },
      { key: "landscape.patioSizes", label: "Original patio sizes", description: "Built-in patio size choices." },
    ],
  },
  {
    label: "Pools",
    items: [
      { key: "pools.poolType", label: "Original pool types", description: "Built-in pool shape choices." },
      { key: "pools.poolSize", label: "Original pool sizes", description: "Built-in pool size choices." },
      { key: "pools.decking", label: "Original decking category", description: "Built-in pool deck choices." },
      { key: "pools.landscaping", label: "Original landscaping category", description: "Built-in pool landscaping choices." },
      { key: "pools.features", label: "Original features category", description: "Built-in pool feature choices." },
      { key: "pools.hotTub", label: "Original hot tub category", description: "Built-in hot tub choices." },
      { key: "pools.sauna", label: "Original sauna category", description: "Built-in sauna choices." },
    ],
  },
  {
    label: "Interior",
    items: [
      { key: "interior.painting", label: "Original painting categories", description: "Built-in painting color groups." },
      { key: "interior.kitchen", label: "Original kitchen categories", description: "Built-in cabinet, counter, fixture, and backsplash groups." },
      { key: "interior.bathroom", label: "Original bathroom category", description: "Built-in bathroom remodel choices." },
      { key: "interior.livingRoom", label: "Original living room categories", description: "Built-in furniture, decor, and lighting groups." },
    ],
  },
];

export const DEFAULT_EMBED_DEFAULT_OPTION_VISIBILITY: EmbedDefaultOptionVisibility =
  EMBED_DEFAULT_OPTION_GROUPS.flatMap((group) => group.items).reduce((visibility, item) => {
    visibility[item.key] = true;
    return visibility;
  }, {} as EmbedDefaultOptionVisibility);

export function normalizeEmbedDefaultOptionVisibility(value: unknown): EmbedDefaultOptionVisibility {
  const source =
    value && typeof value === "object"
      ? value as Partial<Record<EmbedDefaultOptionKey | "roofing.windows", unknown>>
      : {};

  return Object.keys(DEFAULT_EMBED_DEFAULT_OPTION_VISIBILITY).reduce((visibility, key) => {
    const optionKey = key as EmbedDefaultOptionKey;
    const legacyWindowVisibility = source["roofing.windows"];
    visibility[optionKey] =
      (optionKey === "roofing.windowStyles" || optionKey === "roofing.windowColors") &&
      source[optionKey] === undefined
        ? legacyWindowVisibility !== false
        : source[optionKey] !== false;
    return visibility;
  }, {} as EmbedDefaultOptionVisibility);
}

export function isDefaultEmbedOptionVisible(
  value: unknown,
  key: EmbedDefaultOptionKey,
) {
  return normalizeEmbedDefaultOptionVisibility(value)[key] !== false;
}
