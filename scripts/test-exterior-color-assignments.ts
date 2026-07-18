import assert from "node:assert/strict";

import {
  getAssignableExteriorColorValue,
  isColorAssignedToDesign,
  makeDesignColorAssignmentsExplicit,
  removeColorFromDesignAssignments,
  replaceColorValueInDesignAssignments,
  setColorAssignmentForDesign,
} from "../client/src/lib/exterior-color-assignments";

const colors = [
  { label: "Enterprise Forest", value: "tenant_color_enterprise_forest_185b45", hex: "#185b45" },
  { label: "Warm Graphite", value: "tenant_color_warm_graphite_34363c", hex: "#34363c" },
];

const legacyDesigns = [{ label: "Vinyl Siding" }];
assert.equal(
  isColorAssignedToDesign(legacyDesigns[0], colors[0], colors),
  true,
  "legacy designs without an explicit list should continue to allow all existing colors",
);

const assignmentsBeforeAddingNewColor = makeDesignColorAssignmentsExplicit(legacyDesigns, colors);
assert.deepEqual(
  assignmentsBeforeAddingNewColor[0].allowedColorValues,
  [colors[0].value, colors[1].value],
  "existing colors should be frozen before a new color is added so the new color starts unassigned",
);

const withGraphiteRemoved = setColorAssignmentForDesign(
  legacyDesigns,
  colors,
  colors[1],
  0,
  false,
);
assert.deepEqual(withGraphiteRemoved[0].allowedColorValues, [colors[0].value]);

const withGraphiteRestored = setColorAssignmentForDesign(
  withGraphiteRemoved,
  colors,
  colors[1],
  0,
  true,
);
assert.deepEqual(withGraphiteRestored[0].allowedColorValues, [colors[0].value, colors[1].value]);

const draftColor = { label: "", hex: "#ffffff" };
const namedColor = { label: "Mystic Blue", hex: "#7ca6b2" };
const previousValue = getAssignableExteriorColorValue(draftColor);
const nextValue = getAssignableExteriorColorValue(namedColor);
const renamedAssignments = replaceColorValueInDesignAssignments(
  [{ label: "Fiber Cement", allowedColorValues: [previousValue] }],
  previousValue,
  nextValue,
);
assert.deepEqual(renamedAssignments[0].allowedColorValues, [nextValue]);

const afterDelete = removeColorFromDesignAssignments(
  [
    { label: "Vinyl", allowedColorValues: [colors[0].value, colors[1].value] },
    { label: "Legacy all colors" },
  ],
  colors[0],
);
assert.deepEqual(afterDelete[0].allowedColorValues, [colors[1].value]);
assert.equal(afterDelete[1].allowedColorValues, undefined);

console.log("Exterior color assignment regression passed");
