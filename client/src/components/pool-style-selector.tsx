import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

export default function PoolStyleSelector({ selectedStyles, onStyleChange }: PoolStyleSelectorProps) {
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
        <div className={`rounded-xl border-2 p-6 transition-all ${
          activeToggles.poolType ? 'border-blue-500 bg-gradient-to-br from-blue-600 to-blue-700' : 'border-blue-400 bg-gradient-to-br from-blue-500 to-blue-600'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white drop-shadow-sm">Pool Type</h3>
            <Switch
              checked={activeToggles.poolType}
              onCheckedChange={(checked) => handleToggleChange('poolType', checked)}
              className="data-[state=checked]:bg-white data-[state=unchecked]:bg-white/30"
            />
          </div>
          
          {activeToggles.poolType && (
            <div>
              <p className="text-sm text-white/80 mb-2">Choose Pool Type:</p>
              <Select
                value={selectedStyles.poolType}
                onValueChange={(value) => handleOptionSelect('poolType', value)}
              >
                <SelectTrigger className="bg-white/90 border-white/30 text-slate-800">
                  <SelectValue placeholder="Select pool type" />
                </SelectTrigger>
                <SelectContent>
                  {poolTypes.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Pool Size Card */}
        <div className={`rounded-xl border-2 p-6 transition-all ${
          activeToggles.poolSize ? 'border-cyan-500 bg-gradient-to-br from-cyan-600 to-cyan-700' : 'border-cyan-400 bg-gradient-to-br from-cyan-500 to-cyan-600'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white drop-shadow-sm">Pool Size</h3>
            <Switch
              checked={activeToggles.poolSize}
              onCheckedChange={(checked) => handleToggleChange('poolSize', checked)}
              className="data-[state=checked]:bg-white data-[state=unchecked]:bg-white/30"
            />
          </div>
          
          {activeToggles.poolSize && (
            <div>
              <p className="text-sm text-white/80 mb-2">Choose Pool Size:</p>
              <Select
                value={selectedStyles.poolSize}
                onValueChange={(value) => handleOptionSelect('poolSize', value)}
              >
                <SelectTrigger className="bg-white/90 border-white/30 text-slate-800">
                  <SelectValue placeholder="Select pool size" />
                </SelectTrigger>
                <SelectContent>
                  {poolSizes.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Decking Card */}
        <div className={`rounded-xl border-2 p-6 transition-all ${
          activeToggles.decking ? 'border-amber-500 bg-gradient-to-br from-amber-600 to-amber-700' : 'border-amber-400 bg-gradient-to-br from-amber-500 to-amber-600'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white drop-shadow-sm">Pool Decking</h3>
            <Switch
              checked={activeToggles.decking}
              onCheckedChange={(checked) => handleToggleChange('decking', checked)}
              className="data-[state=checked]:bg-white data-[state=unchecked]:bg-white/30"
            />
          </div>
          
          {activeToggles.decking && (
            <div>
              <p className="text-sm text-white/80 mb-2">Choose Decking:</p>
              <Select
                value={selectedStyles.decking}
                onValueChange={(value) => handleOptionSelect('decking', value)}
              >
                <SelectTrigger className="bg-white/90 border-white/30 text-slate-800">
                  <SelectValue placeholder="Select decking type" />
                </SelectTrigger>
                <SelectContent>
                  {deckingOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Landscaping Card */}
        <div className={`rounded-xl border-2 p-6 transition-all ${
          activeToggles.landscaping ? 'border-green-500 bg-gradient-to-br from-green-600 to-green-700' : 'border-green-400 bg-gradient-to-br from-green-500 to-green-600'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white drop-shadow-sm">Landscaping</h3>
            <Switch
              checked={activeToggles.landscaping}
              onCheckedChange={(checked) => handleToggleChange('landscaping', checked)}
              className="data-[state=checked]:bg-white data-[state=unchecked]:bg-white/30"
            />
          </div>
          
          {activeToggles.landscaping && (
            <div>
              <p className="text-sm text-white/80 mb-2">Choose Landscaping:</p>
              <Select
                value={selectedStyles.landscaping}
                onValueChange={(value) => handleOptionSelect('landscaping', value)}
              >
                <SelectTrigger className="bg-white/90 border-white/30 text-slate-800">
                  <SelectValue placeholder="Select landscaping style" />
                </SelectTrigger>
                <SelectContent>
                  {landscapingOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Features Card */}
        <div className={`rounded-xl border-2 p-6 transition-all ${
          activeToggles.features ? 'border-purple-500 bg-gradient-to-br from-purple-600 to-purple-700' : 'border-purple-400 bg-gradient-to-br from-purple-500 to-purple-600'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white drop-shadow-sm">Special Features</h3>
            <Switch
              checked={activeToggles.features}
              onCheckedChange={(checked) => handleToggleChange('features', checked)}
              className="data-[state=checked]:bg-white data-[state=unchecked]:bg-white/30"
            />
          </div>
          
          {activeToggles.features && (
            <div>
              <p className="text-sm text-white/80 mb-2">Choose Features:</p>
              <Select
                value={selectedStyles.features}
                onValueChange={(value) => handleOptionSelect('features', value)}
              >
                <SelectTrigger className="bg-white/90 border-white/30 text-slate-800">
                  <SelectValue placeholder="Select special features" />
                </SelectTrigger>
                <SelectContent>
                  {featureOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}