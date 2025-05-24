
import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Monitor, Smartphone, Upload, Image, Trash2, Check, Edit3 } from "lucide-react";
import { Tool } from "@/types/canvas";

interface CanvasToolbarProps {
  activeTool: Tool;
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
  confirmImagePlacement: () => void;
  imageConfirmed: boolean;
  reactivateImagePositioning: () => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  activeTool,
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
  confirmImagePlacement,
  imageConfirmed,
  reactivateImagePositioning
}) => {
  // Determine which sections to show based on active tool
  const isFloorPlanOrSymbolTool = activeTool !== "select";
  const showOrientationControls = !underlayImage;
  const showSnapControls = isFloorPlanOrSymbolTool;
  const showColorControls = isFloorPlanOrSymbolTool;

  return (
    <div className="p-3 bg-white border-b flex flex-wrap items-center gap-3">
      {/* Drawing Colors - Only show when floor plan or symbol tool is active */}
      {showColorControls && (
        <>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Stroke:</span>
            <input 
              type="color" 
              value={currentColor} 
              onChange={e => setCurrentColor(e.target.value)} 
              className="w-8 h-8 border border-gray-300 rounded cursor-pointer" 
            />
          </div>

          {/* Fill Colors */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Fill:</span>
            <input 
              type="color" 
              value={fillColor} 
              onChange={e => setFillColor(e.target.value)} 
              className="w-8 h-8 border border-gray-300 rounded cursor-pointer" 
            />
          </div>

          <Separator orientation="vertical" className="h-8" />
        </>
      )}

      {/* Canvas Orientation - Only show when no underlay image */}
      {showOrientationControls && (
        <>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Orientation:</span>
            <Button 
              variant={orientation === "portrait" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setOrientation("portrait")} 
              className="flex items-center gap-1"
            >
              <Smartphone className="h-4 w-4" />
              Portrait
            </Button>
            <Button 
              variant={orientation === "landscape" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setOrientation("landscape")} 
              className="flex items-center gap-1"
            >
              <Monitor className="h-4 w-4" />
              Landscape
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8" />
        </>
      )}

      {/* Snap Controls - Only show when floor plan or symbol tool is active */}
      {showSnapControls && (
        <>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Snap:</span>
            <Button 
              variant={snapToEndpoints ? "default" : "outline"} 
              size="sm" 
              onClick={toggleSnapToEndpoints}
            >
              Endpoints
            </Button>
            <Button 
              variant={snapToLines ? "default" : "outline"} 
              size="sm" 
              onClick={toggleSnapToLines}
            >
              Lines
            </Button>
            <Button 
              variant={snapToAngle ? "default" : "outline"} 
              size="sm" 
              onClick={toggleSnapToAngle}
            >
              Angle
            </Button>
            <Button 
              variant={snapToExtensions ? "default" : "outline"} 
              size="sm" 
              onClick={toggleSnapToExtensions}
            >
              Extensions
            </Button>
          </div>
        </>
      )}

      {/* Underlay Image Controls */}
      
    </div>
  );
};

export default CanvasToolbar;
