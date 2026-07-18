export type AssignableExteriorColor = {
  label?: string;
  value?: string;
  hex?: string;
};

export type ColorAssignableExteriorDesign = {
  allowedColorValues?: string[];
};

export function normalizeExteriorAssignmentValue(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function getAssignableExteriorColorValue(color: AssignableExteriorColor) {
  const explicitValue = normalizeExteriorAssignmentValue(color.value);
  if (explicitValue) return explicitValue;

  const label = normalizeExteriorAssignmentValue(color.label || "custom");
  const hex = normalizeExteriorAssignmentValue(String(color.hex || "").replace("#", ""));
  return normalizeExteriorAssignmentValue(`tenant_color_${label}_${hex}`);
}

export function getDesignColorValues(
  design: ColorAssignableExteriorDesign,
  availableColors: AssignableExteriorColor[],
) {
  const values = Array.isArray(design.allowedColorValues)
    ? design.allowedColorValues
    : availableColors.map(getAssignableExteriorColorValue);

  return Array.from(new Set(values.map(normalizeExteriorAssignmentValue).filter(Boolean)));
}

export function isColorAssignedToDesign(
  design: ColorAssignableExteriorDesign,
  color: AssignableExteriorColor,
  availableColors: AssignableExteriorColor[],
) {
  return getDesignColorValues(design, availableColors).includes(
    getAssignableExteriorColorValue(color),
  );
}

export function makeDesignColorAssignmentsExplicit<T extends ColorAssignableExteriorDesign>(
  designs: T[],
  availableColors: AssignableExteriorColor[],
) {
  return designs.map((design) =>
    Array.isArray(design.allowedColorValues)
      ? design
      : { ...design, allowedColorValues: getDesignColorValues(design, availableColors) },
  );
}

export function setColorAssignmentForDesign<T extends ColorAssignableExteriorDesign>(
  designs: T[],
  availableColors: AssignableExteriorColor[],
  color: AssignableExteriorColor,
  designIndex: number,
  checked: boolean,
) {
  const colorValue = getAssignableExteriorColorValue(color);

  return designs.map((design, currentIndex) => {
    if (currentIndex !== designIndex) return design;

    const currentValues = getDesignColorValues(design, availableColors);
    const allowedColorValues = checked
      ? Array.from(new Set([...currentValues, colorValue]))
      : currentValues.filter((value) => value !== colorValue);

    return { ...design, allowedColorValues };
  });
}

export function replaceColorValueInDesignAssignments<T extends ColorAssignableExteriorDesign>(
  designs: T[],
  previousValue: string,
  nextValue: string,
) {
  const normalizedPrevious = normalizeExteriorAssignmentValue(previousValue);
  const normalizedNext = normalizeExteriorAssignmentValue(nextValue);
  if (!normalizedPrevious || !normalizedNext || normalizedPrevious === normalizedNext) return designs;

  return designs.map((design) => {
    if (!Array.isArray(design.allowedColorValues)) return design;
    if (!design.allowedColorValues.map(normalizeExteriorAssignmentValue).includes(normalizedPrevious)) {
      return design;
    }

    return {
      ...design,
      allowedColorValues: Array.from(new Set(
        design.allowedColorValues.map((value) =>
          normalizeExteriorAssignmentValue(value) === normalizedPrevious ? normalizedNext : value,
        ),
      )),
    };
  });
}

export function removeColorFromDesignAssignments<T extends ColorAssignableExteriorDesign>(
  designs: T[],
  color: AssignableExteriorColor,
) {
  const colorValue = getAssignableExteriorColorValue(color);

  return designs.map((design) => {
    if (!Array.isArray(design.allowedColorValues)) return design;
    return {
      ...design,
      allowedColorValues: design.allowedColorValues.filter(
        (value) => normalizeExteriorAssignmentValue(value) !== colorValue,
      ),
    };
  });
}
