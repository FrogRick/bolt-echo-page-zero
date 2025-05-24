
import React from "react";
import { Tool } from "@/types/canvas";
import { Upload, Move, Check, X, Image } from "lucide-react";
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
  reactivateImagePositioning: () => void;
  underlayOpacity: number;
  adjustUnderlayOpacity: (opacity: number) => void;
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
}) => {
  // Track if we just finished a drag operation
  const [justFinishedDrag, setJustFinishedDrag] = React.useState(false);
  // Track if we're starting a drag from a confirmed image
  const [startingDragFromConfirmed, setStartingDragFromConfirmed] = React.useState(false);
  // Track mouse down state for distinguishing click vs drag on confirmed image
  const [mouseDownOnConfirmed, setMouseDownOnConfirmed] = React.useState<{
    x: number;
    y: number;
    timestamp: number;
  } | null>(null);
  
  // Track mouse down state for distinguishing click vs drag on placeholder
  const [mouseDownOnPlaceholder, setMouseDownOnPlaceholder] = React.useState<{
    x: number;
    y: number;
    timestamp: number;
  } | null>(null);

  // Reset the drag flag when drag operations end
  React.useEffect(() => {
    if (!movingUnderlayRect && !resizingUnderlayRect) {
      if (justFinishedDrag) {
        // Use a small timeout to prevent immediate clicks from confirming
        const timeout = setTimeout(() => {
          setJustFinishedDrag(false);
        }, 100);
        return () => clearTimeout(timeout);
      }
    } else {
      setJustFinishedDrag(true);
    }
  }, [movingUnderlayRect, resizingUnderlayRect, justFinishedDrag]);

  // Reset starting drag flag when moving ends
  React.useEffect(() => {
    if (!movingUnderlayRect) {
      setStartingDragFromConfirmed(false);
    }
  }, [movingUnderlayRect]);

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

  // Handle clicks outside the image during positioning
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't confirm if we just finished a drag operation or starting a drag from confirmed
    if (justFinishedDrag || startingDragFromConfirmed) {
      return;
    }

    // Only confirm if we're in positioning mode (not confirmed) and not currently resizing/moving
    if (underlayRect && underlayImage && !imageConfirmed && !resizingUnderlayRect && !movingUnderlayRect) {
      // Check if the click was outside the image area
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;
      
      const clickX = e.clientX - containerRect.left;
      const clickY = e.clientY - containerRect.top;
      
      const isOutsideImage = (
        clickX < underlayRect.x ||
        clickX > underlayRect.x + underlayRect.width ||
        clickY < underlayRect.y ||
        clickY > underlayRect.y + underlayRect.height
      );
      
      if (isOutsideImage) {
        confirmImagePlacement();
      }
    }
  };

  // Handle mousedown on confirmed image
  const handleConfirmedImageMouseDown = (e: React.MouseEvent) => {
    if (activeTool === "select" && imageConfirmed) {
      e.stopPropagation();
      console.log("Mouse down on confirmed image");
      
      // Record the mouse down position and time
      setMouseDownOnConfirmed({
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now()
      });
    }
  };

  // Handle mousemove on confirmed image
  const handleConfirmedImageMouseMove = (e: React.MouseEvent) => {
    if (mouseDownOnConfirmed && activeTool === "select" && imageConfirmed) {
      const deltaX = Math.abs(e.clientX - mouseDownOnConfirmed.x);
      const deltaY = Math.abs(e.clientY - mouseDownOnConfirmed.y);
      const dragThreshold = 5; // pixels
      
      // If mouse moved enough, start drag operation
      if (deltaX > dragThreshold || deltaY > dragThreshold) {
        console.log("Starting drag from confirmed image");
        
        // Set flag to indicate we're starting a drag from confirmed state
        setStartingDragFromConfirmed(true);
        
        // Clear the mouse down state
        setMouseDownOnConfirmed(null);
        
        // Reactivate positioning mode
        reactivateImagePositioning();
        
        // Start moving immediately with the original mouse down event
        setTimeout(() => {
          // Create a synthetic mouse event with the original position
          const syntheticEvent = {
            ...e,
            clientX: mouseDownOnConfirmed.x,
            clientY: mouseDownOnConfirmed.y,
            stopPropagation: () => {},
            preventDefault: () => {}
          } as React.MouseEvent;
          startMovingUnderlayRect(syntheticEvent);
        }, 0);
      }
    }
  };

  // Handle mouseup on confirmed image
  const handleConfirmedImageMouseUp = (e: React.MouseEvent) => {
    if (mouseDownOnConfirmed && activeTool === "select" && imageConfirmed) {
      const deltaX = Math.abs(e.clientX - mouseDownOnConfirmed.x);
      const deltaY = Math.abs(e.clientY - mouseDownOnConfirmed.y);
      const timeDelta = Date.now() - mouseDownOnConfirmed.timestamp;
      const dragThreshold = 5; // pixels
      const clickTimeThreshold = 300; // milliseconds
      
      // If it was a simple click (small movement, short time), just activate editing
      if (deltaX <= dragThreshold && deltaY <= dragThreshold && timeDelta <= clickTimeThreshold) {
        console.log("Simple click on confirmed image, reactivating positioning");
        reactivateImagePositioning();
      }
      
      // Clear the mouse down state
      setMouseDownOnConfirmed(null);
    }
  };

  // Handle mousedown on placeholder
  const handlePlaceholderMouseDown = (e: React.MouseEvent) => {
    console.log("Placeholder onMouseDown triggered", { clientX: e.clientX, clientY: e.clientY });
    e.stopPropagation();
    e.preventDefault();
    
    // Record the mouse down position and time
    setMouseDownOnPlaceholder({
      x: e.clientX,
      y: e.clientY,
      timestamp: Date.now()
    });
    
    // Only handle movement if it's not a resize operation
    if (!resizingUnderlayRect) {
      console.log("Starting to move placeholder");
      startMovingUnderlayRect(e);
    }
  };

  // Handle mousemove on placeholder
  const handlePlaceholderMouseMove = (e: React.MouseEvent) => {
    if (mouseDownOnPlaceholder) {
      const deltaX = Math.abs(e.clientX - mouseDownOnPlaceholder.x);
      const deltaY = Math.abs(e.clientY - mouseDownOnPlaceholder.y);
      const dragThreshold = 5; // pixels
      
      // If mouse moved enough, we're dragging - clear the mouse down state to prevent upload
      if (deltaX > dragThreshold || deltaY > dragThreshold) {
        console.log("Drag detected on placeholder, clearing click state");
        setMouseDownOnPlaceholder(null);
      }
    }
  };

  // Handle mouseup on placeholder
  const handlePlaceholderMouseUp = (e: React.MouseEvent) => {
    if (mouseDownOnPlaceholder) {
      const deltaX = Math.abs(e.clientX - mouseDownOnPlaceholder.x);
      const deltaY = Math.abs(e.clientY - mouseDownOnPlaceholder.y);
      const timeDelta = Date.now() - mouseDownOnPlaceholder.timestamp;
      const dragThreshold = 5; // pixels
      const clickTimeThreshold = 300; // milliseconds
      
      // If it was a simple click (small movement, short time), trigger upload
      if (deltaX <= dragThreshold && deltaY <= dragThreshold && timeDelta <= clickTimeThreshold && !resizingUnderlayRect && !movingUnderlayRect) {
        console.log("Simple click on placeholder, triggering upload");
        handleUnderlayRectClick();
      }
      
      // Clear the mouse down state
      setMouseDownOnPlaceholder(null);
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="flex-1 flex items-center justify-center bg-gray-50 overflow-auto"
      style={{ height: "calc(100% - 120px)" }}
      onClick={handleContainerClick}
    >
      <div className="flex items-center justify-center relative">
        {/* Base Canvas - Bottom layer (z-index 1) with white background */}
        <canvas
          width={canvasSize.width}
          height={canvasSize.height}
          className="border border-gray-200 rounded-lg shadow-md"
          style={{ 
            position: "relative", 
            zIndex: 1,
            backgroundColor: 'white', // White canvas background
          }}
        />

        {/* Confirmed Underlay Image - Middle layer (z-index 2) */}
        {underlayRect && underlayImage && imageConfirmed && (
          <div 
            className={`absolute ${
              activeTool === "select" 
                ? "cursor-pointer" 
                : ""
            }`}
            style={{
              left: underlayRect.x,
              top: underlayRect.y,
              width: underlayRect.width,
              height: underlayRect.height,
              zIndex: 2, // Above canvas but below drawing overlay
              pointerEvents: activeTool === "select" ? "auto" : "none",
            }}
            onMouseDown={handleConfirmedImageMouseDown}
            onMouseMove={handleConfirmedImageMouseMove}
            onMouseUp={handleConfirmedImageMouseUp}
          >
            <img 
              src={underlayImage.src}
              alt="Underlay"
              className="object-contain w-full h-full"
              style={{
                opacity: underlayOpacity
              }}
            />
          </div>
        )}

        {/* Drawing Overlay Canvas - Top layer (z-index 3) for drawings */}
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          className={`absolute top-0 left-0 ${getCursorStyle()}`}
          style={{ 
            zIndex: 3, // Above everything else
            backgroundColor: 'transparent', // Transparent so base layer shows through
            pointerEvents: activeTool === "select" && imageConfirmed ? "none" : "auto" // Disable when selecting confirmed image
          }}
        />

        {/* Positioning Image Layer - Top layer when not confirmed (z-index 10) */}
        {underlayRect && underlayImage && !imageConfirmed && (
          <>
            {/* Control buttons - centered above the image */}
            <div 
              className="absolute flex space-x-2"
              style={{
                left: underlayRect.x + underlayRect.width / 2,
                top: underlayRect.y - 40,
                transform: 'translateX(-50%)',
                zIndex: 15
              }}
            >
              <button
                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  removeUnderlayImage();
                }}
              >
                <X size={20} />
              </button>
              <button
                className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  confirmImagePlacement();
                }}
              >
                <Check size={20} />
              </button>
            </div>

            {/* Image container */}
            <div 
              className="absolute border-2 border-blue-400 overflow-hidden"
              style={{
                left: underlayRect.x,
                top: underlayRect.y,
                width: underlayRect.width,
                height: underlayRect.height,
                zIndex: 10,
                pointerEvents: "auto",
                cursor: !resizingUnderlayRect ? 'grab' : 'default'
              }}
              onMouseDown={(e) => {
                console.log("Image container onMouseDown triggered", { clientX: e.clientX, clientY: e.clientY });
                e.stopPropagation();
                e.preventDefault();
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
                  opacity: underlayOpacity,
                  pointerEvents: 'none'
                }}
              />
            </div>

            {/* Opacity slider - centered below the image */}
            <div 
              className="absolute flex items-center space-x-2"
              style={{
                left: underlayRect.x + underlayRect.width / 2,
                top: underlayRect.y + underlayRect.height + 10,
                transform: 'translateX(-50%)',
                zIndex: 15,
                minWidth: '200px'
              }}
              onClick={(e) => e.stopPropagation()} // Prevent clicks on slider from confirming placement
            >
              <Image size={16} className="text-gray-600" />
              <Slider
                value={[underlayOpacity * 100]}
                onValueChange={(value) => adjustUnderlayOpacity(value[0] / 100)}
                max={100}
                min={0}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-gray-600 min-w-[30px]">{Math.round(underlayOpacity * 100)}%</span>
            </div>
          </>
        )}
        
        {/* Underlay Rectangle Placeholder - Only visible when no image (z-index 10) */}
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
            onMouseDown={handlePlaceholderMouseDown}
            onMouseMove={handlePlaceholderMouseMove}
            onMouseUp={handlePlaceholderMouseUp}
          >
            <div className="flex flex-col items-center justify-center opacity-70 group-hover:opacity-100">
              <Upload size={32} className="text-blue-500 mb-2" />
              <span className="text-blue-600 font-medium text-sm">Upload Underlay</span>
            </div>
          </div>
        )}
        
        {/* Resize Handles - only show for positioning (not when confirmed) (z-index 15) */}
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
