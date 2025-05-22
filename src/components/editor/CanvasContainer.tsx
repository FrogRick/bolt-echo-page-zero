
import React, { useEffect } from "react";
import { Tool } from "@/types/canvas";
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
  handleUnderlayRectClick: () => void;
  resizingUnderlayRect: boolean;
  startResizingUnderlayRect: (corner: string, e: React.MouseEvent) => void;
  movingUnderlayRect: boolean;
  startMovingUnderlayRect: (e: React.MouseEvent) => void;
  isImageSelected: boolean;
  setIsImageSelected: (selected: boolean) => void;
  cropMode: boolean;
  toggleCropMode: () => void;
  cropRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
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
  isImageSelected,
  setIsImageSelected,
  cropMode,
  toggleCropMode,
  cropRect
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
  const resizeHandles = underlayRect && isImageSelected
    ? [
        { position: "nw", x: underlayRect.x, y: underlayRect.y },
        { position: "ne", x: underlayRect.x + underlayRect.width, y: underlayRect.y },
        { position: "se", x: underlayRect.x + underlayRect.width, y: underlayRect.y + underlayRect.height },
        { position: "sw", x: underlayRect.x, y: underlayRect.y + underlayRect.height },
      ]
    : [];
    
  // Handle canvas click to deselect image when clicking outside
  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only handle deselection if we have an image and it's selected
    if (underlayImage && isImageSelected && underlayRect) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Check if click is outside the image area
      if (
        x < underlayRect.x ||
        x > underlayRect.x + underlayRect.width ||
        y < underlayRect.y ||
        y > underlayRect.y + underlayRect.height
      ) {
        // Deselect the image
        setIsImageSelected(false);
      }
    }
  };
  
  // Automatically select the image when it's uploaded
  useEffect(() => {
    if (underlayImage) {
      setIsImageSelected(true);
    }
  }, [underlayImage, setIsImageSelected]);
  
  // Deselect image when changing to another tool
  useEffect(() => {
    if (activeTool !== "select" && isImageSelected) {
      setIsImageSelected(false);
    }
  }, [activeTool, isImageSelected, setIsImageSelected]);

  return (
    <div 
      ref={containerRef} 
      className="flex-1 flex items-center justify-center bg-gray-50 overflow-auto"
      style={{ height: "calc(100% - 120px)" }}
      onClick={handleCanvasClick}
    >
      <div className="flex items-center justify-center relative">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          onMouseDown={(e) => {
            // Only start drawing if not interacting with the image
            if (!isImageSelected || activeTool !== "select") {
              startDrawing(e);
            }
          }}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          className={`bg-white border border-gray-200 rounded-lg shadow-md ${getCursorStyle()}`}
        />
        
        {/* Underlay Rectangle Placeholder */}
        {underlayRect && !underlayImage && (
          <div 
            className="absolute border-2 border-dashed border-blue-400 flex items-center justify-center bg-blue-50 bg-opacity-30 group"
            style={{
              left: underlayRect.x,
              top: underlayRect.y,
              width: underlayRect.width,
              height: underlayRect.height,
              cursor: movingUnderlayRect ? 'grabbing' : 'grab'
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (!resizingUnderlayRect && !movingUnderlayRect) {
                handleUnderlayRectClick();
                setIsImageSelected(true);
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
                setIsImageSelected(true);
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
            className={`absolute flex items-center justify-center overflow-hidden group
              ${isImageSelected ? 'border-2 border-blue-400' : 'border border-gray-200'}`}
            style={{
              left: underlayRect.x,
              top: underlayRect.y,
              width: underlayRect.width,
              height: underlayRect.height,
              cursor: movingUnderlayRect ? 'grabbing' : (isImageSelected ? 'grab' : 'default')
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (activeTool === "select") {
                setIsImageSelected(true);
              }
            }}
            onMouseDown={(e) => {
              if (activeTool !== "select") return;
              
              console.log("Image container onMouseDown triggered", { clientX: e.clientX, clientY: e.clientY });
              e.stopPropagation();
              e.preventDefault();
              // Only handle movement if it's not a resize operation and the tool is select
              if (!resizingUnderlayRect && activeTool === "select") {
                console.log("Starting to move image container");
                startMovingUnderlayRect(e);
                setIsImageSelected(true);
              }
            }}
          >
            <img 
              src={underlayImage.src}
              alt="Underlay"
              className="object-contain w-full h-full"
              style={{
                opacity: 0.5, // Use the opacity setting
                pointerEvents: 'none'
              }}
            />
            
            {isImageSelected && (
              <div className="absolute top-2 left-2 bg-white bg-opacity-70 p-1 rounded-md flex items-center space-x-2">
                <Move size={20} className="text-blue-600" />
                <Crop 
                  size={20} 
                  className={`cursor-pointer ${cropMode ? 'text-green-600' : 'text-blue-600'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCropMode();
                  }}
                />
              </div>
            )}
            
            {/* Crop overlay */}
            {cropMode && cropRect && (
              <div
                className="absolute border-2 border-dashed border-green-500 bg-green-200 bg-opacity-20"
                style={{
                  left: cropRect.x - underlayRect.x,
                  top: cropRect.y - underlayRect.y,
                  width: cropRect.width,
                  height: cropRect.height
                }}
              />
            )}
          </div>
        )}
        
        {/* Resize Handles - show for both placeholder and image when selected */}
        {underlayRect && isImageSelected && !resizingUnderlayRect && !movingUnderlayRect && resizeHandles.map((handle) => (
          <div
            key={handle.position}
            className="absolute w-5 h-5 bg-white border-2 border-blue-500 rounded-full hover:bg-blue-200 flex items-center justify-center"
            style={{
              left: handle.x - 10, // Center the handle (half of width/height)
              top: handle.y - 10,
              cursor: handle.position === "nw" || handle.position === "se" 
                ? "nwse-resize" 
                : "nesw-resize",
              zIndex: 10
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
