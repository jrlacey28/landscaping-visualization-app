import { useState } from "react";
import { Switch } from "@/components/ui/switch";

interface LandscapeStyleSelectorProps {
  selectedStyles: {
    curbing: string;
    landscape: string;
    patios: string;
  };
  onStyleChange: (styles: {
    curbing: string;
    landscape: string;
    patios: string;
  }) => void;
  primaryColor?: string;
  secondaryColor?: string;
}

interface PatioSelection {
  style: string;
  shape: string;
  size: string;
}

const curbingOptions = [
  { value: "natural_stone_curbing", label: "Natural Stone Curbing" },
  { value: "brick_curbing", label: "Brick Curbing" },
];

const curbingColors = [
  { value: "gray", label: "Gray" },
  { value: "tan", label: "Tan" },
  { value: "brown", label: "Brown" },
  { value: "charcoal", label: "Charcoal" },
  { value: "sandstone", label: "Sandstone" },
];

const landscapeOptions = [
  { value: "fresh_mulch", label: "Fresh Mulch" },
  { value: "river_rock", label: "River Rock" },
  { value: "new_grass", label: "New Grass" },
];

const patioStyles = [
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

export default function LandscapeStyleSelector({
  selectedStyles,
  onStyleChange,
  primaryColor = "#10b981",
  secondaryColor = "#059669"
}: LandscapeStyleSelectorProps) {
  const [activeToggles, setActiveToggles] = useState({
    curbing: !!selectedStyles.curbing,
    landscape: !!selectedStyles.landscape,
    patios: !!selectedStyles.patios,
  });

  const [curbingSelection, setCurbingSelection] = useState({
    type: 'natural_stone_curbing',
    color: 'gray'
  });

  const [patioSelection, setPatioSelection] = useState<PatioSelection>({
    style: 'plain_concrete_patio',
    shape: 'rectangular',
    size: 'medium'
  });

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
        const fullCurbingId = curbingSelection.type === 'natural_stone_curbing' 
          ? `${curbingSelection.type}_${curbingSelection.color}` 
          : curbingSelection.type;
        onStyleChange({
          ...selectedStyles,
          curbing: fullCurbingId,
        });
      } else if (category === 'patios') {
        // Set the default patio selection
        const patioSpec = `${patioSelection.style}|${patioSelection.shape}|${patioSelection.size}`;
        onStyleChange({
          ...selectedStyles,
          patios: patioSpec,
        });
      }
    }
  };

  const handleOptionSelect = (category: 'curbing' | 'landscape' | 'patios', value: string) => {
    if (category === 'curbing') {
      const newSelection = { ...curbingSelection, type: value };
      setCurbingSelection(newSelection);
      const fullCurbingId = value === 'natural_stone_curbing' 
        ? `${value}_${newSelection.color}` 
        : value;
      onStyleChange({
        ...selectedStyles,
        [category]: fullCurbingId,
      });
    } else {
      onStyleChange({
        ...selectedStyles,
        [category]: value,
      });
    }
  };

  const handleCurbingColorChange = (color: string) => {
    const newSelection = { ...curbingSelection, color };
    setCurbingSelection(newSelection);
    const fullCurbingId = curbingSelection.type === 'natural_stone_curbing' 
      ? `${curbingSelection.type}_${color}` 
      : curbingSelection.type;
    onStyleChange({
      ...selectedStyles,
      curbing: fullCurbingId,
    });
  };

  const updatePatioSelection = (field: keyof PatioSelection, value: string) => {
    const newSelection = { ...patioSelection, [field]: value };
    setPatioSelection(newSelection);
    
    // Create a combined patio specification that preserves the style
    const patioSpec = `${newSelection.style}|${newSelection.shape}|${newSelection.size}`;
    
    onStyleChange({
      ...selectedStyles,
      patios: patioSpec,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        {/* Curbing Card */}
        <div className="rounded-xl border-2 p-6 transition-all cursor-pointer"
             style={{
               borderColor: activeToggles.curbing ? primaryColor : `${primaryColor}cc`,
               background: activeToggles.curbing 
                 ? `linear-gradient(to bottom right, ${primaryColor}, ${secondaryColor}dd)` 
                 : `linear-gradient(to bottom right, ${primaryColor}cc, ${secondaryColor}cc)`
             }}
             onClick={() => handleToggleChange('curbing', !activeToggles.curbing)}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white drop-shadow-sm">Curbing</h3>
            <Switch
              checked={activeToggles.curbing}
              onCheckedChange={(checked) => handleToggleChange('curbing', checked)}
              onClick={(e) => e.stopPropagation()}
              className="data-[state=checked]:bg-white data-[state=unchecked]:bg-white/30"
            />
          </div>
          
          {activeToggles.curbing && (
            <div className="space-y-4">
              {curbingOptions.map((option) => (
                <label key={option.value} className="flex items-center space-x-3 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="radio"
                    name="curbing"
                    value={option.value}
                    checked={curbingSelection.type === option.value}
                    onChange={() => handleOptionSelect('curbing', option.value)}
                    className="w-4 h-4 text-white border-white/30 focus:ring-white"
                  />
                  <span className="text-sm text-white drop-shadow-sm">{option.label}</span>
                </label>
              ))}
              
              {curbingSelection.type === 'natural_stone_curbing' && (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Color</label>
                  <select
                    value={curbingSelection.color}
                    onChange={(e) => handleCurbingColorChange(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full px-3 py-2 text-sm bg-white/20 border border-white/30 rounded-md text-white placeholder-white/70 focus:ring-2 focus:ring-white focus:border-transparent"
                  >
                    {curbingColors.map((color) => (
                      <option key={color.value} value={color.value} className="text-gray-900">
                        {color.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Landscaping Card */}
        <div className="rounded-xl border-2 p-6 transition-all cursor-pointer"
             style={{
               borderColor: activeToggles.landscape ? secondaryColor : `${secondaryColor}cc`,
               background: activeToggles.landscape 
                 ? `linear-gradient(to bottom right, ${secondaryColor}, ${primaryColor}dd)` 
                 : `linear-gradient(to bottom right, ${secondaryColor}cc, ${primaryColor}cc)`
             }}
             onClick={() => handleToggleChange('landscape', !activeToggles.landscape)}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white drop-shadow-sm">Landscaping</h3>
            <Switch
              checked={activeToggles.landscape}
              onCheckedChange={(checked) => handleToggleChange('landscape', checked)}
              onClick={(e) => e.stopPropagation()}
              className="data-[state=checked]:bg-white data-[state=unchecked]:bg-white/30"
            />
          </div>
          
          {activeToggles.landscape && (
            <div className="space-y-3">
              {landscapeOptions.map((option) => (
                <label key={option.value} className="flex items-center space-x-3 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="radio"
                    name="landscape"
                    value={option.value}
                    checked={selectedStyles.landscape === option.value}
                    onChange={() => handleOptionSelect('landscape', option.value)}
                    className="w-4 h-4 text-white border-white/30 focus:ring-white"
                  />
                  <span className="text-sm text-white drop-shadow-sm">{option.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Concrete Patios Card */}
        <div className="rounded-xl border-2 p-6 transition-all cursor-pointer"
             style={{
               borderColor: activeToggles.patios ? primaryColor : `${primaryColor}cc`,
               background: activeToggles.patios 
                 ? `linear-gradient(to bottom right, ${primaryColor}, ${secondaryColor}dd)` 
                 : `linear-gradient(to bottom right, ${primaryColor}cc, ${secondaryColor}cc)`
             }}
             onClick={() => handleToggleChange('patios', !activeToggles.patios)}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white drop-shadow-sm">Concrete Patios</h3>
            <Switch
              checked={activeToggles.patios}
              onCheckedChange={(checked) => handleToggleChange('patios', checked)}
              onClick={(e) => e.stopPropagation()}
              className="data-[state=checked]:bg-white data-[state=unchecked]:bg-white/30"
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
                  {patioStyles.map((style) => (
                    <option key={style.value} value={style.value} className="text-gray-900">
                      {style.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Patio Shape */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Shape</label>
                <select
                  value={patioSelection.shape}
                  onChange={(e) => updatePatioSelection('shape', e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-3 py-2 text-sm bg-white/20 border border-white/30 rounded-md text-white placeholder-white/70 focus:ring-2 focus:ring-white focus:border-transparent"
                >
                  {patioShapes.map((shape) => (
                    <option key={shape.value} value={shape.value} className="text-gray-900">
                      {shape.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Patio Size - only show for shapes that have size options */}
              {(patioSelection.shape === 'rectangular' || patioSelection.shape === 'curved') && (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Size</label>
                  <select
                    value={patioSelection.size}
                    onChange={(e) => updatePatioSelection('size', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full px-3 py-2 text-sm bg-white/20 border border-white/30 rounded-md text-white placeholder-white/70 focus:ring-2 focus:ring-white focus:border-transparent"
                  >
                    {patioSizes.map((size) => (
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
      </div>
    </div>
  );
}