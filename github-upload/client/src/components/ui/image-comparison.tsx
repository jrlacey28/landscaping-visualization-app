import { useState } from "react";

interface ImageComparisonProps {
  beforeImage: string;
  afterImage: string;
}

export default function ImageComparison({ beforeImage, afterImage }: ImageComparisonProps) {
  const [sliderPosition, setSliderPosition] = useState(50);

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Before Image */}
      <div className="relative">
        <img
          src={beforeImage}
          alt="Original property photo"
          className="w-full h-48 md:h-64 object-cover"
        />
        <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
          Before
        </div>
      </div>

      {/* After Image Overlay */}
      <div 
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={afterImage}
          alt="AI-generated landscape visualization"
          className="w-full h-48 md:h-64 object-cover"
        />
        <div className="absolute top-4 right-4 bg-primary text-white px-3 py-1 rounded-full text-sm font-medium">
          After
        </div>
      </div>

      {/* Slider */}
      <div className="absolute inset-0 flex items-center">
        <input
          type="range"
          min="0"
          max="100"
          value={sliderPosition}
          onChange={(e) => setSliderPosition(Number(e.target.value))}
          className="w-full h-full opacity-0 cursor-ew-resize"
        />
        <div 
          className="absolute w-0.5 h-full bg-white shadow-lg pointer-events-none"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
