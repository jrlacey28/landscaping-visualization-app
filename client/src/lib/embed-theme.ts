export const EMBED_HOME_BACKGROUND =
  "linear-gradient(to bottom right, #1e293b, #0f172a, #000000)";

export const DEFAULT_EMBED_BACKGROUND_COLOR = "#0f172a";

export const EMBED_BACKGROUND_OPTIONS = [
  {
    value: "home-blue",
    label: "Home blue",
    description: "Matches the DreamBuilder home page background",
  },
  {
    value: "brand-gradient",
    label: "Brand gradient",
    description: "Fades between the primary and secondary brand colors",
  },
  {
    value: "solid-primary",
    label: "Solid primary",
    description: "Uses the primary brand color as the page background",
  },
  {
    value: "solid-secondary",
    label: "Solid secondary",
    description: "Uses the secondary brand color as the page background",
  },
  {
    value: "solid-custom",
    label: "Custom solid",
    description: "Uses a custom background color",
  },
  {
    value: "light",
    label: "Light neutral",
    description: "Uses a soft neutral background",
  },
  {
    value: "white",
    label: "White",
    description: "Uses a plain white background",
  },
  {
    value: "transparent",
    label: "Transparent",
    description: "Lets the host website background show through",
  },
] as const;

export type EmbedBackgroundScheme =
  (typeof EMBED_BACKGROUND_OPTIONS)[number]["value"];

export const DEFAULT_EMBED_BACKGROUND_SCHEME: EmbedBackgroundScheme =
  "home-blue";

export function parseEmbedBackgroundScheme(
  value: string | null | undefined,
): EmbedBackgroundScheme {
  const option = EMBED_BACKGROUND_OPTIONS.find((item) => item.value === value);
  return option?.value ?? DEFAULT_EMBED_BACKGROUND_SCHEME;
}

export function getEmbedBackground(
  scheme: EmbedBackgroundScheme,
  primaryColor: string,
  secondaryColor: string,
  customBackgroundColor = DEFAULT_EMBED_BACKGROUND_COLOR,
) {
  switch (scheme) {
    case "brand-gradient":
      return `linear-gradient(to bottom right, ${primaryColor}dd, ${secondaryColor}dd, ${primaryColor}cc)`;
    case "solid-primary":
      return primaryColor;
    case "solid-secondary":
      return secondaryColor;
    case "solid-custom":
      return customBackgroundColor || DEFAULT_EMBED_BACKGROUND_COLOR;
    case "light":
      return "#f8fafc";
    case "white":
      return "#ffffff";
    case "transparent":
      return "transparent";
    case "home-blue":
    default:
      return EMBED_HOME_BACKGROUND;
  }
}

export function isLightEmbedBackground(scheme: EmbedBackgroundScheme) {
  return scheme === "light" || scheme === "white" || scheme === "transparent";
}

export function getEmbedThemeClasses(scheme: EmbedBackgroundScheme) {
  const isLight = isLightEmbedBackground(scheme);

  return {
    headerText: isLight ? "text-slate-950" : "text-white",
    subheadingText: isLight ? "text-slate-600" : "text-white/80",
    panel: isLight
      ? "bg-white border border-slate-200 shadow-sm"
      : "bg-white/10 backdrop-blur-md",
    panelTitle: isLight ? "text-slate-950" : "text-white",
    uploadBorder: isLight ? "border-slate-300" : "border-white/30",
    uploadIcon: isLight ? "text-slate-500" : "text-white/70",
    uploadPrimaryText: isLight ? "text-slate-900" : "text-white",
    uploadSecondaryText: isLight ? "text-slate-500" : "text-white/70",
  };
}
