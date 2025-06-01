import { useState } from "react";
import { Switch } from "@/components/ui/switch";

interface StyleSelectorProps {
  selectedStyles: {
    curbing: string;
    landscape: string;
    patio: string;
  };
  onStyleChange: (styles: { curbing: string; landscape: string; patio: string }) => void;
}

const curbingOptions = [
  { value: "natural-stone", label: "Natural Stone" },
  { value: "river-rock", label: "River Rock" },
  { value: "flagstone", label: "Flagstone" },
];

const landscapeOptions = [
  { value: "river-rock", label: "River Rock" },
  { value: "mulch", label: "Premium Mulch" },
  { value: "sod", label: "Fresh Sod" },
];

const patioOptions = [
  { value: "stamped-concrete", label: "Stamped Concrete" },
  { value: "pavers", label: "Designer Pavers" },
  { value: "natural-stone", label: "Natural Stone" },
];

export default function StyleSelector({ selectedStyles, onStyleChange }: StyleSelectorProps) {
  const [activeToggles, setActiveToggles] = useState({
    curbing: !!selectedStyles.curbing,
    landscape: !!selectedStyles.landscape,
    patio: !!selectedStyles.patio,
  });

  const handleToggleChange = (category: 'curbing' | 'landscape' | 'patio', enabled: boolean) => {
    setActiveToggles(prev => ({ ...prev, [category]: enabled }));
    
    if (!enabled) {
      // If toggling off, clear the selection
      onStyleChange({
        ...selectedStyles,
        [category]: "",
      });
    }
  };

  const handleOptionSelect = (category: 'curbing' | 'landscape' | 'patio', value: string) => {
    onStyleChange({
      ...selectedStyles,
      [category]: value,
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <p className="text-stone-600">Select the upgrades you'd like to see on your property</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Decorative Curbing Card */}
        <div className={`rounded-xl border-2 p-6 transition-all ${
          activeToggles.curbing ? 'border-amber-400 bg-gradient-to-br from-amber-400 to-orange-500' : 'border-amber-300 bg-gradient-to-br from-amber-300 to-orange-400'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white drop-shadow-sm">Decorative Curbing</h3>
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

        {/* Landscape Type Card */}
        <div className={`rounded-xl border-2 p-6 transition-all ${
          activeToggles.landscape ? 'border-green-400 bg-gradient-to-br from-green-400 to-emerald-500' : 'border-green-300 bg-gradient-to-br from-green-300 to-emerald-400'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white drop-shadow-sm">Landscape Type</h3>
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

        {/* Concrete Patio Card */}
        <div className={`rounded-xl border-2 p-6 transition-all ${
          activeToggles.patio ? 'border-blue-400 bg-gradient-to-br from-blue-400 to-indigo-500' : 'border-blue-300 bg-gradient-to-br from-blue-300 to-indigo-400'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white drop-shadow-sm">Concrete Patio</h3>
            <Switch
              checked={activeToggles.patio}
              onCheckedChange={(checked) => handleToggleChange('patio', checked)}
              className="data-[state=checked]:bg-white data-[state=unchecked]:bg-white/30"
            />
          </div>
          
          {activeToggles.patio && (
            <div className="space-y-3">
              {patioOptions.map((option) => (
                <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="patio"
                    value={option.value}
                    checked={selectedStyles.patio === option.value}
                    onChange={() => handleOptionSelect('patio', option.value)}
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
