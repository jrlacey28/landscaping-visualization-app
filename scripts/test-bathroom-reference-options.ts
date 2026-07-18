import assert from "node:assert/strict";
import {
  buildTenantInteriorOptionPrompt,
  collectInteriorReferenceImageUrls,
  getInteriorReferencePreviewUrl,
} from "../shared/interior-reference-options";

const tileSample = {
  referenceImageUrls: ["", "/uploads/calacatta-blue.jpg", "/uploads/detail.jpg"],
};

assert.deepEqual(
  collectInteriorReferenceImageUrls(tileSample),
  ["/uploads/calacatta-blue.jpg", "/uploads/detail.jpg"],
  "blank references must be removed while preserving the uploaded sample order",
);
assert.equal(
  getInteriorReferencePreviewUrl(tileSample),
  "/uploads/calacatta-blue.jpg",
  "the first bathroom reference must be the customer-facing preview",
);

const bathroomPrompt = buildTenantInteriorOptionPrompt({
  service: "bathroom",
  label: "Calacatta Blue Tile",
  prompt: "Use this tile on the shower walls.",
  referenceImageUrls: collectInteriorReferenceImageUrls(tileSample),
});
assert.match(bathroomPrompt, /complete multicolor pattern/i);
assert.match(bathroomPrompt, /Do not flatten or simplify/i);

const kitchenPrompt = buildTenantInteriorOptionPrompt({
  service: "kitchen",
  label: "Sample",
  prompt: "Use this sample.",
  referenceImageUrls: ["/uploads/sample.jpg"],
});
assert.equal(kitchenPrompt, "Use this sample.", "other services must keep their existing behavior");

console.log("Bathroom reference option regression passed");
