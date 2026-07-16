import assert from "node:assert/strict";

import { buildTenantExteriorCustomContext } from "../server/tenant-exterior-context";
import { getStyleConfig } from "../server/style-config";

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

const windowTenant = {
  embedCustomizations: {
    exteriorOptions: {
      windows: [
        {
          label: "Modern Casement",
          prompt: "Use the client's modern casement window profile.",
          referenceImageUrls: ["/uploads/modern-casement.jpg"],
          allowedColorValues: ["tenant_color_warm_bronze_5c4033"],
        },
      ],
    },
    windowColors: [
      {
        label: "Warm Bronze",
        hex: "#5c4033",
        prompt: "Use the configured warm bronze window finish.",
      },
      {
        label: "Bright White",
        hex: "#ffffff",
        prompt: "Use the configured bright white window finish.",
      },
    ],
  },
};

const allowedWindowContext = buildTenantExteriorCustomContext(windowTenant, {
  windows:
    "tenant_custom_exterior_windows_modern_casement__color__tenant_color_warm_bronze_5c4033",
});
assert.match(allowedWindowContext.prompt, /modern casement window profile/i);
assert.match(allowedWindowContext.prompt, /configured warm bronze window finish/i);
assert.equal(allowedWindowContext.referenceImages[0].category, "windows");

const blockedWindowColorContext = buildTenantExteriorCustomContext(windowTenant, {
  windows:
    "tenant_custom_exterior_windows_modern_casement__color__tenant_color_bright_white_ffffff",
});
assert.doesNotMatch(blockedWindowColorContext.prompt, /configured bright white window finish/i);

const builtInWindowConfig = getStyleConfig("window_grid_black");
assert.equal(builtInWindowConfig.category, "windows");
assert.match(builtInWindowConfig.prompt, /grid frame design/i);
assert.match(builtInWindowConfig.prompt, /matte black/i);

console.log("Tenant custom exterior context regression passed");
