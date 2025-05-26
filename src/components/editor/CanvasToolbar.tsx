import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Monitor, Smartphone, Upload, Image, Trash2, Check, Edit3, Download } from "lucide-react";
import { Tool } from "@/types/canvas";

interface CanvasToolbarProps {
  activeTool: Tool;
  currentColor: string;
  setCurrentColor: (color: string) => void;
  fillColor: string;
  setFillColor: (color: string) => void;
  fillOpacity: number;
  setFillOpacity: (opacity: number) => void;
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
  wallThickness: number;
  setWallThickness: (thickness: number) => void;
  isWallToolActive: boolean;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  activeTool,
  currentColor,
  setCurrentColor,
  fillColor,
  setFillColor,
  fillOpacity,
  setFillOpacity,
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
  reactivateImagePositioning,
  wallThickness,
  setWallThickness,
  isWallToolActive
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

          {/* Fill Colors with Opacity */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Fill:</span>
            <input 
              type="color" 
              value={fillColor} 
              onChange={e => setFillColor(e.target.value)} 
              className="w-8 h-8 border border-gray-300 rounded cursor-pointer" 
            />
            <div className="flex items-center gap-2 ml-2">
              <span className="text-xs text-gray-600">Opacity:</span>
              <div className="w-20">
                <Slider
                  value={[fillOpacity]}
                  onValueChange={(value) => setFillOpacity(value[0])}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
              </div>
              <span className="text-xs text-gray-600 w-8">{fillOpacity}%</span>
            </div>
          </div>

          <Separator orientation="vertical" className="h-8" />
        </>
      )}

      {/* Wall Thickness Slider - Only show when wall tool is active */}
      {isWallToolActive && (
        <>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Wall Thickness:</span>
            <div className="w-32">
              <Slider
                value={[wallThickness]}
                onValueChange={(value) => setWallThickness(value[0])}
                max={20}
                min={2}
                step={1}
                className="w-full"
              />
            </div>
            <span className="text-xs text-gray-600 w-8">{wallThickness}px</span>
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
      <div className="ml-auto flex items-center gap-2">
        {underlayImage ? (
          <>
            {imageConfirmed ? (
              <Button
                variant="outline"
                size="sm"
                onClick={reactivateImagePositioning}
                className="flex items-center gap-1"
              >
                <Edit3 className="h-4 w-4" />
                Edit Image
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={confirmImagePlacement}
                className="flex items-center gap-1 bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
              >
                <Check className="h-4 w-4" />
                Confirm Image
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={removeUnderlayImage}
              className="flex items-center gap-1 bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4" />
              Remove Image
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleUploadClick}
            className="flex items-center gap-1"
          >
            <Upload className="h-4 w-4" />
            Upload Image
          </Button>
        )}
      </div>
    </div>
  );
};

export default CanvasToolbar;