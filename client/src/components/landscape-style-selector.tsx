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
}

interface PatioSelection {
  style: string;
  shape: string;
  size: string;
}

const curbingOptions = [
  { value: "natural_stone_curbing", label: "Natural Stone Curbing" },
  { value: "concrete_curbing", label: "Concrete Curbing" },
  { value: "brick_curbing", label: "Brick Curbing" },
  { value: "metal_curbing", label: "Metal Curbing" },
];

const landscapeOptions = [
  { value: "mulch_beds", label: "Fresh Mulch Beds" },
  { value: "river_rock", label: "River Rock Landscaping" },
  { value: "decorative_gravel", label: "Decorative Gravel" },
  { value: "pine_straw", label: "Pine Straw Mulch" },
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
}: LandscapeStyleSelectorProps) {
  const [activeToggles, setActiveToggles] = useState({
    curbing: !!selectedStyles.curbing,
    landscape: !!selectedStyles.landscape,
    patios: !!selectedStyles.patios,
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
    }
  };

  const handleOptionSelect = (category: 'curbing' | 'landscape' | 'patios', value: string) => {
    onStyleChange({
      ...selectedStyles,
      [category]: value,
    });
  };

  const updatePatioSelection = (field: keyof PatioSelection, value: string) => {
    const newSelection = { ...patioSelection, [field]: value };
    setPatioSelection(newSelection);
    
    // Generate the patio ID based on selection
    let patioId = newSelection.style;
    if (newSelection.shape !== 'rectangular' || newSelection.size !== 'medium') {
      if (newSelection.shape === 'curved') {
        patioId = `curved_concrete_patio_${newSelection.size}`;
      } else if (newSelection.shape === 'rectangular') {
        patioId = `rectangular_concrete_patio_${newSelection.size}`;
      } else if (newSelection.shape === 'circular') {
        patioId = 'circular_concrete_patio';
      } else if (newSelection.shape === 'l_shaped') {
        patioId = 'l_shaped_concrete_patio';
      }
    }
    
    onStyleChange({
      ...selectedStyles,
      patios: patioId,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        {/* Curbing Card */}
        <div className={`rounded-xl border-2 p-6 transition-all ${
          activeToggles.curbing ? 'border-emerald-500 bg-gradient-to-br from-emerald-600 to-emerald-700' : 'border-emerald-400 bg-gradient-to-br from-emerald-500 to-emerald-600'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white drop-shadow-sm">Curbing</h3>
            <Switch
              checked={activeToggles.curbing}
              onCheckedChange={(checked) => handleToggleChange('curbing', checked)}
              className="data-[state=checked]:bg-white data-[state=unchecked]:bg-white/30"
            />
          </div>
          
          {activeToggles.curbing && (
            <div className="space-y-3">
              {curbingOptions.map((option) => (
                <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="curbing"
                    value={option.value}
                    checked={selectedStyles.curbing === option.value}
                    onChange={() => handleOptionSelect('curbing', option.value)}
                    className="w-4 h-4 text-white border-white/30 focus:ring-white"
                  />
                  <span className="text-sm text-white drop-shadow-sm">{option.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Landscape Materials Card */}
        <div className={`rounded-xl border-2 p-6 transition-all ${
          activeToggles.landscape ? 'border-teal-500 bg-gradient-to-br from-teal-600 to-teal-700' : 'border-teal-400 bg-gradient-to-br from-teal-500 to-teal-600'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white drop-shadow-sm">Landscape Materials</h3>
            <Switch
              checked={activeToggles.landscape}
              onCheckedChange={(checked) => handleToggleChange('landscape', checked)}
              className="data-[state=checked]:bg-white data-[state=unchecked]:bg-white/30"
            />
          </div>
          
          {activeToggles.landscape && (
            <div className="space-y-3">
              {landscapeOptions.map((option) => (
                <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
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
        <div className={`rounded-xl border-2 p-6 transition-all ${
          activeToggles.patios ? 'border-green-500 bg-gradient-to-br from-green-600 to-green-700' : 'border-green-400 bg-gradient-to-br from-green-500 to-green-600'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white drop-shadow-sm">Concrete Patios</h3>
            <Switch
              checked={activeToggles.patios}
              onCheckedChange={(checked) => handleToggleChange('patios', checked)}
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