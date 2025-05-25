import React, { useEffect } from "react";
import { Tool } from "@/types/canvas";
import { Button } from "@/components/ui/button";
import { Check, X, Upload, Edit3, Trash2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface CanvasContainerProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  canvasSize: { width: number; height: number };
  startDrawing: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  draw: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  endDrawing: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  activeTool: Tool;
  underlayImage: HTMLImageElement | null;
  containerRef: React.RefObject<HTMLDivElement>;
  underlayRect: { x: number; y: number; width: number; height: number } | null;
  handleUnderlayRectClick: () => void;
  resizingUnderlayRect: boolean;
  startResizingUnderlayRect: (corner: string, e: React.MouseEvent) => void;
  movingUnderlayRect: boolean;
  startMovingUnderlayRect: (e: React.MouseEvent) => void;
  confirmImagePlacement: () => void;
  removeUnderlayImage: () => void;
  imageConfirmed: boolean;
  reactivateImagePositioning: () => void;
  underlayOpacity: number;
  adjustUnderlayOpacity: (opacity: number) => void;
  fillOpacity: number;
}

const CanvasContainer: React.FC<CanvasContainerProps> = ({
  canvasRef,
  canvasSize,
  startDrawing,
  draw,
  endDrawing,
  activeTool,
  underlayImage,
  containerRef,
  underlayRect,
  handleUnderlayRectClick,
  resizingUnderlayRect,
  startResizingUnderlayRect,
  movingUnderlayRect,
  startMovingUnderlayRect,
  confirmImagePlacement,
  removeUnderlayImage,
  imageConfirmed,
  reactivateImagePositioning,
  underlayOpacity,
  adjustUnderlayOpacity,
  fillOpacity
}) => {
  // Setup high-DPI canvas when canvas size changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get device pixel ratio for high-DPI displays
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    // Set the internal size to the display size scaled by device pixel ratio
    canvas.width = canvasSize.width * devicePixelRatio;
    canvas.height = canvasSize.height * devicePixelRatio;
    
    // Scale the context to ensure correct drawing operations
    ctx.scale(devicePixelRatio, devicePixelRatio);
    
    // Set the display size
    canvas.style.width = canvasSize.width + 'px';
    canvas.style.height = canvasSize.height + 'px';
    
    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    console.log('Canvas setup with DPI ratio:', devicePixelRatio);
  }, [canvasSize, canvasRef]);

  
  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden bg-gray-100">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          {/* Underlay Image */}
          {underlayImage && underlayRect && (
            <div 
              className="absolute bg-white shadow-lg"
              style={{
                left: `${underlayRect.x}px`,
                top: `${underlayRect.y}px`,
                width: `${underlayRect.width}px`,
                height: `${underlayRect.height}px`,
                opacity: underlayOpacity / 100,
                pointerEvents: imageConfirmed ? 'none' : 'auto',
                cursor: resizingUnderlayRect || movingUnderlayRect ? 'default' : 'move'
              }}
              onMouseDown={!imageConfirmed ? startMovingUnderlayRect : undefined}
            >
              <img 
                src={URL.createObjectURL(new Blob([]))} // This will be replaced by the actual image
                alt="Underlay" 
                className="w-full h-full object-contain"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
                onLoad={() => {
                  // Update the src with the actual image data
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  if (ctx && underlayImage) {
                    canvas.width = underlayImage.width;
                    canvas.height = underlayImage.height;
                    ctx.drawImage(underlayImage, 0, 0);
                    const imgElement = document.querySelector('img[alt="Underlay"]') as HTMLImageElement;
                    if (imgElement) {
                      imgElement.src = canvas.toDataURL();
                    }
                  }
                }}
              />
              
              {/* Resize handles - only show when not confirmed */}
              {!imageConfirmed && (
                <>
                  {/* Corner resize handles */}
                  <div 
                    className="absolute w-3 h-3 bg-blue-500 border border-white cursor-nw-resize -top-1 -left-1"
                    onMouseDown={(e) => startResizingUnderlayRect('nw', e)}
                  />
                  <div 
                    className="absolute w-3 h-3 bg-blue-500 border border-white cursor-ne-resize -top-1 -right-1"
                    onMouseDown={(e) => startResizingUnderlayRect('ne', e)}
                  />
                  <div 
                    className="absolute w-3 h-3 bg-blue-500 border border-white cursor-se-resize -bottom-1 -right-1"
                    onMouseDown={(e) => startResizingUnderlayRect('se', e)}
                  />
                  <div 
                    className="absolute w-3 h-3 bg-blue-500 border border-white cursor-sw-resize -bottom-1 -left-1"
                    onMouseDown={(e) => startResizingUnderlayRect('sw', e)}
                  />
                </>
              )}
            </div>
          )}
          
          {/* Upload prompt overlay - only show when no image */}
          {!underlayImage && underlayRect && (
            <div 
              className="absolute border-2 border-dashed border-gray-400 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
              style={{
                left: `${underlayRect.x}px`,
                top: `${underlayRect.y}px`,
                width: `${underlayRect.width}px`,
                height: `${underlayRect.height}px`
              }}
              onClick={handleUnderlayRectClick}
            >
              <Upload className="h-12 w-12 text-gray-400 mb-2" />
              <span className="text-gray-600 text-sm text-center px-4">
                Click to upload an image as underlay
              </span>
            </div>
          )}

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={endDrawing}
            className="border border-gray-300 cursor-crosshair shadow-lg bg-white"
            style={{
              width: `${canvasSize.width}px`,
              height: `${canvasSize.height}px`
            }}
          />
          
          {/* Image control buttons - positioned at top-right of canvas */}
          {underlayImage && (
            <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
              {!imageConfirmed ? (
                <>
                  <Button
                    onClick={confirmImagePlacement}
                    size="sm"
                    className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-1"
                  >
                    <Check className="h-4 w-4" />
                    Confirm
                  </Button>
                  <Button
                    onClick={removeUnderlayImage}
                    variant="outline"
                    size="sm"
                    className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200 flex items-center gap-1"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={reactivateImagePositioning}
                    variant="outline"
                    size="sm"
                    className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200 flex items-center gap-1"
                  >
                    <Edit3 className="h-4 w-4" />
                    Reposition
                  </Button>
                  <Button
                    onClick={removeUnderlayImage}
                    variant="outline"
                    size="sm"
                    className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200 flex items-center gap-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                </>
              )}
              
              {/* Opacity slider - only show when image is confirmed */}
              {imageConfirmed && (
                <div className="bg-white p-2 rounded shadow-md border flex flex-col gap-1 min-w-32">
                  <span className="text-xs text-gray-600">Image Opacity</span>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[underlayOpacity]}
                      onValueChange={(value) => adjustUnderlayOpacity(value[0])}
                      max={100}
                      min={10}
                      step={10}
                      className="flex-1"
                    />
                    <span className="text-xs text-gray-600 w-8">{underlayOpacity}%</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CanvasContainer;
