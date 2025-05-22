
import React, { useRef, useEffect, useState } from "react";
import { CanvasBoard } from "./CanvasBoard";
import { useCanvasEditor } from "@/hooks/useCanvasEditor";
import { INITIAL_SCALE_FACTOR, A3_SIZE } from "./constants";

interface CanvasContainerProps {
  orientation: "portrait" | "landscape";
  scaleFactor: number;
  setScaleFactor: (scale: number) => void;
  updateCanvasSize: (orient: "portrait" | "landscape", scale?: number) => void;
}

export const CanvasContainer: React.FC<CanvasContainerProps> = ({
  orientation,
  scaleFactor,
  setScaleFactor,
  updateCanvasSize
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    canvasRef,
    activeTool,
    startDrawing,
    draw,
    endDrawing,
    canvasSize,
    underlayImage,
  } = useCanvasEditor();

  // Calculate the appropriate scale factor based on container size
  const calculateScaleFactor = () => {
    if (!containerRef.current) return INITIAL_SCALE_FACTOR;
    
    const containerWidth = containerRef.current.clientWidth - 32; // Subtract padding
    const containerHeight = containerRef.current.clientHeight - 20; // Adjusted for top and bottom margins of 10px each
    
    let width = A3_SIZE.width;
    let height = A3_SIZE.height;
    
    if (orientation === "landscape") {
      width = A3_SIZE.height;
      height = A3_SIZE.width;
    }
    
    // Calculate scaling factors for width and height
    const widthScale = containerWidth / width;
    const heightScale = containerHeight / height;
    
    // Use the smaller scale to ensure the canvas fits within container
    const newScaleFactor = Math.min(widthScale, heightScale) * 0.95; // 95% of available space
    
    return Math.max(1, Math.min(newScaleFactor, 4)); // Limit between 1 and 4
  };
  
  // Update container size on window resize
  useEffect(() => {
    const handleResize = () => {
      const newScaleFactor = calculateScaleFactor();
      setScaleFactor(newScaleFactor);
      updateCanvasSize(orientation, newScaleFactor);
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Calculate on mount
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [orientation, containerRef.current, setScaleFactor, updateCanvasSize]);

  return (
    <div 
      ref={containerRef} 
      className="flex-grow flex items-center justify-center bg-gray-50 overflow-auto"
      style={{ 
        height: "100%",
        paddingTop: "10px", // 10px top margin
        paddingBottom: "10px" // Matching 10px bottom margin
      }}
    >
      <div className="flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          className={`bg-white border border-gray-200 rounded-lg shadow-md ${
            activeTool === "select" 
              ? (underlayImage ? "cursor-move" : "cursor-default")
              : (activeTool === "wall" || activeTool === "wall-polygon" || activeTool === "yellow-polygon" || activeTool === "green-polygon")
                ? "cursor-crosshair" 
                : "cursor-crosshair"
          }`}
        />
      </div>
    </div>
  );
};
