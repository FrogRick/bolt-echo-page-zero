
import React from "react";
import { Tool } from "@/types/canvas";
import { Upload } from "lucide-react";

interface CanvasContainerProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  canvasSize: { width: number; height: number };
  startDrawing: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  draw: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  endDrawing: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  activeTool: Tool;
  underlayImage: HTMLImageElement | null; // Updated this from boolean to HTMLImageElement | null
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
}) => {
  // Determine cursor style based on the active tool
  const getCursorStyle = () => {
    if (activeTool === "select") {
      return underlayImage ? "cursor-move" : "cursor-default";
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
  const resizeHandles = underlayRect
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
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          className={`bg-white border border-gray-200 rounded-lg shadow-md ${getCursorStyle()}`}
        />
        
        {/* Underlay Rectangle Placeholder */}
        {underlayRect && !underlayImage && (
          <div 
            className="absolute border-2 border-dashed border-blue-400 flex items-center justify-center bg-blue-50 bg-opacity-30 cursor-pointer group"
            style={{
              left: underlayRect.x,
              top: underlayRect.y,
              width: underlayRect.width,
              height: underlayRect.height,
              pointerEvents: resizingUnderlayRect ? 'none' : 'auto'
            }}
            onClick={handleUnderlayRectClick}
          >
            <div className="flex flex-col items-center justify-center opacity-70 group-hover:opacity-100">
              <Upload size={32} className="text-blue-500 mb-2" />
              <span className="text-blue-600 font-medium text-sm">Upload Underlay</span>
            </div>
          </div>
        )}
        
        {/* Resize Handles for Underlay Rectangle */}
        {underlayRect && !resizingUnderlayRect && !underlayImage && resizeHandles.map((handle) => (
          <div
            key={handle.position}
            className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-pointer hover:bg-blue-200"
            style={{
              left: handle.x - 6, // Center the 12x12px handle
              top: handle.y - 6,
              cursor: handle.position === "nw" || handle.position === "se" 
                ? "nwse-resize" 
                : "nesw-resize",
              zIndex: 10
            }}
            onMouseDown={(e) => startResizingUnderlayRect(handle.position, e)}
          />
        ))}
      </div>
    </div>
  );
};

export default CanvasContainer;
