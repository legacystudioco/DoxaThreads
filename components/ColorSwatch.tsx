"use client";

interface ColorOption {
  name: string;
  hex: string;
}

interface ColorSwatchProps {
  colors: ColorOption[];
  selectedColor: string;
  onColorSelect: (colorName: string) => void;
}

export function ColorSwatch({ colors, selectedColor, onColorSelect }: ColorSwatchProps) {
  if (colors.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="font-bold uppercase text-sm tracking-wider">
          Color selected:
        </label>
        <div 
          className="w-6 h-6 rounded border-2 border-black"
          style={{ backgroundColor: colors.find(c => c.name === selectedColor)?.hex || "#cccccc" }}
        />
        <span className="font-medium">{selectedColor}</span>
      </div>

      <div className="flex gap-3 flex-wrap">
        {colors.map((color) => {
          const isSelected = selectedColor === color.name;
          
          return (
            <button
              key={color.name}
              onClick={() => onColorSelect(color.name)}
              className={`
                relative flex flex-col items-center gap-2 p-3 rounded-lg
                transition-all duration-200
                ${isSelected 
                  ? 'ring-4 ring-black ring-offset-2' 
                  : 'hover:ring-2 hover:ring-neutral-300 hover:ring-offset-2'
                }
              `}
              type="button"
            >
              {/* Color Swatch Square */}
              <div 
                className="w-16 h-16 rounded border-2 border-black relative overflow-hidden"
                style={{ backgroundColor: color.hex }}
              >
                {/* Checkmark Overlay */}
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                    <svg 
                      className="w-10 h-10 text-white drop-shadow-lg" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Color Name */}
              <span className={`text-sm font-medium ${isSelected ? 'font-bold' : ''}`}>
                {color.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
