
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useCanvasEditor } from "@/hooks/useCanvasEditor";
import { Tool } from "@/types/canvas";
import { Toolbar } from "./Toolbar";
import CanvasToolbar from "./CanvasToolbar";
import CanvasContainer from "./CanvasContainer";
import { calculateScaleFactor, calculateCanvasSize, INITIAL_SCALE_FACTOR } from "./CanvasUtils";
import { toast } from "@/components/ui/use-toast";

const Canvas: React.FC = () => {
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [scaleFactor, setScaleFactor] = useState(INITIAL_SCALE_FACTOR);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Underlay rectangle state
  const [underlayRect, setUnderlayRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [resizingUnderlayRect, setResizingUnderlayRect] = useState(false);
  const [resizeCorner, setResizeCorner] = useState<string | null>(null);
  const [resizeStartPos, setResizeStartPos] = useState<{ x: number; y: number } | null>(null);
  const [resizeStartRect, setResizeStartRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  
  // Moving underlay rectangle state
  const [movingUnderlayRect, setMovingUnderlayRect] = useState(false);
  const [moveStartPos, setMoveStartPos] = useState<{ x: number; y: number } | null>(null);
  const [moveStartRect, setMoveStartRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  
  // Track if mouse has moved during click (to detect drag vs click)
  const [mouseDownPosition, setMouseDownPosition] = useState<{ x: number; y: number } | null>(null);
  const [hasMoved, setHasMoved] = useState(false);

  const {
    canvasRef,
    activeTool,
    setActiveTool,
    currentColor,
    setCurrentColor,
    fillColor,
    setFillColor,
    startDrawing,
    draw,
    endDrawing,
    deleteSelected,
    clearCanvas,
    canvasSize,
    adjustCanvasSize,
    snapToAngle,
    toggleSnapToAngle,
    snapToEndpoints,
    toggleSnapToEndpoints,
    snapToLines,
    toggleSnapToLines,
    snapToExtensions,
    toggleSnapToExtensions,
    rectangleDrawMode,
    // Underlay image controls
    underlayImage,
    addUnderlayImage,
    removeUnderlayImage: hookRemoveUnderlayImage,
    confirmUnderlayImagePlacement,
    underlayOpacity,
    adjustUnderlayOpacity,
    underlayImageConfirmed,
    setUnderlayImageConfirmed
  } = useCanvasEditor();

  // Initialize default underlay rectangle
  useEffect(() => {
    if (canvasSize.width && canvasSize.height && underlayRect === null) {
      const width = canvasSize.width * 0.5;
      const height = canvasSize.height * 0.5;
      const x = (canvasSize.width - width) / 2;
      const y = (canvasSize.height - height) / 2;
      
      setUnderlayRect({ x, y, width, height });
      console.log("Initializing underlayRect:", { x, y, width, height });
    }
  }, [canvasSize, underlayRect]);
  
  // Reset underlay rectangle if image is removed
  useEffect(() => {
    if (!underlayImage) {
      setUnderlayImageConfirmed(false);
      
      if (!underlayRect) {
        const width = canvasSize.width * 0.5;
        const height = canvasSize.height * 0.5;
        const x = (canvasSize.width - width) / 2;
        const y = (canvasSize.height - height) / 2;
        
        setUnderlayRect({ x, y, width, height });
        console.log("Reinitializing underlayRect after image removal:", { x, y, width, height });
      }
    }
  }, [underlayImage, underlayRect, canvasSize, setUnderlayImageConfirmed]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log("File selected:", file.name);
      addUnderlayImage(file);
      setUnderlayImageConfirmed(false);
      toast({
        title: "Image uploaded",
        description: "Position and resize the image, then click the green checkmark to confirm.",
      });
    }
  };

  const handleUploadClick = () => {
    console.log("Upload click triggered");
    fileInputRef.current?.click();
  };
  
  const handleUnderlayRectClick = () => {
    // Only trigger upload if we haven't moved (i.e., not dragging)
    if (!underlayImage && !hasMoved) {
      console.log("Underlay rect clicked without dragging, have image:", !!underlayImage);
      handleUploadClick();
    }
  };
  
  // Function to confirm image placement
  const confirmImagePlacement = () => {
    if (underlayRect) {
      confirmUnderlayImagePlacement(underlayRect);
      toast({
        title: "Image placement confirmed",
        description: "The image is now rendered directly on the canvas. You can draw on top of it.",
      });
    }
  };
  
  // Function to reactivate image positioning
  const reactivateImagePositioning = () => {
    setUnderlayImageConfirmed(false);
    console.log("Image positioning reactivated");
  };
  
  // Wrap the removeUnderlayImage function to also reset our state
  const handleRemoveUnderlayImage = () => {
    hookRemoveUnderlayImage();
    setUnderlayImageConfirmed(false);
  };

  // Handle mouse move during resize
  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!resizingUnderlayRect || !resizeStartPos || !resizeStartRect || !resizeCorner) {
      console.log("Missing state for resize", { 
        resizingUnderlayRect, 
        hasResizeStartPos: !!resizeStartPos, 
        hasResizeStartRect: !!resizeStartRect, 
        resizeCorner 
      });
      return;
    }
    
    const deltaX = e.clientX - resizeStartPos.x;
    const deltaY = e.clientY - resizeStartPos.y;
    
    console.log("Resize move:", { deltaX, deltaY, corner: resizeCorner });
    
    const newRect = { ...resizeStartRect };
    
    switch (resizeCorner) {
      case 'nw':
        newRect.x = resizeStartRect.x + deltaX;
        newRect.y = resizeStartRect.y + deltaY;
        newRect.width = resizeStartRect.width - deltaX;
        newRect.height = resizeStartRect.height - deltaY;
        break;
      case 'ne':
        newRect.y = resizeStartRect.y + deltaY;
        newRect.width = resizeStartRect.width + deltaX;
        newRect.height = resizeStartRect.height - deltaY;
        break;
      case 'se':
        newRect.width = resizeStartRect.width + deltaX;
        newRect.height = resizeStartRect.height + deltaY;
        break;
      case 'sw':
        newRect.x = resizeStartRect.x + deltaX;
        newRect.width = resizeStartRect.width - deltaX;
        newRect.height = resizeStartRect.height + deltaY;
        break;
    }
    
    // Ensure minimum dimensions
    const minSize = 50;
    if (newRect.width < minSize) {
      if (['nw', 'sw'].includes(resizeCorner)) {
        newRect.x = resizeStartRect.x + resizeStartRect.width - minSize;
      }
      newRect.width = minSize;
    }
    
    if (newRect.height < minSize) {
      if (['nw', 'ne'].includes(resizeCorner)) {
        newRect.y = resizeStartRect.y + resizeStartRect.height - minSize;
      }
      newRect.height = minSize;
    }
    
    // Constrain to canvas boundaries
    if (newRect.x < 0) {
      if (['nw', 'sw'].includes(resizeCorner)) {
        newRect.width += newRect.x;
        newRect.x = 0;
      }
    }
    if (newRect.y < 0) {
      if (['nw', 'ne'].includes(resizeCorner)) {
        newRect.height += newRect.y;
        newRect.y = 0;
      }
    }
    if (newRect.x + newRect.width > canvasSize.width) {
      newRect.width = canvasSize.width - newRect.x;
    }
    if (newRect.y + newRect.height > canvasSize.height) {
      newRect.height = canvasSize.height - newRect.y;
    }
    
    console.log("New rect after resize:", newRect);
    
    // Update rectangle
    setUnderlayRect(newRect);
  }, [resizingUnderlayRect, resizeStartPos, resizeStartRect, resizeCorner, canvasSize.width, canvasSize.height]);
  
  // Handle resize end
  const handleResizeEnd = useCallback((e: MouseEvent) => {
    console.log("Resize ended");
    setResizingUnderlayRect(false);
    setResizeCorner(null);
    setResizeStartPos(null);
    setResizeStartRect(null);
    
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  }, [handleResizeMove]);
  
  // Handle starting rectangle resize
  const startResizingUnderlayRect = useCallback((corner: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!underlayRect) return;
    
    console.log("Starting resize:", { corner, clientX: e.clientX, clientY: e.clientY });
    
    // Important: Set state synchronously to ensure it's available in the move handler
    const newResizeStartPos = { x: e.clientX, y: e.clientY };
    const newResizeStartRect = { ...underlayRect };
    
    setResizingUnderlayRect(true);
    setResizeCorner(corner);
    setResizeStartPos(newResizeStartPos);
    setResizeStartRect(newResizeStartRect);
    
    // Use local variables for the event handlers to ensure they have the correct values
    const moveHandler = (moveEvent: MouseEvent) => {
      if (!newResizeStartPos || !newResizeStartRect) return;
      
      const deltaX = moveEvent.clientX - newResizeStartPos.x;
      const deltaY = moveEvent.clientY - newResizeStartPos.y;
      
      console.log("Resize move (direct):", { deltaX, deltaY, corner });
      
      const newRect = { ...newResizeStartRect };
      
      switch (corner) {
        case 'nw':
          newRect.x = newResizeStartRect.x + deltaX;
          newRect.y = newResizeStartRect.y + deltaY;
          newRect.width = newResizeStartRect.width - deltaX;
          newRect.height = newResizeStartRect.height - deltaY;
          break;
        case 'ne':
          newRect.y = newResizeStartRect.y + deltaY;
          newRect.width = newResizeStartRect.width + deltaX;
          newRect.height = newResizeStartRect.height - deltaY;
          break;
        case 'se':
          newRect.width = newResizeStartRect.width + deltaX;
          newRect.height = newResizeStartRect.height + deltaY;
          break;
        case 'sw':
          newRect.x = newResizeStartRect.x + deltaX;
          newRect.width = newResizeStartRect.width - deltaX;
          newRect.height = newResizeStartRect.height + deltaY;
          break;
      }
      
      // Ensure minimum dimensions
      const minSize = 50;
      if (newRect.width < minSize) {
        if (['nw', 'sw'].includes(corner)) {
          newRect.x = newResizeStartRect.x + newResizeStartRect.width - minSize;
        }
        newRect.width = minSize;
      }
      
      if (newRect.height < minSize) {
        if (['nw', 'ne'].includes(corner)) {
          newRect.y = newResizeStartRect.y + newResizeStartRect.height - minSize;
        }
        newRect.height = minSize;
      }
      
      // Constrain to canvas boundaries
      if (newRect.x < 0) {
        if (['nw', 'sw'].includes(corner)) {
          newRect.width += newRect.x;
          newRect.x = 0;
        }
      }
      if (newRect.y < 0) {
        if (['nw', 'ne'].includes(corner)) {
          newRect.height += newRect.y;
          newRect.y = 0;
        }
      }
      if (newRect.x + newRect.width > canvasSize.width) {
        newRect.width = canvasSize.width - newRect.x;
      }
      if (newRect.y + newRect.height > canvasSize.height) {
        newRect.height = canvasSize.height - newRect.y;
      }
      
      console.log("New rect after resize (direct):", newRect);
      
      // Update rectangle
      setUnderlayRect(newRect);
    };
    
    const endHandler = () => {
      console.log("Resize ended (direct handler)");
      setResizingUnderlayRect(false);
      setResizeCorner(null);
      setResizeStartPos(null);
      setResizeStartRect(null);
      
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', endHandler);
    };
    
    // Attach these handlers directly
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', endHandler);
  }, [underlayRect, canvasSize.width, canvasSize.height]);
  
  // Handle rectangle movement
  const handleMoveRect = useCallback((e: MouseEvent) => {
    if (!movingUnderlayRect || !moveStartPos || !moveStartRect) {
      console.log("Missing state for move", { 
        movingUnderlayRect, 
        hasMoveStartPos: !!moveStartPos, 
        hasMoveStartRect: !!moveStartRect
      });
      return;
    }
    
    const deltaX = e.clientX - moveStartPos.x;
    const deltaY = e.clientY - moveStartPos.y;
    
    console.log("Move rect:", { deltaX, deltaY });
    
    // Create new position
    const newRect = {
      ...moveStartRect,
      x: moveStartRect.x + deltaX,
      y: moveStartRect.y + deltaY
    };
    
    // Boundary checks to keep rectangle within canvas
    if (newRect.x < 0) newRect.x = 0;
    if (newRect.y < 0) newRect.y = 0;
    if (newRect.x + newRect.width > canvasSize.width) {
      newRect.x = canvasSize.width - newRect.width;
    }
    if (newRect.y + newRect.height > canvasSize.height) {
      newRect.y = canvasSize.height - newRect.height;
    }
    
    console.log("New rect after move:", newRect);
    
    // Update rectangle position
    setUnderlayRect(newRect);
    
    // Set hasMoved to true when mouse has moved significantly
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      setHasMoved(true);
    }
  }, [movingUnderlayRect, moveStartPos, moveStartRect, canvasSize.width, canvasSize.height]);
  
  // Handle move end
  const handleMoveEnd = useCallback((e: MouseEvent) => {
    console.log("Move ended");
    setMovingUnderlayRect(false);
    setMoveStartPos(null);
    setMoveStartRect(null);
    
    // Reset hasMoved state on move end
    setTimeout(() => {
      setHasMoved(false);
    }, 10);
    
    document.removeEventListener('mousemove', handleMoveRect);
    document.removeEventListener('mouseup', handleMoveEnd);
  }, [handleMoveRect]);
  
  // Handle starting rectangle movement
  const startMovingUnderlayRect = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!underlayRect || resizingUnderlayRect) {
      console.log("Cannot start moving:", { hasUnderlayRect: !!underlayRect, isResizing: resizingUnderlayRect });
      return;
    }
    
    console.log("Starting to move rect:", { clientX: e.clientX, clientY: e.clientY });
    
    // Initialize mouse down position for tracking movement
    setMouseDownPosition({ x: e.clientX, y: e.clientY });
    setHasMoved(false);
    
    // Important: Set state synchronously to ensure it's available in the move handler
    const newMoveStartPos = { x: e.clientX, y: e.clientY };
    const newMoveStartRect = { ...underlayRect };
    
    setMovingUnderlayRect(true);
    setMoveStartPos(newMoveStartPos);
    setMoveStartRect(newMoveStartRect);
    
    // Use local variables for the event handlers to ensure they have the correct values
    const moveHandler = (moveEvent: MouseEvent) => {
      if (!newMoveStartPos || !newMoveStartRect) return;
      
      const deltaX = moveEvent.clientX - newMoveStartPos.x;
      const deltaY = moveEvent.clientY - newMoveStartPos.y;
      
      console.log("Move rect (direct):", { deltaX, deltaY });
      
      // Create new position
      const newRect = {
        ...newMoveStartRect,
        x: newMoveStartRect.x + deltaX,
        y: newMoveStartRect.y + deltaY
      };
      
      // Boundary checks to keep rectangle within canvas
      if (newRect.x < 0) newRect.x = 0;
      if (newRect.y < 0) newRect.y = 0;
      if (newRect.x + newRect.width > canvasSize.width) {
        newRect.x = canvasSize.width - newRect.width;
      }
      if (newRect.y + newRect.height > canvasSize.height) {
        newRect.y = canvasSize.height - newRect.height;
      }
      
      console.log("New rect after move (direct):", newRect);
      
      // Update rectangle position
      setUnderlayRect(newRect);
      
      // Set hasMoved to true when mouse has moved significantly
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        setHasMoved(true);
      }
    };
    
    const endHandler = () => {
      console.log("Move ended (direct handler)");
      setMovingUnderlayRect(false);
      setMoveStartPos(null);
      setMoveStartRect(null);
      
      // Reset hasMoved state on move end with slight delay to allow click event processing
      setTimeout(() => {
        setHasMoved(false);
      }, 10);
      
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', endHandler);
    };
    
    // Attach these handlers directly
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', endHandler);
  }, [underlayRect, resizingUnderlayRect, canvasSize.width, canvasSize.height]);
  
  // Calculate the appropriate scale factor based on container size
  useEffect(() => {
    const handleResize = () => {
      const newScaleFactor = calculateScaleFactor(containerRef, orientation);
      setScaleFactor(newScaleFactor);
      updateCanvasSize(orientation, newScaleFactor);
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Calculate on mount
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [orientation, containerRef.current]);
  
  const updateCanvasSize = (orient: "portrait" | "landscape", scale = scaleFactor) => {
    const newSize = calculateCanvasSize(orient, scale);
    adjustCanvasSize(newSize.width, newSize.height);
  };

  useEffect(() => {
    updateCanvasSize(orientation);
  }, [scaleFactor]);

  // Clean up event listeners - updated with proper dependencies
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.removeEventListener('mousemove', handleMoveRect);
      document.removeEventListener('mouseup', handleMoveEnd);
    };
  }, [handleResizeMove, handleResizeEnd, handleMoveRect, handleMoveEnd]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Force a clean redraw by clearing and triggering the redraw in useCanvasEditor
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // This will trigger the redraw effect in useCanvasEditor
        setActiveTool(activeTool);
      }
    }
  }, [activeTool, currentColor, fillColor, snapToAngle, snapToEndpoints, snapToLines, snapToExtensions, canvasRef, setActiveTool]);

  // Debug monitor for state changes
  useEffect(() => {
    console.log("State changed:", { 
      resizingUnderlayRect, 
      movingUnderlayRect, 
      hasImage: !!underlayImage,
      resizeCorner,
      hasResizeStartPos: !!resizeStartPos,
      hasMoveStartPos: !!moveStartPos
    });
  }, [resizingUnderlayRect, movingUnderlayRect, underlayImage, resizeCorner, resizeStartPos, moveStartPos]);

  // Debug output of underlayRect whenever it changes
  useEffect(() => {
    console.log("UnderlayRect updated:", underlayRect);
  }, [underlayRect]);

  return (
    <div className="flex flex-col h-full">
      <Toolbar 
        activeTool={activeTool}
        onToolChange={setActiveTool}
        onDelete={deleteSelected}
        onClear={clearCanvas}
      />
      
      <CanvasToolbar 
        currentColor={currentColor}
        setCurrentColor={setCurrentColor}
        fillColor={fillColor}
        setFillColor={setFillColor}
        orientation={orientation}
        setOrientation={setOrientation}
        snapToEndpoints={snapToEndpoints}
        toggleSnapToEndpoints={toggleSnapToEndpoints}
        snapToLines={snapToLines}
        toggleSnapToLines={toggleSnapToLines}
        snapToAngle={snapToAngle}
        toggleSnapToAngle={toggleSnapToAngle}
        snapToExtensions={snapToExtensions}
        toggleSnapToExtensions={toggleSnapToExtensions}
        handleUploadClick={handleUploadClick}
        fileInputRef={fileInputRef}
        underlayImage={underlayImage !== null}
        removeUnderlayImage={handleRemoveUnderlayImage}
        underlayOpacity={underlayOpacity}
        adjustUnderlayOpacity={adjustUnderlayOpacity}
        confirmImagePlacement={confirmImagePlacement}
        imageConfirmed={underlayImageConfirmed}
        reactivateImagePositioning={reactivateImagePositioning}
      />
      
      <input 
        ref={fileInputRef}
        type="file" 
        accept="image/*" 
        onChange={handleFileChange} 
        className="hidden"
      />
      
      <CanvasContainer
        canvasRef={canvasRef}
        canvasSize={canvasSize}
        startDrawing={startDrawing}
        draw={draw}
        endDrawing={endDrawing}
        activeTool={activeTool}
        underlayImage={underlayImage}
        containerRef={containerRef}
        underlayRect={underlayRect}
        handleUnderlayRectClick={handleUnderlayRectClick}
        resizingUnderlayRect={resizingUnderlayRect}
        startResizingUnderlayRect={startResizingUnderlayRect}
        movingUnderlayRect={movingUnderlayRect}
        startMovingUnderlayRect={startMovingUnderlayRect}
        confirmImagePlacement={confirmImagePlacement}
        removeUnderlayImage={handleRemoveUnderlayImage}
        imageConfirmed={underlayImageConfirmed}
        reactivateImagePositioning={reactivateImagePositioning}
        underlayOpacity={underlayOpacity}
        hasMoved={hasMoved}
      />
    </div>
  );
};

export default Canvas;
