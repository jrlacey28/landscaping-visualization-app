export type ExteriorSelectionState = {
  roof: { enabled: boolean; style: string; color: string };
  siding: { enabled: boolean; style: string; color: string };
  windows: { enabled: boolean; style: string; color: string };
  surpriseMe: { enabled: boolean; selected: boolean };
};

export type ExteriorSelectedStyles = {
  roof: string;
  siding: string;
  windows: string;
  surpriseMe: string;
};

export function getExteriorToggleSelection(
  selectedStyles: ExteriorSelectedStyles,
  category: keyof ExteriorSelectedStyles,
  enabled: boolean,
  currentCategorySelection = "",
): ExteriorSelectedStyles {
  if (category === "surpriseMe") {
    return enabled
      ? {
          roof: "",
          siding: "",
          windows: "",
          surpriseMe: selectedStyles.surpriseMe || "random_roof_and_siding",
        }
      : { ...selectedStyles, surpriseMe: "" };
  }

  return {
    ...selectedStyles,
    [category]: enabled ? currentCategorySelection : "",
    surpriseMe: enabled ? "" : selectedStyles.surpriseMe,
  };
}

export function validateExteriorSelection(state: ExteriorSelectionState) {
  const enabledCategories = [state.roof, state.siding, state.windows].filter((category) => category.enabled);
  const hasEnabledCategories = enabledCategories.length > 0 || state.surpriseMe.enabled;
  const allStandardCategoriesComplete = enabledCategories.every(
    (category) => Boolean(category.style && category.color),
  );
  const surpriseMeComplete = !state.surpriseMe.enabled || state.surpriseMe.selected;

  return {
    hasEnabledCategories,
    allEnabledCategoriesComplete:
      hasEnabledCategories && allStandardCategoriesComplete && surpriseMeComplete,
  };
}
