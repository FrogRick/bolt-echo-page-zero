
import { Tool, Shape, Point } from "@/types/canvas";

export interface DrawingState {
  isDrawing: boolean;
  currentShape: Shape | null;
  startPoint: Point | null;
  currentPoints: Point[];
}

export const useCanvasDrawingLogic = () => {
  const handleStartDrawing = (
    tool: Tool,
    point: Point,
    currentColor: string,
    fillColor: string,
    fillOpacity: number
  ): DrawingState => {
    const baseShape = {
      id: Date.now().toString(),
      strokeColor: currentColor,
      fillColor: fillColor,
      color: currentColor,
      lineWidth: 2,
    };

    switch (tool) {
      case 'line':
        return {
          isDrawing: true,
          currentShape: {
            ...baseShape,
            type: 'line',
            start: point,
            end: point,
          },
          startPoint: point,
          currentPoints: [],
        };

      case 'rectangle':
        return {
          isDrawing: true,
          currentShape: {
            ...baseShape,
            type: 'rectangle',
            start: point,
            end: point,
          },
          startPoint: point,
          currentPoints: [],
        };

      case 'circle':
        return {
          isDrawing: true,
          currentShape: {
            ...baseShape,
            type: 'circle',
            start: point,
            end: point,
            radius: 0,
          },
          startPoint: point,
          currentPoints: [],
        };

      case 'free-line':
        return {
          isDrawing: true,
          currentShape: {
            ...baseShape,
            type: 'free-line',
            points: [point],
          },
          startPoint: point,
          currentPoints: [point],
        };

      case 'text':
        return {
          isDrawing: true,
          currentShape: {
            ...baseShape,
            type: 'text',
            start: point,
            end: point,
            text: 'Sample Text',
            fontSize: 16,
          },
          startPoint: point,
          currentPoints: [],
        };

      default:
        return {
          isDrawing: false,
          currentShape: null,
          startPoint: null,
          currentPoints: [],
        };
    }
  };

  const handleDrawing = (
    tool: Tool,
    point: Point,
    drawingState: DrawingState
  ): DrawingState => {
    if (!drawingState.isDrawing || !drawingState.currentShape) {
      return drawingState;
    }

    const updatedShape = { ...drawingState.currentShape };

    switch (tool) {
      case 'line':
      case 'rectangle':
      case 'text':
        updatedShape.end = point;
        break;

      case 'circle':
        if (drawingState.startPoint) {
          const dx = point.x - drawingState.startPoint.x;
          const dy = point.y - drawingState.startPoint.y;
          const radius = Math.sqrt(dx * dx + dy * dy);
          updatedShape.end = point;
          updatedShape.radius = radius;
        }
        break;

      case 'free-line':
        if (updatedShape.points) {
          updatedShape.points = [...updatedShape.points, point];
        }
        break;
    }

    return {
      ...drawingState,
      currentShape: updatedShape,
    };
  };

  const handleEndDrawing = (
    tool: Tool,
    drawingState: DrawingState,
    shapes: Shape[]
  ): { shapes: Shape[]; drawingState: DrawingState } => {
    if (!drawingState.isDrawing || !drawingState.currentShape) {
      return {
        shapes,
        drawingState: {
          isDrawing: false,
          currentShape: null,
          startPoint: null,
          currentPoints: [],
        },
      };
    }

    // Add the completed shape to the shapes array
    const newShapes = [...shapes, drawingState.currentShape];

    return {
      shapes: newShapes,
      drawingState: {
        isDrawing: false,
        currentShape: null,
        startPoint: null,
        currentPoints: [],
      },
    };
  };

  return {
    handleStartDrawing,
    handleDrawing,
    handleEndDrawing,
  };
};
