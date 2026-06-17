import { Fragment, type ReactNode, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger } from "@/components/ui/select";
import {
  type EmbedDefaultOptionVisibility,
  normalizeEmbedDefaultOptionVisibility,
} from "@/lib/embed-default-visibility";

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
  customRoofStyles?: StyleOption[];
  customSidingStyles?: StyleOption[];
  customWindowOptions?: StyleOption[];
  defaultOptionVisibility?: Partial<EmbedDefaultOptionVisibility>;
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

const windowOptions: StyleOption[] = [
  { value: "windows_black_frames", label: "Black Frames", hex: "#111827" },
  { value: "windows_white_frames", label: "White Frames", hex: "#FFFFFF" },
  { value: "windows_bronze_frames", label: "Bronze Frames", hex: "#5C4033" },
  { value: "windows_modern_grid", label: "Modern Grid", hex: "#111827" },
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
            <p className="pt-1 text-xs font-semibold uppercase tracking-wide text-white/70">
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
          {group.label && <SelectLabel>{group.label}</SelectLabel>}
          {group.options.map((color) => (
            <SelectItem key={color.value} value={color.value} textValue={color.label} onClick={(e) => e.stopPropagation()}>
              <ColorOptionContent option={color} />
            </SelectItem>
          ))}
        </SelectGroup>
      ))}
    </>
  );
}

function isCustomExteriorStyle(style?: StyleOption) {
  return Boolean(style?.custom || style?.value.startsWith("tenant_custom_exterior_"));
}

function buildExteriorStyleSelection(
  styleValue: string,
  colorValue: string,
  style?: StyleOption,
) {
  if (!styleValue) return "";

  if (isCustomExteriorStyle(style)) {
    return colorValue ? `${styleValue}${CUSTOM_STYLE_COLOR_SEPARATOR}${colorValue}` : styleValue;
  }

  return colorValue ? `${styleValue}_${colorValue}` : "";
}

export default function StyleSelector({
  selectedStyles,
  onStyleChange,
  primaryColor = "#475569",
  secondaryColor = "#64748b",
  showWindows = true,
  customRoofColors = [],
  customSidingColors = [],
  customRoofStyles = [],
  customSidingStyles = [],
  customWindowOptions = [],
  defaultOptionVisibility,
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
  const mergedRoofStyles = [
    ...(defaultVisibility["roofing.roofStyles"] ? roofStyles : []),
    ...customRoofStyles.filter((style) => style.value && style.label),
  ];
  const mergedSidingStyles = [
    ...(defaultVisibility["roofing.sidingStyles"] ? sidingStyles : []),
    ...customSidingStyles.filter((style) => style.value && style.label),
  ];
  const mergedWindowOptions = [
    ...(defaultVisibility["roofing.windows"] ? windowOptions : []),
    ...customWindowOptions.filter((option) => option.value && option.label),
  ];
  const mergedRoofColors = [
    ...(defaultVisibility["roofing.roofColors"] ? roofColors : []),
    ...customRoofColors.filter((color) => color.value && color.label && color.hex),
  ];
  const selectedRoofColorOption = mergedRoofColors.find((color) => color.value === selectedRoofColor);
  const mergedSidingColors = [
    ...(defaultVisibility["roofing.sidingColors"] ? sidingColors : []),
    ...customSidingColors.filter((color) => color.value && color.label && color.hex),
  ];
  const selectedSidingColorOption = mergedSidingColors.find((color) => color.value === selectedSidingColor);
  const selectedRoofStyleOption = mergedRoofStyles.find((style) => style.value === selectedRoofStyle);
  const selectedSidingStyleOption = mergedSidingStyles.find((style) => style.value === selectedSidingStyle);
  const showRoofCard = mergedRoofStyles.length > 0;
  const showSidingCard = mergedSidingStyles.length > 0;
  const showWindowsCard = showWindows && mergedWindowOptions.length > 0;
  const showSurpriseCard = defaultVisibility["roofing.surpriseMe"];

  const handleToggleChange = (category: 'roof' | 'siding' | 'windows' | 'surpriseMe', enabled: boolean) => {
    // Handle mutual exclusivity between surprise me and other options
    if (category === 'surpriseMe' && enabled) {
      // If enabling surprise me, disable roof and siding
      setActiveToggles(prev => ({ ...prev, roof: false, siding: false, surpriseMe: true }));
      onStyleChange({
        ...selectedStyles,
        roof: "",
        siding: "",
        surpriseMe: selectedStyles.surpriseMe || "random_roof_and_siding",
      });
    } else if ((category === 'roof' || category === 'siding') && enabled && activeToggles.surpriseMe) {
      // If enabling roof or siding while surprise me is active, disable surprise me
      setActiveToggles(prev => ({ ...prev, [category]: enabled, surpriseMe: false }));
      onStyleChange({
        ...selectedStyles,
        [category]: selectedStyles[category],
        surpriseMe: "",
      });
    } else {
      // Normal toggle behavior
      setActiveToggles(prev => ({ ...prev, [category]: enabled }));
      
      if (!enabled) {
        // If toggling off, clear the selection
        onStyleChange({
          ...selectedStyles,
          [category]: "",
        });
      }
    }
  };

  const handleOptionSelect = (category: 'roof' | 'siding' | 'windows' | 'surpriseMe', value: string) => {
    // Ensure the toggle stays active when making a selection
    setActiveToggles(prev => ({ ...prev, [category]: true }));
    
    onStyleChange({
      ...selectedStyles,
      [category]: value,
    });
  };

  return (
    <div className="space-y-6">

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Roof Card */}
        {showRoofCard && (
        <div className="rounded-xl border-2 p-6 transition-all cursor-pointer"
             style={{
               borderColor: activeToggles.roof ? primaryColor : `${primaryColor}cc`,
               background: activeToggles.roof 
                 ? `linear-gradient(to bottom right, ${primaryColor}, ${secondaryColor}dd)` 
                 : `linear-gradient(to bottom right, ${primaryColor}cc, ${secondaryColor}cc)`
             }}
             onClick={() => handleToggleChange('roof', !activeToggles.roof)}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white drop-shadow-sm">Roof</h3>
            <Switch
              checked={activeToggles.roof}
              onCheckedChange={(checked) => handleToggleChange('roof', checked)}
              onClick={(e) => e.stopPropagation()}
              style={{ backgroundColor: activeToggles.roof ? primaryColor : "#4b5563" }}
            />
          </div>
          
          {activeToggles.roof && (
            <div className="space-y-3">
              {/* Roof Style Selection */}
              <div>
                <p className="text-sm text-white/80 mb-2">Choose Style:</p>
                <div className="space-y-3">
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
                        className="w-4 h-4 text-white border-white/30 focus:ring-white"
                      />
                      {style.hex && <ColorSwatch color={style.hex} className="h-5 w-5" />}
                      <span className="text-sm text-white drop-shadow-sm">{style.label}</span>
                    </label>
                  )} />
                </div>
              </div>
              
              {/* Roof Color Selection */}
              {selectedRoofStyle && mergedRoofColors.length > 0 && (
                <div onClick={(e) => e.stopPropagation()}>
                  <p className="text-sm text-white/80 mb-2">Choose Color:</p>
                  <Select
                    value={selectedRoofColor}
                    onValueChange={(value) => {
                      setSelectedRoofColor(value);
                      setActiveToggles(prev => ({ ...prev, roof: true }));
                      handleOptionSelect('roof', buildExteriorStyleSelection(selectedRoofStyle, value, selectedRoofStyleOption));
                    }}
                  >
                    <SelectTrigger className="bg-white/90 border-white/30 text-slate-800" onClick={(e) => e.stopPropagation()}>
                      {selectedRoofColorOption ? (
                        <ColorOptionContent option={selectedRoofColorOption} />
                      ) : (
                        <span className="text-muted-foreground">Select a color</span>
                      )}
                    </SelectTrigger>
                    <SelectContent onClick={(e) => e.stopPropagation()}>
                      <GroupedColorSelectItems options={mergedRoofColors} />
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
        <div className="rounded-xl border-2 p-6 transition-all cursor-pointer"
             style={{
               borderColor: activeToggles.siding ? secondaryColor : `${secondaryColor}cc`,
               background: activeToggles.siding 
                 ? `linear-gradient(to bottom right, ${secondaryColor}, ${primaryColor}dd)` 
                 : `linear-gradient(to bottom right, ${secondaryColor}cc, ${primaryColor}cc)`
             }}
             onClick={() => handleToggleChange('siding', !activeToggles.siding)}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white drop-shadow-sm">Siding</h3>
            <Switch
              checked={activeToggles.siding}
              onCheckedChange={(checked) => handleToggleChange('siding', checked)}
              onClick={(e) => e.stopPropagation()}
              style={{ backgroundColor: activeToggles.siding ? primaryColor : "#4b5563" }}
            />
          </div>
          
          {activeToggles.siding && (
            <div className="space-y-3">
              {/* Siding Style Selection */}
              <div>
                <p className="text-sm text-white/80 mb-2">Choose Style:</p>
                <div className="space-y-3">
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
                        className="w-4 h-4 text-white border-white/30 focus:ring-white"
                      />
                      {style.hex && <ColorSwatch color={style.hex} className="h-5 w-5" />}
                      <span className="text-sm text-white drop-shadow-sm">{style.label}</span>
                    </label>
                  )} />
                </div>
              </div>
              
              {/* Siding Color Selection */}
              {selectedSidingStyle && mergedSidingColors.length > 0 && (
                <div onClick={(e) => e.stopPropagation()}>
                  <p className="text-sm text-white/80 mb-2">Choose Color:</p>
                  <Select
                    value={selectedSidingColor}
                    onValueChange={(value) => {
                      setSelectedSidingColor(value);
                      setActiveToggles(prev => ({ ...prev, siding: true }));
                      handleOptionSelect('siding', buildExteriorStyleSelection(selectedSidingStyle, value, selectedSidingStyleOption));
                    }}
                  >
                    <SelectTrigger className="bg-white/90 border-white/30 text-slate-800" onClick={(e) => e.stopPropagation()}>
                      {selectedSidingColorOption ? (
                        <ColorOptionContent option={selectedSidingColorOption} />
                      ) : (
                        <span className="text-muted-foreground">Select a color</span>
                      )}
                    </SelectTrigger>
                    <SelectContent onClick={(e) => e.stopPropagation()}>
                      <GroupedColorSelectItems options={mergedSidingColors} />
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
        <div className="rounded-xl border-2 p-6 transition-all cursor-pointer"
             style={{
               borderColor: activeToggles.windows ? primaryColor : `${primaryColor}cc`,
               background: activeToggles.windows
                 ? `linear-gradient(to bottom right, ${primaryColor}, ${secondaryColor}dd)`
                 : `linear-gradient(to bottom right, ${primaryColor}cc, ${secondaryColor}cc)`
             }}
             onClick={() => handleToggleChange('windows', !activeToggles.windows)}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white drop-shadow-sm">Windows</h3>
            <Switch
              checked={activeToggles.windows}
              onCheckedChange={(checked) => handleToggleChange('windows', checked)}
              onClick={(e) => e.stopPropagation()}
              style={{ backgroundColor: activeToggles.windows ? primaryColor : "#4b5563" }}
            />
          </div>

          {activeToggles.windows && (
            <div className="space-y-3">
              <p className="text-sm text-white/80 mb-2">Choose Option:</p>
              <GroupedOptionRows options={mergedWindowOptions} renderOption={(option) => (
                <label key={option.value} className="flex items-center space-x-3 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="radio"
                    name="windowOption"
                    value={option.value}
                    checked={selectedStyles.windows === option.value}
                    onChange={() => handleOptionSelect('windows', option.value)}
                    className="w-4 h-4 text-white border-white/30 focus:ring-white"
                  />
                  {option.hex && <ColorSwatch color={option.hex} className="h-5 w-5" />}
                  <span className="text-sm text-white drop-shadow-sm">{option.label}</span>
                </label>
              )} />
            </div>
          )}
        </div>
        )}

        {/* Surprise Me Card */}
        {showSurpriseCard && (
        <div className="rounded-xl border-2 p-6 transition-all cursor-pointer"
             style={{
               borderColor: activeToggles.surpriseMe ? primaryColor : `${primaryColor}cc`,
               background: activeToggles.surpriseMe 
                 ? `linear-gradient(to bottom right, ${primaryColor}, ${secondaryColor})` 
                 : `linear-gradient(to bottom right, ${primaryColor}cc, ${secondaryColor}cc)`
             }}
             onClick={() => handleToggleChange('surpriseMe', !activeToggles.surpriseMe)}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white drop-shadow-sm">Surprise Me!</h3>
            <Switch
              checked={activeToggles.surpriseMe}
              onCheckedChange={(checked) => {
                handleToggleChange('surpriseMe', checked);
                if (checked) {
                  handleOptionSelect('surpriseMe', 'random_roof_and_siding');
                }
              }}
              onClick={(e) => e.stopPropagation()}
              style={{ backgroundColor: activeToggles.surpriseMe ? primaryColor : "#4b5563" }}
            />
          </div>
          
          {activeToggles.surpriseMe && (
            <div className="text-center">
              <p className="text-sm text-white/90 drop-shadow-sm">
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
