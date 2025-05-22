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
  
  // Image selection state
  const [isImageSelected, setIsImageSelected] = useState(false);
  
  // Crop functionality
  const [cropMode, setCropMode] = useState(false);
  const [cropRect, setCropRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  
  const toggleCropMode = useCallback(() => {
    const newCropMode = !cropMode;
    setCropMode(newCropMode);
    
    if (newCropMode && underlayRect) {
      // Initialize crop rect to full image dimensions
      setCropRect({...underlayRect});
      toast({
        title: "Crop mode activated",
        description: "Drag the handles to crop your image",
      });
    } else {
      if (cropRect && underlayRect) {
        // Apply the crop by updating the underlayRect and adjusting the image
        handleApplyCrop();
      }
      setCropRect(null);
    }
  }, [cropMode, underlayRect, cropRect]);
  
  // Function to apply the crop
  const handleApplyCrop = () => {
    if (!cropRect || !underlayRect || !underlayImage) return;
    
    // Create a temporary canvas to crop the image
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    // Calculate the relative coordinates within the image
    const scaleX = underlayImage.naturalWidth / underlayRect.width;
    const scaleY = underlayImage.naturalHeight / underlayRect.height;
    
    const sourceX = (cropRect.x - underlayRect.x) * scaleX;
    const sourceY = (cropRect.y - underlayRect.y) * scaleY;
    const sourceWidth = cropRect.width * scaleX;
    const sourceHeight = cropRect.height * scaleY;
    
    // Set canvas dimensions to the crop size
    tempCanvas.width = sourceWidth;
    tempCanvas.height = sourceHeight;
    
    // Draw the cropped portion
    tempCtx.drawImage(
      underlayImage,
      sourceX, sourceY, sourceWidth, sourceHeight,
      0, 0, sourceWidth, sourceHeight
    );
    
    // Convert the canvas to a data URL and create a new image
    tempCanvas.toBlob((blob) => {
      if (blob) {
        const newImage = new Image();
        const url = URL.createObjectURL(blob);
        newImage.onload = () => {
          // Update the image
          removeUnderlayImage();
          addUnderlayImage(blob);
          
          // Update the rectangle to match the crop area
          setUnderlayRect(cropRect);
          
          // Exit crop mode
          setCropMode(false);
          setCropRect(null);
          
          toast({
            title: "Image cropped",
            description: "The image has been cropped successfully",
          });
        };
        newImage.src = url;
      }
    });
  };
  
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
      
      setUnderlayRect({ x, y, width, height });
      console.log("Initializing underlayRect:", { x, y, width, height });
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
      
      setUnderlayRect({ x, y, width, height });
      console.log("Reinitializing underlayRect after image removal:", { x, y, width, height });
    }
    
    // Reset crop mode when image is removed
    if (!underlayImage && cropMode) {
      setCropMode(false);
      setCropRect(null);
    }
  }, [underlayImage, underlayRect, canvasSize, cropMode]);

  // Reset image selection when tool changes
  useEffect(() => {
    if (activeTool !== "select" && isImageSelected) {
      setIsImageSelected(false);
    }
  }, [activeTool, isImageSelected]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log("File selected:", file.name);
      addUnderlayImage(file);
      setIsImageSelected(true); // Automatically select the image after upload
      toast({
        title: "Image uploaded",
        description: "You can now resize and move the image",
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
    
    // Determine if we're resizing the crop rect or the main underlay rect
    const targetRect = cropMode && cropRect ? { ...cropRect } : { ...resizeStartRect };
    
    switch (resizeCorner) {
      case 'nw':
        targetRect.x = resizeStartRect.x + deltaX;
        targetRect.y = resizeStartRect.y + deltaY;
        targetRect.width = resizeStartRect.width - deltaX;
        targetRect.height = resizeStartRect.height - deltaY;
        break;
      case 'ne':
        targetRect.y = resizeStartRect.y + deltaY;
        targetRect.width = resizeStartRect.width + deltaX;
        targetRect.height = resizeStartRect.height - deltaY;
        break;
      case 'se':
        targetRect.width = resizeStartRect.width + deltaX;
        targetRect.height = resizeStartRect.height + deltaY;
        break;
      case 'sw':
        targetRect.x = resizeStartRect.x + deltaX;
        targetRect.width = resizeStartRect.width - deltaX;
        targetRect.height = resizeStartRect.height + deltaY;
        break;
    }
    
    // Ensure minimum dimensions
    const minSize = 50;
    if (targetRect.width < minSize) {
      if (['nw', 'sw'].includes(resizeCorner)) {
        targetRect.x = resizeStartRect.x + resizeStartRect.width - minSize;
      }
      targetRect.width = minSize;
    }
    
    if (targetRect.height < minSize) {
      if (['nw', 'ne'].includes(resizeCorner)) {
        targetRect.y = resizeStartRect.y + resizeStartRect.height - minSize;
      }
      targetRect.height = minSize;
    }
    
    // Apply constraints based on what we're resizing
    if (cropMode && cropRect && underlayRect) {
      // Constrain crop rect to stay within image boundaries
      if (targetRect.x < underlayRect.x) {
        if (['nw', 'sw'].includes(resizeCorner)) {
          targetRect.width -= (underlayRect.x - targetRect.x);
        }
        targetRect.x = underlayRect.x;
      }
      
      if (targetRect.y < underlayRect.y) {
        if (['nw', 'ne'].includes(resizeCorner)) {
          targetRect.height -= (underlayRect.y - targetRect.y);
        }
        targetRect.y = underlayRect.y;
      }
      
      if (targetRect.x + targetRect.width > underlayRect.x + underlayRect.width) {
        targetRect.width = underlayRect.x + underlayRect.width - targetRect.x;
      }
      
      if (targetRect.y + targetRect.height > underlayRect.y + underlayRect.height) {
        targetRect.height = underlayRect.y + underlayRect.height - targetRect.y;
      }
      
      // Update crop rect
      setCropRect(targetRect);
    } else {
      // Constrain underlay rect to canvas boundaries
      if (targetRect.x < 0) {
        if (['nw', 'sw'].includes(resizeCorner)) {
          targetRect.width += targetRect.x;
          targetRect.x = 0;
        }
      }
      
      if (targetRect.y < 0) {
        if (['nw', 'ne'].includes(resizeCorner)) {
          targetRect.height += targetRect.y;
          targetRect.y = 0;
        }
      }
      
      if (targetRect.x + targetRect.width > canvasSize.width) {
        targetRect.width = canvasSize.width - targetRect.x;
      }
      
      if (targetRect.y + targetRect.height > canvasSize.height) {
        targetRect.height = canvasSize.height - targetRect.y;
      }
      
      // Update underlay rect
      setUnderlayRect(targetRect);
    }
  }, [resizingUnderlayRect, resizeStartPos, resizeStartRect, resizeCorner, cropMode, cropRect, underlayRect, canvasSize]);
  
  // Handle resize end
  const handleResizeEnd = useCallback(() => {
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
    
    // Determine which rect we're resizing
    const rectToResize = cropMode && cropRect ? cropRect : underlayRect;
    if (!rectToResize) return;
    
    console.log("Starting resize:", { corner, clientX: e.clientX, clientY: e.clientY });
    
    setResizingUnderlayRect(true);
    setResizeCorner(corner);
    setResizeStartPos({ x: e.clientX, y: e.clientY });
    setResizeStartRect({ ...rectToResize });
    
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  }, [cropMode, cropRect, underlayRect, handleResizeMove, handleResizeEnd]);
  
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
    
    // Handle crop rect movement or main rect movement
    if (cropMode && cropRect && underlayRect) {
      // Crop rect movement - constrain to image boundaries
      if (newRect.x < underlayRect.x) {
        newRect.x = underlayRect.x;
      }
      
      if (newRect.y < underlayRect.y) {
        newRect.y = underlayRect.y;
      }
      
      if (newRect.x + newRect.width > underlayRect.x + underlayRect.width) {
        newRect.x = underlayRect.x + underlayRect.width - newRect.width;
      }
      
      if (newRect.y + newRect.height > underlayRect.y + underlayRect.height) {
        newRect.y = underlayRect.y + underlayRect.height - newRect.height;
      }
      
      setCropRect(newRect);
    } else {
      // Boundary checks to keep rectangle within canvas
      if (newRect.x < 0) newRect.x = 0;
      if (newRect.y < 0) newRect.y = 0;
      if (newRect.x + newRect.width > canvasSize.width) {
        newRect.x = canvasSize.width - newRect.width;
      }
      if (newRect.y + newRect.height > canvasSize.height) {
        newRect.y = canvasSize.height - newRect.height;
      }
      
      // Update rectangle position
      setUnderlayRect(newRect);
    }
  }, [movingUnderlayRect, moveStartPos, moveStartRect, cropMode, cropRect, underlayRect, canvasSize]);
  
  // Handle move end
  const handleMoveEnd = useCallback(() => {
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
    
    // Determine which rect we're moving
    const rectToMove = cropMode && cropRect ? cropRect : underlayRect;
    if (!rectToMove || resizingUnderlayRect) {
      console.log("Cannot start moving:", { hasRect: !!rectToMove, isResizing: resizingUnderlayRect });
      return;
    }
    
    console.log("Starting to move rect:", { clientX: e.clientX, clientY: e.clientY });
    
    setMovingUnderlayRect(true);
    setMoveStartPos({ x: e.clientX, y: e.clientY });
    setMoveStartRect({ ...rectToMove });
    
    document.addEventListener('mousemove', handleMoveRect);
    document.addEventListener('mouseup', handleMoveEnd);
  }, [cropMode, cropRect, underlayRect, resizingUnderlayRect, handleMoveRect, handleMoveEnd]);
  
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

  // Force canvas redraw when certain parameters change
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

  return (
    <div className="flex flex-col h-full">
      <Toolbar 
        activeTool={activeTool}
        onToolChange={(tool) => {
          setActiveTool(tool);
          // Exit crop mode if switching tools
          if (tool !== "select" && cropMode) {
            setCropMode(false);
            setCropRect(null);
          }
        }}
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
          setIsImageSelected(false);
          setCropMode(false);
          setCropRect(null);
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
        isImageSelected={isImageSelected}
        setIsImageSelected={setIsImageSelected}
        cropMode={cropMode}
        toggleCropMode={toggleCropMode}
        cropRect={cropRect}
      />
    </div>
  );
};

export default Canvas;
