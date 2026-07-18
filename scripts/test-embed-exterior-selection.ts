import assert from "node:assert/strict";
import {
  getExteriorToggleSelection,
  validateExteriorSelection,
} from "../client/src/lib/embed-exterior-selection";

const emptyCategory = { enabled: false, style: "", color: "" };

assert.deepEqual(
  validateExteriorSelection({
    roof: emptyCategory,
    siding: { enabled: true, style: "vinyl_siding", color: "" },
    windows: emptyCategory,
    surpriseMe: { enabled: false, selected: false },
  }),
  { hasEnabledCategories: true, allEnabledCategoriesComplete: false },
  "siding without a color must remain incomplete",
);

assert.deepEqual(
  getExteriorToggleSelection(
    {
      roof: "asphalt_shingles_charcoal_gray",
      siding: "vinyl_siding_white",
      windows: "window_grid_black",
      surpriseMe: "",
    },
    "surpriseMe",
    true,
  ),
  {
    roof: "",
    siding: "",
    windows: "",
    surpriseMe: "random_roof_and_siding",
  },
  "surprise me must clear roof, siding, and windows in one transition",
);

assert.deepEqual(
  getExteriorToggleSelection(
    {
      roof: "",
      siding: "",
      windows: "",
      surpriseMe: "random_roof_and_siding",
    },
    "windows",
    true,
    "window_grid_black",
  ),
  {
    roof: "",
    siding: "",
    windows: "window_grid_black",
    surpriseMe: "",
  },
  "enabling windows must turn surprise me off",
);

assert.deepEqual(
  validateExteriorSelection({
    roof: { enabled: true, style: "asphalt_shingles", color: "charcoal" },
    siding: { enabled: true, style: "vinyl_siding", color: "" },
    windows: emptyCategory,
    surpriseMe: { enabled: false, selected: false },
  }),
  { hasEnabledCategories: true, allEnabledCategoriesComplete: false },
  "one complete category must not hide another incomplete enabled category",
);

assert.deepEqual(
  validateExteriorSelection({
    roof: emptyCategory,
    siding: { enabled: true, style: "vinyl_siding", color: "forest_green" },
    windows: emptyCategory,
    surpriseMe: { enabled: false, selected: false },
  }),
  { hasEnabledCategories: true, allEnabledCategoriesComplete: true },
  "style and color together should complete the enabled category",
);

console.log("Embed exterior selection validation regression passed");
