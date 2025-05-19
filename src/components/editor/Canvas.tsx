
import React, { useEffect } from "react";
import { useCanvasEditor } from "@/hooks/useCanvasEditor";
import { Tool } from "@/types/canvas";
import { Toolbar } from "./Toolbar";

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
    rectangleDrawMode,
    toggleRectangleDrawMode
  } = useCanvasEditor();

  // Force canvas redraw when tool or styling changes to ensure correct rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Force a clean redraw by clearing and triggering the redraw in useCanvasEditor
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setTimeout(() => {
          // This will trigger the redraw effect in useCanvasEditor
          setActiveTool(activeTool);
        }, 0);
      }
    }
  }, [activeTool, rectangleDrawMode, currentColor, fillColor, snapToAngle, snapToEndpoints, snapToLines]); 
  // Added all snap settings to the dependency array to ensure proper redrawing

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
        
        <div className="flex items-center gap-2 ml-4">
          <label className="inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={snapToAngle} 
              onChange={toggleSnapToAngle}
              className="sr-only peer"
            />
            <div className="relative w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            <span className="ml-2 text-sm font-medium">Snap to 45°</span>
          </label>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={snapToEndpoints} 
              onChange={toggleSnapToEndpoints}
              className="sr-only peer"
            />
            <div className="relative w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            <span className="ml-2 text-sm font-medium">Snap to endpoints</span>
          </label>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={snapToLines} 
              onChange={toggleSnapToLines}
              className="sr-only peer"
            />
            <div className="relative w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            <span className="ml-2 text-sm font-medium">Snap to lines</span>
          </label>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={rectangleDrawMode === 'click'}
              onChange={toggleRectangleDrawMode}
              className="sr-only peer"
            />
            <div className="relative w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            <span className="ml-2 text-sm font-medium">Rectangle Click Mode</span>
          </label>
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
                : activeTool === "line" || activeTool === "polygon"
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
