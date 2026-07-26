import {
  buildTenantInteriorOptionPrompt,
  collectInteriorReferenceImageUrls,
} from "@shared/interior-reference-options";

export type InteriorService =
  | "painting"
  | "bathroom"
  | "kitchen"
  | "living_room";

function normalizeTenantCustomOptionValue(value: unknown) {
  const rawValue = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return rawValue.startsWith("tenant_custom_")
    ? rawValue
    : `tenant_custom_${rawValue}`;
}

function normalizeTenantToken(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function collectReferenceImageUrls(source: any) {
  const references = [
    ...(Array.isArray(source?.referenceImageUrls)
      ? source.referenceImageUrls
      : []),
    ...(Array.isArray(source?.referenceImages) ? source.referenceImages : []),
    source?.referenceImageUrl,
    source?.imageUrl,
  ];

  return references
    .map((url) => String(url || "").trim())
    .filter(Boolean)
    .slice(0, 8);
}

function collectTenantInteriorOptions(
  tenant: any,
  service: InteriorService,
) {
  const customizations = tenant?.embedCustomizations || {};
  const byService = customizations?.interiorOptions?.[service];
  const legacyBathroomOptions =
    service === "bathroom" ? customizations?.bathroomOptions : null;
  const source = Array.isArray(byService)
    ? byService
    : Array.isArray(legacyBathroomOptions)
      ? legacyBathroomOptions
      : [];

  return source
    .map((option: any) => {
      const label = String(
        option?.label || option?.name || option?.value || "",
      ).trim();
      if (!label) return null;

      return {
        value: normalizeTenantCustomOptionValue(option?.value || label),
        label,
        prompt: String(option?.prompt || option?.instructions || "").trim(),
        referenceImageUrls: collectInteriorReferenceImageUrls(option),
      };
    })
    .filter(Boolean) as Array<{
    value: string;
    label: string;
    prompt: string;
    referenceImageUrls: string[];
  }>;
}

export function buildTenantInteriorCustomContext(
  tenant: any,
  service: InteriorService,
  selectedStyles: string[],
) {
  const selected = new Set(selectedStyles);
  const matchingOptions = collectTenantInteriorOptions(tenant, service).filter(
    (option) => selected.has(option.value),
  );
  const matchingPrompts = matchingOptions.map((option) =>
    buildTenantInteriorOptionPrompt({
      service,
      label: option.label,
      prompt: option.prompt,
      referenceImageUrls: option.referenceImageUrls,
    }),
  );

  return {
    prompt: matchingPrompts.length
      ? [
          "CLIENT-SPECIFIC EMBED OPTIONS:",
          ...matchingPrompts.map(
            (prompt, index) => `${index + 1}. ${prompt}`,
          ),
        ].join("\n")
      : "",
    referenceImageUrls: matchingOptions.flatMap(
      (option) => option.referenceImageUrls,
    ),
  };
}

function normalizeTenantPrefixedOptionValue(option: any, prefix: string) {
  const label = String(
    option?.label || option?.name || option?.value || "option",
  ).trim();
  const rawValue = normalizeTenantToken(
    option?.value || `${prefix}_${normalizeTenantToken(label)}`,
  );
  return rawValue.startsWith("tenant_custom_")
    ? rawValue
    : `${prefix}_${rawValue}`;
}

function buildTenantOptionContext(
  entries: Array<{
    categoryLabel: string;
    selectedStyle?: string;
    options: any[];
    valuePrefix: string;
    transformSelectedStyle?: (value: string) => string;
  }>,
  heading: string,
) {
  const prompts: string[] = [];
  const referenceImageUrls: string[] = [];

  for (const entry of entries) {
    if (!entry.selectedStyle || !Array.isArray(entry.options)) continue;

    const selectedStyle = entry.transformSelectedStyle
      ? entry.transformSelectedStyle(entry.selectedStyle)
      : entry.selectedStyle;
    const selectedToken = normalizeTenantToken(selectedStyle);
    if (!selectedToken) continue;

    const matchedOption = entry.options.find(
      (option: any) =>
        normalizeTenantToken(
          normalizeTenantPrefixedOptionValue(option, entry.valuePrefix),
        ) === selectedToken,
    );

    if (!matchedOption) continue;

    const label = String(
      matchedOption.label || matchedOption.name || selectedStyle,
    ).trim();
    const swatch = String(
      matchedOption.swatch || matchedOption.hex || matchedOption.color || "",
    ).trim();
    const prompt = String(
      matchedOption.prompt || matchedOption.instructions || "",
    ).trim();

    prompts.push(
      prompt ||
        `Apply the client-specific ${entry.categoryLabel} option "${label}"${swatch ? ` (${swatch})` : ""} exactly as configured for this tenant.`,
    );
    referenceImageUrls.push(...collectReferenceImageUrls(matchedOption));
  }

  return {
    prompt: prompts.length
      ? [
          heading,
          ...prompts.map((prompt, index) => `${index + 1}. ${prompt}`),
        ].join("\n")
      : "",
    referenceImageUrls,
  };
}

export function buildTenantLandscapeCustomContext(
  tenant: any,
  selectedStyles: {
    curbing?: string;
    landscape?: string;
    patios?: string;
  },
) {
  const customizations = tenant?.embedCustomizations || {};

  return buildTenantOptionContext(
    [
      {
        categoryLabel: "curbing",
        selectedStyle: selectedStyles.curbing,
        options: customizations?.landscapeOptions?.curbing || [],
        valuePrefix: "tenant_custom_landscape_curbing",
      },
      {
        categoryLabel: "landscape material",
        selectedStyle: selectedStyles.landscape,
        options: customizations?.landscapeOptions?.landscape || [],
        valuePrefix: "tenant_custom_landscape_landscape",
      },
      {
        categoryLabel: "patio",
        selectedStyle: selectedStyles.patios,
        options: customizations?.landscapeOptions?.patios || [],
        valuePrefix: "tenant_custom_landscape_patios",
        transformSelectedStyle: (value) => value.split("|")[0],
      },
    ],
    "CLIENT-SPECIFIC LANDSCAPE EMBED OPTIONS:",
  );
}

export function buildTenantPoolCustomContext(
  tenant: any,
  selectedStyles: {
    poolType?: string;
    poolSize?: string;
    decking?: string;
    landscaping?: string;
    features?: string;
    hotTub?: string;
    sauna?: string;
  },
) {
  const customizations = tenant?.embedCustomizations || {};

  return buildTenantOptionContext(
    [
      {
        categoryLabel: "pool type",
        selectedStyle: selectedStyles.poolType,
        options: customizations?.poolOptions?.poolType || [],
        valuePrefix: "tenant_custom_pool_pool_type",
      },
      {
        categoryLabel: "pool size",
        selectedStyle: selectedStyles.poolSize,
        options: customizations?.poolOptions?.poolSize || [],
        valuePrefix: "tenant_custom_pool_pool_size",
      },
      {
        categoryLabel: "decking",
        selectedStyle: selectedStyles.decking,
        options: customizations?.poolOptions?.decking || [],
        valuePrefix: "tenant_custom_pool_decking",
      },
      {
        categoryLabel: "pool landscaping",
        selectedStyle: selectedStyles.landscaping,
        options: customizations?.poolOptions?.landscaping || [],
        valuePrefix: "tenant_custom_pool_landscaping",
      },
      {
        categoryLabel: "pool feature",
        selectedStyle: selectedStyles.features,
        options: customizations?.poolOptions?.features || [],
        valuePrefix: "tenant_custom_pool_features",
      },
      {
        categoryLabel: "hot tub",
        selectedStyle: selectedStyles.hotTub,
        options: customizations?.poolOptions?.hotTub || [],
        valuePrefix: "tenant_custom_pool_hot_tub",
      },
      {
        categoryLabel: "sauna",
        selectedStyle: selectedStyles.sauna,
        options: customizations?.poolOptions?.sauna || [],
        valuePrefix: "tenant_custom_pool_sauna",
      },
    ],
    "CLIENT-SPECIFIC POOL EMBED OPTIONS:",
  );
}
