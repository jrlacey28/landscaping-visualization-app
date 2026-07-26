import assert from "node:assert/strict";
import {
  IMAGE_COMPARISON_MODELS,
  runImageModelComparison,
} from "../server/image-model-comparison";

assert.deepEqual(
  IMAGE_COMPARISON_MODELS.map((model) => model.id),
  [
    "gemini-2.5-flash-image",
    "gemini-3.1-flash-image",
    "gemini-3-pro-image",
  ],
);
assert.equal(
  IMAGE_COMPARISON_MODELS.some((model) => model.id.includes("imagen")),
  false,
);

const calledModels: string[] = [];
const comparison = await runImageModelComparison(async (modelId) => {
  calledModels.push(modelId);
  return {
    editedImageBuffer: Buffer.from(`result:${modelId}`),
    prompt: "ONE IDENTICAL PRODUCTION PROMPT",
  };
});

assert.deepEqual(
  calledModels,
  IMAGE_COMPARISON_MODELS.map((model) => model.id),
);
assert.equal(comparison.results.length, 3);
assert.equal(comparison.promptMatchesAcrossModels, true);
assert.equal(comparison.prompt, "ONE IDENTICAL PRODUCTION PROMPT");
assert.ok(
  comparison.results.every(
    (result) =>
      result.status === "success" &&
      result.imageDataUrl.startsWith("data:image/jpeg;base64,"),
  ),
);

console.log("Client image model comparison tests passed");
