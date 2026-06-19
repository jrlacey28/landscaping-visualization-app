import * as fs from "fs";
import * as path from "path";
import { GoogleGenAI, Modality } from "@google/genai";
import sharp from "sharp";

// Initialize Gemini AI client
const getGeminiApiKey = () => {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY;

  if (apiKey && apiKey.trim()) {
    console.log("✓ Found Gemini API key");
    return apiKey.trim();
  }

  console.log("⚠️ No Gemini API key found - will be checked when needed");
  return "";
};

const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });

const STANDARD_IMAGE_MODEL =
  process.env.GEMINI_STANDARD_IMAGE_MODEL || "gemini-2.5-flash-image";
const BUSINESS_IMAGE_MODEL =
  process.env.GEMINI_BUSINESS_IMAGE_MODEL || "gemini-3.1-flash-image";
const REFERENCE_IMAGE_LOAD_TIMEOUT_MS = 5000;
const MAX_REFERENCE_SOURCE_IMAGE_BYTES = 24 * 1024 * 1024;
const MAX_REFERENCE_INLINE_IMAGE_BYTES = 1_250_000;
const REFERENCE_IMAGE_MAX_DIMENSION = 1024;
const REFERENCE_IMAGE_JPEG_QUALITY = 82;

function getImageGenerationModel(usePremiumModel?: boolean): string {
  return usePremiumModel ? BUSINESS_IMAGE_MODEL : STANDARD_IMAGE_MODEL;
}

async function generateImageContentWithFallback({
  model,
  fallbackModel,
  contents,
  config,
}: {
  model: string;
  fallbackModel?: string;
  contents: any[];
  config: any;
}) {
  try {
    return await ai.models.generateContent({
      model,
      contents,
      config,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (!fallbackModel || fallbackModel === model) {
      throw error;
    }

    console.error(
      `Gemini image model ${model} failed; retrying with ${fallbackModel}: ${message}`,
    );

    return ai.models.generateContent({
      model: fallbackModel,
      contents,
      config,
    });
  }
}

interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
}

interface RoofingEditRequest {
  imageBuffer: Buffer;
  selectedStyles: {
    roof?: string;
    siding?: string;
    surpriseMe?: string;
    windows?: string;
  };
}

interface RoofingEditResult {
  editedImageBuffer: Buffer;
  prompt: string;
  appliedStyles: string[];
}

export interface GeminiReferenceImageInput {
  url: string;
  role?: string;
  category?: string;
  label?: string;
  source?: string;
}

type NormalizedReferenceImageInput = Required<GeminiReferenceImageInput>;

type GeminiRequestImageLog = {
  imageNumber: number;
  role: string;
  category: string;
  label: string;
  source: string;
  filename: string;
  mimeType: string;
  byteSize: number;
  isHouseImage: boolean;
  isReferenceImage: boolean;
};

export type ExteriorGenerationDebugContext = {
  selectedCategory?: string;
  selectedSidingStyleId?: string;
  selectedColorId?: string;
  resolvedSidingStyleName?: string;
  resolvedSidingStylePrompt?: string;
  resolvedSidingColorName?: string;
  resolvedSidingColorHex?: string;
  resolvedSidingColorPrompt?: string;
  referenceImagesCount?: number;
  referenceImages?: GeminiReferenceImageInput[];
  masking?: {
    maskProvided?: boolean;
    maskApplied?: boolean;
    reason?: string;
  };
};

/**
 * Processes and resizes image to max 1920x1080 while maintaining aspect ratio
 */
async function processImageSize(imageBuffer: Buffer): Promise<ProcessedImage> {
  const image = sharp(imageBuffer).rotate();
  const metadata = await image.metadata();

  let processedImage = image;

  // Check if resizing is needed
  if (
    metadata.width &&
    metadata.height &&
    (metadata.width > 1920 || metadata.height > 1080)
  ) {
    processedImage = image.resize(1920, 1080, {
      fit: "inside",
      withoutEnlargement: false,
    });
  }

  const result = await processedImage.jpeg({ quality: 90 }).toBuffer();
  const finalMetadata = await sharp(result).metadata();

  return {
    buffer: result,
    width: finalMetadata.width || 1920,
    height: finalMetadata.height || 1080,
    format: "jpeg",
  };
}

function resolveLocalUploadPath(refImageUrl: string) {
  let pathname = "";

  try {
    pathname = refImageUrl.startsWith("/uploads/")
      ? refImageUrl
      : new URL(refImageUrl).pathname;
  } catch {
    return null;
  }

  if (!pathname.startsWith("/uploads/")) {
    return null;
  }

  let relativePath: string;
  try {
    relativePath = decodeURIComponent(pathname).replace(/^\/+/, "");
  } catch {
    relativePath = pathname.replace(/^\/+/, "");
  }

  const uploadsRoot = path.resolve(process.cwd(), "public", "uploads");
  const imagePath = path.resolve(process.cwd(), "public", relativePath);
  const relativeToUploadsRoot = path.relative(uploadsRoot, imagePath);

  if (
    relativeToUploadsRoot.startsWith("..") ||
    path.isAbsolute(relativeToUploadsRoot) ||
    !fs.existsSync(imagePath)
  ) {
    return null;
  }

  return imagePath;
}

async function prepareReferenceImageBuffer(imageBuffer: Buffer, sourceLabel: string) {
  if (imageBuffer.byteLength > MAX_REFERENCE_SOURCE_IMAGE_BYTES) {
    console.log(
      `Skipping reference image larger than ${MAX_REFERENCE_SOURCE_IMAGE_BYTES} bytes before optimization: ${sourceLabel}`,
    );
    return null;
  }

  try {
    let optimizedBuffer = await sharp(imageBuffer)
      .rotate()
      .resize({
        width: REFERENCE_IMAGE_MAX_DIMENSION,
        height: REFERENCE_IMAGE_MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: REFERENCE_IMAGE_JPEG_QUALITY, mozjpeg: true })
      .toBuffer();

    if (optimizedBuffer.byteLength > MAX_REFERENCE_INLINE_IMAGE_BYTES) {
      optimizedBuffer = await sharp(imageBuffer)
        .rotate()
        .resize({
          width: 768,
          height: 768,
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 72, mozjpeg: true })
        .toBuffer();
    }

    if (optimizedBuffer.byteLength > MAX_REFERENCE_INLINE_IMAGE_BYTES) {
      console.log(
        `Skipping reference image still larger than ${MAX_REFERENCE_INLINE_IMAGE_BYTES} bytes after optimization: ${sourceLabel}`,
      );
      return null;
    }

    return {
      data: optimizedBuffer.toString("base64"),
      mimeType: "image/jpeg",
      bytes: optimizedBuffer.byteLength,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`Could not optimize reference image: ${sourceLabel} (${message})`);
    return null;
  }
}

async function fetchWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function loadReferenceImage(refImageUrl: string) {
  const trimmedUrl = refImageUrl.trim();
  if (!trimmedUrl) return null;

  if (trimmedUrl.startsWith("data:image/")) {
    const match = trimmedUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) return null;

    return prepareReferenceImageBuffer(Buffer.from(match[2], "base64"), "data URL");
  }

  const localUploadPath = resolveLocalUploadPath(trimmedUrl);
  if (localUploadPath) {
    return prepareReferenceImageBuffer(fs.readFileSync(localUploadPath), trimmedUrl);
  }

  if (!/^https?:\/\//i.test(trimmedUrl)) {
    return null;
  }

  const response = await fetchWithTimeout(trimmedUrl, REFERENCE_IMAGE_LOAD_TIMEOUT_MS);
  if (!response.ok) {
    return null;
  }

  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > MAX_REFERENCE_SOURCE_IMAGE_BYTES) {
    console.log(
      `Skipping reference image larger than ${MAX_REFERENCE_SOURCE_IMAGE_BYTES} bytes: ${trimmedUrl}`,
    );
    return null;
  }

  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_REFERENCE_SOURCE_IMAGE_BYTES) {
    console.log(
      `Skipping reference image larger than ${MAX_REFERENCE_SOURCE_IMAGE_BYTES} bytes: ${trimmedUrl}`,
    );
    return null;
  }

  return prepareReferenceImageBuffer(Buffer.from(arrayBuffer), trimmedUrl);
}

function normalizeReferenceImageInputs(
  referenceImages: Array<string | GeminiReferenceImageInput> | undefined,
  defaultLabel: string,
) {
  const seen = new Set<string>();
  const normalized: NormalizedReferenceImageInput[] = [];

  for (const referenceImage of referenceImages || []) {
    const input =
      typeof referenceImage === "string"
        ? { url: referenceImage }
        : referenceImage;
    const url = String(input?.url || "").trim();
    if (!url) continue;

    const role = String(input.role || `${defaultLabel} reference image`).trim();
    const key = `${role}:${url}`;
    if (seen.has(key)) continue;
    seen.add(key);

    normalized.push({
      url,
      role,
      category: String(input.category || "exterior").trim(),
      label: String(input.label || defaultLabel).trim(),
      source: String(input.source || url).trim(),
    });
  }

  return normalized.slice(0, 8);
}

function getSourceFilename(source: string) {
  if (source.startsWith("data:image/")) {
    return "data-url-image";
  }

  try {
    const pathname = source.startsWith("/uploads/") ? source : new URL(source).pathname;
    const filename = pathname.split("/").filter(Boolean).pop();
    return filename ? decodeURIComponent(filename) : source;
  } catch {
    return source.split(/[\\/]/).filter(Boolean).pop() || source;
  }
}

function logGeminiImagePart(imageLog: GeminiRequestImageLog[], entry: GeminiRequestImageLog) {
  imageLog.push(entry);
  console.log("[Gemini][Image]", {
    imageNumber: entry.imageNumber,
    role: entry.role,
    category: entry.category,
    mimeType: entry.mimeType,
    filename: entry.filename,
    source: entry.source,
    byteSize: entry.byteSize,
    isHouseImage: entry.isHouseImage,
    isReferenceImage: entry.isReferenceImage,
  });
}

async function appendReferenceImageParts(
  contentParts: any[],
  referenceImages: Array<string | GeminiReferenceImageInput> | undefined,
  label: string,
  imageLog?: GeminiRequestImageLog[],
  nextImageNumber?: { value: number },
) {
  const normalizedReferences = normalizeReferenceImageInputs(referenceImages, label);
  if (normalizedReferences.length > 0) {
    console.log(`Loading ${normalizedReferences.length} ${label} reference image(s)`);
  }

  for (const referenceInput of normalizedReferences) {
    try {
      const refImageUrl = referenceInput.url;
      const referenceImage = await loadReferenceImage(refImageUrl);
      if (!referenceImage) {
        console.log(`Could not load reference image: ${refImageUrl}`);
        continue;
      }

      const imageNumber = nextImageNumber ? nextImageNumber.value++ : 0;
      const imageLabel = imageNumber > 0
        ? `Image ${imageNumber} is the ${referenceInput.role}${referenceInput.label ? ` (${referenceInput.label})` : ""}.`
        : `${referenceInput.role}:`;

      contentParts.push({
        text: imageLabel,
      });
      contentParts.push({
        inlineData: {
          data: referenceImage.data,
          mimeType: referenceImage.mimeType,
        },
      });

      if (imageLog && imageNumber > 0) {
        logGeminiImagePart(imageLog, {
          imageNumber,
          role: referenceInput.role,
          category: referenceInput.category,
          label: referenceInput.label,
          source: referenceInput.url,
          filename: getSourceFilename(referenceInput.url),
          mimeType: referenceImage.mimeType,
          byteSize: referenceImage.bytes,
          isHouseImage: false,
          isReferenceImage: true,
        });
      } else {
        console.log(`Loaded ${label} reference image (${referenceImage.bytes} bytes)`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`Could not load reference image: ${referenceInput.url} (${message})`);
    }
  }
}

function imageDimensionsInstruction(processedImage: ProcessedImage): string {
  return `Keep the output at ${processedImage.width}x${processedImage.height} pixels and preserve the original image aspect ratio exactly. Do not stretch, squeeze, letterbox, or convert the image to 16:9.`;
}

async function resizeGeneratedImageToOriginalAspect(
  rawGeneratedBuffer: Buffer,
  processedImage: ProcessedImage,
  quality: number,
  label: string,
): Promise<Buffer> {
  const generatedMetadata = await sharp(rawGeneratedBuffer).metadata();

  console.log(
    `${label}: fitting Gemini output ${generatedMetadata.width || "unknown"}x${generatedMetadata.height || "unknown"} to original ${processedImage.width}x${processedImage.height} without stretching`,
  );

  // "fill" forces width and height independently and distorts mismatched outputs.
  // "cover" preserves the generated image aspect ratio while matching the original canvas.
  return sharp(rawGeneratedBuffer)
    .resize(processedImage.width, processedImage.height, {
      fit: "cover",
    })
    .jpeg({ quality })
    .toBuffer();
}

/**
 * Generates a targeted roofing design prompt that only modifies selected features
 */
async function generateRoofingPrompt(selectedStyles: any): Promise<string> {
  const modifications = [];

  // Build very specific modification instructions
  if (selectedStyles.roof) {
    let roofDetails = "";

    // Handle roof style and color combinations
    if (selectedStyles.roof.includes("asphalt_shingles")) {
      const color =
        selectedStyles.roof.split("_")[2] +
        "_" +
        selectedStyles.roof.split("_")[3];
      switch (color) {
        case "charcoal_black":
          roofDetails =
            "Replace ONLY the roof with charcoal black asphalt shingles. High-quality dimensional shingles with deep black color and subtle texture variation. Professional installation with proper alignment. Do NOT change the house structure, siding, windows, doors, trim, or landscaping.";
          break;
        case "weathered_gray":
          roofDetails =
            "Replace ONLY the roof with weathered gray asphalt shingles. Premium architectural shingles in sophisticated gray tones with natural weathered appearance. Do NOT change any other home features or landscaping.";
          break;
        case "rustic_brown":
          roofDetails =
            "Replace ONLY the roof with rustic brown asphalt shingles. Rich brown architectural shingles with natural earth tone colors and dimensional texture. Do NOT change the house structure or surroundings.";
          break;
        case "slate_blue":
          roofDetails =
            "Replace ONLY the roof with slate blue asphalt shingles. Premium shingles in sophisticated blue-gray color with architectural dimensionality. Do NOT change any other home elements.";
          break;
        case "forest_green":
          roofDetails =
            "Replace ONLY the roof with forest green asphalt shingles. Deep green architectural shingles with natural color variation. Do NOT change the house or landscape features.";
          break;
        default:
          roofDetails =
            "Replace ONLY the roof with asphalt shingles. Do NOT change the house structure, siding, or landscaping.";
      }
    } else if (selectedStyles.roof.includes("steel_roof")) {
      const color =
        selectedStyles.roof.split("_")[2] +
        "_" +
        selectedStyles.roof.split("_")[3];
      if (color === "charcoal_black") {
        roofDetails =
          "Replace ONLY the roof with charcoal black steel roofing. Modern standing seam metal roof with clean lines and durable finish. Do NOT change any other home elements or landscaping.";
      } else {
        roofDetails =
          "Replace ONLY the roof with weathered gray steel roofing. Contemporary metal roof with sophisticated gray finish and standing seam design. Do NOT change the house structure or surroundings.";
      }
    } else if (selectedStyles.roof.includes("steel_shingles")) {
      roofDetails =
        "Replace ONLY the roof with charcoal black steel shingles. Premium metal shingles with traditional appearance and modern durability. Do NOT change any other home or landscape features.";
    } else {
      roofDetails =
        "Replace ONLY the roof with the selected roofing material. Do NOT change the house structure, siding, or landscaping.";
    }
    modifications.push(roofDetails);
  }

  if (selectedStyles.siding) {
    let sidingDetails = "";
    switch (selectedStyles.siding) {
      case "vinyl_siding_white":
        sidingDetails =
          "Replace ONLY the house siding with clean white vinyl siding. Premium quality horizontal lap siding with smooth finish and professional installation. Bright white color with proper trim. Do NOT change the roof, windows, doors, or landscaping.";
        break;
      case "vinyl_siding_gray":
        sidingDetails =
          "Replace ONLY the house siding with modern gray vinyl siding. Contemporary gray color with horizontal lap style and professional installation. Do NOT change the roof, trim, windows, or landscape elements.";
        break;
      case "fiber_cement_beige":
        sidingDetails =
          "Replace ONLY the house siding with beige fiber cement siding. High-quality cementitious siding in warm beige tone with wood-grain texture. Do NOT change the roof or other home features.";
        break;
      case "wood_siding_natural":
        sidingDetails =
          "Replace ONLY the house siding with natural wood siding. Cedar or similar wood species with natural finish and horizontal board installation. Do NOT change the roof, windows, or landscaping.";
        break;
      case "brick_veneer_red":
        sidingDetails =
          "Replace ONLY the house siding with red brick veneer. Traditional red brick with classic mortar joints and professional masonry installation. Do NOT change the roof, trim, or landscape elements.";
        break;
      default:
        sidingDetails =
          "Replace ONLY the house siding with the selected siding material. Do NOT change the roof, windows, doors, or landscaping.";
    }
    modifications.push(sidingDetails);
  }

  if (selectedStyles.surpriseMe) {
    const surpriseDetails =
      "Transform this home with a complementary roof and siding combination. Choose appropriate colors and materials that work well together for a beautiful exterior renovation. Maintain all windows, doors, trim, and landscaping exactly as shown.";
    modifications.push(surpriseDetails);
  }

  // Create precise prompt that emphasizes preservation
  const specificPrompt = `
PRECISE HOME EXTERIOR RENOVATION INSTRUCTIONS:

${modifications.join("\n\n")}

CRITICAL PRESERVATION RULES:
- Keep the house structure, foundation, and framing exactly the same
- Preserve all windows, doors, and architectural trim details exactly where they are
- Maintain all existing landscaping, trees, shrubs, and yard features
- Keep the driveway, walkways, and outdoor fixtures identical
- Only modify the specific roof/siding features listed above
- Maintain the original perspective, lighting, and shadows
- Preserve the original image dimensions and aspect ratio. Do not stretch, squeeze, or convert the image to 16:9.
- The final result must look naturally integrated and professionally installed

Make ONLY the specified changes above. Do not redesign or dramatically alter the home structure or surroundings.`;

  return specificPrompt;
}

/**
 * Processes home exterior image with Gemini AI for complete editing workflow
 */
export async function processLandscapeWithGemini({
  imageBuffer,
  selectedStyles,
  customPrompt,
  referenceImageUrls,
  referenceImages,
  debugContext,
  usePremiumModel = false,
}: {
  imageBuffer: Buffer;
  selectedStyles: {
    roof?: string;
    siding?: string;
    surpriseMe?: string;
    windows?: string;
  };
  customPrompt?: string;
  referenceImageUrls?: string[];
  referenceImages?: GeminiReferenceImageInput[];
  debugContext?: ExteriorGenerationDebugContext;
  usePremiumModel?: boolean;
}): Promise<{
  editedImageBuffer: Buffer;
  appliedStyles: string[];
  prompt: string;
}> {
  try {
    // Check API key at runtime
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || !apiKey.trim()) {
      throw new Error(
        "GEMINI_API_KEY not found in secrets. Please add your Google Gemini API key to the Secrets tool.",
      );
    }
    // Step 1: Process and resize image
    const processedImage = await processImageSize(imageBuffer);

    // Step 2: Generate tailored prompt using style config
    // Import style config to get proper prompts
    const { getStyleConfig } = await import("./style-config");

    // Build prompt based on selected styles using actual style config
    const modifications: string[] = [];
    const appliedStyles: string[] = [];

    console.log("🔍 PROCESSING STYLES:", selectedStyles);

    if (selectedStyles.roof) {
      try {
        const styleConfig = getStyleConfig(selectedStyles.roof);
        console.log(`✓ Found roof style: ${styleConfig.name}`);
        modifications.push(styleConfig.prompt);
        appliedStyles.push(selectedStyles.roof);
      } catch (error) {
        console.log(`❌ Roof style not found: ${selectedStyles.roof}`);
      }
    }

    if (selectedStyles.siding) {
      try {
        const styleConfig = getStyleConfig(selectedStyles.siding);
        console.log(`✓ Found siding style: ${styleConfig.name}`);
        modifications.push(styleConfig.prompt);
        appliedStyles.push(selectedStyles.siding);
      } catch (error) {
        console.log(`❌ Siding style not found: ${selectedStyles.siding}`);
      }
    }

    if (selectedStyles.surpriseMe) {
      try {
        const styleConfig = getStyleConfig(selectedStyles.surpriseMe);
        console.log(`✓ Found surprise style: ${styleConfig.name}`);
        modifications.push(styleConfig.prompt);
        appliedStyles.push(selectedStyles.surpriseMe);
      } catch (error) {
        console.log(
          `❌ Surprise style not found: ${selectedStyles.surpriseMe}`,
        );
      }
    }

    if (selectedStyles.windows) {
      try {
        const styleConfig = getStyleConfig(selectedStyles.windows);
        console.log(`Found window style: ${styleConfig.name}`);
        modifications.push(styleConfig.prompt);
        appliedStyles.push(selectedStyles.windows);
      } catch (error) {
        console.log(`Window style not found: ${selectedStyles.windows}`);
      }
    }

    if (modifications.length === 0 && customPrompt?.trim()) {
      modifications.push(customPrompt.trim());
      appliedStyles.push("client_custom_exterior_options");
      customPrompt = undefined;
    }

    if (modifications.length === 0) {
      console.log("❌ No valid modifications found");
      throw new Error("No valid modifications selected");
    }

    console.log(`✓ Using ${modifications.length} style prompts`);

    // Use the actual detailed prompts from style config
    let finalPrompt = `HOME EXTERIOR RENOVATION INSTRUCTIONS:

${modifications.join("\n\n")}

CRITICAL PRESERVATION RULES:
- Keep the house structure, doors, and trim exactly the same unless a selected window option explicitly changes window frames
- Preserve all existing landscaping, trees, shrubs, and plants
- Maintain the exact driveway, walkways, and yard layout
- Keep the same property layout and overall design
- Only modify the specific roof/siding/window features listed above
- Maintain original lighting, shadows, and perspective
- ${imageDimensionsInstruction(processedImage)}
- Result must look natural and professionally installed

Apply ONLY the specified modifications above. Do not redesign or dramatically alter the home.`;

    // Add custom prompt if provided (Professional feature)
    if (customPrompt && customPrompt.trim()) {
      finalPrompt += `\n\nADDITIONAL CUSTOM INSTRUCTIONS:\n${customPrompt.trim()}`;
      console.log("✓ Custom prompt added to generation");
    }

    finalPrompt += `\n\nSIDING EDIT BOUNDARY:
- If siding is selected, change only the siding areas.
- Preserve roof, windows, doors, trim, driveway, landscaping, and house structure.
- Masking applied: ${debugContext?.masking?.maskApplied ? "yes" : "no"}.
- Mask provided: ${debugContext?.masking?.maskProvided ? "yes" : "no"}.
- ${debugContext?.masking?.reason || "No deterministic siding-area mask is used in this Gemini request; follow the siding-only prompt constraints strictly."}`;

    // Step 4: Generate edited image using Gemini
    const base64Image = processedImage.buffer.toString("base64");

    const tenantReferenceInputs =
      referenceImages && referenceImages.length > 0
        ? referenceImages
        : (referenceImageUrls || []).map((url) => ({
            url,
            role: "client-specific exterior reference image",
            category: "exterior",
            label: "Client-specific exterior",
            source: url,
          }));

    console.log("[Gemini][Exterior Debug]", {
      selectedCategory: debugContext?.selectedCategory || "",
      selectedSidingStyleId: debugContext?.selectedSidingStyleId || selectedStyles.siding || "",
      selectedColorId: debugContext?.selectedColorId || "",
      resolvedStylePrompt: debugContext?.resolvedSidingStylePrompt || "",
      resolvedColorPrompt: debugContext?.resolvedSidingColorPrompt || "",
      referenceImagesCount: tenantReferenceInputs.length,
      maskingUsed: debugContext?.masking?.maskApplied === true,
      maskProvided: debugContext?.masking?.maskProvided === true,
      maskingReason: debugContext?.masking?.reason || "",
      finalPrompt,
    });

    console.log("🎯 GEMINI PROMPT BEING SENT:");
    console.log("=====================================");
    console.log(finalPrompt);
    console.log("=====================================");

    // Prepare content parts with original image and reference images
    const imageRequestLog: GeminiRequestImageLog[] = [];
    const nextImageNumber = { value: 1 };
    const contentParts: any[] = [
      { text: finalPrompt },
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg",
        },
      },
    ];
    logGeminiImagePart(imageRequestLog, {
      imageNumber: nextImageNumber.value++,
      role: "house image",
      category: "source",
      label: "House photo to edit",
      source: "uploaded house image",
      filename: "uploaded-house-image.jpg",
      mimeType: "image/jpeg",
      byteSize: processedImage.buffer.byteLength,
      isHouseImage: true,
      isReferenceImage: false,
    });
    const imageModel = getImageGenerationModel(usePremiumModel);
    console.log(`Using Gemini image model: ${imageModel}`);

    await appendReferenceImageParts(
      contentParts,
      tenantReferenceInputs,
      "Client-specific exterior",
      imageRequestLog,
      nextImageNumber,
    );

    // Add reference images for each applied style
    for (const styleId of appliedStyles) {
      const styleConfig = getStyleConfig(styleId);
      await appendReferenceImageParts(
        contentParts,
        styleConfig.referenceImages?.map((url) => ({
          url,
          role: `${styleConfig.name} reference image`,
          category: styleConfig.category,
          label: styleConfig.name,
          source: url,
        })),
        styleConfig.name,
        imageRequestLog,
        nextImageNumber,
      );
    }

    console.log("[Gemini][Request Images Included]", imageRequestLog);

    const response = await generateImageContentWithFallback({
      model: imageModel,
      fallbackModel: STANDARD_IMAGE_MODEL,
      contents: [
        {
          role: "user",
          parts: contentParts,
        },
      ],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    // Extract the generated image from Gemini response
    let generatedImageBuffer = processedImage.buffer; // fallback to original

    if (response.candidates && response.candidates.length > 0) {
      const content = response.candidates[0].content;
      if (content && content.parts) {
        for (const part of content.parts) {
          if (part.inlineData && part.inlineData.data) {
            // Convert base64 to buffer for the generated image
            const rawGeneratedBuffer = Buffer.from(
              part.inlineData.data,
              "base64",
            );

            // Fit the generated image to original dimensions without stretching.
            const originalMetadata = await sharp(
              processedImage.buffer,
            ).metadata();
            const targetWidth = originalMetadata.width || 1920;
            const targetHeight = originalMetadata.height || 1080;

            console.log(
              `📐 Resizing Gemini output to match original: ${targetWidth}x${targetHeight}`,
            );

            generatedImageBuffer = await resizeGeneratedImageToOriginalAspect(
              rawGeneratedBuffer,
              processedImage,
              95,
              "Exterior image",
            );

            console.log(
              "Gemini generated and resized exterior image successfully",
            );
            break;
          }
        }
      }
    }

    return {
      editedImageBuffer: generatedImageBuffer,
      prompt: finalPrompt,
      appliedStyles,
    };
  } catch (error) {
    console.error("Gemini roofing processing error:", error);
    throw new Error(
      `Roofing processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Processes pool visualization requests - completely separate from roofing/siding
 */
export async function processPoolWithGemini({
  imageBuffer,
  selectedStyles,
  customPrompt,
  referenceImageUrls,
  usePremiumModel = false,
}: {
  imageBuffer: Buffer;
  selectedStyles: Record<string, any>;
  customPrompt?: string;
  referenceImageUrls?: string[];
  usePremiumModel?: boolean;
}): Promise<{
  editedImageBuffer: Buffer;
  appliedStyles: string[];
  prompt: string;
}> {
  try {
    // Check API key at runtime
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || !apiKey.trim()) {
      throw new Error(
        "GEMINI_API_KEY not found in secrets. Please add your Google Gemini API key to the Secrets tool.",
      );
    }

    // Step 1: Process and resize image
    const processedImage = await processImageSize(imageBuffer);

    // Step 2: Generate pool-specific prompt using POOL style config
    const { POOL_STYLE_CONFIG } = await import("./pool-style-config");

    // Build prompt based on selected pool styles
    const modifications: string[] = [];
    const appliedStyles: string[] = [];

    console.log("🏊 PROCESSING POOL STYLES:", selectedStyles);

    // Process each selected pool style
    Object.keys(selectedStyles).forEach((styleKey) => {
      const styleConfig = selectedStyles[styleKey];
      if (styleConfig && styleConfig.prompt) {
        console.log(`✓ Found pool style: ${styleConfig.name || styleKey}`);
        modifications.push(styleConfig.prompt);
        appliedStyles.push(styleKey);
      } else if (selectedStyles[styleKey]) {
        console.log(`❌ Pool style not found: ${styleKey}`);
      }
    });

    if (modifications.length === 0) {
      console.log("❌ No valid pool modifications found");
      if (customPrompt?.trim()) {
        modifications.push(customPrompt.trim());
        appliedStyles.push("client_custom_pool_options");
        customPrompt = undefined;
      } else {
        throw new Error("No valid pool modifications selected");
      }
    }

    console.log(`✓ Using ${modifications.length} pool style prompts`);

    // Pool-specific final prompt
    let finalPrompt = `POOL INSTALLATION INSTRUCTIONS:

${modifications.join("\n\n")}

CRITICAL PRESERVATION RULES:
- Keep the house structure, windows, doors, and all architecture exactly the same
- Preserve all existing non-pool landscaping, trees, shrubs, and plants
- Maintain the exact driveway, walkways, and existing hardscaping
- Keep the same property layout and overall yard design
- Only add the pool and related features as specified above
- Maintain original lighting, shadows, and perspective
- ${imageDimensionsInstruction(processedImage)}
- Result must look natural and professionally installed
- Pool should fit harmoniously in the available yard space

Apply ONLY the pool installations specified above. Do not redesign the yard or dramatically alter existing features.`;

    // Add custom prompt if provided (Professional feature)
    if (customPrompt && customPrompt.trim()) {
      finalPrompt += `\n\nADDITIONAL CUSTOM INSTRUCTIONS:\n${customPrompt.trim()}`;
      console.log("✓ Custom prompt added to pool generation");
    }

    // Step 3: Generate edited image using Gemini
    const base64Image = processedImage.buffer.toString("base64");

    console.log("🏊 POOL GEMINI PROMPT BEING SENT:");
    console.log("=====================================");
    console.log(finalPrompt);
    console.log("=====================================");

    const contentParts: any[] = [
      { text: finalPrompt },
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg",
        },
      },
    ];
    const imageModel = getImageGenerationModel(usePremiumModel);
    console.log(`Using Gemini image model: ${imageModel}`);

    await appendReferenceImageParts(contentParts, referenceImageUrls, "Client-specific pool");

    const response = await generateImageContentWithFallback({
      model: imageModel,
      fallbackModel: STANDARD_IMAGE_MODEL,
      contents: [
        {
          role: "user",
          parts: contentParts,
        },
      ],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    // Extract the generated image from Gemini response
    let generatedImageBuffer = processedImage.buffer; // fallback to original

    if (response.candidates && response.candidates.length > 0) {
      const content = response.candidates[0].content;
      if (content && content.parts) {
        for (const part of content.parts) {
          if (part.inlineData && part.inlineData.data) {
            // Convert base64 to buffer for the generated image
            const rawGeneratedBuffer = Buffer.from(
              part.inlineData.data,
              "base64",
            );

            // Fit the generated image to original dimensions without stretching.
            const originalMetadata = await sharp(
              processedImage.buffer,
            ).metadata();
            const targetWidth = originalMetadata.width || 1920;
            const targetHeight = originalMetadata.height || 1080;

            console.log(
              `🏊 Resizing pool image to match original: ${targetWidth}x${targetHeight}`,
            );

            generatedImageBuffer = await resizeGeneratedImageToOriginalAspect(
              rawGeneratedBuffer,
              processedImage,
              95,
              "Pool image",
            );

            console.log(
              "✓ Gemini generated and resized pool image successfully",
            );
            break;
          }
        }
      }
    }

    return {
      editedImageBuffer: generatedImageBuffer,
      prompt: finalPrompt,
      appliedStyles,
    };
  } catch (error) {
    console.error("Gemini pool processing error:", error);
    throw new Error(
      `Pool processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Analyzes home exterior image to suggest improvement areas
 */
export async function analyzeLandscapeImage(
  imageBuffer: Buffer,
): Promise<string> {
  try {
    const base64Image = imageBuffer.toString("base64");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: [
        {
          inlineData: {
            data: base64Image,
            mimeType: "image/jpeg",
          },
        },
        "Analyze this home exterior image and identify specific areas that could benefit from roof upgrades and siding improvements. Provide professional roofing and siding recommendations based on the home's architecture and style.",
      ],
    });

    return response.text || "Professional exterior analysis completed";
  } catch (error) {
    console.error("Gemini image analysis error:", error);
    return "Image analysis unavailable";
  }
}

/**
 * Processes landscape visualization requests - curbing, landscape materials, and patios
 */
export async function processLandscapeVisualizationWithGemini({
  imageBuffer,
  selectedStyles,
  customPrompt,
  referenceImageUrls,
  usePremiumModel = false,
}: {
  imageBuffer: Buffer;
  selectedStyles: {
    curbing?: string;
    landscape?: string;
    patios?: string;
  };
  customPrompt?: string;
  referenceImageUrls?: string[];
  usePremiumModel?: boolean;
}): Promise<{
  editedImageBuffer: Buffer;
  appliedStyles: string[];
  prompt: string;
}> {
  try {
    // Check API key at runtime
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || !apiKey.trim()) {
      throw new Error(
        "GEMINI_API_KEY not found in secrets. Please add your Google Gemini API key to the Secrets tool.",
      );
    }

    // Step 1: Process and resize image
    const processedImage = await processImageSize(imageBuffer);

    // Step 2: Generate landscape-specific prompt using landscape style config
    const { LANDSCAPE_STYLE_CONFIG } = await import("./landscape-style-config");

    // Build prompt based on selected landscape styles
    const modifications: string[] = [];
    const appliedStyles: string[] = [];

    console.log("🌿 PROCESSING LANDSCAPE STYLES:", selectedStyles);

    if (selectedStyles.curbing) {
      try {
        const styleConfig = LANDSCAPE_STYLE_CONFIG[selectedStyles.curbing];
        if (styleConfig) {
          console.log(`✓ Found curbing style: ${styleConfig.name}`);
          modifications.push(styleConfig.prompt);
          appliedStyles.push(selectedStyles.curbing);
        }
      } catch (error) {
        console.log(`❌ Curbing style not found: ${selectedStyles.curbing}`);
      }
    }

    if (selectedStyles.landscape) {
      try {
        const styleConfig = LANDSCAPE_STYLE_CONFIG[selectedStyles.landscape];
        if (styleConfig) {
          console.log(`✓ Found landscape style: ${styleConfig.name}`);
          modifications.push(styleConfig.prompt);
          appliedStyles.push(selectedStyles.landscape);
        }
      } catch (error) {
        console.log(
          `❌ Landscape style not found: ${selectedStyles.landscape}`,
        );
      }
    }

    if (selectedStyles.patios) {
      try {
        // Handle new patio spec format: "style|shape|size"
        const patioSpec = selectedStyles.patios;
        let styleConfig;
        let shape = "rectangular";
        let size = "medium";

        if (patioSpec.includes("|")) {
          // Parse combined specification
          const [styleId, shapeSpec, sizeSpec] = patioSpec.split("|");
          shape = shapeSpec || "rectangular";
          size = sizeSpec || "medium";
          styleConfig = LANDSCAPE_STYLE_CONFIG[styleId];
        } else {
          // Legacy single ID format
          styleConfig = LANDSCAPE_STYLE_CONFIG[patioSpec];
        }

        if (styleConfig) {
          console.log(
            `✓ Found patio style: ${styleConfig.name} (${shape}, ${size})`,
          );

          // Modify the prompt to include shape and size specifications
          let enhancedPrompt = styleConfig.prompt;

          // Add shape specifications
          if (shape === "curved") {
            enhancedPrompt = enhancedPrompt.replace(
              "in an appropriate area of the yard",
              `in an appropriate area of the yard. Design with flowing curved edges and organic shapes`,
            );
          } else if (shape === "circular") {
            enhancedPrompt = enhancedPrompt.replace(
              "in an appropriate area of the yard",
              `in an appropriate area of the yard. Create a perfect circular design`,
            );
          } else if (shape === "l_shaped") {
            enhancedPrompt = enhancedPrompt.replace(
              "in an appropriate area of the yard",
              `in an appropriate area of the yard. Design in an L-shaped configuration to maximize corner space`,
            );
          } else if (shape === "rectangular") {
            enhancedPrompt = enhancedPrompt.replace(
              "in an appropriate area of the yard",
              `in an appropriate area of the yard. Create clean rectangular design with straight edges`,
            );
          }

          // Add size specifications
          if (size === "small") {
            enhancedPrompt = enhancedPrompt.replace(
              "patio",
              "small patio (approximately 10x12 feet)",
            );
          } else if (size === "large") {
            enhancedPrompt = enhancedPrompt.replace(
              "patio",
              "large patio (approximately 20x24 feet)",
            );
          } else {
            enhancedPrompt = enhancedPrompt.replace(
              "patio",
              "medium patio (approximately 15x18 feet)",
            );
          }

          modifications.push(enhancedPrompt);
          appliedStyles.push(patioSpec);
        }
      } catch (error) {
        console.log(`❌ Patio style not found: ${selectedStyles.patios}`);
      }
    }

    if (modifications.length === 0) {
      console.log("❌ No valid landscape modifications found");
      if (customPrompt?.trim()) {
        modifications.push(customPrompt.trim());
        appliedStyles.push("client_custom_landscape_options");
        customPrompt = undefined;
      } else {
        throw new Error("No valid landscape modifications selected");
      }
    }

    console.log(`✓ Using ${modifications.length} landscape style prompts`);

    // Landscape-specific final prompt
    let finalPrompt = `LANDSCAPE TRANSFORMATION INSTRUCTIONS:

${modifications.join("\n\n")}

CRITICAL PRESERVATION RULES:
- Keep the house structure, windows, doors, and all architecture exactly the same
- Preserve all existing trees, large shrubs, and established landscaping not being modified
- Maintain the exact driveway, walkways, and existing hardscaping unless adding patios
- Keep the same property layout and overall yard design
- Only add or modify the specific landscape features listed above
- Maintain original lighting, shadows, and perspective
- ${imageDimensionsInstruction(processedImage)}
- Result must look natural and professionally installed
- Landscape changes should enhance the existing property

Apply ONLY the landscape modifications specified above. Do not redesign the entire yard or dramatically alter existing features.`;

    // Add custom prompt if provided (Professional feature)
    if (customPrompt && customPrompt.trim()) {
      finalPrompt += `\n\nADDITIONAL CUSTOM INSTRUCTIONS:\n${customPrompt.trim()}`;
      console.log("✓ Custom prompt added to landscape generation");
    }

    // Step 3: Generate edited image using Gemini
    const base64Image = processedImage.buffer.toString("base64");

    console.log("🌿 LANDSCAPE GEMINI PROMPT BEING SENT:");
    console.log("=====================================");
    console.log(finalPrompt);
    console.log("=====================================");

    const contentParts: any[] = [
      { text: finalPrompt },
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg",
        },
      },
    ];
    const selectedLandscapeImageModel = getImageGenerationModel(usePremiumModel);
    console.log(`Selected Gemini image model: ${selectedLandscapeImageModel}`);

    await appendReferenceImageParts(contentParts, referenceImageUrls, "Client-specific landscape");

    // Add retry logic for Gemini API failures
    let response;
    let lastError;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🌿 Gemini API attempt ${attempt}/${maxRetries}`);

        const imageModel = selectedLandscapeImageModel;
        console.log(`Using Gemini image model: ${imageModel}`);

        response = await generateImageContentWithFallback({
          model: imageModel,
          fallbackModel: STANDARD_IMAGE_MODEL,
          contents: [
            {
              role: "user",
              parts: contentParts,
            },
          ],
          config: {
            responseModalities: [Modality.TEXT, Modality.IMAGE],
          },
        });

        console.log(`✓ Gemini API succeeded on attempt ${attempt}`);
        break; // Success, exit retry loop
      } catch (error: any) {
        lastError = error;
        console.log(
          `❌ Gemini API attempt ${attempt} failed:`,
          error.message || error,
        );

        if (attempt === maxRetries) {
          console.log(`❌ All ${maxRetries} Gemini API attempts failed`);
          throw error;
        }

        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // Ensure response exists after retry logic
    if (!response) {
      throw new Error(
        "Failed to get response from Gemini API after all retries",
      );
    }

    // Extract the generated image from Gemini response
    let generatedImageBuffer = processedImage.buffer; // fallback to original

    if (response.candidates && response.candidates.length > 0) {
      const content = response.candidates[0].content;
      if (content && content.parts) {
        for (const part of content.parts) {
          if (part.inlineData && part.inlineData.data) {
            // Convert base64 to buffer for the generated image
            const rawGeneratedBuffer = Buffer.from(
              part.inlineData.data,
              "base64",
            );

            // Fit the generated image to original dimensions without stretching.
            const originalMetadata = await sharp(
              processedImage.buffer,
            ).metadata();
            const targetWidth = originalMetadata.width || 1920;
            const targetHeight = originalMetadata.height || 1080;

            console.log(
              `🌿 Resizing landscape image to match original: ${targetWidth}x${targetHeight}`,
            );

            generatedImageBuffer = await resizeGeneratedImageToOriginalAspect(
              rawGeneratedBuffer,
              processedImage,
              85,
              "Landscape image",
            );

            console.log(
              "✓ Gemini generated and resized landscape image successfully",
            );
            break;
          }
        }
      }
    }

    return {
      editedImageBuffer: generatedImageBuffer,
      appliedStyles: appliedStyles,
      prompt: finalPrompt,
    };
  } catch (error) {
    console.error("Gemini landscape processing error:", error);
    throw new Error(
      `Landscape processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Processes interior visualization requests - painting, bathrooms, kitchens, and living rooms
 */
export async function processInteriorVisualizationWithGemini({
  imageBuffer,
  service,
  selectedStyles,
  customColorName,
  customColorHex,
  customPrompt,
  referenceImageUrls,
  usePremiumModel = false,
}: {
  imageBuffer: Buffer;
  service: "painting" | "bathroom" | "kitchen" | "living_room";
  selectedStyles: string[];
  customColorName?: string;
  customColorHex?: string;
  customPrompt?: string;
  referenceImageUrls?: string[];
  usePremiumModel?: boolean;
}): Promise<{
  editedImageBuffer: Buffer;
  appliedStyles: string[];
  prompt: string;
}> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || !apiKey.trim()) {
      throw new Error(
        "GEMINI_API_KEY not found in secrets. Please add your Google Gemini API key to the Secrets tool.",
      );
    }

    const processedImage = await processImageSize(imageBuffer);
    const { getInteriorStyleConfig } = await import("./interior-style-config");
    const styleConfigs = selectedStyles.map((styleId) =>
      getInteriorStyleConfig(service, styleId),
    );

    const serviceLabels: Record<typeof service, string> = {
      painting: "interior painting",
      bathroom: "bathroom redesign",
      kitchen: "kitchen redesign",
      living_room: "living room design",
    };

    let modificationPrompt = styleConfigs
      .map((styleConfig, index) => `${index + 1}. ${styleConfig.prompt}`)
      .join("\n\n");

    if (service === "painting" && selectedStyles.includes("custom_paint_color")) {
      const customColorDetails = [
        customColorName ? `name: ${customColorName}` : null,
        customColorHex ? `hex: ${customColorHex}` : null,
      ].filter(Boolean).join(", ");

      if (customColorDetails) {
        modificationPrompt += `\n\nCUSTOM PAINT COLOR DETAILS: Use the exact user-selected paint color (${customColorDetails}) for the wall repaint. Match it as closely as possible while preserving realistic indoor lighting and shadows.`;
      }
    }

    let finalPrompt = `INTERIOR DESIGN VISUALIZATION INSTRUCTIONS:

Service: ${serviceLabels[service]}
Selected options: ${styleConfigs.map((styleConfig) => styleConfig.name).join(", ")}

${modificationPrompt}

CRITICAL PRESERVATION RULES:
- Preserve the original room shape, camera angle, perspective, and proportions
- Keep windows, doors, ceiling height, and architectural openings in their original positions
- If several individual options are selected, apply all of them together in one cohesive design
- Maintain realistic indoor lighting and natural shadows
- Do not add exterior landscaping or outdoor elements
- Do not change the image crop, aspect ratio, or viewpoint
- Result must look like a realistic professional remodel photograph
- ${imageDimensionsInstruction(processedImage)}

Apply ONLY the requested ${serviceLabels[service]} changes and keep the result practical, buildable, and cohesive with the existing room.`;

    if (customPrompt && customPrompt.trim()) {
      finalPrompt += `\n\nADDITIONAL CUSTOM INSTRUCTIONS:\n${customPrompt.trim()}`;
      console.log("Custom prompt added to interior generation");
    }

    const base64Image = processedImage.buffer.toString("base64");
    const contentParts: any[] = [
      { text: finalPrompt },
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg",
        },
      },
    ];
    const imageModel = getImageGenerationModel(usePremiumModel);
    console.log(`Selected Gemini image model: ${imageModel}`);

    await appendReferenceImageParts(contentParts, referenceImageUrls, "Client-specific interior");

    let response;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Interior Gemini API attempt ${attempt}/${maxRetries}`);
        console.log(`Using Gemini image model: ${imageModel}`);

        response = await generateImageContentWithFallback({
          model: imageModel,
          fallbackModel: STANDARD_IMAGE_MODEL,
          contents: [
            {
              role: "user",
              parts: contentParts,
            },
          ],
          config: {
            responseModalities: [Modality.TEXT, Modality.IMAGE],
          },
        });

        break;
      } catch (error: any) {
        console.log(
          `Interior Gemini API attempt ${attempt} failed:`,
          error.message || error,
        );

        if (attempt === maxRetries) {
          throw error;
        }

        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    if (!response) {
      throw new Error("Failed to get response from Gemini API after all retries");
    }

    let generatedImageBuffer = processedImage.buffer;

    if (response.candidates && response.candidates.length > 0) {
      const content = response.candidates[0].content;
      if (content && content.parts) {
        for (const part of content.parts) {
          if (part.inlineData && part.inlineData.data) {
            const rawGeneratedBuffer = Buffer.from(
              part.inlineData.data,
              "base64",
            );

            generatedImageBuffer = await resizeGeneratedImageToOriginalAspect(
              rawGeneratedBuffer,
              processedImage,
              92,
              "Interior image",
            );

            break;
          }
        }
      }
    }

    return {
      editedImageBuffer: generatedImageBuffer,
      appliedStyles: [service, ...selectedStyles],
      prompt: finalPrompt,
    };
  } catch (error) {
    console.error("Gemini interior processing error:", error);
    throw new Error(
      `Interior processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Processes Halloween visualization requests - decorations and spooky atmosphere
 */
export async function processHalloweenVisualizationWithGemini({
  imageBuffer,
  selectedDecorations,
  nightMode,
  spookyMode,
  usePremiumModel = false,
}: {
  imageBuffer: Buffer;
  selectedDecorations: string;
  nightMode: boolean;
  spookyMode: boolean;
  usePremiumModel?: boolean;
}): Promise<{
  editedImageBuffer: Buffer;
  appliedDecorations: string[];
  prompt: string;
}> {
  try {
    // Check API key at runtime
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || !apiKey.trim()) {
      throw new Error(
        "GEMINI_API_KEY not found in secrets. Please add your Google Gemini API key to the Secrets tool.",
      );
    }

    // Step 1: Process and resize image
    const processedImage = await processImageSize(imageBuffer);

    // Step 2: Import Halloween style config
    const { HALLOWEEN_STYLE_CONFIG } = await import("./halloween-style-config");

    // Step 3: Parse selectedDecorations string (split by comma) into an array
    const decorationIds = selectedDecorations
      ? selectedDecorations
          .split(",")
          .map((id) => id.trim())
          .filter((id) => id.length > 0)
      : [];

    // Build prompt based on selected Halloween decorations
    const modifications: string[] = [];
    const appliedDecorations: string[] = [];

    console.log("🎃 PROCESSING HALLOWEEN DECORATIONS:", decorationIds);

    // Step 4: If spookyMode is true and no decorations selected, generate random scary scene with 3-4 decorations
    if (spookyMode && decorationIds.length === 0) {
      console.log(
        "🎃 Generating random spooky Halloween scene with 3-4 decorations",
      );

      // Always include pumpkins, then randomly select 2-3 more decorations
      const allDecorationIds = Object.keys(HALLOWEEN_STYLE_CONFIG).filter(
        (id) => !["night_mode", "really_spooky"].includes(id),
      );

      // Shuffle and select 2-3 random decorations (excluding pumpkins which we'll add separately)
      const nonPumpkinIds = allDecorationIds.filter(
        (id) => !id.includes("pumpkin"),
      );
      const shuffled = nonPumpkinIds.sort(() => Math.random() - 0.5);
      const randomCount = Math.floor(Math.random() * 2) + 2; // 2 or 3 random decorations
      const selectedIds = shuffled.slice(0, randomCount);

      // Always add a pumpkin decoration first
      const pumpkinIds = allDecorationIds.filter((id) =>
        id.includes("pumpkin"),
      );
      const randomPumpkin =
        pumpkinIds[Math.floor(Math.random() * pumpkinIds.length)];

      const finalSelectionIds = [randomPumpkin, ...selectedIds];

      console.log("🎃 Selected decorations:", finalSelectionIds);

      // Add each selected decoration
      for (const decorationId of finalSelectionIds) {
        try {
          const styleConfig = HALLOWEEN_STYLE_CONFIG[decorationId];
          if (styleConfig) {
            console.log(`✓ Adding random decoration: ${styleConfig.name}`);
            modifications.push(styleConfig.prompt);
            appliedDecorations.push(decorationId);
          }
        } catch (error) {
          console.log(`❌ Error loading decoration: ${decorationId}`, error);
        }
      }

      // Add spooky atmosphere
      try {
        const spookyConfig = HALLOWEEN_STYLE_CONFIG["really_spooky"];
        if (spookyConfig) {
          console.log(`✓ Adding spooky mode atmosphere: ${spookyConfig.name}`);
          modifications.push(spookyConfig.prompt);
          appliedDecorations.push("really_spooky");
        }
      } catch (error) {
        console.log(`❌ Error loading spooky mode configuration`, error);
      }
    } else {
      // Original logic for specific decorations
      for (const decorationId of decorationIds) {
        try {
          const styleConfig = HALLOWEEN_STYLE_CONFIG[decorationId];
          if (styleConfig) {
            console.log(`✓ Found Halloween decoration: ${styleConfig.name}`);
            modifications.push(styleConfig.prompt);
            appliedDecorations.push(decorationId);
          } else {
            console.log(`❌ Halloween decoration not found: ${decorationId}`);
          }
        } catch (error) {
          console.log(
            `❌ Error loading Halloween decoration: ${decorationId}`,
            error,
          );
        }
      }

      // Step 5: If nightMode is true, add the "night_mode" configuration
      if (nightMode) {
        try {
          const nightConfig = HALLOWEEN_STYLE_CONFIG["night_mode"];
          if (nightConfig) {
            console.log(`✓ Adding night mode atmosphere: ${nightConfig.name}`);
            modifications.push(nightConfig.prompt);
            appliedDecorations.push("night_mode");
          }
        } catch (error) {
          console.log(`❌ Error loading night mode configuration`, error);
        }
      }

      // Step 6: If spookyMode is true (with specific decorations), add the "really_spooky" configuration
      if (spookyMode) {
        try {
          const spookyConfig = HALLOWEEN_STYLE_CONFIG["really_spooky"];
          if (spookyConfig) {
            console.log(
              `✓ Adding spooky mode atmosphere: ${spookyConfig.name}`,
            );
            modifications.push(spookyConfig.prompt);
            appliedDecorations.push("really_spooky");
          }
        } catch (error) {
          console.log(`❌ Error loading spooky mode configuration`, error);
        }
      }
    }

    // Step 7: If no modifications, use fallback prompt
    if (modifications.length === 0) {
      console.log("⚠️ No valid Halloween decorations found, using fallback");
      modifications.push(
        "Add festive Halloween decorations to the home and yard while preserving all existing features",
      );
    }

    console.log(`✓ Using ${modifications.length} Halloween decoration prompts`);

    // Step 8: Combine all modification prompts with proper formatting
    const decorationList = modifications
      .map((mod, idx) => `${idx + 1}. ${mod}`)
      .join("\n\n");

    const finalPrompt = `ADD these Halloween decorations to the property:

${decorationList}

RULES:
- Add ALL decorations listed above - each one must appear in the result
- Keep house, landscaping, driveway exactly as they are  
- ${imageDimensionsInstruction(processedImage)}
- Make decorations look realistic and professionally placed
- If multiple decorations are listed, include every single one

Create a complete Halloween scene with ALL the decorations specified above visible in the image.`;

    // Step 9: Generate edited image using Gemini
    const base64Image = processedImage.buffer.toString("base64");

    console.log("🎃 HALLOWEEN GEMINI PROMPT BEING SENT:");
    console.log("=====================================");
    console.log(finalPrompt);
    console.log("=====================================");

    const contentParts: any[] = [
      { text: finalPrompt },
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg",
        },
      },
    ];

    // Add retry logic for Gemini API failures
    let response;
    let lastError;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🎃 Gemini API attempt ${attempt}/${maxRetries}`);

        const imageModel = getImageGenerationModel(usePremiumModel);
        console.log(`Using Gemini image model: ${imageModel}`);

        response = await generateImageContentWithFallback({
          model: imageModel,
          fallbackModel: STANDARD_IMAGE_MODEL,
          contents: [
            {
              role: "user",
              parts: contentParts,
            },
          ],
          config: {
            responseModalities: [Modality.TEXT, Modality.IMAGE],
          },
        });

        console.log(`✓ Gemini API succeeded on attempt ${attempt}`);
        break;
      } catch (error: any) {
        lastError = error;
        console.log(
          `❌ Gemini API attempt ${attempt} failed:`,
          error.message || error,
        );

        if (attempt === maxRetries) {
          console.log(`❌ All ${maxRetries} Gemini API attempts failed`);
          throw error;
        }

        const delay = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    if (!response) {
      throw new Error(
        "Failed to get response from Gemini API after all retries",
      );
    }

    // Extract the generated image from Gemini response
    let generatedImageBuffer = processedImage.buffer;

    if (response.candidates && response.candidates.length > 0) {
      const content = response.candidates[0].content;
      if (content && content.parts) {
        for (const part of content.parts) {
          if (part.inlineData && part.inlineData.data) {
            const rawGeneratedBuffer = Buffer.from(
              part.inlineData.data,
              "base64",
            );

            const originalMetadata = await sharp(
              processedImage.buffer,
            ).metadata();
            const targetWidth = originalMetadata.width || 1920;
            const targetHeight = originalMetadata.height || 1080;

            console.log(
              `🎃 Resizing Halloween image to match original: ${targetWidth}x${targetHeight}`,
            );

            generatedImageBuffer = await resizeGeneratedImageToOriginalAspect(
              rawGeneratedBuffer,
              processedImage,
              85,
              "Halloween image",
            );

            console.log(
              "✓ Gemini generated and resized Halloween image successfully",
            );
            break;
          }
        }
      }
    }

    // Step 9: Return the edited image buffer, applied decorations array, and final prompt
    return {
      editedImageBuffer: generatedImageBuffer,
      appliedDecorations: appliedDecorations,
      prompt: finalPrompt,
    };
  } catch (error) {
    console.error("Gemini Halloween processing error:", error);
    throw new Error(
      `Halloween processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Process Christmas lights visualization with Gemini AI
 * Converts to nighttime, adds C9 rope lights, and optionally snow
 */
export async function processChristmasLightsWithGemini(
  imageBuffer: Buffer,
  lightType: string,
  lightColor: string,
  addSnow: boolean,
  usePremiumModel = false,
): Promise<{
  editedImageBuffer: Buffer;
  prompt: string;
  appliedFeatures: string[];
}> {
  try {
    console.log(
      `🎄 Starting Christmas lights processing: ${lightType}, ${lightColor}, snow=${addSnow}`,
    );

    // Step 1: Process and resize image to max 1920x1080
    const processedImage = await processImageSize(imageBuffer);
    console.log(
      `✓ Image processed: ${processedImage.width}x${processedImage.height}`,
    );

    // Step 2: Build light type details
    const appliedFeatures: string[] = [];
    let lightTypeDetails = "";

    switch (lightType) {
      case "c9-rope":
        lightTypeDetails =
          'C9 Rope Lights (classic large bulb style, 1.25" diameter bulbs)';
        break;
      case "c7-rope":
        lightTypeDetails =
          'C7 Rope Lights (medium bulb classic style, 1" diameter bulbs, slightly smaller than C9)';
        break;
      case "icicle":
        lightTypeDetails =
          "Icicle Lights (hanging dripping effect, vertical strands hanging from roofline creating icicle appearance)";
        break;
      case "mini-lights":
        lightTypeDetails =
          'Mini Lights (small traditional bulbs, 0.5" diameter, densely packed classic Christmas style)';
        break;
      case "led-rope":
        lightTypeDetails =
          "LED Rope Lights (modern continuous glow, smooth tube appearance without individual bulb separation)";
        break;
      default:
        lightTypeDetails = "C9 Rope Lights (classic large bulb style)";
    }

    // Step 3: Build color temperature details based on selection
    let colorDetails = "";
    let colorTemp = "";

    switch (lightColor) {
      case "warm-white":
        colorTemp = "Warm White with 2700K color temperature";
        colorDetails =
          "soft golden glow like candlelight or traditional incandescent bulbs. The lights should have a cozy, inviting yellowish tone that feels nostalgic and warm.";
        appliedFeatures.push(`${lightTypeDetails} - Warm White (2700K)`);
        break;
      case "pure-white":
        colorTemp = "Pure White with 4000K color temperature";
        colorDetails =
          "true white with no yellow or blue tint. Clean, neutral, modern brightness that appears as genuine white light without any color cast.";
        appliedFeatures.push(`${lightTypeDetails} - Pure White (4000K)`);
        break;
      case "cool-white":
        colorTemp = "Cool White with 8000K color temperature";
        colorDetails =
          "bright white with icy bluish hue. Crisp, energetic winter wonderland appearance with a clear blue-white tone like fresh snow under bright sky.";
        appliedFeatures.push(`${lightTypeDetails} - Cool White (8000K)`);
        break;
      case "rgb-multicolor":
        colorTemp = "RGB Multicolor";
        colorDetails =
          "vibrant red, green, blue, yellow, and other festive colors. Dynamic mix of traditional Christmas colors creating a cheerful, colorful display. Each bulb should be a different bright color.";
        appliedFeatures.push(`${lightTypeDetails} - RGB Multicolor`);
        break;
      default:
        colorTemp = "Warm White";
        colorDetails = "soft golden glow";
        appliedFeatures.push(lightTypeDetails);
    }

    // Step 4: Add snow if requested
    let snowDetails = "";
    if (addSnow) {
      snowDetails =
        "\n\n4. ADD fresh snow covering: Light blanket of fresh white snow on roof, yard, landscaping, and ground. Natural accumulation with realistic texture and depth. Snow should look freshly fallen with clean white appearance.";
      appliedFeatures.push("Fresh Snow");
    }

    // Step 5: Build the complete prompt with nighttime conversion
    const finalPrompt = `Transform this home into a beautiful Christmas lights display with the following changes:

1. CONVERT TO NIGHTTIME: Transform the scene to nighttime with dark evening sky (deep blue-black gradient). The sky should be clearly night - not dusk, not daytime. Make it look like 8-9 PM on a winter evening with natural darkness.

2. ADD CHRISTMAS LIGHTS: Install ${lightTypeDetails} in ${colorTemp} - ${colorDetails}
   
   BULB SPACING AND DENSITY (CRITICAL):
   - Bulbs must be VERY CLOSELY SPACED - only 4 to 6 inches apart (10-15 cm)
   - Create a DENSE, CONTINUOUS line of lights with MANY bulbs
   - The lights should appear as an almost unbroken string of closely-packed bulbs
   - Do NOT spread bulbs far apart - they should be tightly clustered
   - Professional installation means ABUNDANT bulb coverage, not sparse placement
   
   INSTALLATION PATTERN (FOLLOW EXACTLY):
   - ONLY install lights along the ROOFLINE where the roof meets the fascia/gutter
   - Line roofline edges, peaks, and eaves with densely-packed continuous lights
   - Install lights ONLY on the roofline - nowhere else
   - DO NOT put lights around windows or doors
   - DO NOT put lights on garage door trim or garage areas
   - DO NOT put lights on siding, walls, or lower trim areas
   - DO NOT create multiple rows or layers of lights
   - ONE continuous dense line of lights along the roofline ONLY
   - Lights should be THE PRIMARY light source illuminating the home from the roofline
   - ${lightType === "icicle" ? "Dense vertical strands hanging down from roofline only, creating thick icicle dripping effect" : "Each individual bulb clearly visible with proper glow and accurate color"}
   - ${lightType === "led-rope" ? "Smooth continuous tube glow without individual bulb separation" : "Individual bulbs tightly spaced creating nearly continuous coverage"}
   - For RGB multicolor, ensure each closely-spaced bulb shows a different vibrant color (red, green, blue, yellow, orange, pink) in a repeating pattern

3. LIGHTING EFFECTS: The densely-packed Christmas lights should cast realistic, abundant glow onto the house exterior. With so many closely-spaced lights, the illumination should be bright and festive. The colored light from the bulbs should illuminate nearby surfaces (roof, walls, trim) with their corresponding color. Warm whites cast golden glow, cool whites cast bluish glow, RGB casts colorful multi-hued glow. Make the lighting look professionally done, abundant, and realistic.${snowDetails}

CRITICAL RULES:
- Make it CLEARLY NIGHTTIME - dark sky, evening atmosphere
- Christmas lights must be the dominant light source on the home
- LIGHTS ONLY ON ROOFLINE - do NOT put lights on windows, doors, garage, siding, or walls
- ONLY ONE LINE OF LIGHTS along the roofline where roof meets fascia/gutter
- BULBS MUST BE DENSELY PACKED - 4 to 6 inches apart maximum, creating continuous coverage
- Use MANY bulbs to create professional, abundant lighting display along roofline
- Color temperature MUST BE ACCURATE - ${colorTemp} has specific appearance described above
- Light TYPE must match ${lightTypeDetails} exactly - get the size and style right
- Keep the house structure, landscaping, and all existing features exactly as they are
- Only add lights${addSnow ? ", snow," : ""} and nighttime conversion - nothing else
- ${imageDimensionsInstruction(processedImage)}
- Make it look like a professional Christmas lights installation photograph taken at night with DENSE bulb coverage on roofline ONLY

Create a stunning nighttime Christmas scene with DENSELY-PACKED, ABUNDANT ${lightTypeDetails} in ${colorTemp} illuminating the home with many closely-spaced bulbs installed ONLY along the roofline.`;

    console.log("🎄 CHRISTMAS LIGHTS GEMINI PROMPT:");
    console.log("=====================================");
    console.log(finalPrompt);
    console.log("=====================================");

    // Step 5: Call Gemini API with retry logic
    const base64Image = processedImage.buffer.toString("base64");

    const contentParts: any[] = [
      { text: finalPrompt },
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg",
        },
      },
    ];

    let response;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🎄 Gemini API attempt ${attempt}/${maxRetries}`);

        const imageModel = getImageGenerationModel(usePremiumModel);
        console.log(`Using Gemini image model: ${imageModel}`);

        response = await generateImageContentWithFallback({
          model: imageModel,
          fallbackModel: STANDARD_IMAGE_MODEL,
          contents: [
            {
              role: "user",
              parts: contentParts,
            },
          ],
          config: {
            responseModalities: [Modality.TEXT, Modality.IMAGE],
          },
        });

        console.log(`✓ Gemini API succeeded on attempt ${attempt}`);
        break;
      } catch (error: any) {
        console.log(
          `❌ Gemini API attempt ${attempt} failed:`,
          error.message || error,
        );

        if (attempt === maxRetries) {
          console.log(`❌ All ${maxRetries} Gemini API attempts failed`);
          throw error;
        }

        const delay = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    if (!response) {
      throw new Error(
        "Failed to get response from Gemini API after all retries",
      );
    }

    // Step 6: Extract generated image from response
    let generatedImageBuffer = processedImage.buffer;

    if (response.candidates && response.candidates.length > 0) {
      const content = response.candidates[0].content;
      if (content && content.parts) {
        for (const part of content.parts) {
          if (part.inlineData && part.inlineData.data) {
            const rawGeneratedBuffer = Buffer.from(
              part.inlineData.data,
              "base64",
            );

            const originalMetadata = await sharp(
              processedImage.buffer,
            ).metadata();
            const targetWidth = originalMetadata.width || 1920;
            const targetHeight = originalMetadata.height || 1080;

            console.log(
              `🎄 Resizing Christmas image to match original: ${targetWidth}x${targetHeight}`,
            );

            generatedImageBuffer = await resizeGeneratedImageToOriginalAspect(
              rawGeneratedBuffer,
              processedImage,
              85,
              "Christmas image",
            );

            console.log(
              "✓ Gemini generated Christmas lights image successfully",
            );
            break;
          }
        }
      }
    }

    return {
      editedImageBuffer: generatedImageBuffer,
      appliedFeatures: appliedFeatures,
      prompt: finalPrompt,
    };
  } catch (error) {
    console.error("Gemini Christmas lights processing error:", error);
    throw new Error(
      `Christmas lights processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
