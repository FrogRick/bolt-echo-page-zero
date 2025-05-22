
import React from "react";
import { ColorPickers } from "./ColorPickers";
import { OrientationSelect } from "./OrientationSelect";
import { SnapControls } from "./SnapControls";
import { UnderlayControls } from "./UnderlayControls";

interface CanvasToolbarProps {
  currentColor: string;
  setCurrentColor: (color: string) => void;
  fillColor: string;
  setFillColor: (color: string) => void;
  orientation: "portrait" | "landscape";
  handleOrientationChange: (value: string) => void;
  snapToEndpoints: boolean;
  toggleSnapToEndpoints: () => void;
  snapToLines: boolean;
  toggleSnapToLines: () => void;
  snapToAngle: boolean;
  toggleSnapToAngle: () => void;
  snapToExtensions: boolean;
  toggleSnapToExtensions: () => void;
  underlayImage: HTMLImageElement | null;
  addUnderlayImage: (file: File) => void;
  removeUnderlayImage: () => void;
  underlayScale: number;
  adjustUnderlayScale: (scale: number) => void;
  underlayOpacity: number;
  adjustUnderlayOpacity: (opacity: number) => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  currentColor,
  setCurrentColor,
  fillColor,
  setFillColor,
  orientation,
  handleOrientationChange,
  snapToEndpoints,
  toggleSnapToEndpoints,
  snapToLines,
  toggleSnapToLines,
  snapToAngle,
  toggleSnapToAngle,
  snapToExtensions,
  toggleSnapToExtensions,
  underlayImage,
  addUnderlayImage,
  removeUnderlayImage,
  underlayScale,
  adjustUnderlayScale,
  underlayOpacity,
  adjustUnderlayOpacity
}) => {
  return (
    <div className="p-2 bg-white border-b flex items-center gap-4 flex-wrap">
      <ColorPickers 
        currentColor={currentColor}
        setCurrentColor={setCurrentColor}
        fillColor={fillColor}
        setFillColor={setFillColor}
      />
      
      <OrientationSelect 
        orientation={orientation}
        handleOrientationChange={handleOrientationChange}
      />
      
      <SnapControls 
        snapToEndpoints={snapToEndpoints}
        toggleSnapToEndpoints={toggleSnapToEndpoints}
        snapToLines={snapToLines}
        toggleSnapToLines={toggleSnapToLines}
        snapToAngle={snapToAngle}
        toggleSnapToAngle={toggleSnapToAngle}
        snapToExtensions={snapToExtensions}
        toggleSnapToExtensions={toggleSnapToExtensions}
      />
      
      <UnderlayControls 
        underlayImage={underlayImage}
        addUnderlayImage={addUnderlayImage}
        removeUnderlayImage={removeUnderlayImage}
        underlayScale={underlayScale}
        adjustUnderlayScale={adjustUnderlayScale}
        underlayOpacity={underlayOpacity}
        adjustUnderlayOpacity={adjustUnderlayOpacity}
      />
    </div>
  );
};
