export type ExteriorCustomColor = {
  value: string;
  label: string;
  hex: string;
  groupLabel?: string;
};

export type ExteriorCustomStyle = {
  value: string;
  label: string;
  hex?: string;
  groupLabel?: string;
  custom: true;
  allowedColorValues?: string[];
};

export function normalizeExteriorOptionToken(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function normalizeExteriorCustomColor(color: any): ExteriorCustomColor {
  const hex = String(color?.hex || color?.color || "");
  const label = String(color?.label || color?.name || color?.value || "").trim();
  const rawValue = color?.value || `tenant_color_${normalizeExteriorOptionToken(label || "custom")}_${hex.replace("#", "")}`;

  return {
    value: normalizeExteriorOptionToken(rawValue),
    label,
    hex,
    groupLabel: typeof color?.groupLabel === "string" ? color.groupLabel.trim() || undefined : undefined,
  };
}

export function normalizeExteriorCustomStyle(
  option: any,
  category: "roof" | "siding" | "windows",
): ExteriorCustomStyle {
  const label = String(option?.label || option?.name || option?.value || "").trim();
  const rawValue = option?.value || `tenant_custom_exterior_${category}_${normalizeExteriorOptionToken(label || "option")}`;
  const normalizedValue = normalizeExteriorOptionToken(rawValue);

  return {
    value: normalizedValue.startsWith("tenant_custom_")
      ? normalizedValue
      : `tenant_custom_exterior_${category}_${normalizedValue}`,
    label,
    hex: typeof option?.hex === "string"
      ? option.hex
      : typeof option?.swatch === "string"
        ? option.swatch
        : undefined,
    groupLabel: typeof option?.groupLabel === "string" ? option.groupLabel.trim() || undefined : undefined,
    custom: true,
    allowedColorValues: Array.isArray(option?.allowedColorValues)
      ? option.allowedColorValues.map(normalizeExteriorOptionToken).filter(Boolean)
      : undefined,
  };
}

export function getExteriorCustomStyles(
  customizations: any,
  category: "roof" | "siding" | "windows",
) {
  const options = customizations?.exteriorOptions?.[category];

  return Array.isArray(options)
    ? options
        .map((option: any) => normalizeExteriorCustomStyle(option, category))
        .filter((option: ExteriorCustomStyle) => option.value && option.label)
    : [];
}

function getExteriorCustomColors(source: unknown) {
  return Array.isArray(source)
    ? source
        .map(normalizeExteriorCustomColor)
        .filter((color: ExteriorCustomColor) =>
          color.value && color.label && /^#[0-9a-f]{6}$/i.test(color.hex),
        )
    : [];
}

export function getExteriorSelectorCustomizations(customizations: any) {
  return {
    customRoofColors: getExteriorCustomColors(customizations?.roofColors),
    customSidingColors: getExteriorCustomColors(customizations?.sidingColors),
    customWindowColors: getExteriorCustomColors(customizations?.windowColors),
    customRoofStyles: getExteriorCustomStyles(customizations, "roof"),
    customSidingStyles: getExteriorCustomStyles(customizations, "siding"),
    customWindowOptions: getExteriorCustomStyles(customizations, "windows"),
  };
}
