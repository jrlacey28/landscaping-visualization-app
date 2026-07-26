import assert from "node:assert/strict";
import {
  IMAGE_COMPARISON_MODELS,
  extractFinalGeminiImage,
  extractImagenImage,
} from "../server/image-model-comparison";

assert.deepEqual(
  IMAGE_COMPARISON_MODELS.map((model) => model.id),
  [
    "gemini-2.5-flash-image",
    "gemini-3.1-flash-image",
    "gemini-3-pro-image",
    "imagen-4.0-ultra-generate-001",
  ],
);

const geminiImage = extractFinalGeminiImage({
  candidates: [
    {
      content: {
        parts: [
          {
            inlineData: {
              data: "intermediate-thought-image",
              mimeType: "image/png",
            },
          },
          { inlineData: { data: "final-image", mimeType: "image/webp" } },
        ],
      },
    },
  ],
});

assert.deepEqual(geminiImage, {
  data: "final-image",
  mimeType: "image/webp",
});

const imagenImage = extractImagenImage({
  generatedImages: [
    {
      image: {
        imageBytes: "imagen-result",
        mimeType: "image/jpeg",
      },
    },
  ],
});

assert.deepEqual(imagenImage, {
  data: "imagen-result",
  mimeType: "image/jpeg",
});

assert.throws(
  () =>
    extractImagenImage({
      generatedImages: [{ raiFilteredReason: "Blocked by safety policy" }],
    }),
  /Blocked by safety policy/,
);

console.log("Image model comparison tests passed");
