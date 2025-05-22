
import React from "react";
import { Tool, UnderlayImageCrop } from "@/types/canvas";
import { Upload, Move, Crop } from "lucide-react";

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
  imageCrop?: UnderlayImageCrop | null;
  handleUnderlayRectClick: () => void;
  resizingUnderlayRect: boolean;
  startResizingUnderlayRect: (corner: string, e: React.MouseEvent) => void;
  movingUnderlayRect: boolean;
  startMovingUnderlayRect: (e: React.MouseEvent) => void;
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
  imageCrop,
  handleUnderlayRectClick,
  resizingUnderlayRect,
  startResizingUnderlayRect,
  movingUnderlayRect,
  startMovingUnderlayRect,
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

  // Calculate resize and crop handle positions if underlayRect exists
  const resizeHandles = underlayRect
    ? [
        // Corner handles (resize)
        { position: "nw", x: underlayRect.x, y: underlayRect.y, type: "resize" },
        { position: "ne", x: underlayRect.x + underlayRect.width, y: underlayRect.y, type: "resize" },
        { position: "se", x: underlayRect.x + underlayRect.width, y: underlayRect.y + underlayRect.height, type: "resize" },
        { position: "sw", x: underlayRect.x, y: underlayRect.y + underlayRect.height, type: "resize" },
        // Side handles (crop)
        { position: "n", x: underlayRect.x + underlayRect.width / 2, y: underlayRect.y, type: "crop" },
        { position: "e", x: underlayRect.x + underlayRect.width, y: underlayRect.y + underlayRect.height / 2, type: "crop" },
        { position: "s", x: underlayRect.x + underlayRect.width / 2, y: underlayRect.y + underlayRect.height, type: "crop" },
        { position: "w", x: underlayRect.x, y: underlayRect.y + underlayRect.height / 2, type: "crop" },
      ]
    : [];

  return (
    <div 
      ref={containerRef} 
      className="flex-1 flex items-center justify-center bg-gray-50 overflow-auto"
      style={{ height: "calc(100% - 120px)" }}
    >
      <div className="flex items-center justify-center relative">
        {/* Underlay Rectangle Placeholder - Positioned underneath canvas */}
        {underlayRect && !underlayImage && (
          <div 
            className="absolute border-2 border-dashed border-blue-400 flex items-center justify-center bg-blue-50 bg-opacity-30 group"
            style={{
              left: underlayRect.x,
              top: underlayRect.y,
              width: underlayRect.width,
              height: underlayRect.height,
              cursor: movingUnderlayRect ? 'grabbing' : 'grab',
              zIndex: 0, // Lower z-index to place below canvas
              position: "absolute"
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
        
        {/* If image is uploaded, place it in the underlay rect and make it movable/resizable */}
        {underlayRect && underlayImage && (
          <div 
            className="absolute border-2 border-blue-400 flex items-center justify-center overflow-hidden group"
            style={{
              left: underlayRect.x,
              top: underlayRect.y,
              width: underlayRect.width,
              height: underlayRect.height,
              cursor: movingUnderlayRect ? 'grabbing' : 'grab',
              zIndex: 0, // Lower z-index to place below canvas
              position: "absolute"
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
                opacity: 0.5, // Use the opacity setting
                pointerEvents: 'none',
                // Apply cropping if imageCrop exists
                clipPath: imageCrop ? `inset(
                  ${(imageCrop.y - underlayRect.y) / underlayRect.height * 100}% 
                  ${(underlayRect.x + underlayRect.width - imageCrop.x - imageCrop.width) / underlayRect.width * 100}% 
                  ${(underlayRect.y + underlayRect.height - imageCrop.y - imageCrop.height) / underlayRect.height * 100}% 
                  ${(imageCrop.x - underlayRect.x) / underlayRect.width * 100}%
                )` : 'none'
              }}
            />
            <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Move size={20} className="text-blue-600" />
            </div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-1">
              <Crop size={16} className="text-blue-600" />
            </div>
          </div>
        )}
        
        {/* Canvas - Positioned above underlay */}
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          className={`bg-white border border-gray-200 rounded-lg shadow-md ${getCursorStyle()}`}
          style={{ position: "relative", zIndex: 1 }}
        />
        
        {/* Resize and Crop Handles - Always render on top with highest z-index */}
        {underlayRect && !movingUnderlayRect && resizeHandles.map((handle) => (
          <div
            key={handle.position}
            className={`absolute ${handle.type === "crop" ? "crop-handle" : "resize-handle"} flex items-center justify-center`}
            style={{
              left: handle.x - (handle.type === "crop" ? 8 : 10),
              top: handle.y - (handle.type === "crop" ? 8 : 10),
              cursor: getHandleCursor(handle.position),
              zIndex: 20, // Higher z-index to ensure handles are always accessible
              pointerEvents: "auto", // Ensure handles receive mouse events
              ...(handle.type === "crop" 
                ? getCropHandleStyles(handle.position) 
                : {
                    width: '20px',
                    height: '20px',
                    backgroundColor: 'white',
                    border: '2px solid #3b82f6',
                    borderRadius: '50%'
                  }
              )
            }}
            onMouseDown={(e) => {
              console.log(`${handle.type === "crop" ? "Crop" : "Resize"} handle ${handle.position} onMouseDown triggered`, { clientX: e.clientX, clientY: e.clientY });
              e.stopPropagation();
              e.preventDefault();
              console.log(`Starting ${handle.type === "crop" ? "crop" : "resize"} from ${handle.position} ${handle.type === "crop" ? "side" : "corner"}`);
              startResizingUnderlayRect(handle.position, e);
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Helper function to determine cursor style for handles
function getHandleCursor(position: string): string {
  switch (position) {
    case "nw":
    case "se":
      return "nwse-resize";
    case "ne":
    case "sw":
      return "nesw-resize";
    case "n":
    case "s":
      return "ns-resize";
    case "e":
    case "w":
      return "ew-resize";
    default:
      return "default";
  }
}

// Helper function to get specific styles for crop handles (thick lines)
function getCropHandleStyles(position: string): React.CSSProperties {
  const baseStyles: React.CSSProperties = {
    backgroundColor: "#3b82f6",
    border: "none",
    position: "absolute",
    zIndex: 20
  };
  
  // Style the crop handles as thick lines based on their position
  switch (position) {
    case "n":
    case "s":
      return {
        ...baseStyles,
        width: "32px",
        height: "6px",
        transform: "translateX(-16px) translateY(-3px)" // Center the line
      };
    case "e":
    case "w":
      return {
        ...baseStyles,
        width: "6px",
        height: "32px",
        transform: "translateX(-3px) translateY(-16px)" // Center the line
      };
    default:
      return baseStyles;
  }
}

export default CanvasContainer;
