import { useState } from "react";
import { Switch } from "@/components/ui/switch";

interface PoolStyleSelectorProps {
  selectedStyles: {
    poolType: string;
    poolSize: string;
    decking: string;
    landscaping: string;
    features: string;
  };
  onStyleChange: (styles: { 
    poolType: string; 
    poolSize: string; 
    decking: string; 
    landscaping: string; 
    features: string; 
  }) => void;
  primaryColor?: string;
  secondaryColor?: string;
}

const poolTypes = [
  { value: "rectangular_pool", label: "Rectangular Pool" },
  { value: "kidney_shaped_pool", label: "Kidney-Shaped Pool" },
  { value: "oval_pool", label: "Oval Pool" },
  { value: "freeform_pool", label: "Freeform Pool" },
];

const poolSizes = [
  { value: "small_pool", label: "Small Pool (12x24 ft)" },
  { value: "medium_pool", label: "Medium Pool (16x32 ft)" },
  { value: "large_pool", label: "Large Pool (20x40 ft)" },
];

const deckingOptions = [
  { value: "concrete_pool_deck", label: "Concrete Pool Deck" },
  { value: "travertine_pool_deck", label: "Travertine Pool Deck" },
  { value: "brick_pool_deck", label: "Brick Pool Deck" },
];

const landscapingOptions = [
  { value: "tropical_pool_landscaping", label: "Tropical Landscaping" },
  { value: "modern_pool_landscaping", label: "Modern Landscaping" },
  { value: "natural_pool_landscaping", label: "Natural Landscaping" },
];

const featureOptions = [
  { value: "pool_with_spa", label: "Pool with Attached Spa" },
  { value: "pool_with_waterfall", label: "Pool with Waterfall" },
  { value: "pool_with_lighting", label: "Pool with LED Lighting" },
];

export default function PoolStyleSelector({ selectedStyles, onStyleChange, primaryColor = "#10b981", secondaryColor = "#059669" }: PoolStyleSelectorProps) {
  const [activeToggles, setActiveToggles] = useState({
    poolType: !!selectedStyles.poolType,
    poolSize: !!selectedStyles.poolSize,
    decking: !!selectedStyles.decking,
    landscaping: !!selectedStyles.landscaping,
    features: !!selectedStyles.features,
  });

  const handleToggleChange = (category: 'poolType' | 'poolSize' | 'decking' | 'landscaping' | 'features', enabled: boolean) => {
    setActiveToggles(prev => ({ ...prev, [category]: enabled }));
    
    if (!enabled) {
      // If toggling off, clear the selection
      onStyleChange({
        ...selectedStyles,
        [category]: "",
      });
    }
  };

  const handleOptionSelect = (category: 'poolType' | 'poolSize' | 'decking' | 'landscaping' | 'features', value: string) => {
    onStyleChange({
      ...selectedStyles,
      [category]: value,
    });
  };

  return (
    <div className="space-y-6">

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Pool Type Card */}
        <div className="rounded-xl border-2 p-6 transition-all"
             style={{
               borderColor: activeToggles.poolType ? primaryColor : `${primaryColor}cc`,
               background: activeToggles.poolType 
                 ? `linear-gradient(to bottom right, ${primaryColor}, ${secondaryColor}dd)` 
                 : `linear-gradient(to bottom right, ${primaryColor}cc, ${secondaryColor}cc)`
             }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white drop-shadow-sm">Pool Type</h3>
            <Switch
              checked={activeToggles.poolType}
              onCheckedChange={(checked) => handleToggleChange('poolType', checked)}
              className="data-[state=checked]:bg-white data-[state=unchecked]:bg-white/30"
            />
          </div>
          
          {activeToggles.poolType && (
            <div className="space-y-3">
              {poolTypes.map((option) => (
                <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="poolType"
                    value={option.value}
                    checked={selectedStyles.poolType === option.value}
                    onChange={() => handleOptionSelect('poolType', option.value)}
                    className="w-4 h-4 text-white border-white/30 focus:ring-white"
                  />
                  <span className="text-sm text-white drop-shadow-sm">{option.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Pool Size Card */}
        <div className="rounded-xl border-2 p-6 transition-all"
             style={{
               borderColor: activeToggles.poolSize ? secondaryColor : `${secondaryColor}cc`,
               background: activeToggles.poolSize 
                 ? `linear-gradient(to bottom right, ${secondaryColor}, ${primaryColor}dd)` 
                 : `linear-gradient(to bottom right, ${secondaryColor}cc, ${primaryColor}cc)`
             }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white drop-shadow-sm">Pool Size</h3>
            <Switch
              checked={activeToggles.poolSize}
              onCheckedChange={(checked) => handleToggleChange('poolSize', checked)}
              className="data-[state=checked]:bg-white data-[state=unchecked]:bg-white/30"
            />
          </div>
          
          {activeToggles.poolSize && (
            <div className="space-y-3">
              {poolSizes.map((option) => (
                <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="poolSize"
                    value={option.value}
                    checked={selectedStyles.poolSize === option.value}
                    onChange={() => handleOptionSelect('poolSize', option.value)}
                    className="w-4 h-4 text-white border-white/30 focus:ring-white"
                  />
                  <span className="text-sm text-white drop-shadow-sm">{option.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Decking Card */}
        <div className="rounded-xl border-2 p-6 transition-all"
             style={{
               borderColor: activeToggles.decking ? primaryColor : `${primaryColor}cc`,
               background: activeToggles.decking 
                 ? `linear-gradient(to bottom right, ${primaryColor}, ${secondaryColor}dd)` 
                 : `linear-gradient(to bottom right, ${primaryColor}cc, ${secondaryColor}cc)`
             }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white drop-shadow-sm">Pool Decking</h3>
            <Switch
              checked={activeToggles.decking}
              onCheckedChange={(checked) => handleToggleChange('decking', checked)}
              className="data-[state=checked]:bg-white data-[state=unchecked]:bg-white/30"
            />
          </div>
          
          {activeToggles.decking && (
            <div className="space-y-3">
              {deckingOptions.map((option) => (
                <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="decking"
                    value={option.value}
                    checked={selectedStyles.decking === option.value}
                    onChange={() => handleOptionSelect('decking', option.value)}
                    className="w-4 h-4 text-white border-white/30 focus:ring-white"
                  />
                  <span className="text-sm text-white drop-shadow-sm">{option.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Landscaping Card */}
        <div className="rounded-xl border-2 p-6 transition-all"
             style={{
               borderColor: activeToggles.landscaping ? secondaryColor : `${secondaryColor}cc`,
               background: activeToggles.landscaping 
                 ? `linear-gradient(to bottom right, ${secondaryColor}, ${primaryColor}dd)` 
                 : `linear-gradient(to bottom right, ${secondaryColor}cc, ${primaryColor}cc)`
             }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white drop-shadow-sm">Landscaping</h3>
            <Switch
              checked={activeToggles.landscaping}
              onCheckedChange={(checked) => handleToggleChange('landscaping', checked)}
              className="data-[state=checked]:bg-white data-[state=unchecked]:bg-white/30"
            />
          </div>
          
          {activeToggles.landscaping && (
            <div className="space-y-3">
              {landscapingOptions.map((option) => (
                <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="landscaping"
                    value={option.value}
                    checked={selectedStyles.landscaping === option.value}
                    onChange={() => handleOptionSelect('landscaping', option.value)}
                    className="w-4 h-4 text-white border-white/30 focus:ring-white"
                  />
                  <span className="text-sm text-white drop-shadow-sm">{option.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Features Card */}
        <div className="rounded-xl border-2 p-6 transition-all"
             style={{
               borderColor: activeToggles.features ? primaryColor : `${primaryColor}cc`,
               background: activeToggles.features 
                 ? `linear-gradient(to bottom right, ${primaryColor}, ${secondaryColor})` 
                 : `linear-gradient(to bottom right, ${primaryColor}cc, ${secondaryColor}cc)`
             }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white drop-shadow-sm">Special Features</h3>
            <Switch
              checked={activeToggles.features}
              onCheckedChange={(checked) => handleToggleChange('features', checked)}
              className="data-[state=checked]:bg-white data-[state=unchecked]:bg-white/30"
            />
          </div>
          
          {activeToggles.features && (
            <div className="space-y-3">
              {featureOptions.map((option) => (
                <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="features"
                    value={option.value}
                    checked={selectedStyles.features === option.value}
                    onChange={() => handleOptionSelect('features', option.value)}
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