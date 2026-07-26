import { GoogleGenAI, Modality } from "@google/genai";

export const IMAGE_COMPARISON_MODELS = [
  {
    id: "gemini-2.5-flash-image",
    label: "Gemini 2.5 Flash Image",
    api: "generateContent",
  },
  {
    id: "gemini-3.1-flash-image",
    label: "Gemini 3.1 Flash Image",
    api: "generateContent",
  },
  {
    id: "gemini-3-pro-image",
    label: "Gemini 3 Pro Image",
    api: "generateContent",
  },
  {
    id: "imagen-4.0-ultra-generate-001",
    label: "Imagen 4 Ultra",
    api: "generateImages",
  },
] as const;

type ComparisonModel = (typeof IMAGE_COMPARISON_MODELS)[number];

export type ImageModelComparisonResult =
  | {
      modelId: string;
      label: string;
      status: "success";
      durationMs: number;
      imageDataUrl: string;
      mimeType: string;
    }
  | {
      modelId: string;
      label: string;
      status: "error";
      durationMs: number;
      error: string;
    };

type GeminiResponseLike = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        inlineData?: {
          data?: string;
          mimeType?: string;
        };
      }>;
    };
  }>;
};

type ImagenResponseLike = {
  generatedImages?: Array<{
    image?: {
      imageBytes?: string;
      mimeType?: string;
    };
    raiFilteredReason?: string;
  }>;
};

type ExtractedImage = {
  data: string;
  mimeType: string;
};

function getApiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY ||
    ""
  ).trim();
}

let comparisonClient: GoogleGenAI | undefined;

function getComparisonClient() {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error("Gemini API key is not configured");
  }

  comparisonClient ??= new GoogleGenAI({ apiKey });
  return comparisonClient;
}

export function extractFinalGeminiImage(
  response: GeminiResponseLike,
): ExtractedImage {
  const parts = response.candidates?.[0]?.content?.parts || [];

  // Gemini 3 can return thought images before the final rendered image.
  // Reading from the end ensures the comparison displays the final output.
  for (let index = parts.length - 1; index >= 0; index -= 1) {
    const inlineData = parts[index]?.inlineData;
    if (inlineData?.data) {
      return {
        data: inlineData.data,
        mimeType: inlineData.mimeType || "image/png",
      };
    }
  }

  throw new Error("The model completed without returning an image");
}

export function extractImagenImage(
  response: ImagenResponseLike,
): ExtractedImage {
  const generatedImage = response.generatedImages?.[0];
  const imageBytes = generatedImage?.image?.imageBytes;

  if (!imageBytes) {
    const filteredReason = generatedImage?.raiFilteredReason;
    throw new Error(
      filteredReason
        ? `Imagen did not return an image: ${filteredReason}`
        : "Imagen completed without returning an image",
    );
  }

  return {
    data: imageBytes,
    mimeType: generatedImage.image?.mimeType || "image/jpeg",
  };
}

function safeErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/AIza[A-Za-z0-9_-]+/g, "[redacted]").slice(0, 600);
}

async function generateWithModel(
  model: ComparisonModel,
  prompt: string,
): Promise<ExtractedImage> {
  const client = getComparisonClient();

  if (model.api === "generateImages") {
    const response = await client.models.generateImages({
      model: model.id,
      prompt,
      config: {
        numberOfImages: 1,
        includeRaiReason: true,
        outputMimeType: "image/jpeg",
      },
    });

    return extractImagenImage(response);
  }

  const response = await client.models.generateContent({
    model: model.id,
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  return extractFinalGeminiImage(response);
}

async function runSingleComparison(
  model: ComparisonModel,
  prompt: string,
): Promise<ImageModelComparisonResult> {
  const startedAt = Date.now();

  try {
    const image = await generateWithModel(model, prompt);
    return {
      modelId: model.id,
      label: model.label,
      status: "success",
      durationMs: Date.now() - startedAt,
      imageDataUrl: `data:${image.mimeType};base64,${image.data}`,
      mimeType: image.mimeType,
    };
  } catch (error) {
    return {
      modelId: model.id,
      label: model.label,
      status: "error",
      durationMs: Date.now() - startedAt,
      error: safeErrorMessage(error),
    };
  }
}

export async function runImageModelComparison(prompt: string) {
  return Promise.all(
    IMAGE_COMPARISON_MODELS.map((model) =>
      runSingleComparison(model, prompt),
    ),
  );
}
