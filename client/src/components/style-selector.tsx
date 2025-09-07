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
  primaryColor?: string;
  secondaryColor?: string;
}

const roofStyles = [
  { value: "asphalt_shingles", label: "Asphalt Shingles" },
  { value: "steel_roof", label: "Steel Roof" },
  { value: "steel_shingles", label: "Steel Shingles" },
];

const roofColors = [
  { value: "charcoal_gray", label: "Charcoal Gray", hex: "#36454F" },
  { value: "pewter_gray", label: "Pewter Gray", hex: "#8C92AC" },
  { value: "weathered_wood", label: "Weathered Wood", hex: "#79685D" },
  { value: "driftwood", label: "Driftwood", hex: "#A7988A" },
  { value: "desert_tan", label: "Desert Tan", hex: "#D2B48C" },
  { value: "slate_blue", label: "Slate Blue", hex: "#6A7BA2" },
  { value: "williamsburg_gray", label: "Williamsburg Gray", hex: "#B0AFAE" },
  { value: "forest_green", label: "Forest Green", hex: "#014421" },
  { value: "midnight_black", label: "Midnight Black", hex: "#1C1C1C" },
  { value: "moire_black", label: "Moire Black", hex: "#2E2E2E" },
  { value: "merlot", label: "Merlot", hex: "#73343A" },
  { value: "estate_gray", label: "Estate Gray", hex: "#555555" },
  { value: "barkwood", label: "Barkwood", hex: "#5C4033" },
  { value: "harbor_blue", label: "Harbor Blue", hex: "#46647E" },
  { value: "onyx_black", label: "Onyx Black", hex: "#0F0F0F" },
];

const sidingStyles = [
  { value: "vinyl_siding", label: "Vinyl Siding" },
  { value: "fiber_cement", label: "Fiber Cement" },
  { value: "wood_siding", label: "Wood Siding" },
  { value: "brick_veneer", label: "Brick Veneer" },
];

const sidingColors = [
  { value: "white", label: "White", hex: "#FFFFFF" },
  { value: "colonial_white", label: "Colonial White", hex: "#FAF9F6" },
  { value: "gray", label: "Gray", hex: "#808080" },
  { value: "greige", label: "Greige", hex: "#BEB6AA" },
  { value: "beige_almond", label: "Beige / Almond", hex: "#F5F5DC" },
  { value: "sandstone", label: "Sandstone", hex: "#C2B280" },
  { value: "navy_coastal_blue", label: "Navy / Coastal Blue", hex: "#2C3E50" },
  { value: "sage_green", label: "Sage Green", hex: "#9C9F84" },
  { value: "forest_green", label: "Forest Green", hex: "#014421" },
  { value: "autumn_red", label: "Autumn Red", hex: "#8B2E2E" },
  { value: "brown_chestnut_espresso", label: "Brown (Chestnut / Espresso)", hex: "#4B3621" },
  { value: "charcoal_dark_gray", label: "Charcoal / Dark Gray", hex: "#333333" },
  { value: "clay_khaki", label: "Clay / Khaki", hex: "#B2A17E" },
  { value: "azure_blue", label: "Azure Blue", hex: "#4A90E2" },
  { value: "savannah_wicker", label: "Savannah Wicker", hex: "#D8CAB1" },
];

export default function StyleSelector({ selectedStyles, onStyleChange, primaryColor = "#475569", secondaryColor = "#64748b" }: StyleSelectorProps) {
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
    // Handle mutual exclusivity between surprise me and other options
    if (category === 'surpriseMe' && enabled) {
      // If enabling surprise me, disable roof and siding
      setActiveToggles({ roof: false, siding: false, surpriseMe: true });
      onStyleChange({
        roof: "",
        siding: "",
        surpriseMe: selectedStyles.surpriseMe || "random_roof_and_siding",
      });
    } else if ((category === 'roof' || category === 'siding') && enabled && activeToggles.surpriseMe) {
      // If enabling roof or siding while surprise me is active, disable surprise me
      setActiveToggles(prev => ({ ...prev, [category]: enabled, surpriseMe: false }));
      onStyleChange({
        ...selectedStyles,
        [category]: selectedStyles[category],
        surpriseMe: "",
      });
    } else {
      // Normal toggle behavior
      setActiveToggles(prev => ({ ...prev, [category]: enabled }));
      
      if (!enabled) {
        // If toggling off, clear the selection
        onStyleChange({
          ...selectedStyles,
          [category]: "",
        });
      }
    }
  };

  const handleOptionSelect = (category: 'roof' | 'siding' | 'surpriseMe', value: string) => {
    // Ensure the toggle stays active when making a selection
    setActiveToggles(prev => ({ ...prev, [category]: true }));
    
    onStyleChange({
      ...selectedStyles,
      [category]: value,
    });
  };

  return (
    <div className="space-y-6">

      <div className="grid md:grid-cols-3 gap-4">
        {/* Roof Card */}
        <div className="rounded-xl border-2 p-6 transition-all cursor-pointer"
             style={{
               borderColor: activeToggles.roof ? primaryColor : `${primaryColor}cc`,
               background: activeToggles.roof 
                 ? `linear-gradient(to bottom right, ${primaryColor}, ${secondaryColor}dd)` 
                 : `linear-gradient(to bottom right, ${primaryColor}cc, ${secondaryColor}cc)`
             }}
             onClick={() => handleToggleChange('roof', !activeToggles.roof)}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white drop-shadow-sm">Roof</h3>
            <Switch
              checked={activeToggles.roof}
              onCheckedChange={(checked) => handleToggleChange('roof', checked)}
              onClick={(e) => e.stopPropagation()}
              className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-600"
            />
          </div>
          
          {activeToggles.roof && (
            <div className="space-y-3">
              {/* Roof Style Selection */}
              <div>
                <p className="text-sm text-white/80 mb-2">Choose Style:</p>
                <div className="space-y-3">
                  {roofStyles.map((style) => (
                    <label key={style.value} className="flex items-center space-x-3 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="radio"
                        name="roofStyle"
                        value={style.value}
                        checked={selectedRoofStyle === style.value}
                        onChange={() => {
                          setSelectedRoofStyle(style.value);
                          setSelectedRoofColor(""); // Reset color when style changes
                          setActiveToggles(prev => ({ ...prev, roof: true }));
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
                <div onClick={(e) => e.stopPropagation()}>
                  <p className="text-sm text-white/80 mb-2">Choose Color:</p>
                  <Select
                    value={selectedRoofColor}
                    onValueChange={(value) => {
                      setSelectedRoofColor(value);
                      setActiveToggles(prev => ({ ...prev, roof: true }));
                      handleOptionSelect('roof', `${selectedRoofStyle}_${value}`);
                    }}
                  >
                    <SelectTrigger className="bg-white/90 border-white/30 text-slate-800" onClick={(e) => e.stopPropagation()}>
                      <SelectValue placeholder="Select a color" />
                    </SelectTrigger>
                    <SelectContent onClick={(e) => e.stopPropagation()}>
                      {roofColors.map((color) => (
                        <SelectItem key={color.value} value={color.value} onClick={(e) => e.stopPropagation()}>
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
        <div className="rounded-xl border-2 p-6 transition-all cursor-pointer"
             style={{
               borderColor: activeToggles.siding ? secondaryColor : `${secondaryColor}cc`,
               background: activeToggles.siding 
                 ? `linear-gradient(to bottom right, ${secondaryColor}, ${primaryColor}dd)` 
                 : `linear-gradient(to bottom right, ${secondaryColor}cc, ${primaryColor}cc)`
             }}
             onClick={() => handleToggleChange('siding', !activeToggles.siding)}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white drop-shadow-sm">Siding</h3>
            <Switch
              checked={activeToggles.siding}
              onCheckedChange={(checked) => handleToggleChange('siding', checked)}
              onClick={(e) => e.stopPropagation()}
              className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-600"
            />
          </div>
          
          {activeToggles.siding && (
            <div className="space-y-3">
              {/* Siding Style Selection */}
              <div>
                <p className="text-sm text-white/80 mb-2">Choose Style:</p>
                <div className="space-y-3">
                  {sidingStyles.map((style) => (
                    <label key={style.value} className="flex items-center space-x-3 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="radio"
                        name="sidingStyle"
                        value={style.value}
                        checked={selectedSidingStyle === style.value}
                        onChange={() => {
                          setSelectedSidingStyle(style.value);
                          setSelectedSidingColor(""); // Reset color when style changes
                          setActiveToggles(prev => ({ ...prev, siding: true }));
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
                <div onClick={(e) => e.stopPropagation()}>
                  <p className="text-sm text-white/80 mb-2">Choose Color:</p>
                  <Select
                    value={selectedSidingColor}
                    onValueChange={(value) => {
                      setSelectedSidingColor(value);
                      setActiveToggles(prev => ({ ...prev, siding: true }));
                      handleOptionSelect('siding', `${selectedSidingStyle}_${value}`);
                    }}
                  >
                    <SelectTrigger className="bg-white/90 border-white/30 text-slate-800" onClick={(e) => e.stopPropagation()}>
                      <SelectValue placeholder="Select a color" />
                    </SelectTrigger>
                    <SelectContent onClick={(e) => e.stopPropagation()}>
                      {sidingColors.map((color) => (
                        <SelectItem key={color.value} value={color.value} onClick={(e) => e.stopPropagation()}>
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
        <div className="rounded-xl border-2 p-6 transition-all cursor-pointer"
             style={{
               borderColor: activeToggles.surpriseMe ? primaryColor : `${primaryColor}cc`,
               background: activeToggles.surpriseMe 
                 ? `linear-gradient(to bottom right, ${primaryColor}, ${secondaryColor})` 
                 : `linear-gradient(to bottom right, ${primaryColor}cc, ${secondaryColor}cc)`
             }}
             onClick={() => handleToggleChange('surpriseMe', !activeToggles.surpriseMe)}>
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
              onClick={(e) => e.stopPropagation()}
              className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-600"
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
