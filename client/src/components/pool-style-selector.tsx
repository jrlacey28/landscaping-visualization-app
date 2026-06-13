import React, { useState } from "react";
import { Switch } from "@/components/ui/switch";
import {
  type EmbedDefaultOptionVisibility,
  normalizeEmbedDefaultOptionVisibility,
} from "@/lib/embed-default-visibility";

interface PoolStyleSelectorProps {
  selectedStyles: {
    poolType: string;
    poolSize: string;
    decking: string;
    landscaping: string;
    features: string;
    hotTub: string;
    sauna: string;
  };
  onStyleChange: (styles: any) => void;
  primaryColor?: string;
  secondaryColor?: string;
  customOptions?: {
    poolType?: SelectorOption[];
    poolSize?: SelectorOption[];
    decking?: SelectorOption[];
    landscaping?: SelectorOption[];
    features?: SelectorOption[];
    hotTub?: SelectorOption[];
    sauna?: SelectorOption[];
  };
  defaultOptionVisibility?: Partial<EmbedDefaultOptionVisibility>;
}

type SelectorOption = {
  value: string;
  label: string;
};

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

const hotTubOptions = [
  { value: "built_in_hottub", label: "Built-in Hot Tub" },
  { value: "portable_hottub", label: "Portable Hot Tub" },
  { value: "swim_spa", label: "Swim Spa" },
];

const saunaOptions = [
  { value: "outdoor_sauna", label: "Outdoor Sauna" },
  { value: "barrel_sauna", label: "Barrel Sauna" },
  { value: "modern_sauna", label: "Modern Glass Sauna" },
];

const PoolStyleSelector = React.memo(function PoolStyleSelector({
  selectedStyles,
  onStyleChange,
  primaryColor = "#10b981",
  secondaryColor = "#059669",
  customOptions,
  defaultOptionVisibility,
}: PoolStyleSelectorProps) {
  const defaultVisibility = normalizeEmbedDefaultOptionVisibility(defaultOptionVisibility);
  const allPoolTypes = [...(defaultVisibility["pools.poolType"] ? poolTypes : []), ...(customOptions?.poolType || [])];
  const allPoolSizes = [...(defaultVisibility["pools.poolSize"] ? poolSizes : []), ...(customOptions?.poolSize || [])];
  const allDeckingOptions = [...(defaultVisibility["pools.decking"] ? deckingOptions : []), ...(customOptions?.decking || [])];
  const allLandscapingOptions = [...(defaultVisibility["pools.landscaping"] ? landscapingOptions : []), ...(customOptions?.landscaping || [])];
  const allFeatureOptions = [...(defaultVisibility["pools.features"] ? featureOptions : []), ...(customOptions?.features || [])];
  const allHotTubOptions = [...(defaultVisibility["pools.hotTub"] ? hotTubOptions : []), ...(customOptions?.hotTub || [])];
  const allSaunaOptions = [...(defaultVisibility["pools.sauna"] ? saunaOptions : []), ...(customOptions?.sauna || [])];

  const [activeToggles, setActiveToggles] = useState({
    poolType: !!selectedStyles.poolType,
    poolSize: !!selectedStyles.poolSize,
    decking: !!selectedStyles.decking,
    landscaping: !!selectedStyles.landscaping,
    features: !!selectedStyles.features,
    hotTub: !!selectedStyles.hotTub,
    sauna: !!selectedStyles.sauna,
  });

  const handleToggleChange = (category: 'poolType' | 'poolSize' | 'decking' | 'landscaping' | 'features' | 'hotTub' | 'sauna', enabled: boolean) => {
    setActiveToggles(prev => ({ ...prev, [category]: enabled }));

    if (!enabled) {
      // If toggling off, clear the selection
      onStyleChange({
        ...selectedStyles,
        [category]: "",
      });
    }
  };

  const handleOptionSelect = (category: 'poolType' | 'poolSize' | 'decking' | 'landscaping' | 'features' | 'hotTub' | 'sauna', value: string) => {
    onStyleChange({
      ...selectedStyles,
      [category]: value,
    });
  };

  return (
    <div className="space-y-6">

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Pool Type Card */}
        {allPoolTypes.length > 0 && (
        <div className="rounded-xl border-2 p-6 transition-all cursor-pointer"
             style={{
               borderColor: activeToggles.poolType ? primaryColor : `${primaryColor}cc`,
               background: activeToggles.poolType 
                 ? `linear-gradient(to bottom right, ${primaryColor}, ${secondaryColor}dd)` 
                 : `linear-gradient(to bottom right, ${primaryColor}cc, ${secondaryColor}cc)`
             }}
             onClick={() => handleToggleChange('poolType', !activeToggles.poolType)}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white drop-shadow-sm">Pool Type</h3>
            <Switch
              checked={activeToggles.poolType}
              onCheckedChange={(checked) => handleToggleChange('poolType', checked)}
              onClick={(e) => e.stopPropagation()}
              style={{ backgroundColor: activeToggles.poolType ? primaryColor : "#4b5563" }}
            />
          </div>

          {activeToggles.poolType && (
            <div className="space-y-3">
              {allPoolTypes.map((option) => (
                <label key={option.value} className="flex items-center space-x-3 cursor-pointer" onClick={(e) => e.stopPropagation()}>
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
        )}

        {/* Pool Size Card */}
        {allPoolSizes.length > 0 && (
        <div className="rounded-xl border-2 p-6 transition-all cursor-pointer"
             style={{
               borderColor: activeToggles.poolSize ? secondaryColor : `${secondaryColor}cc`,
               background: activeToggles.poolSize 
                 ? `linear-gradient(to bottom right, ${secondaryColor}, ${primaryColor}dd)` 
                 : `linear-gradient(to bottom right, ${secondaryColor}cc, ${primaryColor}cc)`
             }}
             onClick={() => handleToggleChange('poolSize', !activeToggles.poolSize)}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white drop-shadow-sm">Pool Size</h3>
            <Switch
              checked={activeToggles.poolSize}
              onCheckedChange={(checked) => handleToggleChange('poolSize', checked)}
              onClick={(e) => e.stopPropagation()}
              style={{ backgroundColor: activeToggles.poolSize ? secondaryColor : "#4b5563" }}
            />
          </div>

          {activeToggles.poolSize && (
            <div className="space-y-3">
              {allPoolSizes.map((option) => (
                <label key={option.value} className="flex items-center space-x-3 cursor-pointer" onClick={(e) => e.stopPropagation()}>
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
        )}

        {/* Decking Card */}
        {allDeckingOptions.length > 0 && (
        <div className="rounded-xl border-2 p-6 transition-all cursor-pointer"
             style={{
               borderColor: activeToggles.decking ? primaryColor : `${primaryColor}cc`,
               background: activeToggles.decking 
                 ? `linear-gradient(to bottom right, ${primaryColor}, ${secondaryColor}dd)` 
                 : `linear-gradient(to bottom right, ${primaryColor}cc, ${secondaryColor}cc)`
             }}
             onClick={() => handleToggleChange('decking', !activeToggles.decking)}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white drop-shadow-sm">Pool Decking</h3>
            <Switch
              checked={activeToggles.decking}
              onCheckedChange={(checked) => handleToggleChange('decking', checked)}
              onClick={(e) => e.stopPropagation()}
              style={{ backgroundColor: activeToggles.decking ? primaryColor : "#4b5563" }}
            />
          </div>

          {activeToggles.decking && (
            <div className="space-y-3">
              {allDeckingOptions.map((option) => (
                <label key={option.value} className="flex items-center space-x-3 cursor-pointer" onClick={(e) => e.stopPropagation()}>
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
        )}

        {/* Landscaping Card */}
        {allLandscapingOptions.length > 0 && (
        <div className="rounded-xl border-2 p-6 transition-all cursor-pointer"
             style={{
               borderColor: activeToggles.landscaping ? secondaryColor : `${secondaryColor}cc`,
               background: activeToggles.landscaping 
                 ? `linear-gradient(to bottom right, ${secondaryColor}, ${primaryColor}dd)` 
                 : `linear-gradient(to bottom right, ${secondaryColor}cc, ${primaryColor}cc)`
             }}
             onClick={() => handleToggleChange('landscaping', !activeToggles.landscaping)}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white drop-shadow-sm">Landscaping</h3>
            <Switch
              checked={activeToggles.landscaping}
              onCheckedChange={(checked) => handleToggleChange('landscaping', checked)}
              onClick={(e) => e.stopPropagation()}
              style={{ backgroundColor: activeToggles.landscaping ? secondaryColor : "#4b5563" }}
            />
          </div>

          {activeToggles.landscaping && (
            <div className="space-y-3">
              {allLandscapingOptions.map((option) => (
                <label key={option.value} className="flex items-center space-x-3 cursor-pointer" onClick={(e) => e.stopPropagation()}>
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
        )}

        {/* Features Card */}
        {allFeatureOptions.length > 0 && (
        <div className="rounded-xl border-2 p-6 transition-all cursor-pointer"
             style={{
               borderColor: activeToggles.features ? primaryColor : `${primaryColor}cc`,
               background: activeToggles.features 
                 ? `linear-gradient(to bottom right, ${primaryColor}, ${secondaryColor})` 
                 : `linear-gradient(to bottom right, ${primaryColor}cc, ${secondaryColor}cc)`
             }}
             onClick={() => handleToggleChange('features', !activeToggles.features)}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white drop-shadow-sm">Special Features</h3>
            <Switch
              checked={activeToggles.features}
              onCheckedChange={(checked) => handleToggleChange('features', checked)}
              onClick={(e) => e.stopPropagation()}
              style={{ backgroundColor: activeToggles.features ? primaryColor : "#4b5563" }}
            />
          </div>

          {activeToggles.features && (
            <div className="space-y-3">
              {allFeatureOptions.map((option) => (
                <label key={option.value} className="flex items-center space-x-3 cursor-pointer" onClick={(e) => e.stopPropagation()}>
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
        )}

        {/* Hot Tub Card */}
        {allHotTubOptions.length > 0 && (
        <div className="rounded-xl border-2 p-6 transition-all cursor-pointer"
             style={{
               borderColor: activeToggles.hotTub ? secondaryColor : `${secondaryColor}cc`,
               background: activeToggles.hotTub 
                 ? `linear-gradient(to bottom right, ${secondaryColor}, ${primaryColor}dd)` 
                 : `linear-gradient(to bottom right, ${secondaryColor}cc, ${primaryColor}cc)`
             }}
             onClick={() => handleToggleChange('hotTub', !activeToggles.hotTub)}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white drop-shadow-sm">Hot Tub</h3>
            <Switch
              checked={activeToggles.hotTub}
              onCheckedChange={(checked) => handleToggleChange('hotTub', checked)}
              onClick={(e) => e.stopPropagation()}
              style={{ backgroundColor: activeToggles.hotTub ? secondaryColor : "#4b5563" }}
            />
          </div>

          {activeToggles.hotTub && (
            <div className="space-y-3">
              {allHotTubOptions.map((option) => (
                <label key={option.value} className="flex items-center space-x-3 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="radio"
                    name="hotTub"
                    value={option.value}
                    checked={selectedStyles.hotTub === option.value}
                    onChange={() => handleOptionSelect('hotTub', option.value)}
                    className="w-4 h-4 text-white border-white/30 focus:ring-white"
                  />
                  <span className="text-sm text-white drop-shadow-sm">{option.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        )}

        {/* Sauna Card */}
        {allSaunaOptions.length > 0 && (
        <div className="rounded-xl border-2 p-6 transition-all cursor-pointer"
             style={{
               borderColor: activeToggles.sauna ? primaryColor : `${primaryColor}cc`,
               background: activeToggles.sauna 
                 ? `linear-gradient(to bottom right, ${primaryColor}, ${secondaryColor}dd)` 
                 : `linear-gradient(to bottom right, ${primaryColor}cc, ${secondaryColor}cc)`
             }}
             onClick={() => handleToggleChange('sauna', !activeToggles.sauna)}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white drop-shadow-sm">Sauna</h3>
            <Switch
              checked={activeToggles.sauna}
              onCheckedChange={(checked) => handleToggleChange('sauna', checked)}
              onClick={(e) => e.stopPropagation()}
              style={{ backgroundColor: activeToggles.sauna ? primaryColor : "#4b5563" }}
            />
          </div>

          {activeToggles.sauna && (
            <div className="space-y-3">
              {allSaunaOptions.map((option) => (
                <label key={option.value} className="flex items-center space-x-3 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="radio"
                    name="sauna"
                    value={option.value}
                    checked={selectedStyles.sauna === option.value}
                    onChange={() => handleOptionSelect('sauna', option.value)}
                    className="w-4 h-4 text-white border-white/30 focus:ring-white"
                  />
                  <span className="text-sm text-white drop-shadow-sm">{option.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
});

export default PoolStyleSelector;
