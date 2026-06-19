import assert from "node:assert/strict";

import { buildTenantExteriorCustomContext } from "../server/tenant-exterior-context";

const selectedSiding =
  "tenant_custom_exterior_siding_polar_wall_plus__color__tenant_color_geneva_blue_6b858e";

const tenant = {
  embedCustomizations: {
    exteriorOptions: {
      siding: [
        {
          label: "Polar Wall Plus",
          prompt:
            "Use Polar Wall Plus manufactured siding with its product-specific profile and texture.",
          referenceImageUrls: ["/uploads/polar-wall-plus-reference.jpg"],
        },
      ],
    },
    sidingColors: [
      {
        label: "Geneva Blue",
        hex: "#6b858e",
        prompt: "Use Geneva Blue as the selected tenant siding color.",
      },
    ],
  },
};

const context = buildTenantExteriorCustomContext(tenant, {
  siding: selectedSiding,
});

assert.equal(
  context.debug.selectedSidingStyleId,
  "tenant_custom_exterior_siding_polar_wall_plus",
);
assert.equal(context.debug.selectedColorId, "tenant_color_geneva_blue_6b858e");
assert.equal(context.debug.resolvedSidingStyleName, "Polar Wall Plus");
assert.equal(context.debug.resolvedSidingColorName, "Geneva Blue");
assert.equal(context.debug.resolvedSidingColorHex, "#6b858e");
assert.equal(context.referenceImages.length, 1);
assert.equal(context.referenceImages[0].url, "/uploads/polar-wall-plus-reference.jpg");
assert.equal(context.referenceImages[0].role, "siding material reference");
assert.equal(context.referenceImages[0].category, "siding");
assert.match(context.prompt, /Image 2 is the siding material reference/);
assert.match(context.prompt, /Do not use generic horizontal vinyl siding/);
assert.match(context.prompt, /Do not create smooth painted siding/);
assert.match(context.prompt, /Use the selected color: Geneva Blue \/ #6b858e/);

console.log("Tenant custom siding context regression passed");
