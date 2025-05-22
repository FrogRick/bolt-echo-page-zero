
import React from "react";
import { Tool } from "@/types/canvas";
import { Upload, Move } from "lucide-react";

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
  isImageSelected?: boolean;
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
  isImageSelected = false,
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
  const resizeHandles = underlayRect && (isImageSelected || !underlayImage)
    ? [
        { position: "nw", x: underlayRect.x, y: underlayRect.y },
        { position: "ne", x: underlayRect.x + underlayRect.width, y: underlayRect.y },
        { position: "se", x: underlayRect.x + underlayRect.width, y: underlayRect.y + underlayRect.height },
        { position: "sw", x: underlayRect.x, y: underlayRect.y + underlayRect.height },
      ]
    : [];
    
  // Log render info
  console.log("CanvasContainer render:", { 
    underlayRect, 
    resizingUnderlayRect, 
    movingUnderlayRect,
    resizeHandles: resizeHandles.length,
    isImageSelected,
    activeTool,
    hasImage: !!underlayImage
  });

  return (
    <div 
      ref={containerRef} 
      className="flex-1 flex items-center justify-center bg-gray-50 overflow-auto"
      style={{ height: "calc(100% - 120px)" }}
    >
      <div className="flex items-center justify-center relative">
        {/* Canvas Element - Base Layer */}
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
            position: "absolute", 
            zIndex: 1, // Base layer
            pointerEvents: movingUnderlayRect || resizingUnderlayRect ? 'none' : 'auto' // Disable canvas events when moving/resizing
          }}
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
              cursor: movingUnderlayRect ? 'grabbing' : 'grab',
              zIndex: 10, // Above canvas
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
              
              // Always handle movement for placeholder (even without select tool)
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
            className={`absolute flex items-center justify-center overflow-hidden group ${
              isImageSelected ? 'border-2 border-blue-400' : ''
            }`}
            style={{
              left: underlayRect.x,
              top: underlayRect.y,
              width: underlayRect.width,
              height: underlayRect.height,
              cursor: isImageSelected && activeTool === "select" ? (movingUnderlayRect ? 'grabbing' : 'grab') : 'default',
              zIndex: 10, // Above canvas
              position: "absolute"
            }}
            onClick={(e) => {
              if (activeTool === "select") {
                e.stopPropagation();
                handleUnderlayRectClick();
              }
            }}
            onMouseDown={(e) => {
              console.log("Image container onMouseDown triggered", { 
                clientX: e.clientX, 
                clientY: e.clientY, 
                isSelected: isImageSelected,
                activeTool 
              });
              
              // Only allow interaction when the image is selected and using the select tool
              if (!isImageSelected || activeTool !== "select") {
                return;
              }
              
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
                pointerEvents: 'none'
              }}
            />
            {isImageSelected && activeTool === "select" && (
              <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Move size={20} className="text-blue-600" />
              </div>
            )}
          </div>
        )}
        
        {/* Drawing Canvas (invisible, just for capturing events) */}
        <div 
          className="absolute"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: canvasSize.width,
            height: canvasSize.height,
            zIndex: 15, // Above placeholder and image, below resize handles
            pointerEvents: movingUnderlayRect || resizingUnderlayRect ? 'none' : 'auto'
          }}
          onMouseDown={(e) => {
            // Forward events to the canvas
            if (canvasRef.current) {
              const rect = canvasRef.current.getBoundingClientRect();
              const mouseEvent = new MouseEvent('mousedown', {
                bubbles: true,
                cancelable: true,
                view: window,
                clientX: e.clientX,
                clientY: e.clientY
              });
              canvasRef.current.dispatchEvent(mouseEvent);
            }
          }}
          onMouseMove={(e) => {
            // Forward events to the canvas
            if (canvasRef.current) {
              const mouseEvent = new MouseEvent('mousemove', {
                bubbles: true,
                cancelable: true,
                view: window,
                clientX: e.clientX,
                clientY: e.clientY
              });
              canvasRef.current.dispatchEvent(mouseEvent);
            }
          }}
          onMouseUp={(e) => {
            // Forward events to the canvas
            if (canvasRef.current) {
              const mouseEvent = new MouseEvent('mouseup', {
                bubbles: true,
                cancelable: true,
                view: window,
                clientX: e.clientX,
                clientY: e.clientY
              });
              canvasRef.current.dispatchEvent(mouseEvent);
            }
          }}
          onMouseLeave={(e) => {
            // Forward events to the canvas
            if (canvasRef.current) {
              const mouseEvent = new MouseEvent('mouseleave', {
                bubbles: true,
                cancelable: true,
                view: window
              });
              canvasRef.current.dispatchEvent(mouseEvent);
            }
          }}
        />
        
        {/* Resize Handles - show for placeholder or when image is selected and using select tool */}
        {underlayRect && (isImageSelected || !underlayImage) && 
          (!resizingUnderlayRect && !movingUnderlayRect) && 
          ((activeTool === "select" && isImageSelected) || !underlayImage) && 
          resizeHandles.map((handle) => (
          <div
            key={handle.position}
            className="absolute w-5 h-5 bg-white border-2 border-blue-500 rounded-full hover:bg-blue-200 flex items-center justify-center"
            style={{
              left: handle.x - 10, // Center the handle (half of width/height)
              top: handle.y - 10,
              cursor: handle.position === "nw" || handle.position === "se" 
                ? "nwse-resize" 
                : "nesw-resize",
              zIndex: 20, // Highest z-index to be always on top
              position: "absolute"
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
