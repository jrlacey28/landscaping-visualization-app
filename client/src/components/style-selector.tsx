import { useState } from "react";
import { Switch } from "@/components/ui/switch";

interface StyleSelectorProps {
  selectedStyles: {
    roof: string;
    siding: string;
    surpriseMe: string;
  };
  onStyleChange: (styles: { roof: string; siding: string; surpriseMe: string }) => void;
}

const roofStyles = [
  { value: "asphalt_shingles", label: "Asphalt Shingles" },
  { value: "steel_roof", label: "Steel Roof" },
  { value: "steel_shingles", label: "Steel Shingles" },
];

const roofColors = [
  { value: "charcoal_black", label: "Charcoal Black" },
  { value: "weathered_gray", label: "Weathered Gray" },
  { value: "rustic_brown", label: "Rustic Brown" },
  { value: "slate_blue", label: "Slate Blue" },
  { value: "forest_green", label: "Forest Green" },
];

const sidingOptions = [
  { value: "vinyl_siding_white", label: "Vinyl Siding - White" },
  { value: "vinyl_siding_gray", label: "Vinyl Siding - Gray" },
  { value: "fiber_cement_beige", label: "Fiber Cement - Beige" },
  { value: "wood_siding_natural", label: "Wood Siding - Natural" },
  { value: "brick_veneer_red", label: "Brick Veneer - Red" },
];

export default function StyleSelector({ selectedStyles, onStyleChange }: StyleSelectorProps) {
  const [activeToggles, setActiveToggles] = useState({
    roof: !!selectedStyles.roof,
    siding: !!selectedStyles.siding,
    surpriseMe: !!selectedStyles.surpriseMe,
  });
  
  const [selectedRoofStyle, setSelectedRoofStyle] = useState("");
  const [selectedRoofColor, setSelectedRoofColor] = useState("");

  const handleToggleChange = (category: 'roof' | 'siding' | 'surpriseMe', enabled: boolean) => {
    setActiveToggles(prev => ({ ...prev, [category]: enabled }));
    
    if (!enabled) {
      // If toggling off, clear the selection
      onStyleChange({
        ...selectedStyles,
        [category]: "",
      });
    }
  };

  const handleOptionSelect = (category: 'roof' | 'siding' | 'surpriseMe', value: string) => {
    onStyleChange({
      ...selectedStyles,
      [category]: value,
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <p className="text-slate-600">Select the roofing and siding options you'd like to see on your home</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Roof Card */}
        <div className={`rounded-xl border-2 p-6 transition-all ${
          activeToggles.roof ? 'border-blue-500 bg-gradient-to-br from-blue-600 to-blue-700' : 'border-blue-400 bg-gradient-to-br from-blue-500 to-blue-600'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white drop-shadow-sm">Roof</h3>
            <Switch
              checked={activeToggles.roof}
              onCheckedChange={(checked) => handleToggleChange('roof', checked)}
              className="data-[state=checked]:bg-white data-[state=unchecked]:bg-white/30"
            />
          </div>
          
          {activeToggles.roof && (
            <div className="space-y-4">
              {/* Roof Style Selection */}
              <div>
                <p className="text-sm text-white/80 mb-2">Choose Style:</p>
                <div className="space-y-2">
                  {roofStyles.map((style) => (
                    <label key={style.value} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="roofStyle"
                        value={style.value}
                        checked={selectedRoofStyle === style.value}
                        onChange={() => {
                          setSelectedRoofStyle(style.value);
                          setSelectedRoofColor(""); // Reset color when style changes
                          handleOptionSelect('roof', '');
                        }}
                        className="w-4 h-4 text-white border-white/30 focus:ring-white"
                      />
                      <span className="text-sm text-white drop-shadow-sm">{style.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Roof Color Selection */}
              {selectedRoofStyle && (
                <div>
                  <p className="text-sm text-white/80 mb-2">Choose Color:</p>
                  <div className="space-y-2">
                    {roofColors.map((color) => (
                      <label key={color.value} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="roofColor"
                          value={color.value}
                          checked={selectedRoofColor === color.value}
                          onChange={() => {
                            setSelectedRoofColor(color.value);
                            handleOptionSelect('roof', `${selectedRoofStyle}_${color.value}`);
                          }}
                          className="w-4 h-4 text-white border-white/30 focus:ring-white"
                        />
                        <span className="text-sm text-white drop-shadow-sm">{color.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Siding Card */}
        <div className={`rounded-xl border-2 p-6 transition-all ${
          activeToggles.siding ? 'border-slate-500 bg-gradient-to-br from-slate-600 to-slate-700' : 'border-slate-400 bg-gradient-to-br from-slate-500 to-slate-600'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white drop-shadow-sm">Siding</h3>
            <Switch
              checked={activeToggles.siding}
              onCheckedChange={(checked) => handleToggleChange('siding', checked)}
              className="data-[state=checked]:bg-white data-[state=unchecked]:bg-white/30"
            />
          </div>
          
          {activeToggles.siding && (
            <div className="space-y-3">
              {sidingOptions.map((option) => (
                <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="siding"
                    value={option.value}
                    checked={selectedStyles.siding === option.value}
                    onChange={() => handleOptionSelect('siding', option.value)}
                    className="w-4 h-4 text-white border-white/30 focus:ring-white"
                  />
                  <span className="text-sm text-white drop-shadow-sm">{option.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Surprise Me Card */}
        <div className={`rounded-xl border-2 p-6 transition-all ${
          activeToggles.surpriseMe ? 'border-red-500 bg-gradient-to-br from-red-600 to-rose-700' : 'border-red-400 bg-gradient-to-br from-red-500 to-rose-600'
        }`}>
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
              className="data-[state=checked]:bg-white data-[state=unchecked]:bg-white/30"
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
      </div>
    </div>
  );
}
