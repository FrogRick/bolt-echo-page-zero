
import React from "react";

interface ColorPickersProps {
  currentColor: string;
  setCurrentColor: (color: string) => void;
  fillColor: string;
  setFillColor: (color: string) => void;
}

export const ColorPickers: React.FC<ColorPickersProps> = ({
  currentColor,
  setCurrentColor,
  fillColor,
  setFillColor
}) => {
  return (
    <>
      <div className="flex items-center gap-2">
        <label htmlFor="colorPicker" className="text-sm font-medium">Stroke:</label>
        <input
          id="colorPicker"
          type="color"
          value={currentColor}
          onChange={(e) => setCurrentColor(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer"
        />
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="fillColorPicker" className="text-sm font-medium">Fill:</label>
        <input
          id="fillColorPicker"
          type="color"
          value={fillColor}
          onChange={(e) => setFillColor(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer"
        />
      </div>
    </>
  );
};
