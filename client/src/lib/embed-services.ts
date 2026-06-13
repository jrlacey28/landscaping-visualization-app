export type EmbedServiceKey =
  | "landscape"
  | "roofing"
  | "pools"
  | "painting"
  | "kitchen"
  | "bathroom"
  | "living-room";

export type EmbedServiceAccess = Record<EmbedServiceKey, boolean>;

export const EMBED_SERVICES: Array<{
  key: EmbedServiceKey;
  label: string;
  path: string;
  description: string;
}> = [
  {
    key: "landscape",
    label: "Landscape Visualizer",
    path: "/embed",
    description: "Landscape, curbing, mulch, grass, and patio embeds.",
  },
  {
    key: "roofing",
    label: "Roofing & Siding Visualizer",
    path: "/embed-roofing",
    description: "Roof, siding, window, and exterior color embeds.",
  },
  {
    key: "pools",
    label: "Pool Visualizer",
    path: "/embed-pools",
    description: "Pool, decking, spa, lighting, and outdoor feature embeds.",
  },
  {
    key: "painting",
    label: "Painting Visualizer",
    path: "/embed-painting",
    description: "Interior paint color and finish embeds.",
  },
  {
    key: "kitchen",
    label: "Kitchen Visualizer",
    path: "/embed-kitchen",
    description: "Cabinet, counter, backsplash, fixture, and kitchen remodel embeds.",
  },
  {
    key: "bathroom",
    label: "Bathroom Visualizer",
    path: "/embed-bathroom",
    description: "Tile, vanity, fixture, and bathroom remodel embeds.",
  },
  {
    key: "living-room",
    label: "Living Room Visualizer",
    path: "/embed-living-room",
    description: "Furniture, built-in, lighting, rug, and living room embeds.",
  },
];

export const DEFAULT_EMBED_SERVICE_ACCESS: EmbedServiceAccess =
  EMBED_SERVICES.reduce((access, service) => {
    access[service.key] = true;
    return access;
  }, {} as EmbedServiceAccess);

export function normalizeEmbedServiceAccess(value: unknown): EmbedServiceAccess {
  const source = value && typeof value === "object" ? value as Partial<EmbedServiceAccess> : {};

  return EMBED_SERVICES.reduce((access, service) => {
    access[service.key] = source[service.key] !== false;
    return access;
  }, {} as EmbedServiceAccess);
}

export function getEnabledEmbedServices(tenant: any) {
  const customizations = tenant?.embedCustomizations || {};
  const serviceAccess = normalizeEmbedServiceAccess(customizations.enabledServices);

  return EMBED_SERVICES.filter((service) => serviceAccess[service.key]);
}

export function isEmbedServiceEnabled(tenant: any, serviceKey: EmbedServiceKey) {
  const customizations = tenant?.embedCustomizations || {};
  return normalizeEmbedServiceAccess(customizations.enabledServices)[serviceKey] !== false;
}
