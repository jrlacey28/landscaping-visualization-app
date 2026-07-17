import assert from "node:assert/strict";
import { validateExteriorSelection } from "../client/src/lib/embed-exterior-selection";

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
