import React, { Fragment, type ReactNode, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import {
  type EmbedDefaultOptionVisibility,
  normalizeEmbedDefaultOptionVisibility,
} from "@/lib/embed-default-visibility";

interface LandscapeStyleSelectorProps {
  selectedStyles: {
    curbing: string;
    landscape: string;
    patios: string;
  };
  onStyleChange: (styles: any) => void;
  primaryColor?: string;
  secondaryColor?: string;
  customOptions?: {
    curbing?: SelectorOption[];
    landscape?: SelectorOption[];
    patios?: SelectorOption[];
  };
  defaultOptionVisibility?: Partial<EmbedDefaultOptionVisibility>;
}

interface PatioSelection {
  style: string;
  shape: string;
  size: string;
}

const curbingOptions: SelectorOption[] = [
  { value: "natural_stone_curbing", label: "Natural Stone Curbing" },
  { value: "brick_curbing", label: "Brick Curbing" },
];

const curbingColors = [
  { value: "gray", label: "Gray", hex: "#808080" },
  { value: "tan", label: "Tan", hex: "#D2B48C" },
  { value: "brown", label: "Brown", hex: "#6B4F3A" },
  { value: "charcoal", label: "Charcoal", hex: "#333333" },
  { value: "sandstone", label: "Sandstone", hex: "#C2B280" },
];

const landscapeOptions: SelectorOption[] = [
  { value: "mulch", label: "Fresh Mulch", swatch: "#6B4423" },
  { value: "river_rock", label: "River Rock", swatch: "linear-gradient(135deg, #8b8174 0%, #d6c7ad 45%, #5f6368 100%)" },
  { value: "new_grass", label: "New Grass", swatch: "#2f7d32" },
];

const mulchColors = [
  { value: "brown_mulch", label: "Brown Mulch", hex: "#6B4423" },
  { value: "black_mulch", label: "Black Mulch", hex: "#1F1B18" },
  { value: "red_mulch", label: "Red Mulch", hex: "#8A2E1B" },
  { value: "natural_cedar_mulch", label: "Natural Cedar Mulch", hex: "#B0642F" },
];

const patioStyles: SelectorOption[] = [
  { value: "stamped_concrete_patio", label: "Stamped Concrete" },
  { value: "plain_concrete_patio", label: "Plain Concrete" },
  { value: "exposed_aggregate_patio", label: "Exposed Aggregate" },
  { value: "colored_concrete_patio", label: "Colored Concrete" },
];

const patioShapes = [
  { value: "rectangular", label: "Rectangular" },
  { value: "curved", label: "Curved" },
  { value: "circular", label: "Circular" },
  { value: "l_shaped", label: "L-Shaped" },
];

const patioSizes = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

type ColorOption = {
  value: string;
  label: string;
  hex: string;
};

type SelectorOption = {
  value: string;
  label: string;
  swatch?: string;
  groupLabel?: string;
};

function isMulchValue(value: string) {
  return value === "fresh_mulch" || mulchColors.some((color) => color.value === value);
}

function Swatch({ color, className = "h-4 w-4" }: { color: string; className?: string }) {
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
      <Swatch color={option.hex} />
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

function GroupedNativeOptions<T extends GroupableOption & { label: string }>({ options }: { options: T[] }) {
  return (
    <>
      {groupOptions(options).map((group, groupIndex) =>
        group.label ? (
          <optgroup key={group.label} label={group.label}>
            {group.options.map((option) => (
              <option key={option.value} value={option.value} className="text-gray-900">
                {option.label}
              </option>
            ))}
          </optgroup>
        ) : (
          <Fragment key={`ungrouped-${groupIndex}`}>
            {group.options.map((option) => (
              <option key={option.value} value={option.value} className="text-gray-900">
                {option.label}
              </option>
            ))}
          </Fragment>
        ),
      )}
    </>
  );
}

const LandscapeStyleSelector = React.memo(function LandscapeStyleSelector({
  selectedStyles,
  onStyleChange,
  primaryColor = "#10b981",
  secondaryColor = "#059669",
  customOptions,
  defaultOptionVisibility,
}: LandscapeStyleSelectorProps) {
  const defaultVisibility = normalizeEmbedDefaultOptionVisibility(defaultOptionVisibility);
  const allCurbingOptions = [
    ...(defaultVisibility["landscape.curbing"] ? curbingOptions : []),
    ...(customOptions?.curbing || []),
  ];
  const allLandscapeOptions = [
    ...(defaultVisibility["landscape.landscape"] ? landscapeOptions : []),
    ...(customOptions?.landscape || []),
  ];
  const allPatioStyles = [
    ...(defaultVisibility["landscape.patios"] ? patioStyles : []),
    ...(customOptions?.patios || []),
  ];
  const allCurbingColors = defaultVisibility["landscape.curbingColors"] ? curbingColors : [];
  const allMulchColors = defaultVisibility["landscape.mulchColors"] ? mulchColors : [];
  const allPatioShapes = defaultVisibility["landscape.patioShapes"] ? patioShapes : [];
  const allPatioSizes = defaultVisibility["landscape.patioSizes"] ? patioSizes : [];
  const defaultCurbingType = allCurbingOptions[0]?.value || "";
  const defaultLandscapeType = allLandscapeOptions[0]?.value || "";
  const defaultPatioStyle = allPatioStyles[0]?.value || "";
  const defaultPatioShape = allPatioShapes[0]?.value || "";
  const defaultPatioSize = allPatioSizes[0]?.value || "";

  const [activeToggles, setActiveToggles] = useState({
    curbing: !!selectedStyles.curbing,
    landscape: !!selectedStyles.landscape,
    patios: !!selectedStyles.patios,
  });

  const [curbingSelection, setCurbingSelection] = useState({
    type: defaultCurbingType,
    color: allCurbingColors[0]?.value || "",
  });

  const [landscapeSelection, setLandscapeSelection] = useState(() => ({
    type: isMulchValue(selectedStyles.landscape) ? "mulch" : selectedStyles.landscape || defaultLandscapeType,
    mulch: isMulchValue(selectedStyles.landscape) && selectedStyles.landscape !== "fresh_mulch"
      ? selectedStyles.landscape
      : allMulchColors[0]?.value || "",
  }));

  const [patioSelection, setPatioSelection] = useState<PatioSelection>({
    style: defaultPatioStyle,
    shape: defaultPatioShape,
    size: defaultPatioSize,
  });

  const selectedCurbingColor = allCurbingColors.find((color) => color.value === curbingSelection.color) || allCurbingColors[0];
  const selectedMulchColor = allMulchColors.find((color) => color.value === landscapeSelection.mulch) || allMulchColors[0];
  const showCurbingCard = allCurbingOptions.length > 0;
  const showLandscapeCard = allLandscapeOptions.length > 0;
  const showPatiosCard = allPatioStyles.length > 0;

  const buildPatioSpec = (selection: PatioSelection) => {
    if (!selection.style) return "";
    if (!allPatioShapes.length) return selection.style;
    return [selection.style, selection.shape || allPatioShapes[0]?.value || "", allPatioSizes.length ? selection.size || allPatioSizes[0]?.value || "" : ""]
      .filter(Boolean)
      .join("|");
  };

  const handleToggleChange = (category: 'curbing' | 'landscape' | 'patios', enabled: boolean) => {
    setActiveToggles(prev => ({ ...prev, [category]: enabled }));

    if (!enabled) {
      // If toggling off, clear the selection
      onStyleChange({
        ...selectedStyles,
        [category]: "",
      });
    } else {
      // If toggling on, set the initial selection
      if (category === 'curbing') {
        // Set the default curbing selection with type and color
        const fullCurbingId = curbingSelection.type === 'natural_stone_curbing' && curbingSelection.color
          ? `${curbingSelection.type}_${curbingSelection.color}` 
          : curbingSelection.type;
        onStyleChange({
          ...selectedStyles,
          curbing: fullCurbingId,
        });
      } else if (category === 'landscape') {
        onStyleChange({
          ...selectedStyles,
          landscape: landscapeSelection.type === "mulch" ? landscapeSelection.mulch : landscapeSelection.type,
        });
      } else if (category === 'patios') {
        // Set the default patio selection
        const patioSpec = buildPatioSpec(patioSelection);
        onStyleChange({
          ...selectedStyles,
          patios: patioSpec,
        });
      }
    }
  };

  const handleOptionSelect = (category: 'curbing' | 'landscape' | 'patios', value: string) => {
    // Ensure the toggle stays active when making a selection
    setActiveToggles(prev => ({ ...prev, [category]: true }));

    if (category === 'curbing') {
      const newSelection = { ...curbingSelection, type: value };
      setCurbingSelection(newSelection);
      const fullCurbingId = value === 'natural_stone_curbing' && newSelection.color
        ? `${value}_${newSelection.color}` 
        : value;
      onStyleChange({
        ...selectedStyles,
        [category]: fullCurbingId,
      });
    } else if (category === 'landscape') {
      const newSelection = { ...landscapeSelection, type: value };
      setLandscapeSelection(newSelection);
      onStyleChange({
        ...selectedStyles,
        landscape: value === "mulch" ? newSelection.mulch : value,
      });
    } else {
      onStyleChange({
        ...selectedStyles,
        [category]: value,
      });
    }
  };

  const handleCurbingColorChange = (color: string) => {
    // Ensure the curbing toggle stays active when changing color
    setActiveToggles(prev => ({ ...prev, curbing: true }));

    const newSelection = { ...curbingSelection, color };
    setCurbingSelection(newSelection);
    const fullCurbingId = curbingSelection.type === 'natural_stone_curbing' && color
      ? `${curbingSelection.type}_${color}` 
      : curbingSelection.type;
    onStyleChange({
      ...selectedStyles,
      curbing: fullCurbingId,
    });
  };

  const handleMulchColorChange = (mulch: string) => {
    setActiveToggles(prev => ({ ...prev, landscape: true }));

    const newSelection = { ...landscapeSelection, type: "mulch", mulch };
    setLandscapeSelection(newSelection);
    onStyleChange({
      ...selectedStyles,
      landscape: mulch,
    });
  };

  const updatePatioSelection = (field: keyof PatioSelection, value: string) => {
    // Ensure the patios toggle stays active when updating selection
    setActiveToggles(prev => ({ ...prev, patios: true }));

    const newSelection = { ...patioSelection, [field]: value };
    setPatioSelection(newSelection);

    // Create a combined patio specification that preserves the style
    const patioSpec = buildPatioSpec(newSelection);

    onStyleChange({
      ...selectedStyles,
      patios: patioSpec,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        {/* Curbing Card */}
        {showCurbingCard && (
        <div className="rounded-xl border-2 p-6 transition-all cursor-pointer"
             style={{
               borderColor: activeToggles.curbing ? '#ffffff' : `${primaryColor}cc`,
               background: activeToggles.curbing 
                 ? `linear-gradient(to bottom right, ${primaryColor}, ${secondaryColor})`
                 : `linear-gradient(to bottom right, ${primaryColor}cc, ${secondaryColor}cc)`
             }}
             onClick={() => handleToggleChange('curbing', !activeToggles.curbing)}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white drop-shadow-sm">Curbing</h3>
            <Switch
              checked={activeToggles.curbing}
              onCheckedChange={(checked) => handleToggleChange('curbing', checked)}
              onClick={(e) => e.stopPropagation()}
              style={{ backgroundColor: activeToggles.curbing ? primaryColor : "#4b5563" }}
            />
          </div>

          {activeToggles.curbing && (
            <div className="space-y-4">
              <GroupedOptionRows options={allCurbingOptions} renderOption={(option) => (
                <label key={option.value} className="flex items-center space-x-3 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="radio"
                    name="curbing"
                    value={option.value}
                    checked={curbingSelection.type === option.value}
                    onChange={() => handleOptionSelect('curbing', option.value)}
                    className="w-4 h-4 text-white border-white/30 focus:ring-white"
                  />
                  {option.swatch && <Swatch color={option.swatch} className="h-5 w-5" />}
                  <span className="text-sm text-white drop-shadow-sm">{option.label}</span>
                </label>
              )} />

              {curbingSelection.type === 'natural_stone_curbing' && selectedCurbingColor && (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Color</label>
                  <Select
                    value={curbingSelection.color}
                    onValueChange={handleCurbingColorChange}
                  >
                    <SelectTrigger
                      className="bg-white/90 border-white/30 text-slate-800"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ColorOptionContent option={selectedCurbingColor} />
                    </SelectTrigger>
                    <SelectContent onClick={(e) => e.stopPropagation()}>
                      {allCurbingColors.map((color) => (
                        <SelectItem key={color.value} value={color.value} textValue={color.label}>
                          <ColorOptionContent option={color} />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* Landscaping Card */}
        {showLandscapeCard && (
        <div className="rounded-xl border-2 p-6 transition-all cursor-pointer"
             style={{
               borderColor: activeToggles.landscape ? '#ffffff' : `${secondaryColor}cc`,
               background: activeToggles.landscape 
                 ? `linear-gradient(to bottom right, ${secondaryColor}, ${primaryColor})`
                 : `linear-gradient(to bottom right, ${secondaryColor}cc, ${primaryColor}cc)`
             }}
             onClick={() => handleToggleChange('landscape', !activeToggles.landscape)}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white drop-shadow-sm">Landscaping</h3>
            <Switch
              checked={activeToggles.landscape}
              onCheckedChange={(checked) => handleToggleChange('landscape', checked)}
              onClick={(e) => e.stopPropagation()}
              style={{ backgroundColor: activeToggles.landscape ? secondaryColor : "#4b5563" }}
            />
          </div>

          {activeToggles.landscape && (
            <div className="space-y-3">
              <GroupedOptionRows options={allLandscapeOptions} renderOption={(option) => (
                <label key={option.value} className="flex items-center space-x-3 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="radio"
                    name="landscape"
                    value={option.value}
                    checked={option.value === "mulch" ? isMulchValue(selectedStyles.landscape) : selectedStyles.landscape === option.value}
                    onChange={() => handleOptionSelect('landscape', option.value)}
                    className="w-4 h-4 text-white border-white/30 focus:ring-white"
                  />
                  {option.swatch && <Swatch color={option.swatch} className="h-5 w-5" />}
                  <span className="text-sm text-white drop-shadow-sm">{option.label}</span>
                </label>
              )} />

              {landscapeSelection.type === "mulch" && selectedMulchColor && (
                <div onClick={(e) => e.stopPropagation()}>
                  <label className="block text-sm font-medium text-white mb-2">Mulch Color</label>
                  <Select
                    value={landscapeSelection.mulch}
                    onValueChange={handleMulchColorChange}
                  >
                    <SelectTrigger
                      className="bg-white/90 border-white/30 text-slate-800"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ColorOptionContent option={selectedMulchColor} />
                    </SelectTrigger>
                    <SelectContent onClick={(e) => e.stopPropagation()}>
                      {allMulchColors.map((color) => (
                        <SelectItem key={color.value} value={color.value} textValue={color.label}>
                          <ColorOptionContent option={color} />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* Concrete Patios Card */}
        {showPatiosCard && (
        <div className="rounded-xl border-2 p-6 transition-all cursor-pointer"
             style={{
               borderColor: activeToggles.patios ? '#ffffff' : `${primaryColor}cc`,
               background: activeToggles.patios 
                 ? `linear-gradient(to bottom right, ${primaryColor}, ${secondaryColor})`
                 : `linear-gradient(to bottom right, ${primaryColor}cc, ${secondaryColor}cc)`
             }}
             onClick={() => handleToggleChange('patios', !activeToggles.patios)}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white drop-shadow-sm">Concrete Patios</h3>
            <Switch
              checked={activeToggles.patios}
              onCheckedChange={(checked) => handleToggleChange('patios', checked)}
              onClick={(e) => e.stopPropagation()}
              style={{ backgroundColor: activeToggles.patios ? primaryColor : "#4b5563" }}
            />
          </div>

          {activeToggles.patios && (
            <div className="space-y-4">
              {/* Patio Style */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Style</label>
                <select
                  value={patioSelection.style}
                  onChange={(e) => updatePatioSelection('style', e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-3 py-2 text-sm bg-white/20 border border-white/30 rounded-md text-white placeholder-white/70 focus:ring-2 focus:ring-white focus:border-transparent"
                >
                  <GroupedNativeOptions options={allPatioStyles} />
                </select>
              </div>

              {/* Patio Shape */}
              {allPatioShapes.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">Shape</label>
                <select
                  value={patioSelection.shape}
                  onChange={(e) => updatePatioSelection('shape', e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-3 py-2 text-sm bg-white/20 border border-white/30 rounded-md text-white placeholder-white/70 focus:ring-2 focus:ring-white focus:border-transparent"
                >
                  {allPatioShapes.map((shape) => (
                    <option key={shape.value} value={shape.value} className="text-gray-900">
                      {shape.label}
                    </option>
                  ))}
                </select>
              </div>
              )}

              {/* Patio Size - only show for shapes that have size options */}
              {allPatioSizes.length > 0 && (patioSelection.shape === 'rectangular' || patioSelection.shape === 'curved') && (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Size</label>
                  <select
                    value={patioSelection.size}
                    onChange={(e) => updatePatioSelection('size', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full px-3 py-2 text-sm bg-white/20 border border-white/30 rounded-md text-white placeholder-white/70 focus:ring-2 focus:ring-white focus:border-transparent"
                  >
                    {allPatioSizes.map((size) => (
                      <option key={size.value} value={size.value} className="text-gray-900">
                        {size.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
});

export default LandscapeStyleSelector;
