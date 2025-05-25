
import { useState } from "react";
import { Tool, Shape, Point } from "@/types/canvas";

export interface DrawingState {
  isDrawing: boolean;
  currentShape: Shape | null;
  startPoint: Point | null;
  currentPoints: Point[];
  polygonPoints?: Point[];
  isPolygonMode?: boolean;
}

export const useCanvasDrawingLogic = () => {
  const handleStartDrawing = (
    tool: Tool,
    point: Point,
    strokeColor: string,
    fillColor: string,
    fillOpacity: number,
    strokeWidth: number
  ): DrawingState => {
    
    // Handle polygon tools (wall-polygon, yellow-polygon, green-polygon)
    if (tool.includes('polygon')) {
      return {
        isDrawing: true,
        currentShape: null,
        startPoint: point,
        currentPoints: [],
        polygonPoints: [point],
        isPolygonMode: true
      };
    }
    
    // Handle other drawing tools
    const newShape: Shape = {
      id: crypto.randomUUID(),
      type: getShapeType(tool),
      start: point,
      strokeColor: strokeColor,
      fillColor: getFillColorForTool(tool, fillColor),
      lineWidth: strokeWidth,
    };

    // For tools that need an end point
    if (['line', 'rectangle', 'circle', 'wall'].includes(tool)) {
      newShape.end = point;
    }

    // For circle, set initial radius
    if (tool === 'circle') {
      newShape.radius = 0;
    }

    // For free-line, initialize points array
    if (tool === 'free-line') {
      newShape.points = [point];
    }

    return {
      isDrawing: true,
      currentShape: newShape,
      startPoint: point,
      currentPoints: tool === 'free-line' ? [point] : [],
      isPolygonMode: false
    };
  };

  const handleDrawing = (
    tool: Tool,
    point: Point,
    drawingState: DrawingState
  ): DrawingState => {
    if (!drawingState.isDrawing) return drawingState;

    // Handle polygon mode
    if (drawingState.isPolygonMode && drawingState.polygonPoints) {
      return {
        ...drawingState,
        currentPoints: [...drawingState.polygonPoints, point]
      };
    }

    // Handle current shape drawing
    if (!drawingState.currentShape) return drawingState;

    const updatedShape = { ...drawingState.currentShape };

    if (tool === 'free-line') {
      updatedShape.points = [...(drawingState.currentPoints || []), point];
      return {
        ...drawingState,
        currentShape: updatedShape,
        currentPoints: updatedShape.points
      };
    }

    // For other tools, update end point
    updatedShape.end = point;

    // For circle, calculate radius
    if (tool === 'circle' && updatedShape.start) {
      const dx = point.x - updatedShape.start.x;
      const dy = point.y - updatedShape.start.y;
      updatedShape.radius = Math.sqrt(dx * dx + dy * dy);
    }

    return {
      ...drawingState,
      currentShape: updatedShape
    };
  };

  const handleEndDrawing = (
    tool: Tool,
    drawingState: DrawingState,
    existingShapes: Shape[]
  ): { shapes: Shape[], drawingState: DrawingState } => {
    if (!drawingState.isDrawing) {
      return { shapes: existingShapes, drawingState };
    }

    // Handle polygon mode - don't end on single click, wait for double-click or Enter
    if (drawingState.isPolygonMode) {
      return { shapes: existingShapes, drawingState };
    }

    // Add completed shape to shapes array
    if (drawingState.currentShape) {
      const newShapes = [...existingShapes, drawingState.currentShape];
      
      return {
        shapes: newShapes,
        drawingState: {
          isDrawing: false,
          currentShape: null,
          startPoint: null,
          currentPoints: [],
          isPolygonMode: false
        }
      };
    }

    return {
      shapes: existingShapes,
      drawingState: {
        isDrawing: false,
        currentShape: null,
        startPoint: null,
        currentPoints: [],
        isPolygonMode: false
      }
    };
  };

  const handlePolygonPoint = (
    tool: Tool,
    point: Point,
    drawingState: DrawingState
  ): DrawingState => {
    if (!drawingState.isPolygonMode || !drawingState.polygonPoints) {
      return drawingState;
    }

    const newPolygonPoints = [...drawingState.polygonPoints, point];
    
    return {
      ...drawingState,
      polygonPoints: newPolygonPoints,
      currentPoints: newPolygonPoints
    };
  };

  const finishPolygon = (
    tool: Tool,
    drawingState: DrawingState,
    existingShapes: Shape[],
    strokeColor: string,
    fillColor: string,
    strokeWidth: number
  ): { shapes: Shape[], drawingState: DrawingState } => {
    if (!drawingState.isPolygonMode || !drawingState.polygonPoints || drawingState.polygonPoints.length < 3) {
      return { shapes: existingShapes, drawingState };
    }

    const newShape: Shape = {
      id: crypto.randomUUID(),
      type: 'polygon',
      points: drawingState.polygonPoints,
      strokeColor: strokeColor,
      fillColor: getFillColorForTool(tool, fillColor),
      lineWidth: strokeWidth,
    };

    const newShapes = [...existingShapes, newShape];
    
    return {
      shapes: newShapes,
      drawingState: {
        isDrawing: false,
        currentShape: null,
        startPoint: null,
        currentPoints: [],
        polygonPoints: [],
        isPolygonMode: false
      }
    };
  };

  return {
    handleStartDrawing,
    handleDrawing,
    handleEndDrawing,
    handlePolygonPoint,
    finishPolygon
  };
};

// Helper functions
const getShapeType = (tool: Tool): Shape['type'] => {
  switch (tool) {
    case 'wall':
    case 'line':
      return 'line';
    case 'rectangle':
    case 'yellow-rectangle':
    case 'green-rectangle':
      return 'rectangle';
    case 'circle':
      return 'circle';
    case 'free-line':
      return 'free-line';
    case 'text':
      return 'text';
    case 'wall-polygon':
    case 'yellow-polygon':
    case 'green-polygon':
      return 'polygon';
    default:
      return 'line';
  }
};

const getFillColorForTool = (tool: Tool, defaultFillColor: string): string => {
  switch (tool) {
    case 'yellow-rectangle':
    case 'yellow-polygon':
      return '#fbbf24'; // Yellow
    case 'green-rectangle':
    case 'green-polygon':
      return '#10b981'; // Green
    case 'wall':
    case 'wall-polygon':
      return '#6b7280'; // Gray for walls
    default:
      return defaultFillColor;
  }
};
