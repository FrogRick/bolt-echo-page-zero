
import React from "react";
import { Tool } from "@/types/canvas";
import { Upload, Move, Check, X } from "lucide-react";

interface CanvasContainerProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  canvasSize: { width: number; height: number };
  startDrawing: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  draw: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  endDrawing: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  activeTool: Tool;
  underlayImage: HTMLImageElement | null;
  containerRef: React.RefObject<HTMLDivElement>;
  underlayRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  handleUnderlayRectClick: () => void;
  resizingUnderlayRect: boolean;
  startResizingUnderlayRect: (corner: string, e: React.MouseEvent) => void;
  movingUnderlayRect: boolean;
  startMovingUnderlayRect: (e: React.MouseEvent) => void;
  confirmImagePlacement: () => void;
  removeUnderlayImage: () => void;
  imageConfirmed: boolean;
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
}) => {
  // Determine cursor style based on the active tool
  const getCursorStyle = () => {
    if (activeTool === "select") {
      return "cursor-default";
    } else if (
      activeTool === "wall" ||
      activeTool === "wall-polygon" ||
      activeTool === "yellow-polygon" ||
      activeTool === "green-polygon"
    ) {
      return "cursor-crosshair";
    } else {
      return "cursor-crosshair";
    }
  };

  // Calculate resize handle positions if underlayRect exists
  const resizeHandles = underlayRect && !imageConfirmed
    ? [
        { position: "nw", x: underlayRect.x, y: underlayRect.y },
        { position: "ne", x: underlayRect.x + underlayRect.width, y: underlayRect.y },
        { position: "se", x: underlayRect.x + underlayRect.width, y: underlayRect.y + underlayRect.height },
        { position: "sw", x: underlayRect.x, y: underlayRect.y + underlayRect.height },
      ]
    : [];

  return (
    <div 
      ref={containerRef} 
      className="flex-1 flex items-center justify-center bg-gray-50 overflow-auto"
      style={{ height: "calc(100% - 120px)" }}
    >
      <div className="flex items-center justify-center relative">
        {/* Confirmed Underlay Image - Behind canvas */}
        {underlayRect && underlayImage && imageConfirmed && (
          <div 
            className="absolute"
            style={{
              left: underlayRect.x,
              top: underlayRect.y,
              width: underlayRect.width,
              height: underlayRect.height,
              zIndex: 1, // Behind canvas
              pointerEvents: "none" // Don't interfere with drawing
            }}
          >
            <img 
              src={underlayImage.src}
              alt="Underlay"
              className="object-contain w-full h-full"
              style={{
                opacity: 0.5
              }}
            />
          </div>
        )}

        {/* Positioning Image Layer - Above canvas when not confirmed */}
        {underlayRect && underlayImage && !imageConfirmed && (
          <div 
            className="absolute border-2 border-blue-400 overflow-hidden"
            style={{
              left: underlayRect.x,
              top: underlayRect.y,
              width: underlayRect.width,
              height: underlayRect.height,
              zIndex: 10, // Above canvas when positioning
              pointerEvents: "auto",
              cursor: !resizingUnderlayRect ? 'grab' : 'default'
            }}
            onMouseDown={(e) => {
              console.log("Image container onMouseDown triggered", { clientX: e.clientX, clientY: e.clientY });
              e.stopPropagation();
              e.preventDefault();
              // Only handle movement if it's not a resize operation
              if (!resizingUnderlayRect) {
                console.log("Starting to move image container");
                startMovingUnderlayRect(e);
              }
            }}
          >
            <img 
              src={underlayImage.src}
              alt="Underlay"
              className="object-contain w-full h-full"
              style={{
                opacity: 0.5,
                pointerEvents: 'none'
              }}
            />
            
            {/* Control buttons - only shown when positioning */}
            <div className="absolute top-2 right-2 flex space-x-2">
              <button
                className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  removeUnderlayImage();
                }}
              >
                <X size={16} />
              </button>
              <button
                className="bg-green-500 hover:bg-green-600 text-white p-1 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  confirmImagePlacement();
                }}
              >
                <Check size={16} />
              </button>
            </div>
            
            <div className="absolute top-2 left-2 opacity-70">
              <Move size={20} className="text-blue-600" />
            </div>
          </div>
        )}
        
        {/* Canvas - Always on top for drawing */}
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          className={`bg-white border border-gray-200 rounded-lg shadow-md ${getCursorStyle()}`}
          style={{ 
            position: "relative", 
            zIndex: 5, // Above confirmed underlay, below positioning overlay
            backgroundColor: imageConfirmed ? 'transparent' : 'white' // Make transparent when image is confirmed
          }}
        />
        
        {/* Underlay Rectangle Placeholder - Only visible when no image */}
        {underlayRect && !underlayImage && (
          <div 
            className="absolute border-2 border-dashed border-blue-400 flex items-center justify-center bg-blue-50 bg-opacity-30 group"
            style={{
              left: underlayRect.x,
              top: underlayRect.y,
              width: underlayRect.width,
              height: underlayRect.height,
              cursor: movingUnderlayRect ? 'grabbing' : 'grab',
              zIndex: 10
            }}
            onClick={(e) => {
              if (!resizingUnderlayRect && !movingUnderlayRect) {
                handleUnderlayRectClick();
              }
            }}
            onMouseDown={(e) => {
              console.log("Placeholder onMouseDown triggered", { clientX: e.clientX, clientY: e.clientY });
              e.stopPropagation();
              e.preventDefault();
              // Only handle movement if it's not a resize operation
              if (!resizingUnderlayRect) {
                console.log("Starting to move placeholder");
                startMovingUnderlayRect(e);
              }
            }}
          >
            <div className="flex flex-col items-center justify-center opacity-70 group-hover:opacity-100">
              <Upload size={32} className="text-blue-500 mb-2" />
              <span className="text-blue-600 font-medium text-sm">Upload Underlay</span>
            </div>
          </div>
        )}
        
        {/* Resize Handles - only show for positioning (not when confirmed) */}
        {!imageConfirmed && underlayRect && !resizingUnderlayRect && !movingUnderlayRect && resizeHandles.map((handle) => (
          <div
            key={handle.position}
            className="absolute w-5 h-5 bg-white border-2 border-blue-500 rounded-full hover:bg-blue-200 flex items-center justify-center"
            style={{
              left: handle.x - 10, // Center the handle (half of width/height)
              top: handle.y - 10,
              cursor: handle.position === "nw" || handle.position === "se" 
                ? "nwse-resize" 
                : "nesw-resize",
              zIndex: 15 // Always on top
            }}
            onMouseDown={(e) => {
              console.log(`Resize handle ${handle.position} onMouseDown triggered`, { clientX: e.clientX, clientY: e.clientY });
              e.stopPropagation();
              e.preventDefault();
              console.log(`Starting resize from ${handle.position} corner`);
              startResizingUnderlayRect(handle.position, e);
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default CanvasContainer;
