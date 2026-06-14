export type EmbedSelectorOption = {
  value: string;
  label: string;
  swatch?: string;
  groupLabel?: string;
};

export function normalizeEmbedOptionToken(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function normalizeEmbedCustomOptionValue(option: any, prefix: string) {
  const label = String(option?.label || option?.name || option?.value || "option").trim();
  const rawValue = normalizeEmbedOptionToken(option?.value || `${prefix}_${normalizeEmbedOptionToken(label)}`);

  return rawValue.startsWith("tenant_custom_") ? rawValue : `${prefix}_${rawValue}`;
}

export function normalizeEmbedCustomOptions(source: unknown, prefix: string): EmbedSelectorOption[] {
  if (!Array.isArray(source)) {
    return [];
  }

  return source
    .map((option: any) => {
      const label = String(option?.label || option?.name || option?.value || "").trim();
      if (!label) {
        return null;
      }

      const swatch =
        typeof option?.swatch === "string"
          ? option.swatch
          : typeof option?.hex === "string"
            ? option.hex
            : typeof option?.color === "string"
              ? option.color
              : undefined;

      return {
        value: normalizeEmbedCustomOptionValue(option, prefix),
        label,
        swatch,
        groupLabel: typeof option?.groupLabel === "string" ? option.groupLabel.trim() || undefined : undefined,
      };
    })
    .filter(Boolean) as EmbedSelectorOption[];
}
