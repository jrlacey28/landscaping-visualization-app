import sharp from "sharp";
import { desc, eq } from "drizzle-orm";
import {
  christmasLightsVisualizations,
  halloweenVisualizations,
  landscapeVisualizations,
  poolVisualizations,
  visualizations,
} from "@shared/schema";

import { db } from "./db";
import { storage } from "./storage";
import { getPublicImage } from "./public-image-store";
import {
  processChristmasLightsWithGemini,
  processHalloweenVisualizationWithGemini,
  processInteriorVisualizationWithGemini,
  processLandscapeVisualizationWithGemini,
  processLandscapeWithGemini,
  processPoolWithGemini,
} from "./gemini-service";
import { buildTenantExteriorCustomContext } from "./tenant-exterior-context";
import {
  buildTenantInteriorCustomContext,
  buildTenantLandscapeCustomContext,
  buildTenantPoolCustomContext,
  type InteriorService,
} from "./tenant-service-context";
import { POOL_STYLE_CONFIG } from "./pool-style-config";
import { HALLOWEEN_STYLE_CONFIG } from "./halloween-style-config";
import {
  runImageModelComparison,
  type ImageComparisonModelId,
} from "./image-model-comparison";

export const CLIENT_COMPARISON_SERVICES = [
  "roofing-siding",
  "interior",
  "pools",
  "landscape",
  "halloween",
  "christmas-lights",
] as const;

export type ClientComparisonService =
  (typeof CLIENT_COMPARISON_SERVICES)[number];

const serviceLabels: Record<ClientComparisonService, string> = {
  "roofing-siding": "Roofing & Siding",
  interior: "Interior",
  pools: "Pools",
  landscape: "Landscape",
  halloween: "Halloween",
  "christmas-lights": "Christmas Lights",
};

const interiorServices = new Set<InteriorService>([
  "painting",
  "bathroom",
  "kitchen",
  "living_room",
]);

type ComparisonCase = {
  id: string;
  visualizationId: number;
  service: ClientComparisonService;
  serviceLabel: string;
  status: string;
  createdAt: Date | null;
  styles: string[];
};

function humanize(value: unknown) {
  return String(value || "")
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function styleLine(label: string, value: unknown) {
  const formatted = humanize(value);
  return formatted ? `${label}: ${formatted}` : null;
}

function compactStyles(values: Array<string | null | undefined | false>) {
  return values.filter(Boolean) as string[];
}

function createCase(
  service: ClientComparisonService,
  generation: any,
  styles: string[],
): ComparisonCase {
  return {
    id: `${service}:${generation.id}`,
    visualizationId: generation.id,
    service,
    serviceLabel: serviceLabels[service],
    status: generation.status || "completed",
    createdAt: generation.createdAt || null,
    styles,
  };
}

export function parseComparisonCaseId(caseId: string) {
  const separatorIndex = caseId.lastIndexOf(":");
  const service = caseId.slice(0, separatorIndex);
  const visualizationId = Number(caseId.slice(separatorIndex + 1));

  if (
    !CLIENT_COMPARISON_SERVICES.includes(
      service as ClientComparisonService,
    ) ||
    !Number.isInteger(visualizationId) ||
    visualizationId <= 0
  ) {
    throw new Error("Invalid comparison test case");
  }

  return {
    service: service as ClientComparisonService,
    visualizationId,
  };
}

export async function listClientComparisonCases(tenantId: number) {
  const [standardRows, poolRows, landscapeRows, halloweenRows, christmasRows] =
    await Promise.all([
      db
        .select({
          id: visualizations.id,
          selectedRoof: visualizations.selectedRoof,
          selectedSiding: visualizations.selectedSiding,
          selectedSurpriseMe: visualizations.selectedSurpriseMe,
          status: visualizations.status,
          createdAt: visualizations.createdAt,
        })
        .from(visualizations)
        .where(eq(visualizations.tenantId, tenantId))
        .orderBy(desc(visualizations.createdAt))
        .limit(30),
      db
        .select({
          id: poolVisualizations.id,
          selectedPoolType: poolVisualizations.selectedPoolType,
          selectedPoolSize: poolVisualizations.selectedPoolSize,
          selectedDecking: poolVisualizations.selectedDecking,
          selectedLandscaping: poolVisualizations.selectedLandscaping,
          selectedFeatures: poolVisualizations.selectedFeatures,
          status: poolVisualizations.status,
          createdAt: poolVisualizations.createdAt,
        })
        .from(poolVisualizations)
        .where(eq(poolVisualizations.tenantId, tenantId))
        .orderBy(desc(poolVisualizations.createdAt))
        .limit(20),
      db
        .select({
          id: landscapeVisualizations.id,
          selectedCurbing: landscapeVisualizations.selectedCurbing,
          selectedLandscape: landscapeVisualizations.selectedLandscape,
          selectedPatios: landscapeVisualizations.selectedPatios,
          status: landscapeVisualizations.status,
          createdAt: landscapeVisualizations.createdAt,
        })
        .from(landscapeVisualizations)
        .where(eq(landscapeVisualizations.tenantId, tenantId))
        .orderBy(desc(landscapeVisualizations.createdAt))
        .limit(20),
      db
        .select({
          id: halloweenVisualizations.id,
          selectedDecorations: halloweenVisualizations.selectedDecorations,
          nightMode: halloweenVisualizations.nightMode,
          spookyMode: halloweenVisualizations.spookyMode,
          status: halloweenVisualizations.status,
          createdAt: halloweenVisualizations.createdAt,
        })
        .from(halloweenVisualizations)
        .where(eq(halloweenVisualizations.tenantId, tenantId))
        .orderBy(desc(halloweenVisualizations.createdAt))
        .limit(20),
      db
        .select({
          id: christmasLightsVisualizations.id,
          lightType: christmasLightsVisualizations.lightType,
          lightColor: christmasLightsVisualizations.lightColor,
          addSnow: christmasLightsVisualizations.addSnow,
          status: christmasLightsVisualizations.status,
          createdAt: christmasLightsVisualizations.createdAt,
        })
        .from(christmasLightsVisualizations)
        .where(eq(christmasLightsVisualizations.tenantId, tenantId))
        .orderBy(desc(christmasLightsVisualizations.createdAt))
        .limit(20),
    ]);

  const cases: ComparisonCase[] = [];

  for (const generation of standardRows) {
    const isInterior = interiorServices.has(
      generation.selectedRoof as InteriorService,
    );
    const service = isInterior ? "interior" : "roofing-siding";
    const styles = isInterior
      ? compactStyles([
          styleLine("Room", generation.selectedRoof),
          generation.selectedSiding
            ? `Styles: ${generation.selectedSiding
                .split(",")
                .map(humanize)
                .join(", ")}`
            : null,
        ])
      : compactStyles([
          styleLine("Roof", generation.selectedRoof),
          styleLine("Siding", generation.selectedSiding),
          styleLine("Surprise", generation.selectedSurpriseMe),
        ]);
    cases.push(createCase(service, generation, styles));
  }

  for (const generation of poolRows) {
    cases.push(
      createCase(
        "pools",
        generation,
        compactStyles([
          styleLine("Type", generation.selectedPoolType),
          styleLine("Size", generation.selectedPoolSize),
          styleLine("Decking", generation.selectedDecking),
          styleLine("Landscaping", generation.selectedLandscaping),
          styleLine("Features", generation.selectedFeatures),
        ]),
      ),
    );
  }

  for (const generation of landscapeRows) {
    cases.push(
      createCase(
        "landscape",
        generation,
        compactStyles([
          styleLine("Curbing", generation.selectedCurbing),
          styleLine("Landscape", generation.selectedLandscape),
          styleLine("Patio", generation.selectedPatios),
        ]),
      ),
    );
  }

  for (const generation of halloweenRows) {
    cases.push(
      createCase(
        "halloween",
        generation,
        compactStyles([
          styleLine("Decorations", generation.selectedDecorations),
          generation.nightMode ? "Night Mode" : null,
          generation.spookyMode ? "Spooky Mode" : null,
        ]),
      ),
    );
  }

  for (const generation of christmasRows) {
    cases.push(
      createCase(
        "christmas-lights",
        generation,
        compactStyles([
          styleLine("Light Type", generation.lightType),
          styleLine("Color", generation.lightColor),
          generation.addSnow ? "Snow Added" : null,
        ]),
      ),
    );
  }

  return cases
    .sort(
      (left, right) =>
        new Date(right.createdAt || 0).getTime() -
        new Date(left.createdAt || 0).getTime(),
    )
    .slice(0, 60);
}

async function getComparisonGeneration(
  tenantId: number,
  caseId: string,
): Promise<{
  service: ClientComparisonService;
  generation: any;
}> {
  const { service, visualizationId } = parseComparisonCaseId(caseId);
  let generation: any;

  if (service === "pools") {
    generation = await storage.getPoolVisualization(visualizationId);
  } else if (service === "landscape") {
    generation = await storage.getLandscapeVisualization(visualizationId);
  } else if (service === "halloween") {
    generation = await storage.getHalloweenVisualization(visualizationId);
  } else if (service === "christmas-lights") {
    generation =
      await storage.getChristmasLightsVisualization(visualizationId);
  } else {
    generation = await storage.getVisualization(visualizationId);
  }

  if (!generation || generation.tenantId !== tenantId) {
    throw new Error("The selected client test case was not found");
  }

  if (
    service === "interior" &&
    !interiorServices.has(generation.selectedRoof as InteriorService)
  ) {
    throw new Error("The selected test case is not an interior generation");
  }

  if (
    service === "roofing-siding" &&
    interiorServices.has(generation.selectedRoof as InteriorService)
  ) {
    throw new Error("The selected test case is not an exterior generation");
  }

  return { service, generation };
}

async function loadStoredSourceImage(source: string) {
  if (source.startsWith("data:image/")) {
    const commaIndex = source.indexOf(",");
    if (commaIndex < 0 || !source.slice(0, commaIndex).includes(";base64")) {
      throw new Error("The saved source image has an invalid data URL");
    }
    return Buffer.from(source.slice(commaIndex + 1), "base64");
  }

  const publicImageMatch = source.match(
    /^\/(?:uploads|api\/public-images)\/([^?#/]+)/,
  );
  if (publicImageMatch) {
    const stored = await getPublicImage(
      decodeURIComponent(publicImageMatch[1]),
    );
    if (!stored) {
      throw new Error("The saved source image could not be found");
    }
    return stored.imageData;
  }

  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source, {
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      throw new Error(`Unable to load saved source image (${response.status})`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  throw new Error("The saved source image uses an unsupported URL");
}

function resolveStableHalloweenDecorations(generation: any) {
  const selected = String(generation.selectedDecorations || "").trim();
  if (selected || !generation.spookyMode) {
    return selected;
  }

  const decorationIds = Object.keys(HALLOWEEN_STYLE_CONFIG).filter(
    (id) => !["night_mode", "really_spooky"].includes(id),
  );
  const pumpkin =
    decorationIds.find((id) => id.includes("pumpkin")) ||
    decorationIds[0];
  const others = decorationIds
    .filter((id) => id !== pumpkin && !id.includes("pumpkin"))
    .slice(0, 3);

  return [pumpkin, ...others].filter(Boolean).join(",");
}

async function prepareClientComparison(tenantId: number, caseId: string) {
  const tenant = await storage.getTenant(tenantId);
  if (!tenant) {
    throw new Error("Client not found");
  }

  const { service, generation } = await getComparisonGeneration(
    tenantId,
    caseId,
  );
  const imageBuffer = await loadStoredSourceImage(
    generation.originalImageUrl,
  );

  if (service === "roofing-siding") {
    const selectedStyles = {
      roof: generation.selectedRoof || undefined,
      siding: generation.selectedSiding || undefined,
      surpriseMe: generation.selectedSurpriseMe || undefined,
    };
    const context = buildTenantExteriorCustomContext(tenant, selectedStyles);

    return {
      tenant,
      service,
      referenceImageCount: context.referenceImages.length,
      imageBuffer,
      generate: (modelId: ImageComparisonModelId) =>
        processLandscapeWithGemini({
          imageBuffer,
          selectedStyles,
          customPrompt: context.prompt || undefined,
          referenceImages: context.referenceImages,
          debugContext: context.debug,
          imageModelOverride: modelId,
        }),
    };
  }

  if (service === "interior") {
    const interiorService = generation.selectedRoof as InteriorService;
    const selectedStyles = String(generation.selectedSiding || "")
      .split(",")
      .map((style) => style.trim())
      .filter(Boolean);
    const context = buildTenantInteriorCustomContext(
      tenant,
      interiorService,
      selectedStyles,
    );

    return {
      tenant,
      service,
      referenceImageCount: context.referenceImageUrls.length,
      imageBuffer,
      generate: (modelId: ImageComparisonModelId) =>
        processInteriorVisualizationWithGemini({
          imageBuffer,
          service: interiorService,
          selectedStyles,
          customPrompt: context.prompt || undefined,
          referenceImageUrls: context.referenceImageUrls,
          imageModelOverride: modelId,
        }),
    };
  }

  if (service === "pools") {
    const selectedStyles = {
      poolType: generation.selectedPoolType || undefined,
      poolSize: generation.selectedPoolSize || undefined,
      decking: generation.selectedDecking || undefined,
      landscaping: generation.selectedLandscaping || undefined,
      features: generation.selectedFeatures || undefined,
    };
    const context = buildTenantPoolCustomContext(tenant, selectedStyles);
    const poolStylesForProcessing: Record<string, any> = {};

    for (const selectedStyle of Object.values(selectedStyles)) {
      if (selectedStyle && POOL_STYLE_CONFIG[selectedStyle]) {
        poolStylesForProcessing[selectedStyle] =
          POOL_STYLE_CONFIG[selectedStyle];
      }
    }

    return {
      tenant,
      service,
      referenceImageCount: context.referenceImageUrls.length,
      imageBuffer,
      generate: (modelId: ImageComparisonModelId) =>
        processPoolWithGemini({
          imageBuffer,
          selectedStyles: poolStylesForProcessing,
          customPrompt: context.prompt || undefined,
          referenceImageUrls: context.referenceImageUrls,
          imageModelOverride: modelId,
        }),
    };
  }

  if (service === "landscape") {
    const selectedStyles = {
      curbing: generation.selectedCurbing || undefined,
      landscape: generation.selectedLandscape || undefined,
      patios: generation.selectedPatios || undefined,
    };
    const context = buildTenantLandscapeCustomContext(
      tenant,
      selectedStyles,
    );

    return {
      tenant,
      service,
      referenceImageCount: context.referenceImageUrls.length,
      imageBuffer,
      generate: (modelId: ImageComparisonModelId) =>
        processLandscapeVisualizationWithGemini({
          imageBuffer,
          selectedStyles,
          customPrompt: context.prompt || undefined,
          referenceImageUrls: context.referenceImageUrls,
          imageModelOverride: modelId,
        }),
    };
  }

  if (service === "halloween") {
    const selectedDecorations =
      resolveStableHalloweenDecorations(generation);

    return {
      tenant,
      service,
      referenceImageCount: 0,
      imageBuffer,
      generate: (modelId: ImageComparisonModelId) =>
        processHalloweenVisualizationWithGemini({
          imageBuffer,
          selectedDecorations,
          nightMode: Boolean(generation.nightMode),
          spookyMode: Boolean(generation.spookyMode),
          imageModelOverride: modelId,
        }),
    };
  }

  return {
    tenant,
    service,
    referenceImageCount: 0,
    imageBuffer,
    generate: (modelId: ImageComparisonModelId) =>
      processChristmasLightsWithGemini(
        imageBuffer,
        generation.lightType || "c9_rope_lights",
        generation.lightColor || "warm_white",
        Boolean(generation.addSnow),
        false,
        modelId,
      ),
  };
}

export async function createClientComparisonSourceThumbnail(
  tenantId: number,
  caseId: string,
) {
  const { generation } = await getComparisonGeneration(tenantId, caseId);
  const imageBuffer = await loadStoredSourceImage(
    generation.originalImageUrl,
  );
  return sharp(imageBuffer)
    .rotate()
    .resize({
      width: 900,
      height: 650,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
}

export async function runClientModelComparison(
  tenantId: number,
  caseId: string,
) {
  const prepared = await prepareClientComparison(tenantId, caseId);
  const comparison = await runImageModelComparison(prepared.generate);

  return {
    generatedAt: new Date().toISOString(),
    tenant: {
      id: prepared.tenant.id,
      companyName: prepared.tenant.companyName,
      slug: prepared.tenant.slug,
    },
    caseId,
    service: prepared.service,
    serviceLabel: serviceLabels[prepared.service],
    referenceImageCount: prepared.referenceImageCount,
    ...comparison,
  };
}
