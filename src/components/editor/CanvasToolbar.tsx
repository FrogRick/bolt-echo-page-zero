
import React from "react";
import { Tool } from "@/types/canvas";
import { Toggle } from "@/components/ui/toggle";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageIcon, ImageOff, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface CanvasToolbarProps {
  currentColor: string;
  setCurrentColor: (color: string) => void;
  fillColor: string;
  setFillColor: (color: string) => void;
  orientation: "portrait" | "landscape";
  setOrientation: (orientation: "portrait" | "landscape") => void;
  snapToEndpoints: boolean;
  toggleSnapToEndpoints: () => void;
  snapToLines: boolean;
  toggleSnapToLines: () => void;
  snapToAngle: boolean;
  toggleSnapToAngle: () => void;
  snapToExtensions: boolean;
  toggleSnapToExtensions: () => void;
  handleUploadClick: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  underlayImage: boolean;
  removeUnderlayImage: () => void;
  underlayOpacity: number;
  adjustUnderlayOpacity: (opacity: number) => void;
  underlayScale: number;
  adjustUnderlayScale: (scale: number) => void;
}

const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  currentColor,
  setCurrentColor,
  fillColor,
  setFillColor,
  orientation,
  setOrientation,
  snapToEndpoints,
  toggleSnapToEndpoints,
  snapToLines,
  toggleSnapToLines,
  snapToAngle,
  toggleSnapToAngle,
  snapToExtensions,
  toggleSnapToExtensions,
  handleUploadClick,
  fileInputRef,
  underlayImage,
  removeUnderlayImage,
  underlayOpacity,
  adjustUnderlayOpacity,
  underlayScale,
  adjustUnderlayScale
}) => {
  const handleOrientationChange = (value: string) => {
    setOrientation(value as "portrait" | "landscape");
  };

  return (
    <div className="p-2 bg-white border-b flex items-center gap-4 flex-wrap">
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
      
      <div className="border-l pl-4 flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium">Orientation:</span>
          <Select
            value={orientation}
            onValueChange={handleOrientationChange}
          >
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue placeholder="Portrait" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="portrait">Portrait</SelectItem>
              <SelectItem value="landscape">Landscape</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="border-l pl-4 flex items-center gap-3">
        <Toggle 
          pressed={snapToEndpoints} 
          onPressedChange={toggleSnapToEndpoints}
          aria-label="Toggle snap to endpoints"
          className="data-[state=on]:bg-blue-500 data-[state=on]:text-white"
        >
          <span className="text-sm">Snap</span>
        </Toggle>
        
        <Toggle 
          pressed={snapToLines} 
          onPressedChange={toggleSnapToLines}
          aria-label="Toggle snap to lines"
          className="data-[state=on]:bg-blue-500 data-[state=on]:text-white"
        >
          <span className="text-sm">Lines</span>
        </Toggle>
        
        <Toggle 
          pressed={snapToAngle} 
          onPressedChange={toggleSnapToAngle}
          aria-label="Toggle snap to 45 degree angles"
          className="data-[state=on]:bg-blue-500 data-[state=on]:text-white"
        >
          <span className="text-sm">45°</span>
        </Toggle>

        <Toggle 
          pressed={snapToExtensions} 
          onPressedChange={toggleSnapToExtensions}
          aria-label="Toggle snap to extensions"
          className="data-[state=on]:bg-blue-500 data-[state=on]:text-white"
        >
          <span className="text-sm">Extension</span>
        </Toggle>
      </div>
      
      <div className="border-l pl-4 flex items-center gap-3">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleUploadClick}
          className="flex items-center gap-1"
        >
          <Upload size={16} />
          <span>Underlay</span>
        </Button>
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*" 
          className="hidden"
        />
        
        {underlayImage && (
          <>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={removeUnderlayImage} 
              className="flex items-center gap-1 text-red-500"
            >
              <ImageOff size={16} />
              <span>Remove</span>
            </Button>
            
            <div className="flex items-center gap-2">
              <ImageIcon size={16} className="text-gray-500" />
              <div className="w-24">
                <Slider 
                  value={[underlayOpacity * 100]} 
                  min={10} 
                  max={100} 
                  step={5}
                  onValueChange={(value) => adjustUnderlayOpacity(value[0] / 100)}
                />
              </div>
              <span className="text-xs text-gray-500">{Math.round(underlayOpacity * 100)}%</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Scale:</span>
              <div className="w-24">
                <Slider 
                  value={[underlayScale * 100]} 
                  min={10} 
                  max={200} 
                  step={5}
                  onValueChange={(value) => adjustUnderlayScale(value[0] / 100)}
                />
              </div>
              <span className="text-xs text-gray-500">{Math.round(underlayScale * 100)}%</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CanvasToolbar;
