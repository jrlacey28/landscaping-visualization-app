export type InteriorReferenceService = "painting" | "bathroom" | "kitchen" | "living_room";

export function collectInteriorReferenceImageUrls(source: any, limit = 8) {
  const references = [
    ...(Array.isArray(source?.referenceImageUrls) ? source.referenceImageUrls : []),
    ...(Array.isArray(source?.referenceImages) ? source.referenceImages : []),
    source?.referenceImageUrl,
    source?.imageUrl,
  ];

  return Array.from(
    new Set(references.map((url) => String(url || "").trim()).filter(Boolean)),
  ).slice(0, limit);
}

export function getInteriorReferencePreviewUrl(source: any) {
  return collectInteriorReferenceImageUrls(source, 1)[0];
}

export function buildTenantInteriorOptionPrompt({
  service,
  label,
  prompt,
  referenceImageUrls,
}: {
  service: InteriorReferenceService;
  label: string;
  prompt?: string;
  referenceImageUrls?: string[];
}) {
  const basePrompt = prompt?.trim() || `Apply the client-specific option "${label}".`;
  if (service !== "bathroom" || !referenceImageUrls?.length) {
    return basePrompt;
  }

  return `${basePrompt}\nBATHROOM TILE SAMPLE REQUIREMENT: Use the attached sample image as the exact material reference. Match its complete multicolor pattern, veining, texture, finish, scale, and color variation realistically. Do not flatten or simplify the sample into one solid color.`;
}
