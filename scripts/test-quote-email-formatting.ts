import assert from "node:assert/strict";

import { formatSelectedStyleTags } from "../server/email-service";

const tags = formatSelectedStyleTags({
  roof: {
    type: "asphalt_shingles_onyx_black",
    enabled: true,
  },
  siding: {
    type: "tenant_custom_exterior_siding_sand_castle__color__tenant_color_sand_cast_c8b393",
    enabled: true,
  },
  windows: {
    type: "",
    enabled: false,
  },
  surpriseMe: {
    type: "",
    enabled: false,
  },
});

assert.deepEqual(tags, [
  { label: "Roof", value: "Asphalt Shingles Onyx Black" },
  { label: "Siding", value: "Sand Castle · Sand Cast" },
]);

assert.equal(
  JSON.stringify(tags).includes("enabled"),
  false,
  "email tags should not expose selection metadata",
);

assert.deepEqual(
  formatSelectedStyleTags(JSON.stringify({ roof: { type: "steel_roof_black", enabled: true } })),
  [{ label: "Roof", value: "Steel Roof Black" }],
  "legacy JSON strings should also become readable tags",
);

console.log("Quote email selection formatting regression passed");
