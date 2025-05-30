import React, { useRef, useState, useEffect, useCallback } from "react";
import { useCanvasEditor } from "@/hooks/useCanvasEditor";
import { Tool } from "@/types/canvas";
import { Toolbar } from "./Toolbar";
import CanvasToolbar from "./CanvasToolbar";
import CanvasContainer from "./CanvasContainer";
import { calculateScaleFactor, calculateCanvasSize, INITIAL_SCALE_FACTOR } from "./CanvasUtils";
import { useToast } from "@/hooks/use-toast";
import { DownloadPDFButton } from "./DownloadPDFButton";

const Canvas: React.FC = () => {
  const { toast } = useToast();
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [scaleFactor, setScaleFactor] = useState(INITIAL_SCALE_FACTOR);
  const [fillOpacity, setFillOpacity] = useState(50); // Default 50% opacity
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
  
  // Add state for tracking if image is confirmed
  const [imageConfirmed, setImageConfirmed] = useState(false);
  
  // Wall thickness state
  const [wallThickness, setWallThickness] = useState(8); // Default wall thickness
  
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
      
      setUnderlayRect({ x, y, width, height });
      console.log("Initializing underlayRect:", { x, y, width, height });
    }
  }, [canvasSize, underlayRect]);
  
  // Reset underlay rectangle and confirmed state if image is removed
  useEffect(() => {
    if (!underlayImage) {
      // Reset confirmed state
      setImageConfirmed(false);
      
      if (!underlayRect) {
        // Reinitialize the rectangle
        const width = canvasSize.width * 0.5;
        const height = canvasSize.height * 0.5;
        const x = (canvasSize.width - width) / 2;
        const y = (canvasSize.height - height) / 2;
        
        setUnderlayRect({ x, y, width, height });
        console.log("Reinitializing underlayRect after image removal:", { x, y, width, height });
      }
    }
  }, [underlayImage, underlayRect, canvasSize]);

  // Adjust underlay rectangle to match image dimensions when image is loaded
  useEffect(() => {
    if (underlayImage && underlayRect && !imageConfirmed) {
      // Only auto-adjust if this is a newly loaded image, not a reactivated one
      // We can detect this by checking if the rectangle is still at default position/size
      const isDefaultRect = (
        Math.abs(underlayRect.x - (canvasSize.width - canvasSize.width * 0.5) / 2) < 1 &&
        Math.abs(underlayRect.y - (canvasSize.height - canvasSize.height * 0.5) / 2) < 1 &&
        Math.abs(underlayRect.width - canvasSize.width * 0.5) < 1 &&
        Math.abs(underlayRect.height - canvasSize.height * 0.5) < 1
      );
      
      if (isDefaultRect) {
        console.log("Adjusting underlay rect to match image dimensions");
        
        // Calculate the scale to fit the image within the canvas while maintaining aspect ratio
        const imageAspectRatio = underlayImage.width / underlayImage.height;
        const maxWidth = canvasSize.width * 0.8; // Use 80% of canvas width as max
        const maxHeight = canvasSize.height * 0.8; // Use 80% of canvas height as max
        
        let newWidth, newHeight;
        
        if (imageAspectRatio > maxWidth / maxHeight) {
          // Image is wider relative to canvas
          newWidth = Math.min(maxWidth, underlayImage.width);
          newHeight = newWidth / imageAspectRatio;
        } else {
          // Image is taller relative to canvas
          newHeight = Math.min(maxHeight, underlayImage.height);
          newWidth = newHeight * imageAspectRatio;
        }
        
        // Center the rectangle
        const newX = (canvasSize.width - newWidth) / 2;
        const newY = (canvasSize.height - newHeight) / 2;
        
        const newRect = {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight
        };
        
        console.log("New rect based on image dimensions:", newRect);
        setUnderlayRect(newRect);
      } else {
        console.log("Image reactivated, keeping current position");
      }
    }
  }, [underlayImage, canvasSize, imageConfirmed]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log("File selected:", file.name);
      addUnderlayImage(file);
      setImageConfirmed(false); // Reset confirmed state for new image
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
    console.log("Underlay rect clicked, have image:", !!underlayImage);
    if (!underlayImage) {
      handleUploadClick();
    }
  };
  
  // New function to confirm image placement
  const confirmImagePlacement = () => {
    setImageConfirmed(true);
    toast({
      title: "Image placement confirmed",
      description: "You can now draw on top of the image.",
    });
  };
  
  // New function to reactivate image positioning
  const reactivateImagePositioning = () => {
    setImageConfirmed(false);
    console.log("Image positioning reactivated");
  };
  
  // Wrap the removeUnderlayImage function to also reset our state
  const handleRemoveUnderlayImage = () => {
    hookRemoveUnderlayImage();
    setImageConfirmed(false);
  };
  
  // Handle mouse move during resize with aspect ratio preservation
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
    
    let newWidth = resizeStartRect.width;
    let newHeight = resizeStartRect.height;
    
    // Calculate new dimensions based on corner being dragged
    switch (resizeCorner) {
      case 'nw':
        newWidth = resizeStartRect.width - deltaX;
        newHeight = resizeStartRect.height - deltaY;
        break;
      case 'ne':
        newWidth = resizeStartRect.width + deltaX;
        newHeight = resizeStartRect.height - deltaY;
        break;
      case 'se':
        newWidth = resizeStartRect.width + deltaX;
        newHeight = resizeStartRect.height + deltaY;
        break;
      case 'sw':
        newWidth = resizeStartRect.width - deltaX;
        newHeight = resizeStartRect.height + deltaY;
        break;
    }
    
    // Preserve aspect ratio if we have an image
    if (underlayImage) {
      const imageAspectRatio = underlayImage.width / underlayImage.height;
      
      // Use the dimension that changed the most to determine the scale
      const widthChange = Math.abs(newWidth - resizeStartRect.width);
      const heightChange = Math.abs(newHeight - resizeStartRect.height);
      
      if (widthChange > heightChange) {
        // Width changed more, adjust height
        newHeight = newWidth / imageAspectRatio;
      } else {
        // Height changed more, adjust width
        newWidth = newHeight * imageAspectRatio;
      }
    }
    
    // Ensure minimum dimensions
    const minSize = 50;
    if (newWidth < minSize) {
      newWidth = minSize;
      if (underlayImage) {
        newHeight = newWidth / (underlayImage.width / underlayImage.height);
      }
    }
    if (newHeight < minSize) {
      newHeight = minSize;
      if (underlayImage) {
        newWidth = newHeight * (underlayImage.width / underlayImage.height);
      }
    }
    
    // Adjust position based on which corner is being resized
    const newRect = { ...resizeStartRect };
    switch (resizeCorner) {
      case 'nw':
        newRect.x = resizeStartRect.x + resizeStartRect.width - newWidth;
        newRect.y = resizeStartRect.y + resizeStartRect.height - newHeight;
        break;
      case 'ne':
        newRect.y = resizeStartRect.y + resizeStartRect.height - newHeight;
        break;
      case 'sw':
        newRect.x = resizeStartRect.x + resizeStartRect.width - newWidth;
        break;
      case 'se':
        // No position adjustment needed
        break;
    }
    
    newRect.width = newWidth;
    newRect.height = newHeight;
    
    // Constrain to canvas boundaries
    if (newRect.x < 0) {
      const overflow = -newRect.x;
      newRect.x = 0;
      newRect.width -= overflow;
      if (underlayImage) {
        newRect.height = newRect.width / (underlayImage.width / underlayImage.height);
      }
    }
    if (newRect.y < 0) {
      const overflow = -newRect.y;
      newRect.y = 0;
      newRect.height -= overflow;
      if (underlayImage) {
        newRect.width = newRect.height * (underlayImage.width / underlayImage.height);
      }
    }
    if (newRect.x + newRect.width > canvasSize.width) {
      newRect.width = canvasSize.width - newRect.x;
      if (underlayImage) {
        newRect.height = newRect.width / (underlayImage.width / underlayImage.height);
      }
    }
    if (newRect.y + newRect.height > canvasSize.height) {
      newRect.height = canvasSize.height - newRect.y;
      if (underlayImage) {
        newRect.width = newRect.height * (underlayImage.width / underlayImage.height);
      }
    }
    
    console.log("New rect after resize:", newRect);
    
    // Update rectangle
    setUnderlayRect(newRect);
  }, [resizingUnderlayRect, resizeStartPos, resizeStartRect, resizeCorner, canvasSize.width, canvasSize.height, underlayImage]);
  
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
      
      let newWidth = newResizeStartRect.width;
      let newHeight = newResizeStartRect.height;
      
      // Calculate new dimensions based on corner being dragged
      switch (corner) {
        case 'nw':
          newWidth = newResizeStartRect.width - deltaX;
          newHeight = newResizeStartRect.height - deltaY;
          break;
        case 'ne':
          newWidth = newResizeStartRect.width + deltaX;
          newHeight = newResizeStartRect.height - deltaY;
          break;
        case 'se':
          newWidth = newResizeStartRect.width + deltaX;
          newHeight = newResizeStartRect.height + deltaY;
          break;
        case 'sw':
          newWidth = newResizeStartRect.width - deltaX;
          newHeight = newResizeStartRect.height + deltaY;
          break;
      }
      
      // Preserve aspect ratio if we have an image
      if (underlayImage) {
        const imageAspectRatio = underlayImage.width / underlayImage.height;
        
        // Use the dimension that changed the most to determine the scale
        const widthChange = Math.abs(newWidth - newResizeStartRect.width);
        const heightChange = Math.abs(newHeight - newResizeStartRect.height);
        
        if (widthChange > heightChange) {
          // Width changed more, adjust height
          newHeight = newWidth / imageAspectRatio;
        } else {
          // Height changed more, adjust width
          newWidth = newHeight * imageAspectRatio;
        }
      }
      
      const newRect = { ...newResizeStartRect };
      
      // Ensure minimum dimensions
      const minSize = 50;
      if (newWidth < minSize) {
        newWidth = minSize;
        if (underlayImage) {
          newHeight = newWidth / (underlayImage.width / underlayImage.height);
        }
      }
      if (newHeight < minSize) {
        newHeight = minSize;
        if (underlayImage) {
          newWidth = newHeight * (underlayImage.width / underlayImage.height);
        }
      }
      
      // Adjust position based on which corner is being resized
      switch (corner) {
        case 'nw':
          newRect.x = newResizeStartRect.x + newResizeStartRect.width - newWidth;
          newRect.y = newResizeStartRect.y + newResizeStartRect.height - newHeight;
          break;
        case 'ne':
          newRect.y = newResizeStartRect.y + newResizeStartRect.height - newHeight;
          break;
        case 'sw':
          newRect.x = newResizeStartRect.x + newResizeStartRect.width - newWidth;
          break;
        case 'se':
          // No position adjustment needed
          break;
      }
      
      newRect.width = newWidth;
      newRect.height = newHeight;
      
      // Constrain to canvas boundaries
      if (newRect.x < 0) {
        const overflow = -newRect.x;
        newRect.x = 0;
        newRect.width -= overflow;
        if (underlayImage) {
          newRect.height = newRect.width / (underlayImage.width / underlayImage.height);
        }
      }
      if (newRect.y < 0) {
        const overflow = -newRect.y;
        newRect.y = 0;
        newRect.height -= overflow;
        if (underlayImage) {
          newRect.width = newRect.height * (underlayImage.width / underlayImage.height);
        }
      }
      if (newRect.x + newRect.width > canvasSize.width) {
        newRect.width = canvasSize.width - newRect.x;
        if (underlayImage) {
          newRect.height = newRect.width / (underlayImage.width / underlayImage.height);
        }
      }
      if (newRect.y + newRect.height > canvasSize.height) {
        newRect.height = canvasSize.height - newRect.y;
        if (underlayImage) {
          newRect.width = newRect.height * (underlayImage.width / underlayImage.height);
        }
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
  }, [underlayRect, canvasSize.width, canvasSize.height, underlayImage]);
  
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
    
    // Create a new position
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
  }, [movingUnderlayRect, moveStartPos, moveStartRect, canvasSize.width, canvasSize.height]);
  
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

  // Show wall thickness slider when wall tool is active
  const isWallToolActive = activeTool === 'wall' || activeTool === 'wall-polygon';

  return (
    <div className="flex flex-col h-full">
      <Toolbar 
        activeTool={activeTool}
        onToolChange={setActiveTool}
        onDelete={deleteSelected}
        onClear={clearCanvas}
      />
      
      <CanvasToolbar 
        activeTool={activeTool}
        currentColor={currentColor}
        setCurrentColor={setCurrentColor}
        fillColor={fillColor}
        setFillColor={setFillColor}
        fillOpacity={fillOpacity}
        setFillOpacity={setFillOpacity}
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
        confirmImagePlacement={confirmImagePlacement}
        imageConfirmed={imageConfirmed}
        reactivateImagePositioning={reactivateImagePositioning}
        wallThickness={wallThickness}
        setWallThickness={setWallThickness}
        isWallToolActive={isWallToolActive}
      />
      
      <input 
        ref={fileInputRef}
        type="file" 
        accept="image/*" 
        onChange={handleFileChange} 
        className="hidden"
      />
      
      <div className="flex-1 flex items-center justify-center bg-gray-50 overflow-auto relative">
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
          imageConfirmed={imageConfirmed}
          reactivateImagePositioning={reactivateImagePositioning}
          underlayOpacity={underlayOpacity}
          adjustUnderlayOpacity={adjustUnderlayOpacity}
          fillOpacity={fillOpacity}
          wallThickness={wallThickness}
        />
        
        <div className="absolute bottom-4 right-4 z-10">
          <DownloadPDFButton 
            canvasRef={canvasRef} 
            orientation={orientation}
            canvasSize={canvasSize}
          />
        </div>
      </div>
    </div>
  );
};

export default Canvas;