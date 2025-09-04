import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

const sidingStyles = [
  { value: "vinyl_siding", label: "Vinyl Siding" },
  { value: "fiber_cement", label: "Fiber Cement" },
  { value: "wood_siding", label: "Wood Siding" },
  { value: "brick_veneer", label: "Brick Veneer" },
];

const sidingColors = [
  { value: "white", label: "White" },
  { value: "gray", label: "Gray" },
  { value: "beige", label: "Beige" },
  { value: "natural", label: "Natural" },
  { value: "red", label: "Red" },
  { value: "brown", label: "Brown" },
  { value: "tan", label: "Tan" },
];

export default function StyleSelector({ selectedStyles, onStyleChange }: StyleSelectorProps) {
  const [activeToggles, setActiveToggles] = useState({
    roof: !!selectedStyles.roof,
    siding: !!selectedStyles.siding,
    surpriseMe: !!selectedStyles.surpriseMe,
  });
  
  const [selectedRoofStyle, setSelectedRoofStyle] = useState("");
  const [selectedRoofColor, setSelectedRoofColor] = useState("");
  const [selectedSidingStyle, setSelectedSidingStyle] = useState("");
  const [selectedSidingColor, setSelectedSidingColor] = useState("");

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
            <div className="space-y-3">
              {/* Roof Style Selection */}
              <div>
                <p className="text-sm text-white/80 mb-2">Choose Style:</p>
                <div className="space-y-3">
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
                  <Select
                    value={selectedRoofColor}
                    onValueChange={(value) => {
                      setSelectedRoofColor(value);
                      handleOptionSelect('roof', `${selectedRoofStyle}_${value}`);
                    }}
                  >
                    <SelectTrigger className="bg-white/90 border-white/30 text-slate-800">
                      <SelectValue placeholder="Select a color" />
                    </SelectTrigger>
                    <SelectContent>
                      {roofColors.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          {color.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              {/* Siding Style Selection */}
              <div>
                <p className="text-sm text-white/80 mb-2">Choose Style:</p>
                <div className="space-y-3">
                  {sidingStyles.map((style) => (
                    <label key={style.value} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="sidingStyle"
                        value={style.value}
                        checked={selectedSidingStyle === style.value}
                        onChange={() => {
                          setSelectedSidingStyle(style.value);
                          setSelectedSidingColor(""); // Reset color when style changes
                          handleOptionSelect('siding', '');
                        }}
                        className="w-4 h-4 text-white border-white/30 focus:ring-white"
                      />
                      <span className="text-sm text-white drop-shadow-sm">{style.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Siding Color Selection */}
              {selectedSidingStyle && (
                <div>
                  <p className="text-sm text-white/80 mb-2">Choose Color:</p>
                  <Select
                    value={selectedSidingColor}
                    onValueChange={(value) => {
                      setSelectedSidingColor(value);
                      handleOptionSelect('siding', `${selectedSidingStyle}_${value}`);
                    }}
                  >
                    <SelectTrigger className="bg-white/90 border-white/30 text-slate-800">
                      <SelectValue placeholder="Select a color" />
                    </SelectTrigger>
                    <SelectContent>
                      {sidingColors.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          {color.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
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
