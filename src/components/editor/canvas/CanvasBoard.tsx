
import React from "react";
import { Tool } from "@/types/canvas";

interface CanvasBoardProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  activeTool: Tool;
  canvasSize: { width: number; height: number };
  startDrawing: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  draw: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  endDrawing: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  underlayImage: HTMLImageElement | null;
}

export const CanvasBoard: React.FC<CanvasBoardProps> = ({
  canvasRef,
  activeTool,
  canvasSize,
  startDrawing,
  draw,
  endDrawing,
  underlayImage,
}) => {
  return (
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
  );
};
