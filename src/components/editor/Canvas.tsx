
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      addUnderlayImage(e.target.files[0]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
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
        underlayImage={underlayImage}
        removeUnderlayImage={removeUnderlayImage}
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
      />
    </div>
  );
};

export default Canvas;
