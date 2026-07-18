import { Fragment, type CSSProperties, type ReactNode, useEffect, useState } from "react";
import { Grid3X3, Home, Layers, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger } from "@/components/ui/select";
import {
  type EmbedDefaultOptionVisibility,
  normalizeEmbedDefaultOptionVisibility,
} from "@/lib/embed-default-visibility";
import {
  getExteriorToggleSelection,
  validateExteriorSelection,
} from "@/lib/embed-exterior-selection";

type ColorOption = {
  value: string;
  label: string;
  hex: string;
  groupLabel?: string;
};

type StyleOption = {
  value: string;
  label: string;
  hex?: string;
  groupLabel?: string;
  custom?: boolean;
  allowedColorValues?: string[];
};

const CUSTOM_STYLE_COLOR_SEPARATOR = "__color__";

interface StyleSelectorProps {
  selectedStyles: {
    roof: string;
    siding: string;
    windows: string;
    surpriseMe: string;
  };
  onStyleChange: (styles: { roof: string; siding: string; windows: string; surpriseMe: string }) => void;
  primaryColor?: string;
  secondaryColor?: string;
  showWindows?: boolean;
  customRoofColors?: ColorOption[];
  customSidingColors?: ColorOption[];
  customWindowColors?: ColorOption[];
  customRoofStyles?: StyleOption[];
  customSidingStyles?: StyleOption[];
  customWindowOptions?: StyleOption[];
  defaultOptionVisibility?: Partial<EmbedDefaultOptionVisibility>;
  compact?: boolean;
  onSelectionStatusChange?: (status: {
    hasEnabledCategories: boolean;
    allEnabledCategoriesComplete: boolean;
  }) => void;
}

const roofStyles: StyleOption[] = [
  { value: "asphalt_shingles", label: "Asphalt Shingles" },
  { value: "steel_roof", label: "Steel Roof" },
  { value: "steel_shingles", label: "Steel Shingles" },
];

const roofColors = [
  { value: "charcoal_gray", label: "Charcoal Gray", hex: "#36454F" },
  { value: "pewter_gray", label: "Pewter Gray", hex: "#8C92AC" },
  { value: "weathered_wood", label: "Weathered Wood", hex: "#79685D" },
  { value: "driftwood", label: "Driftwood", hex: "#A7988A" },
  { value: "desert_tan", label: "Desert Tan", hex: "#D2B48C" },
  { value: "slate_blue", label: "Slate Blue", hex: "#6A7BA2" },
  { value: "williamsburg_gray", label: "Williamsburg Gray", hex: "#B0AFAE" },
  { value: "forest_green", label: "Forest Green", hex: "#014421" },
  { value: "midnight_black", label: "Midnight Black", hex: "#1C1C1C" },
  { value: "moire_black", label: "Moire Black", hex: "#2E2E2E" },
  { value: "merlot", label: "Merlot", hex: "#73343A" },
  { value: "estate_gray", label: "Estate Gray", hex: "#555555" },
  { value: "barkwood", label: "Barkwood", hex: "#5C4033" },
  { value: "harbor_blue", label: "Harbor Blue", hex: "#46647E" },
  { value: "onyx_black", label: "Onyx Black", hex: "#0F0F0F" },
];

const sidingStyles: StyleOption[] = [
  { value: "vinyl_siding", label: "Vinyl Siding" },
  { value: "fiber_cement", label: "Fiber Cement" },
  { value: "wood_siding", label: "Wood Siding" },
  { value: "brick_veneer", label: "Brick Veneer" },
];

const sidingColors = [
  { value: "white", label: "White", hex: "#FFFFFF" },
  { value: "colonial_white", label: "Colonial White", hex: "#FAF9F6" },
  { value: "gray", label: "Gray", hex: "#808080" },
  { value: "greige", label: "Greige", hex: "#BEB6AA" },
  { value: "beige_almond", label: "Beige / Almond", hex: "#F5F5DC" },
  { value: "sandstone", label: "Sandstone", hex: "#C2B280" },
  { value: "navy_coastal_blue", label: "Navy / Coastal Blue", hex: "#2C3E50" },
  { value: "sage_green", label: "Sage Green", hex: "#9C9F84" },
  { value: "forest_green", label: "Forest Green", hex: "#014421" },
  { value: "autumn_red", label: "Autumn Red", hex: "#8B2E2E" },
  { value: "brown_chestnut_espresso", label: "Brown (Chestnut / Espresso)", hex: "#4B3621" },
  { value: "charcoal_dark_gray", label: "Charcoal / Dark Gray", hex: "#333333" },
  { value: "clay_khaki", label: "Clay / Khaki", hex: "#B2A17E" },
  { value: "azure_blue", label: "Azure Blue", hex: "#4A90E2" },
  { value: "savannah_wicker", label: "Savannah Wicker", hex: "#D8CAB1" },
];

const windowStyles: StyleOption[] = [
  { value: "window_frames", label: "Standard Frames" },
  { value: "window_grid", label: "Grid Frames" },
];

const windowColors: ColorOption[] = [
  { value: "black", label: "Black", hex: "#111827" },
  { value: "white", label: "White", hex: "#FFFFFF" },
  { value: "bronze", label: "Bronze", hex: "#5C4033" },
];

function ColorSwatch({ color, className = "h-4 w-4" }: { color: string; className?: string }) {
  return (
    <span
      className={`${className} shrink-0 rounded-full border border-black/20 shadow-inner`}
      style={{ background: color }}
      aria-hidden="true"
    />
  );
}

function ColorOptionContent({ option }: { option: ColorOption }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <ColorSwatch color={option.hex} />
      <span className="truncate">{option.label}</span>
    </span>
  );
}

function StyleOptionContent({ option }: { option: StyleOption }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      {option.hex && <ColorSwatch color={option.hex} />}
      <span className="truncate">{option.label}</span>
    </span>
  );
}

function colorWithAlpha(color: string, alpha: number) {
  const normalized = color.trim().replace("#", "");
  const expanded = normalized.length === 3
    ? normalized.split("").map((character) => `${character}${character}`).join("")
    : normalized;

  if (!/^[0-9a-f]{6}$/i.test(expanded)) {
    return `rgba(71, 85, 105, ${alpha})`;
  }

  const value = Number.parseInt(expanded, 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

function getContrastTextColor(color: string) {
  const normalized = color.trim().replace("#", "");
  const expanded = normalized.length === 3
    ? normalized.split("").map((character) => `${character}${character}`).join("")
    : normalized;

  if (!/^[0-9a-f]{6}$/i.test(expanded)) return "#ffffff";

  const value = Number.parseInt(expanded, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000;
  return luminance > 165 ? "#0f172a" : "#ffffff";
}

type GroupableOption = {
  value: string;
  groupLabel?: string;
};

function groupOptions<T extends GroupableOption>(options: T[]) {
  return options.reduce((groups, option) => {
    const groupLabel = option.groupLabel?.trim() || "";
    const existingGroup = groups.find((group) => group.label === groupLabel);

    if (existingGroup) {
      existingGroup.options.push(option);
    } else {
      groups.push({ label: groupLabel, options: [option] });
    }

    return groups;
  }, [] as Array<{ label: string; options: T[] }>);
}

function GroupedOptionRows<T extends GroupableOption>({
  options,
  renderOption,
}: {
  options: T[];
  renderOption: (option: T) => ReactNode;
}) {
  return (
    <>
      {groupOptions(options).map((group, groupIndex) => (
        <Fragment key={group.label || `ungrouped-${groupIndex}`}>
          {group.label && (
            <p className="pt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {group.label}
            </p>
          )}
          {group.options.map((option) => renderOption(option))}
        </Fragment>
      ))}
    </>
  );
}

function GroupedColorSelectItems({ options }: { options: ColorOption[] }) {
  return (
    <>
      {groupOptions(options).map((group, groupIndex) => (
        <SelectGroup key={group.label || `ungrouped-${groupIndex}`}>
          {group.label && <SelectLabel className="text-slate-500">{group.label}</SelectLabel>}
          {group.options.map((color) => (
            <SelectItem
              key={color.value}
              value={color.value}
              textValue={color.label}
              className="text-slate-800 focus:bg-slate-100 focus:text-slate-950 data-[state=checked]:font-semibold"
              onClick={(e) => e.stopPropagation()}
            >
              <ColorOptionContent option={color} />
            </SelectItem>
          ))}
        </SelectGroup>
      ))}
    </>
  );
}

function GroupedStyleSelectItems({ options }: { options: StyleOption[] }) {
  return (
    <>
      {groupOptions(options).map((group, groupIndex) => (
        <SelectGroup key={group.label || `ungrouped-${groupIndex}`}>
          {group.label && <SelectLabel className="text-slate-500">{group.label}</SelectLabel>}
          {group.options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              textValue={option.label}
              className="text-slate-800 focus:bg-slate-100 focus:text-slate-950 data-[state=checked]:font-semibold"
            >
              <StyleOptionContent option={option} />
            </SelectItem>
          ))}
        </SelectGroup>
      ))}
    </>
  );
}

type CompactCategoryCardProps = {
  title: string;
  icon: ReactNode;
  active: boolean;
  onToggle: (enabled: boolean) => void;
  primaryColor: string;
  iconStyle: CSSProperties;
  cardStyle: CSSProperties;
  styleLabel: string;
  stylePlaceholder: string;
  styles: StyleOption[];
  selectedStyle?: StyleOption;
  onStyleChange: (value: string) => void;
  colors: ColorOption[];
  selectedColor?: ColorOption;
  onColorChange: (value: string) => void;
};

function CompactCategoryCard({
  title,
  icon,
  active,
  onToggle,
  primaryColor,
  iconStyle,
  cardStyle,
  styleLabel,
  stylePlaceholder,
  styles,
  selectedStyle,
  onStyleChange,
  colors,
  selectedColor,
  onColorChange,
}: CompactCategoryCardProps) {
  return (
    <div className="rounded-xl border p-3 transition-all" style={cardStyle}>
      <div className="flex cursor-pointer items-center gap-2.5" onClick={() => onToggle(!active)}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={iconStyle}>
          {icon}
        </span>
        <h3 className="min-w-0 flex-1 text-sm font-semibold text-slate-900">{title}</h3>
        <Switch
          checked={active}
          onCheckedChange={onToggle}
          onClick={(event) => event.stopPropagation()}
          style={{ backgroundColor: active ? primaryColor : "#cbd5e1" }}
        />
      </div>

      {active && (
        <div className={`mt-3 grid gap-2 border-t border-slate-200 pt-3 ${colors.length > 0 && selectedStyle ? "grid-cols-2" : ""}`}>
          <div onClick={(event) => event.stopPropagation()}>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{styleLabel}</p>
            <Select value={selectedStyle?.value || ""} onValueChange={onStyleChange}>
              <SelectTrigger className="h-9 border-slate-200 bg-white text-sm text-slate-800">
                {selectedStyle ? <StyleOptionContent option={selectedStyle} /> : <span className="text-slate-500">{stylePlaceholder}</span>}
              </SelectTrigger>
              <SelectContent className="border-slate-200 bg-white text-slate-900 shadow-xl">
                <GroupedStyleSelectItems options={styles} />
              </SelectContent>
            </Select>
          </div>

          {selectedStyle && colors.length > 0 && (
            <div onClick={(event) => event.stopPropagation()}>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Color</p>
              <Select value={selectedColor?.value || ""} onValueChange={onColorChange}>
                <SelectTrigger className="h-9 border-slate-200 bg-white text-sm text-slate-800">
                  {selectedColor ? <ColorOptionContent option={selectedColor} /> : <span className="text-slate-500">Select color</span>}
                </SelectTrigger>
                <SelectContent className="border-slate-200 bg-white text-slate-900 shadow-xl">
                  <GroupedColorSelectItems options={colors} />
                </SelectContent>
              </Select>
            </div>
          )}
          {selectedStyle && colors.length === 0 && (
            <p className="rounded-lg bg-amber-50 px-2.5 py-2 text-xs font-medium text-amber-800">
              No colors are available for this selection.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function isCustomExteriorStyle(style?: StyleOption) {
  return Boolean(style?.custom || style?.value.startsWith("tenant_custom_exterior_"));
}

function getColorsForStyle(colors: ColorOption[], style?: StyleOption) {
  if (!style || !Array.isArray(style.allowedColorValues)) return colors;
  const allowed = new Set(style.allowedColorValues);
  return colors.filter((color) => allowed.has(color.value));
}

function buildExteriorStyleSelection(
  styleValue: string,
  colorValue: string,
  style?: StyleOption,
) {
  if (!styleValue || !colorValue) return "";

  if (isCustomExteriorStyle(style)) {
    return `${styleValue}${CUSTOM_STYLE_COLOR_SEPARATOR}${colorValue}`;
  }

  return `${styleValue}_${colorValue}`;
}

export default function StyleSelector({
  selectedStyles,
  onStyleChange,
  primaryColor = "#475569",
  secondaryColor = "#64748b",
  showWindows = true,
  customRoofColors = [],
  customSidingColors = [],
  customWindowColors = [],
  customRoofStyles = [],
  customSidingStyles = [],
  customWindowOptions = [],
  defaultOptionVisibility,
  compact = false,
  onSelectionStatusChange,
}: StyleSelectorProps) {
  const defaultVisibility = normalizeEmbedDefaultOptionVisibility(defaultOptionVisibility);
  const [activeToggles, setActiveToggles] = useState({
    roof: !!selectedStyles.roof,
    siding: !!selectedStyles.siding,
    windows: !!selectedStyles.windows,
    surpriseMe: !!selectedStyles.surpriseMe,
  });
  
  const [selectedRoofStyle, setSelectedRoofStyle] = useState("");
  const [selectedRoofColor, setSelectedRoofColor] = useState("");
  const [selectedSidingStyle, setSelectedSidingStyle] = useState("");
  const [selectedSidingColor, setSelectedSidingColor] = useState("");
  const [selectedWindowStyle, setSelectedWindowStyle] = useState("");
  const [selectedWindowColor, setSelectedWindowColor] = useState("");
  const mergedRoofStyles = [
    ...(defaultVisibility["roofing.roofStyles"] ? roofStyles : []),
    ...customRoofStyles.filter((style) => style.value && style.label),
  ];
  const mergedSidingStyles = [
    ...(defaultVisibility["roofing.sidingStyles"] ? sidingStyles : []),
    ...customSidingStyles.filter((style) => style.value && style.label),
  ];
  const mergedWindowOptions = [
    ...(defaultVisibility["roofing.windowStyles"] ? windowStyles : []),
    ...customWindowOptions.filter((option) => option.value && option.label),
  ];
  const mergedRoofColors = [
    ...(defaultVisibility["roofing.roofColors"] ? roofColors : []),
    ...customRoofColors.filter((color) => color.value && color.label && color.hex),
  ];
  const mergedSidingColors = [
    ...(defaultVisibility["roofing.sidingColors"] ? sidingColors : []),
    ...customSidingColors.filter((color) => color.value && color.label && color.hex),
  ];
  const selectedRoofStyleOption = mergedRoofStyles.find((style) => style.value === selectedRoofStyle);
  const selectedSidingStyleOption = mergedSidingStyles.find((style) => style.value === selectedSidingStyle);
  const selectedWindowStyleOption = mergedWindowOptions.find((style) => style.value === selectedWindowStyle);
  const availableRoofColors = getColorsForStyle(mergedRoofColors, selectedRoofStyleOption);
  const availableSidingColors = getColorsForStyle(mergedSidingColors, selectedSidingStyleOption);
  const mergedWindowColors = [
    ...(defaultVisibility["roofing.windowColors"] ? windowColors : []),
    ...customWindowColors.filter((color) => color.value && color.label && color.hex),
  ];
  const availableWindowColors = getColorsForStyle(mergedWindowColors, selectedWindowStyleOption);
  const selectedRoofColorOption = availableRoofColors.find((color) => color.value === selectedRoofColor);
  const selectedSidingColorOption = availableSidingColors.find((color) => color.value === selectedSidingColor);
  const selectedWindowColorOption = availableWindowColors.find((color) => color.value === selectedWindowColor);
  const showRoofCard = mergedRoofStyles.length > 0;
  const showSidingCard = mergedSidingStyles.length > 0;
  const showWindowsCard = showWindows && mergedWindowOptions.length > 0;
  const showSurpriseCard = defaultVisibility["roofing.surpriseMe"];
  const brandTint = colorWithAlpha(primaryColor, 0.07);
  const brandShadow = colorWithAlpha(primaryColor, 0.14);
  const brandTextColor = getContrastTextColor(primaryColor);
  const cardStyle = (active: boolean) => ({
    borderColor: active ? primaryColor : "#e2e8f0",
    backgroundColor: active ? brandTint : "#ffffff",
    boxShadow: active ? `0 8px 24px ${brandShadow}` : "0 1px 2px rgba(15, 23, 42, 0.04)",
  });
  const iconStyle = {
    backgroundColor: primaryColor,
    color: brandTextColor,
  };
  const { hasEnabledCategories, allEnabledCategoriesComplete } = validateExteriorSelection({
    roof: {
      enabled: showRoofCard && activeToggles.roof,
      style: selectedRoofStyle,
      color: selectedRoofColor,
    },
    siding: {
      enabled: showSidingCard && activeToggles.siding,
      style: selectedSidingStyle,
      color: selectedSidingColor,
    },
    windows: {
      enabled: showWindowsCard && activeToggles.windows,
      style: selectedWindowStyle,
      color: selectedWindowColor,
    },
    surpriseMe: {
      enabled: showSurpriseCard && activeToggles.surpriseMe,
      selected: Boolean(selectedStyles.surpriseMe),
    },
  });

  useEffect(() => {
    onSelectionStatusChange?.({
      hasEnabledCategories: Boolean(hasEnabledCategories),
      allEnabledCategoriesComplete,
    });
  }, [allEnabledCategoriesComplete, hasEnabledCategories, onSelectionStatusChange]);

  const getCurrentCategorySelection = (category: "roof" | "siding" | "windows") => {
    if (category === "roof") {
      return buildExteriorStyleSelection(selectedRoofStyle, selectedRoofColor, selectedRoofStyleOption);
    }

    if (category === "siding") {
      return buildExteriorStyleSelection(selectedSidingStyle, selectedSidingColor, selectedSidingStyleOption);
    }

    return buildExteriorStyleSelection(selectedWindowStyle, selectedWindowColor, selectedWindowStyleOption);
  };

  const handleToggleChange = (category: 'roof' | 'siding' | 'windows' | 'surpriseMe', enabled: boolean) => {
    if (category === 'surpriseMe' && enabled) {
      setActiveToggles(prev => ({
        ...prev,
        roof: false,
        siding: false,
        windows: false,
        surpriseMe: true,
      }));
      onStyleChange(getExteriorToggleSelection(selectedStyles, category, enabled));
      return;
    }

    if (category === 'surpriseMe') {
      setActiveToggles(prev => ({ ...prev, surpriseMe: false }));
      onStyleChange(getExteriorToggleSelection(selectedStyles, category, enabled));
      return;
    }

    setActiveToggles(prev => ({
      ...prev,
      [category]: enabled,
      surpriseMe: enabled ? false : prev.surpriseMe,
    }));
    onStyleChange(getExteriorToggleSelection(
      selectedStyles,
      category,
      enabled,
      getCurrentCategorySelection(category),
    ));
  };

  const handleOptionSelect = (category: 'roof' | 'siding' | 'windows' | 'surpriseMe', value: string) => {
    const clearSurpriseMe = category !== "surpriseMe";
    setActiveToggles(prev => ({
      ...prev,
      [category]: true,
      surpriseMe: clearSurpriseMe ? false : prev.surpriseMe,
    }));
    
    onStyleChange({
      ...selectedStyles,
      [category]: value,
      surpriseMe: clearSurpriseMe ? "" : value,
    });
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {showRoofCard && (
          <CompactCategoryCard
            title="Roof"
            icon={<Home className="h-4 w-4" />}
            active={activeToggles.roof}
            onToggle={(enabled) => {
              handleToggleChange("roof", enabled);
            }}
            primaryColor={primaryColor}
            iconStyle={iconStyle}
            cardStyle={cardStyle(activeToggles.roof)}
            styleLabel="Roof style"
            stylePlaceholder="Select style"
            styles={mergedRoofStyles}
            selectedStyle={selectedRoofStyleOption}
            onStyleChange={(value) => {
              setSelectedRoofStyle(value);
              setSelectedRoofColor("");
              handleOptionSelect("roof", "");
            }}
            colors={availableRoofColors}
            selectedColor={selectedRoofColorOption}
            onColorChange={(value) => {
              setSelectedRoofColor(value);
              handleOptionSelect("roof", buildExteriorStyleSelection(selectedRoofStyle, value, selectedRoofStyleOption));
            }}
          />
        )}

        {showSidingCard && (
          <CompactCategoryCard
            title="Siding"
            icon={<Layers className="h-4 w-4" />}
            active={activeToggles.siding}
            onToggle={(enabled) => {
              handleToggleChange("siding", enabled);
            }}
            primaryColor={primaryColor}
            iconStyle={iconStyle}
            cardStyle={cardStyle(activeToggles.siding)}
            styleLabel="Siding style"
            stylePlaceholder="Select style"
            styles={mergedSidingStyles}
            selectedStyle={selectedSidingStyleOption}
            onStyleChange={(value) => {
              setSelectedSidingStyle(value);
              setSelectedSidingColor("");
              handleOptionSelect("siding", "");
            }}
            colors={availableSidingColors}
            selectedColor={selectedSidingColorOption}
            onColorChange={(value) => {
              setSelectedSidingColor(value);
              handleOptionSelect("siding", buildExteriorStyleSelection(selectedSidingStyle, value, selectedSidingStyleOption));
            }}
          />
        )}

        {showWindowsCard && (
          <CompactCategoryCard
            title="Windows"
            icon={<Grid3X3 className="h-4 w-4" />}
            active={activeToggles.windows}
            onToggle={(enabled) => {
              handleToggleChange("windows", enabled);
            }}
            primaryColor={primaryColor}
            iconStyle={iconStyle}
            cardStyle={cardStyle(activeToggles.windows)}
            styleLabel="Window design"
            stylePlaceholder="Select design"
            styles={mergedWindowOptions}
            selectedStyle={selectedWindowStyleOption}
            onStyleChange={(value) => {
              setSelectedWindowStyle(value);
              setSelectedWindowColor("");
              handleOptionSelect("windows", "");
            }}
            colors={availableWindowColors}
            selectedColor={selectedWindowColorOption}
            onColorChange={(value) => {
              setSelectedWindowColor(value);
              handleOptionSelect("windows", buildExteriorStyleSelection(selectedWindowStyle, value, selectedWindowStyleOption));
            }}
          />
        )}

        {showSurpriseCard && (
          <div className="rounded-xl border p-3 transition-all" style={cardStyle(activeToggles.surpriseMe)}>
            <div className="flex cursor-pointer items-center gap-2.5" onClick={() => handleToggleChange("surpriseMe", !activeToggles.surpriseMe)}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={iconStyle}>
                <Sparkles className="h-4 w-4" />
              </span>
              <h3 className="min-w-0 flex-1 text-sm font-semibold text-slate-900">Surprise me</h3>
              <Switch
                checked={activeToggles.surpriseMe}
                onCheckedChange={(checked) => handleToggleChange("surpriseMe", checked)}
                onClick={(event) => event.stopPropagation()}
                style={{ backgroundColor: activeToggles.surpriseMe ? primaryColor : "#cbd5e1" }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {/* Roof Card */}
        {showRoofCard && (
        <div className="rounded-2xl border p-4 transition-all" style={cardStyle(activeToggles.roof)}>
          <div className="flex cursor-pointer items-center gap-3" onClick={() => handleToggleChange('roof', !activeToggles.roof)}>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-slate-900">Roof</h3>
              <p className="text-xs text-slate-500">Material and color</p>
            </div>
            <Switch
              checked={activeToggles.roof}
              onCheckedChange={(checked) => handleToggleChange('roof', checked)}
              onClick={(e) => e.stopPropagation()}
              style={{ backgroundColor: activeToggles.roof ? primaryColor : "#cbd5e1" }}
            />
          </div>
          
          {activeToggles.roof && (
            <div className="mt-4 space-y-4 border-t border-slate-200 pt-4">
              {/* Roof Style Selection */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Choose style</p>
                <div className="space-y-2.5">
                  <GroupedOptionRows options={mergedRoofStyles} renderOption={(style) => (
                    <label key={style.value} className="flex items-center space-x-3 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="radio"
                        name="roofStyle"
                        value={style.value}
                        checked={selectedRoofStyle === style.value}
                        onChange={() => {
                          setSelectedRoofStyle(style.value);
                          setSelectedRoofColor(""); // Reset color when style changes
                          setActiveToggles(prev => ({ ...prev, roof: true }));
                          handleOptionSelect('roof', buildExteriorStyleSelection(style.value, "", style));
                        }}
                        className="h-4 w-4 border-slate-300"
                        style={{ accentColor: primaryColor }}
                      />
                      {style.hex && <ColorSwatch color={style.hex} className="h-5 w-5" />}
                      <span className="text-sm text-slate-700">{style.label}</span>
                    </label>
                  )} />
                </div>
              </div>
              
              {/* Roof Color Selection */}
              {selectedRoofStyle && availableRoofColors.length > 0 && (
                <div onClick={(e) => e.stopPropagation()}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Choose color</p>
                  <Select
                    value={selectedRoofColor}
                    onValueChange={(value) => {
                      setSelectedRoofColor(value);
                      setActiveToggles(prev => ({ ...prev, roof: true }));
                      handleOptionSelect('roof', buildExteriorStyleSelection(selectedRoofStyle, value, selectedRoofStyleOption));
                    }}
                  >
                    <SelectTrigger className="border-slate-200 bg-white text-slate-800" onClick={(e) => e.stopPropagation()}>
                      {selectedRoofColorOption ? (
                        <ColorOptionContent option={selectedRoofColorOption} />
                      ) : (
                        <span className="text-muted-foreground">Select a color</span>
                      )}
                    </SelectTrigger>
                    <SelectContent className="border-slate-200 bg-white text-slate-900 shadow-xl" onClick={(e) => e.stopPropagation()}>
                       <GroupedColorSelectItems options={availableRoofColors} />
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* Siding Card */}
        {showSidingCard && (
        <div className="rounded-2xl border p-4 transition-all" style={cardStyle(activeToggles.siding)}>
          <div className="flex cursor-pointer items-center gap-3" onClick={() => handleToggleChange('siding', !activeToggles.siding)}>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-slate-900">Siding</h3>
              <p className="text-xs text-slate-500">Style and color</p>
            </div>
            <Switch
              checked={activeToggles.siding}
              onCheckedChange={(checked) => handleToggleChange('siding', checked)}
              onClick={(e) => e.stopPropagation()}
              style={{ backgroundColor: activeToggles.siding ? primaryColor : "#cbd5e1" }}
            />
          </div>
          
          {activeToggles.siding && (
            <div className="mt-4 space-y-4 border-t border-slate-200 pt-4">
              {/* Siding Style Selection */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Choose style</p>
                <div className="space-y-2.5">
                  <GroupedOptionRows options={mergedSidingStyles} renderOption={(style) => (
                    <label key={style.value} className="flex items-center space-x-3 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="radio"
                        name="sidingStyle"
                        value={style.value}
                        checked={selectedSidingStyle === style.value}
                        onChange={() => {
                          setSelectedSidingStyle(style.value);
                          setSelectedSidingColor(""); // Reset color when style changes
                          setActiveToggles(prev => ({ ...prev, siding: true }));
                          handleOptionSelect('siding', buildExteriorStyleSelection(style.value, "", style));
                        }}
                        className="h-4 w-4 border-slate-300"
                        style={{ accentColor: primaryColor }}
                      />
                      {style.hex && <ColorSwatch color={style.hex} className="h-5 w-5" />}
                      <span className="text-sm text-slate-700">{style.label}</span>
                    </label>
                  )} />
                </div>
              </div>
              
              {/* Siding Color Selection */}
              {selectedSidingStyle && availableSidingColors.length > 0 && (
                <div onClick={(e) => e.stopPropagation()}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Choose color</p>
                  <Select
                    value={selectedSidingColor}
                    onValueChange={(value) => {
                      setSelectedSidingColor(value);
                      setActiveToggles(prev => ({ ...prev, siding: true }));
                      handleOptionSelect('siding', buildExteriorStyleSelection(selectedSidingStyle, value, selectedSidingStyleOption));
                    }}
                  >
                    <SelectTrigger className="border-slate-200 bg-white text-slate-800" onClick={(e) => e.stopPropagation()}>
                      {selectedSidingColorOption ? (
                        <ColorOptionContent option={selectedSidingColorOption} />
                      ) : (
                        <span className="text-muted-foreground">Select a color</span>
                      )}
                    </SelectTrigger>
                    <SelectContent className="border-slate-200 bg-white text-slate-900 shadow-xl" onClick={(e) => e.stopPropagation()}>
                       <GroupedColorSelectItems options={availableSidingColors} />
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* Windows Card */}
        {showWindowsCard && (
        <div className="rounded-2xl border p-4 transition-all" style={cardStyle(activeToggles.windows)}>
          <div className="flex cursor-pointer items-center gap-3" onClick={() => handleToggleChange('windows', !activeToggles.windows)}>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-slate-900">Windows</h3>
              <p className="text-xs text-slate-500">Design and frame color</p>
            </div>
            <Switch
              checked={activeToggles.windows}
              onCheckedChange={(checked) => handleToggleChange('windows', checked)}
              onClick={(e) => e.stopPropagation()}
              style={{ backgroundColor: activeToggles.windows ? primaryColor : "#cbd5e1" }}
            />
          </div>

          {activeToggles.windows && (
            <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Choose design</p>
              <GroupedOptionRows options={mergedWindowOptions} renderOption={(option) => (
                <label key={option.value} className="flex items-center space-x-3 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="radio"
                    name="windowStyle"
                    value={option.value}
                    checked={selectedWindowStyle === option.value}
                    onChange={() => {
                      setSelectedWindowStyle(option.value);
                      setSelectedWindowColor("");
                      setActiveToggles((previous) => ({ ...previous, windows: true }));
                      handleOptionSelect('windows', buildExteriorStyleSelection(option.value, "", option));
                    }}
                    className="h-4 w-4 border-slate-300"
                    style={{ accentColor: primaryColor }}
                  />
                  {option.hex && <ColorSwatch color={option.hex} className="h-5 w-5" />}
                  <span className="text-sm text-slate-700">{option.label}</span>
                </label>
              )} />
              {selectedWindowStyle && availableWindowColors.length > 0 && (
                <div onClick={(event) => event.stopPropagation()}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Choose color</p>
                  <Select
                    value={selectedWindowColor}
                    onValueChange={(value) => {
                      setSelectedWindowColor(value);
                      setActiveToggles((previous) => ({ ...previous, windows: true }));
                      handleOptionSelect(
                        'windows',
                        buildExteriorStyleSelection(selectedWindowStyle, value, selectedWindowStyleOption),
                      );
                    }}
                  >
                    <SelectTrigger className="border-slate-200 bg-white text-slate-800" onClick={(event) => event.stopPropagation()}>
                      {selectedWindowColorOption ? (
                        <ColorOptionContent option={selectedWindowColorOption} />
                      ) : (
                        <span className="text-muted-foreground">Select a color</span>
                      )}
                    </SelectTrigger>
                    <SelectContent className="border-slate-200 bg-white text-slate-900 shadow-xl" onClick={(event) => event.stopPropagation()}>
                      <GroupedColorSelectItems options={availableWindowColors} />
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* Surprise Me Card */}
        {showSurpriseCard && (
        <div className="rounded-2xl border p-4 transition-all" style={cardStyle(activeToggles.surpriseMe)}>
          <div className="flex cursor-pointer items-center gap-3" onClick={() => handleToggleChange('surpriseMe', !activeToggles.surpriseMe)}>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-slate-900">Surprise me</h3>
              <p className="text-xs text-slate-500">Let AI choose a combination</p>
            </div>
            <Switch
              checked={activeToggles.surpriseMe}
              onCheckedChange={(checked) => handleToggleChange('surpriseMe', checked)}
              onClick={(e) => e.stopPropagation()}
              style={{ backgroundColor: activeToggles.surpriseMe ? primaryColor : "#cbd5e1" }}
            />
          </div>
          
          {activeToggles.surpriseMe && (
            <div className="mt-4 border-t border-slate-200 pt-4">
              <p className="text-sm leading-5 text-slate-600">
                Let our AI choose the perfect roof and siding combination for your home!
              </p>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
