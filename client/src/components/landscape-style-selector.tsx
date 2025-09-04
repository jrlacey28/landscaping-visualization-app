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

const patioOptions = [
  { value: "stamped_concrete_patio", label: "Stamped Concrete Patio" },
  { value: "plain_concrete_patio", label: "Plain Concrete Patio" },
  { value: "exposed_aggregate_patio", label: "Exposed Aggregate Patio" },
  { value: "colored_concrete_patio", label: "Colored Concrete Patio" },
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
            <div className="space-y-3">
              {patioOptions.map((option) => (
                <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="patios"
                    value={option.value}
                    checked={selectedStyles.patios === option.value}
                    onChange={() => handleOptionSelect('patios', option.value)}
                    className="w-4 h-4 text-white border-white/30 focus:ring-white"
                  />
                  <span className="text-sm text-white drop-shadow-sm">{option.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}