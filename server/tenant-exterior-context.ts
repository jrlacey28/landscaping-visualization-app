import {
  ROOF_COLORS,
  SIDING_COLORS,
  splitExteriorStyleColorSelection,
} from "./style-config";

type ExteriorCategory = "roof" | "siding" | "windows";

export type TenantReferenceImage = {
  url: string;
  role: string;
  category: ExteriorCategory | "color";
  label: string;
  source: string;
};

type TenantExteriorSelectedStyles = {
  roof?: string;
  siding?: string;
  windows?: string;
};

type ResolvedTenantOption = {
  category: ExteriorCategory;
  selectedStyle: string;
  styleValue: string;
  colorValue: string;
  label: string;
  prompt: string;
  referenceImages: TenantReferenceImage[];
};

type ResolvedTenantColor = {
  category: "roof" | "siding";
  selectedColor: string;
  label: string;
  hex: string;
  prompt: string;
  referenceImages: TenantReferenceImage[];
  builtIn?: boolean;
};

export type TenantExteriorCustomContext = {
  prompt: string;
  referenceImages: TenantReferenceImage[];
  referenceImageUrls: string[];
  debug: {
    selectedCategory: string;
    selectedSidingStyleId: string;
    selectedColorId: string;
    resolvedSidingStyleName: string;
    resolvedSidingStylePrompt: string;
    resolvedSidingColorName: string;
    resolvedSidingColorHex: string;
    resolvedSidingColorPrompt: string;
    referenceImagesCount: number;
    referenceImages: TenantReferenceImage[];
  };
};

function normalizeTenantToken(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeTenantColorValue(color: any) {
  const hex = String(color?.hex || color?.color || "").replace("#", "");
  const label = String(color?.label || color?.name || color?.value || "custom").trim();
  return normalizeTenantToken(color?.value || `tenant_color_${normalizeTenantToken(label)}_${hex}`);
}

function normalizeTenantExteriorOptionValue(option: any, category: ExteriorCategory) {
  const label = String(option?.label || option?.name || option?.value || "option").trim();
  const rawValue = normalizeTenantToken(
    option?.value || `tenant_custom_exterior_${category}_${normalizeTenantToken(label)}`,
  );
  return rawValue.startsWith("tenant_custom_")
    ? rawValue
    : `tenant_custom_exterior_${category}_${rawValue}`;
}

function collectReferenceImageUrls(source: any) {
  const references = [
    ...(Array.isArray(source?.referenceImageUrls) ? source.referenceImageUrls : []),
    ...(Array.isArray(source?.referenceImages) ? source.referenceImages : []),
    source?.referenceImageUrl,
    source?.imageUrl,
  ];

  return references
    .map((url) => String(url || "").trim())
    .filter(Boolean)
    .slice(0, 8);
}

function getSelectedColorValue(styleId: string | undefined, knownStyleTypes: string[]) {
  if (!styleId) return "";
  const { styleValue, colorValue } = splitExteriorStyleColorSelection(styleId);

  if (colorValue) return colorValue;

  for (const styleType of knownStyleTypes) {
    if (styleValue.startsWith(`${styleType}_`)) {
      return styleValue.substring(styleType.length + 1);
    }
  }

  return "";
}

function isCustomExteriorStyleSelection(styleId: string | undefined) {
  if (!styleId) return false;
  return splitExteriorStyleColorSelection(styleId).styleValue.startsWith("tenant_custom_exterior_");
}

function buildReferenceImages(
  source: any,
  category: ExteriorCategory | "color",
  role: string,
  label: string,
) {
  return collectReferenceImageUrls(source).map((url) => ({
    url,
    role,
    category,
    label,
    source: `${category} option: ${label}`,
  }));
}

function resolveTenantExteriorOptions(
  customizations: any,
  selectedStyles: TenantExteriorSelectedStyles,
) {
  const customExteriorOptions: Array<{
    category: ExteriorCategory;
    selectedStyle?: string;
    options: any[];
  }> = [
    { category: "roof", selectedStyle: selectedStyles.roof, options: customizations?.exteriorOptions?.roof || [] },
    { category: "siding", selectedStyle: selectedStyles.siding, options: customizations?.exteriorOptions?.siding || [] },
    { category: "windows", selectedStyle: selectedStyles.windows, options: customizations?.exteriorOptions?.windows || [] },
  ];

  const resolvedOptions: ResolvedTenantOption[] = [];

  for (const { category, selectedStyle, options } of customExteriorOptions) {
    if (!selectedStyle || !Array.isArray(options)) continue;

    const { styleValue, colorValue } = splitExteriorStyleColorSelection(selectedStyle);
    const matchedOption = options.find(
      (option: any) =>
        normalizeTenantExteriorOptionValue(option, category) === normalizeTenantToken(styleValue),
    );

    if (!matchedOption) continue;

    const label = String(matchedOption.label || matchedOption.name || selectedStyle).trim();
    const prompt = String(matchedOption.prompt || matchedOption.instructions || "").trim();
    const role = category === "siding" ? "siding material reference" : `${category} material reference`;

    resolvedOptions.push({
      category,
      selectedStyle,
      styleValue,
      colorValue,
      label,
      prompt: prompt || `Apply the client-specific ${category} option "${label}" exactly as configured for this tenant.`,
      referenceImages: buildReferenceImages(matchedOption, category, role, label),
    });
  }

  return resolvedOptions;
}

function resolveTenantExteriorColors(
  customizations: any,
  selectedStyles: TenantExteriorSelectedStyles,
) {
  const roofColorValue = getSelectedColorValue(selectedStyles.roof, [
    "asphalt_shingles",
    "steel_roof",
    "steel_shingles",
  ]);
  const sidingColorValue = getSelectedColorValue(selectedStyles.siding, [
    "vinyl_siding",
    "fiber_cement",
    "wood_siding",
    "brick_veneer",
  ]);

  const colorMatches = [
    {
      category: "roof" as const,
      selectedStyle: selectedStyles.roof,
      selectedColor: roofColorValue,
      colors: Array.isArray(customizations?.roofColors) ? customizations.roofColors : [],
      builtInColors: ROOF_COLORS,
    },
    {
      category: "siding" as const,
      selectedStyle: selectedStyles.siding,
      selectedColor: sidingColorValue,
      colors: Array.isArray(customizations?.sidingColors) ? customizations.sidingColors : [],
      builtInColors: SIDING_COLORS,
    },
  ];

  const resolvedColors: ResolvedTenantColor[] = [];

  for (const colorMatch of colorMatches) {
    if (!colorMatch.selectedColor) continue;

    const matchedColor = colorMatch.colors.find(
      (color: any) =>
        normalizeTenantColorValue(color) === normalizeTenantToken(colorMatch.selectedColor),
    );

    if (matchedColor) {
      const label = String(matchedColor.label || matchedColor.name || colorMatch.selectedColor).trim();
      const hex = String(matchedColor.hex || matchedColor.color || "").trim();
      const prompt = String(matchedColor.prompt || matchedColor.instructions || "").trim();

      resolvedColors.push({
        category: colorMatch.category,
        selectedColor: colorMatch.selectedColor,
        label,
        hex,
        prompt:
          prompt ||
          `Use the tenant-specific ${colorMatch.category} color "${label}"${hex ? ` (${hex})` : ""} as closely as possible.`,
        referenceImages: buildReferenceImages(
          matchedColor,
          "color",
          `${colorMatch.category} color reference`,
          label,
        ),
      });
      continue;
    }

    if (!isCustomExteriorStyleSelection(colorMatch.selectedStyle)) continue;

    const builtInColor =
      colorMatch.builtInColors[colorMatch.selectedColor as keyof typeof colorMatch.builtInColors];
    if (!builtInColor) continue;

    resolvedColors.push({
      category: colorMatch.category,
      selectedColor: colorMatch.selectedColor,
      label: builtInColor.label,
      hex: builtInColor.hex,
      prompt: `Use the selected ${colorMatch.category} color "${builtInColor.label}" (${builtInColor.hex}) with the client-specific ${colorMatch.category} style.`,
      referenceImages: [],
      builtIn: true,
    });
  }

  return resolvedColors;
}

function buildTenantCustomSidingPrompt(
  sidingOption: ResolvedTenantOption,
  sidingColor: ResolvedTenantColor | undefined,
) {
  const colorLabel = sidingColor?.label || sidingOption.colorValue || "selected tenant color";
  const colorHex = sidingColor?.hex || "tenant color hex unavailable";
  const colorPrompt = sidingColor?.prompt || "Use the selected tenant siding color as closely as possible.";

  return `TENANT CUSTOM SIDING MATERIAL INSTRUCTIONS:

Image 1 is the house photo to edit.
Image 2 is the siding material reference.

Apply the selected siding material from Image 2 only to the siding areas of the house in Image 1.

Match the siding reference exactly:
- flat panel face
- repeating curved/scooped groove pattern
- subtle speckled/grain surface texture
- same panel spacing
- same shadow depth
- realistic manufactured siding appearance

Use the selected color: ${colorLabel} / ${colorHex}.
The color should change, but the siding texture, grooves, profile, and material pattern must come from Image 2.

Resolved tenant siding style: ${sidingOption.label}.
Tenant siding style instructions: ${sidingOption.prompt}
Tenant siding color instructions: ${colorPrompt}

Do not use generic horizontal vinyl siding.
Do not create smooth painted siding.
Do not invent a different siding pattern.
Do not modify the roof, windows, doors, trim, driveway, landscaping, or house structure unless explicitly selected.

Keep the final image realistic, buildable, and photo-realistic.`;
}

export function buildTenantExteriorCustomContext(
  tenant: any,
  selectedStyles: TenantExteriorSelectedStyles,
): TenantExteriorCustomContext {
  const customizations = tenant?.embedCustomizations || {};
  const selectedSidingParts = splitExteriorStyleColorSelection(selectedStyles.siding);
  const resolvedOptions = resolveTenantExteriorOptions(customizations, selectedStyles);
  const resolvedColors = resolveTenantExteriorColors(customizations, selectedStyles);

  const sidingOption = resolvedOptions.find((option) => option.category === "siding");
  const sidingColor = resolvedColors.find((color) => color.category === "siding");

  const prompts: string[] = [];

  if (sidingOption) {
    prompts.push(buildTenantCustomSidingPrompt(sidingOption, sidingColor));
  }

  for (const option of resolvedOptions) {
    if (option.category === "siding") continue;
    prompts.push(`Apply the client-specific ${option.category} option "${option.label}". ${option.prompt}`);
  }

  for (const color of resolvedColors) {
    if (color.category === "siding") continue;
    prompts.push(color.prompt);
  }

  if (!sidingOption && sidingColor) {
    prompts.push(sidingColor.prompt);
  }

  const referenceImages = [
    ...(sidingOption?.referenceImages || []),
    ...resolvedOptions
      .filter((option) => option !== sidingOption)
      .flatMap((option) => option.referenceImages),
    ...(sidingColor?.referenceImages || []),
    ...resolvedColors
      .filter((color) => color !== sidingColor)
      .flatMap((color) => color.referenceImages),
  ];

  return {
    prompt: prompts.length
      ? ["CLIENT-SPECIFIC EXTERIOR EMBED OPTIONS:", ...prompts.map((prompt, index) => `${index + 1}. ${prompt}`)].join("\n\n")
      : "",
    referenceImages,
    referenceImageUrls: referenceImages.map((referenceImage) => referenceImage.url),
    debug: {
      selectedCategory: sidingOption ? "siding" : selectedStyles.siding ? "siding" : resolvedOptions[0]?.category || "",
      selectedSidingStyleId: sidingOption?.styleValue || selectedSidingParts.styleValue || "",
      selectedColorId: sidingOption?.colorValue || sidingColor?.selectedColor || selectedSidingParts.colorValue || "",
      resolvedSidingStyleName: sidingOption?.label || "",
      resolvedSidingStylePrompt: sidingOption?.prompt || "",
      resolvedSidingColorName: sidingColor?.label || "",
      resolvedSidingColorHex: sidingColor?.hex || "",
      resolvedSidingColorPrompt: sidingColor?.prompt || "",
      referenceImagesCount: referenceImages.length,
      referenceImages,
    },
  };
}
