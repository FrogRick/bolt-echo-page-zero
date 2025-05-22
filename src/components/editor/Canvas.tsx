import React, { useEffect, useState, useRef } from "react";
import { useCanvasEditor } from "@/hooks/useCanvasEditor";
import { Tool } from "@/types/canvas";
import { Toolbar } from "./Toolbar";
import CanvasToolbar from "./CanvasToolbar";
import CanvasContainer from "./CanvasContainer";
import { calculateScaleFactor, calculateCanvasSize, INITIAL_SCALE_FACTOR } from "./CanvasUtils";

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
    }
  }, [underlayImage, underlayRect, canvasSize]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      addUnderlayImage(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleUnderlayRectClick = () => {
    if (!underlayImage) {
      handleUploadClick();
    }
  };
  
  // Handle starting rectangle resize
  const startResizingUnderlayRect = (corner: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!underlayRect) return;
    
    setResizingUnderlayRect(true);
    setResizeCorner(corner);
    setResizeStartPos({ x: e.clientX, y: e.clientY });
    setResizeStartRect({ ...underlayRect });
    
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };
  
  // Handle resize movement
  const handleResizeMove = (e: MouseEvent) => {
    if (!resizingUnderlayRect || !resizeStartPos || !resizeStartRect || !resizeCorner) return;
    
    const deltaX = e.clientX - resizeStartPos.x;
    const deltaY = e.clientY - resizeStartPos.y;
    
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
    
    // Update rectangle
    setUnderlayRect(newRect);
  };
  
  const handleResizeEnd = () => {
    setResizingUnderlayRect(false);
    setResizeCorner(null);
    setResizeStartPos(null);
    setResizeStartRect(null);
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  };
  
  // Handle starting rectangle movement
  const startMovingUnderlayRect = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!underlayRect || resizingUnderlayRect) return;
    
    setMovingUnderlayRect(true);
    setMoveStartPos({ x: e.clientX, y: e.clientY });
    setMoveStartRect({ ...underlayRect });
    
    document.addEventListener('mousemove', handleMoveRect);
    document.addEventListener('mouseup', handleMoveEnd);
  };
  
  // Handle rectangle movement
  const handleMoveRect = (e: MouseEvent) => {
    if (!movingUnderlayRect || !moveStartPos || !moveStartRect) return;
    
    const deltaX = e.clientX - moveStartPos.x;
    const deltaY = e.clientY - moveStartPos.y;
    
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
    
    // Update rectangle position
    setUnderlayRect(newRect);
  };
  
  const handleMoveEnd = () => {
    setMovingUnderlayRect(false);
    setMoveStartPos(null);
    setMoveStartRect(null);
    document.removeEventListener('mousemove', handleMoveRect);
    document.removeEventListener('mouseup', handleMoveEnd);
  };
  
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

  // Clean up event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.removeEventListener('mousemove', handleMoveRect);
      document.removeEventListener('mouseup', handleMoveEnd);
    };
  }, []);

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
