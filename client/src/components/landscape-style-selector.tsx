import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

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

// Landscape style options
const curbingOptions = [
  { id: "natural_stone_curbing", name: "Natural Stone Curbing" },
  { id: "concrete_curbing", name: "Concrete Curbing" },
  { id: "brick_curbing", name: "Brick Curbing" },
  { id: "metal_curbing", name: "Metal Curbing" },
];

const landscapeOptions = [
  { id: "mulch_beds", name: "Fresh Mulch Beds" },
  { id: "river_rock", name: "River Rock Landscaping" },
  { id: "decorative_gravel", name: "Decorative Gravel" },
  { id: "pine_straw", name: "Pine Straw Mulch" },
];

const patioOptions = [
  { id: "stamped_concrete_patio", name: "Stamped Concrete Patio" },
  { id: "plain_concrete_patio", name: "Plain Concrete Patio" },
  { id: "exposed_aggregate_patio", name: "Exposed Aggregate Patio" },
  { id: "colored_concrete_patio", name: "Colored Concrete Patio" },
];

export default function LandscapeStyleSelector({
  selectedStyles,
  onStyleChange,
}: LandscapeStyleSelectorProps) {
  const [activeToggles, setActiveToggles] = useState({
    curbing: false,
    landscape: false,
    patios: false,
  });

  const handleToggleChange = (category: keyof typeof activeToggles, checked: boolean) => {
    setActiveToggles(prev => ({ ...prev, [category]: checked }));
    
    if (!checked) {
      // If toggle is turned off, clear the selection for that category
      onStyleChange({
        ...selectedStyles,
        [category]: "",
      });
    }
  };

  const handleOptionSelect = (category: keyof typeof selectedStyles, value: string) => {
    onStyleChange({
      ...selectedStyles,
      [category]: value,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
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
            <div className="space-y-2">
              {curbingOptions.map((option) => (
                <Button
                  key={option.id}
                  variant={selectedStyles.curbing === option.id ? "secondary" : "ghost"}
                  className={`w-full justify-start text-left ${
                    selectedStyles.curbing === option.id
                      ? "bg-white text-emerald-700 hover:bg-white/90"
                      : "text-white hover:bg-white/20"
                  }`}
                  onClick={() => handleOptionSelect('curbing', option.id)}
                >
                  {option.name}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Landscape Materials Card */}
        <div className={`rounded-xl border-2 p-6 transition-all ${
          activeToggles.landscape ? 'border-green-500 bg-gradient-to-br from-green-600 to-green-700' : 'border-green-400 bg-gradient-to-br from-green-500 to-green-600'
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
            <div className="space-y-2">
              {landscapeOptions.map((option) => (
                <Button
                  key={option.id}
                  variant={selectedStyles.landscape === option.id ? "secondary" : "ghost"}
                  className={`w-full justify-start text-left ${
                    selectedStyles.landscape === option.id
                      ? "bg-white text-green-700 hover:bg-white/90"
                      : "text-white hover:bg-white/20"
                  }`}
                  onClick={() => handleOptionSelect('landscape', option.id)}
                >
                  {option.name}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Patios Card */}
        <div className={`rounded-xl border-2 p-6 transition-all ${
          activeToggles.patios ? 'border-teal-500 bg-gradient-to-br from-teal-600 to-teal-700' : 'border-teal-400 bg-gradient-to-br from-teal-500 to-teal-600'
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
            <div className="space-y-2">
              {patioOptions.map((option) => (
                <Button
                  key={option.id}
                  variant={selectedStyles.patios === option.id ? "secondary" : "ghost"}
                  className={`w-full justify-start text-left ${
                    selectedStyles.patios === option.id
                      ? "bg-white text-teal-700 hover:bg-white/90"
                      : "text-white hover:bg-white/20"
                  }`}
                  onClick={() => handleOptionSelect('patios', option.id)}
                >
                  {option.name}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Selection Summary */}
      {(selectedStyles.curbing || selectedStyles.landscape || selectedStyles.patios) && (
        <div className="mt-6 p-4 bg-slate-100 rounded-lg">
          <h4 className="font-medium text-slate-800 mb-2">Selected Features:</h4>
          <div className="space-y-1 text-sm text-slate-600">
            {selectedStyles.curbing && (
              <p>• Curbing: {curbingOptions.find(opt => opt.id === selectedStyles.curbing)?.name}</p>
            )}
            {selectedStyles.landscape && (
              <p>• Landscape: {landscapeOptions.find(opt => opt.id === selectedStyles.landscape)?.name}</p>
            )}
            {selectedStyles.patios && (
              <p>• Patio: {patioOptions.find(opt => opt.id === selectedStyles.patios)?.name}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}