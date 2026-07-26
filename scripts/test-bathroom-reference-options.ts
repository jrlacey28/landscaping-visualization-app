import assert from "node:assert/strict";
import {
  buildTenantInteriorOptionPrompt,
  collectInteriorReferenceImageUrls,
  getInteriorReferencePreviewUrl,
} from "../shared/interior-reference-options";
import { buildTenantInteriorCustomContext } from "../server/tenant-service-context";

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

const tenantContext = buildTenantInteriorCustomContext(
  {
    embedCustomizations: {
      interiorOptions: {
        bathroom: [
          {
            label: "Calacatta Blue Tile",
            prompt: "Use this tile on the shower walls.",
            referenceImageUrls: [
              "/uploads/calacatta-blue.jpg",
              "/uploads/detail.jpg",
            ],
          },
        ],
      },
    },
  },
  "bathroom",
  ["tenant_custom_calacatta_blue_tile"],
);

assert.deepEqual(tenantContext.referenceImageUrls, [
  "/uploads/calacatta-blue.jpg",
  "/uploads/detail.jpg",
]);
assert.match(tenantContext.prompt, /CLIENT-SPECIFIC EMBED OPTIONS/);
assert.match(tenantContext.prompt, /complete multicolor pattern/i);

console.log("Bathroom reference option regression passed");
