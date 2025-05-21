
import React, { useEffect, useState } from "react";
import { useCanvasEditor } from "@/hooks/useCanvasEditor";
import { Tool } from "@/types/canvas";
import { Toolbar } from "./Toolbar";
import { Toggle } from "@/components/ui/toggle";

const Canvas: React.FC = () => {
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
    snapToAngle,
    toggleSnapToAngle,
    snapToEndpoints,
    toggleSnapToEndpoints,
    snapToLines,
    toggleSnapToLines,
    snapToExtensions,
    toggleSnapToExtensions,
    rectangleDrawMode
  } = useCanvasEditor();

  // Force canvas redraw when tool or styling changes to ensure correct rendering
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
      
      <div className="p-2 bg-white border-b flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label htmlFor="colorPicker" className="text-sm font-medium">Stroke:</label>
          <input
            id="colorPicker"
            type="color"
            value={currentColor}
            onChange={(e) => setCurrentColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="fillColorPicker" className="text-sm font-medium">Fill:</label>
          <input
            id="fillColorPicker"
            type="color"
            value={fillColor}
            onChange={(e) => setFillColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer"
          />
        </div>
        
        <div className="border-l pl-4 flex items-center gap-3">
          <Toggle 
            pressed={snapToEndpoints} 
            onPressedChange={toggleSnapToEndpoints}
            aria-label="Toggle snap to endpoints"
            className="data-[state=on]:bg-blue-500 data-[state=on]:text-white"
          >
            <span className="text-sm">Snap</span>
          </Toggle>
          
          <Toggle 
            pressed={snapToExtensions} 
            onPressedChange={toggleSnapToExtensions}
            aria-label="Toggle snap to extensions"
            className="data-[state=on]:bg-blue-500 data-[state=on]:text-white"
          >
            <span className="text-sm">Extension</span>
          </Toggle>
          
          <Toggle 
            pressed={snapToAngle} 
            onPressedChange={toggleSnapToAngle}
            aria-label="Toggle snap to 45 degree angles"
            className="data-[state=on]:bg-blue-500 data-[state=on]:text-white"
          >
            <span className="text-sm">45°</span>
          </Toggle>
        </div>
      </div>
      
      <div className="flex-grow flex items-center justify-center bg-gray-50 overflow-auto p-4">
        <div className="relative shadow-xl">
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={endDrawing}
            onMouseLeave={endDrawing}
            className={`bg-white border border-gray-200 ${
              activeTool === "select" 
                ? "cursor-default" 
                : (activeTool === "wall" || activeTool === "wall-polygon" || activeTool === "yellow-polygon" || activeTool === "green-polygon")
                  ? "cursor-crosshair" 
                  : "cursor-crosshair"
            }`}
          />
        </div>
      </div>
    </div>
  );
};

export default Canvas;
