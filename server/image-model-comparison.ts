export const IMAGE_COMPARISON_MODELS = [
  {
    id: "gemini-2.5-flash-image",
    label: "Gemini 2.5 Flash Image",
  },
  {
    id: "gemini-3.1-flash-image",
    label: "Gemini 3.1 Flash Image",
  },
  {
    id: "gemini-3-pro-image",
    label: "Gemini 3 Pro Image",
  },
] as const;

export type ImageComparisonModelId =
  (typeof IMAGE_COMPARISON_MODELS)[number]["id"];

export type ComparisonGenerationOutput = {
  editedImageBuffer: Buffer;
  prompt: string;
};

export type ImageModelComparisonResult =
  | {
      modelId: ImageComparisonModelId;
      label: string;
      status: "success";
      durationMs: number;
      imageDataUrl: string;
      mimeType: "image/jpeg";
      prompt: string;
    }
  | {
      modelId: ImageComparisonModelId;
      label: string;
      status: "error";
      durationMs: number;
      error: string;
    };

function safeErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/AIza[A-Za-z0-9_-]+/g, "[redacted]").slice(0, 600);
}

export async function runImageModelComparison(
  generate: (
    modelId: ImageComparisonModelId,
  ) => Promise<ComparisonGenerationOutput>,
) {
  const results = await Promise.all(
    IMAGE_COMPARISON_MODELS.map(
      async (model): Promise<ImageModelComparisonResult> => {
        const startedAt = Date.now();

        try {
          const generated = await generate(model.id);
          return {
            modelId: model.id,
            label: model.label,
            status: "success",
            durationMs: Date.now() - startedAt,
            imageDataUrl: `data:image/jpeg;base64,${generated.editedImageBuffer.toString("base64")}`,
            mimeType: "image/jpeg",
            prompt: generated.prompt,
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
      },
    ),
  );

  const successfulPrompts = results
    .filter(
      (
        result,
      ): result is Extract<
        ImageModelComparisonResult,
        { status: "success" }
      > => result.status === "success",
    )
    .map((result) => result.prompt);
  const prompt = successfulPrompts[0] || "";
  const promptMatchesAcrossModels =
    successfulPrompts.length === IMAGE_COMPARISON_MODELS.length &&
    successfulPrompts.every((candidate) => candidate === prompt);

  return {
    results,
    prompt,
    promptMatchesAcrossModels,
  };
}
