
import React, { useState, useEffect } from "react";
import { useCanvasEditor } from "@/hooks/useCanvasEditor";
import { Toolbar } from "./Toolbar";
import { CanvasContainer } from "./canvas/CanvasContainer";
import { CanvasToolbar } from "./canvas/CanvasToolbar";
import { INITIAL_SCALE_FACTOR, A3_SIZE } from "./canvas/constants";

const Canvas: React.FC = () => {
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [scaleFactor, setScaleFactor] = useState(INITIAL_SCALE_FACTOR);
  
  const {
    activeTool,
    setActiveTool,
    currentColor,
    setCurrentColor,
    fillColor,
    setFillColor,
    deleteSelected,
    clearCanvas,
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
  
  // Handle orientation change
  const handleOrientationChange = (value: string) => {
    setOrientation(value as "portrait" | "landscape");
    updateCanvasSize(value as "portrait" | "landscape");
  };
  
  // Update canvas size based on orientation and scale factor
  const updateCanvasSize = (orient: "portrait" | "landscape", scale = scaleFactor) => {
    if (orient === "portrait") {
      adjustCanvasSize(
        Math.round(A3_SIZE.width * scale),
        Math.round(A3_SIZE.height * scale)
      );
    } else {
      adjustCanvasSize(
        Math.round(A3_SIZE.height * scale),
        Math.round(A3_SIZE.width * scale)
      );
    }
  };

  // Initialize canvas size
  useEffect(() => {
    updateCanvasSize(orientation);
  }, [scaleFactor]);

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
        handleOrientationChange={handleOrientationChange}
        snapToEndpoints={snapToEndpoints}
        toggleSnapToEndpoints={toggleSnapToEndpoints}
        snapToLines={snapToLines}
        toggleSnapToLines={toggleSnapToLines}
        snapToAngle={snapToAngle}
        toggleSnapToAngle={toggleSnapToAngle}
        snapToExtensions={snapToExtensions}
        toggleSnapToExtensions={toggleSnapToExtensions}
        underlayImage={underlayImage}
        addUnderlayImage={addUnderlayImage}
        removeUnderlayImage={removeUnderlayImage}
        underlayScale={underlayScale}
        adjustUnderlayScale={adjustUnderlayScale}
        underlayOpacity={underlayOpacity}
        adjustUnderlayOpacity={adjustUnderlayOpacity}
      />
      
      <CanvasContainer 
        orientation={orientation}
        scaleFactor={scaleFactor}
        setScaleFactor={setScaleFactor}
        updateCanvasSize={updateCanvasSize}
      />
    </div>
  );
};

export default Canvas;
