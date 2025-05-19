
import React, { useEffect } from "react";
import { useCanvasEditor } from "@/hooks/useCanvasEditor";
import { Toolbar } from "./Toolbar";
import { Tool } from "@/types/canvas";

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
    handleCanvasClick
  } = useCanvasEditor();
  
  // Initialize canvas with correct dimensions
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = canvasSize.width;
      canvasRef.current.height = canvasSize.height;
    }
  }, [canvasSize]);

  return (
    <div className="flex flex-col h-full">
      <Toolbar 
        activeTool={activeTool as Tool}
        onToolChange={setActiveTool}
        onDelete={deleteSelected}
        onClear={clearCanvas}
      />
      
      <div className="p-2 bg-white border-b flex items-center gap-4">
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
            onClick={handleCanvasClick}
            className={`bg-white border border-gray-200 ${
              activeTool === "select" 
                ? "cursor-default" 
                : "cursor-crosshair" 
            }`}
          />
        </div>
      </div>
    </div>
  );
};

export default Canvas;
