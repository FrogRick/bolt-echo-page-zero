import React, { useEffect, useState, useRef, useCallback } from "react";
import { useCanvasEditor } from "@/hooks/useCanvasEditor";
import { Tool, UnderlayImageCrop } from "@/types/canvas";
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
  
  // Image crop state (used for rendering actual crop)
  const [imageCrop, setImageCrop] = useState<UnderlayImageCrop | null>(null);
  
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
    removeUnderlayImage,
    underlayScale,
    adjustUnderlayScale,
    underlayOpacity,
    adjustUnderlayOpacity
  } = useCanvasEditor();

  // Initialize default underlay rectangle
  useEffect(() => {
    if (canvasSize.width && canvasSize.height && underlayRect === null) {
      // Set default rectangle to 50% of canvas size, centered
      const width = canvasSize.width * 0.5;
      const height = canvasSize.height * 0.5;
      const x = (canvasSize.width - width) / 2;
      const y = (canvasSize.height - height) / 2;
      
      const newRect = { x, y, width, height };
      setUnderlayRect(newRect);
      // Initialize crop to match the full rect
      setImageCrop(newRect);
      console.log("Initializing underlayRect:", newRect);
    }
  }, [canvasSize, underlayRect]);
  
  // Reset underlay rectangle if image is removed
  useEffect(() => {
    if (!underlayImage && !underlayRect) {
      // Reinitialize the rectangle
      const width = canvasSize.width * 0.5;
      const height = canvasSize.height * 0.5;
      const x = (canvasSize.width - width) / 2;
      const y = (canvasSize.height - height) / 2;
      
      const newRect = { x, y, width, height };
      setUnderlayRect(newRect);
      // Reset crop too
      setImageCrop(newRect);
      console.log("Reinitializing underlayRect after image removal:", newRect);
    }
  }, [underlayImage, underlayRect, canvasSize]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log("File selected:", file.name);
      addUnderlayImage(file);
      toast({
        title: "Image uploaded",
        description: "You can now resize, move, and crop the image",
      });
    }
  };

  const handleUploadClick = () => {
    console.log("Upload click triggered");
    fileInputRef.current?.click();
  };
  
  const handleUnderlayRectClick = () => {
    console.log("Underlay rect clicked, have image:", !!underlayImage);
    if (!underlayImage) {
      handleUploadClick();
    }
  };
  
  // Handle mouse move during resize or crop
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
    
    console.log("Resize/crop move:", { deltaX, deltaY, corner: resizeCorner });
    
    const newRect = { ...resizeStartRect };
    
    // Check if this is a corner (resize) or side (crop) handle
    const isCropHandle = ['n', 'e', 's', 'w'].includes(resizeCorner);
    
    if (isCropHandle) {
      // Crop operation - adjust crop bounds but not the container
      // We'll adjust the image crop separately
      const newCrop = { ...imageCrop! };
      
      switch (resizeCorner) {
        case 'n':
          newCrop.y = resizeStartRect.y + deltaY;
          newCrop.height = resizeStartRect.height - deltaY;
          break;
        case 'e':
          newCrop.width = resizeStartRect.width + deltaX;
          break;
        case 's':
          newCrop.height = resizeStartRect.height + deltaY;
          break;
        case 'w':
          newCrop.x = resizeStartRect.x + deltaX;
          newCrop.width = resizeStartRect.width - deltaX;
          break;
      }
      
      // Ensure crop stays within the container
      const minSize = 50;
      if (newCrop.width < minSize) {
        if (resizeCorner === 'w') {
          newCrop.x = resizeStartRect.x + resizeStartRect.width - minSize;
        }
        newCrop.width = minSize;
      }
      
      if (newCrop.height < minSize) {
        if (resizeCorner === 'n') {
          newCrop.y = resizeStartRect.y + resizeStartRect.height - minSize;
        }
        newCrop.height = minSize;
      }
      
      // Don't allow crop to go outside the original rect
      if (newCrop.x < resizeStartRect.x) {
        newCrop.x = resizeStartRect.x;
        newCrop.width = resizeStartRect.width;
      }
      
      if (newCrop.y < resizeStartRect.y) {
        newCrop.y = resizeStartRect.y;
        newCrop.height = resizeStartRect.height;
      }
      
      if (newCrop.x + newCrop.width > resizeStartRect.x + resizeStartRect.width) {
        newCrop.width = resizeStartRect.x + resizeStartRect.width - newCrop.x;
      }
      
      if (newCrop.y + newCrop.height > resizeStartRect.y + resizeStartRect.height) {
        newCrop.height = resizeStartRect.y + resizeStartRect.height - newCrop.y;
      }
      
      console.log("New crop after crop operation:", newCrop);
      
      // Update crop only, not the container rect
      setImageCrop(newCrop);
    } else {
      // Full resize operation (both container and crop)
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
      
      // Update rectangle and also reset crop to full size
      setUnderlayRect(newRect);
      setImageCrop(newRect);
    }
  }, [resizingUnderlayRect, resizeStartPos, resizeStartRect, resizeCorner, canvasSize.width, canvasSize.height, imageCrop]);
  
  // Handle resize end
  const handleResizeEnd = useCallback((e: MouseEvent) => {
    console.log("Resize/crop ended");
    setResizingUnderlayRect(false);
    setResizeCorner(null);
    setResizeStartPos(null);
    setResizeStartRect(null);
    
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  }, [handleResizeMove]);
  
  // Handle starting rectangle resize or crop
  const startResizingUnderlayRect = useCallback((corner: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!underlayRect) return;
    
    const isCropHandle = ['n', 'e', 's', 'w'].includes(corner);
    console.log(`Starting ${isCropHandle ? 'crop' : 'resize'}:`, { corner, clientX: e.clientX, clientY: e.clientY });
    
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
      
      console.log(`${isCropHandle ? 'Crop' : 'Resize'} move (direct):`, { deltaX, deltaY, corner });
      
      if (isCropHandle) {
        // Crop operation - adjust crop bounds but not the container
        const newCrop = { ...imageCrop! };
        
        switch (corner) {
          case 'n':
            newCrop.y = Math.max(newResizeStartRect.y, newResizeStartRect.y + deltaY);
            newCrop.height = Math.max(50, newResizeStartRect.height - deltaY);
            break;
          case 'e':
            newCrop.width = Math.max(50, Math.min(newResizeStartRect.width + deltaX, 
              newResizeStartRect.x + newResizeStartRect.width - newCrop.x));
            break;
          case 's':
            newCrop.height = Math.max(50, Math.min(newResizeStartRect.height + deltaY,
              newResizeStartRect.y + newResizeStartRect.height - newCrop.y));
            break;
          case 'w':
            newCrop.x = Math.max(newResizeStartRect.x, 
              Math.min(newResizeStartRect.x + deltaX, newResizeStartRect.x + newResizeStartRect.width - 50));
            newCrop.width = newResizeStartRect.x + newResizeStartRect.width - newCrop.x;
            break;
        }
        
        console.log("New crop after crop operation (direct):", newCrop);
        setImageCrop(newCrop);
      } else {
        // Full resize operation
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
        
        // Update rectangle and also reset crop to full size
        setUnderlayRect(newRect);
        setImageCrop(newRect);
      }
    };
    
    const endHandler = () => {
      console.log("Resize/crop ended (direct handler)");
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
  }, [underlayRect, canvasSize.width, canvasSize.height, imageCrop]);
  
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
    
    // Update rectangle position and adjust crop accordingly
    setUnderlayRect(newRect);
    
    // Also move the crop with the same delta
    if (imageCrop) {
      const newCrop = {
        x: imageCrop.x + deltaX,
        y: imageCrop.y + deltaY,
        width: imageCrop.width,
        height: imageCrop.height
      };
      
      // Adjust if crop would go outside the rect
      if (newCrop.x < newRect.x) newCrop.x = newRect.x;
      if (newCrop.y < newRect.y) newCrop.y = newRect.y;
      if (newCrop.x + newCrop.width > newRect.x + newRect.width) {
        newCrop.x = newRect.x + newRect.width - newCrop.width;
      }
      if (newCrop.y + newCrop.height > newRect.y + newRect.height) {
        newCrop.y = newRect.y + newRect.height - newCrop.height;
      }
      
      setImageCrop(newCrop);
    }
  }, [movingUnderlayRect, moveStartPos, moveStartRect, canvasSize.width, canvasSize.height, imageCrop]);
  
  // Handle move end
  const handleMoveEnd = useCallback((e: MouseEvent) => {
    console.log("Move ended");
    setMovingUnderlayRect(false);
    setMoveStartPos(null);
    setMoveStartRect(null);
    
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
      
      // Also move the crop with the same delta if it exists
      if (imageCrop) {
        const newCrop = {
          x: imageCrop.x + deltaX,
          y: imageCrop.y + deltaY,
          width: imageCrop.width,
          height: imageCrop.height
        };
        
        // Adjust if crop would go outside the rect
        if (newCrop.x < newRect.x) newCrop.x = newRect.x;
        if (newCrop.y < newRect.y) newCrop.y = newRect.y;
        if (newCrop.x + newCrop.width > newRect.x + newRect.width) {
          newCrop.x = newRect.x + newRect.width - newCrop.width;
        }
        if (newCrop.y + newCrop.height > newRect.y + newRect.height) {
          newCrop.y = newRect.y + newRect.height - newCrop.height;
        }
        
        setImageCrop(newCrop);
      }
    };
    
    const endHandler = () => {
      console.log("Move ended (direct handler)");
      setMovingUnderlayRect(false);
      setMoveStartPos(null);
      setMoveStartRect(null);
      
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', endHandler);
    };
    
    // Attach these handlers directly
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', endHandler);
  }, [underlayRect, resizingUnderlayRect, canvasSize.width, canvasSize.height, imageCrop]);

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
      hasMoveStartPos: !!moveStartPos,
      hasCrop: !!imageCrop
    });
  }, [resizingUnderlayRect, movingUnderlayRect, underlayImage, resizeCorner, resizeStartPos, moveStartPos, imageCrop]);

  // Debug output of underlayRect whenever it changes
  useEffect(() => {
    console.log("UnderlayRect updated:", underlayRect);
  }, [underlayRect]);

  // Debug output of crop whenever it changes
  useEffect(() => {
    console.log("ImageCrop updated:", imageCrop);
  }, [imageCrop]);
  
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
        removeUnderlayImage={() => {
          removeUnderlayImage();
          // Don't reset underlayRect here, it will be recreated by the effect
        }}
        underlayOpacity={underlayOpacity}
        adjustUnderlayOpacity={adjustUnderlayOpacity}
        underlayScale={underlayScale}
        adjustUnderlayScale={adjustUnderlayScale}
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
      />
    </div>
  );
};

export default Canvas;
