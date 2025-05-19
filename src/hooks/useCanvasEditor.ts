
import { useRef, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { drawShapes, drawInProgressPolygon, drawPreviewLine } from '@/utils/canvasDrawing';
import { useShapeDetection } from '@/hooks/useShapeDetection';
import { Tool, Point, Shape, PreviewLine } from '@/types/canvas';

export const useCanvasEditor = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [currentColor, setCurrentColor] = useState<string>('#000000');
  const [fillColor, setFillColor] = useState<string>('#ffffff');
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [polygonPoints, setPolygonPoints] = useState<Point[]>([]);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedShape, setSelectedShape] = useState<Shape | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
  const [previewLine, setPreviewLine] = useState<PreviewLine | null>(null);

  // Import shape detection functions
  const { findShapeAtPoint } = useShapeDetection();

  // Clear the canvas and redraw all shapes
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all saved shapes
    drawShapes(ctx, shapes, selectedShape?.id || null, fillColor);

    // Draw polygon in progress
    if (activeTool === 'polygon' && polygonPoints.length > 0) {
      drawInProgressPolygon(ctx, polygonPoints, currentPoint, currentColor, fillColor);
    }

    // Draw preview line when using the line tool
    if (activeTool === 'line' && startPoint && currentPoint) {
      drawPreviewLine(ctx, startPoint, currentPoint, currentColor);
    }
    
    // Draw preview line for single click line tool
    if (previewLine) {
      drawPreviewLine(ctx, previewLine.start, previewLine.end, currentColor);
    }
  };

  // Handle mouse down event
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const point: Point = { x, y };
    
    if (activeTool === 'select') {
      handleSelectToolMouseDown(point);
    } else if (activeTool === 'line') {
      handleLineToolMouseDown(point);
    } else if (activeTool === 'rectangle') {
      handleRectangleToolMouseDown(point);
    } else if (activeTool === 'polygon') {
      handlePolygonToolMouseDown(point);
    }
  };

  // Handle mouse move event
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const point: Point = { x, y };
    
    setCurrentPoint(point);
    
    if (isDragging && selectedShape) {
      handleDragMove(point);
    } else if (activeTool === 'line' && startPoint) {
      // Update the preview line as mouse moves
      setPreviewLine({
        start: startPoint,
        end: point
      });
      redrawCanvas();
    } else if (isDrawing && activeTool === 'rectangle') {
      redrawCanvas();
    } else if (activeTool === 'polygon' && polygonPoints.length > 0) {
      // Update the current point for polygon preview
      redrawCanvas();
    }
  };

  // Handle select tool mouse down
  const handleSelectToolMouseDown = (point: Point) => {
    // Check if we clicked on a shape
    const clickedShape = findShapeAtPoint(point, shapes);
    
    if (clickedShape) {
      setSelectedShape(clickedShape);
      setIsDragging(true);
      
      if (clickedShape.type === 'rectangle') {
        setDragOffset({
          x: point.x - clickedShape.start.x,
          y: point.y - clickedShape.start.y
        });
      } else {
        setDragOffset(point);
      }
    } else {
      setSelectedShape(null);
    }
  };

  // Handle line tool mouse down
  const handleLineToolMouseDown = (point: Point) => {
    // If there's no start point, set it and show preview immediately
    if (!startPoint) {
      setStartPoint(point);
      setCurrentPoint(point);
      setPreviewLine({
        start: point,
        end: point
      });
    } else {
      // If there's already a start point, complete the line and reset
      const newLine = {
        id: uuidv4(),
        type: 'line' as const,
        start: { ...startPoint },
        end: point,
        color: currentColor
      };
      
      setShapes([...shapes, newLine]);
      setStartPoint(null);
      setPreviewLine(null);
      
      // No longer automatically switch back to select tool
    }
  };

  // Handle rectangle tool mouse down
  const handleRectangleToolMouseDown = (point: Point) => {
    setStartPoint(point);
    setIsDrawing(true);
  };

  // Handle polygon tool mouse down
  const handlePolygonToolMouseDown = (point: Point) => {
    if (polygonPoints.length === 0) {
      // First point of a new polygon
      setPolygonPoints([point]);
    } else {
      // Check if we're closing the polygon (clicking near the first point)
      const firstPoint = polygonPoints[0];
      const distance = Math.sqrt(Math.pow(point.x - firstPoint.x, 2) + Math.pow(point.y - firstPoint.y, 2));
      
      if (polygonPoints.length > 2 && distance < 10) {
        // Close the polygon and save it
        const newPolygon = {
          id: uuidv4(),
          type: 'polygon' as const,
          points: [...polygonPoints],
          color: currentColor,
          fillColor: fillColor
        };
        
        setShapes([...shapes, newPolygon]);
        setPolygonPoints([]);
      } else {
        // Add a new point to the polygon
        setPolygonPoints([...polygonPoints, point]);
      }
    }
  };

  // Handle dragging shapes
  const handleDragMove = (point: Point) => {
    if (!selectedShape) return;

    const updatedShapes = shapes.map(shape => {
      if (shape.id === selectedShape.id) {
        if (shape.type === 'line') {
          const dx = point.x - dragOffset.x;
          const dy = point.y - dragOffset.y;
          const originalDx = shape.end.x - shape.start.x;
          const originalDy = shape.end.y - shape.start.y;
          
          return {
            ...shape,
            start: { x: dx, y: dy },
            end: { x: dx + originalDx, y: dy + originalDy }
          };
        } else if (shape.type === 'rectangle') {
          return {
            ...shape,
            start: { 
              x: point.x - dragOffset.x, 
              y: point.y - dragOffset.y 
            },
            end: {
              x: point.x - dragOffset.x + (shape.end.x - shape.start.x),
              y: point.y - dragOffset.y + (shape.end.y - shape.start.y)
            }
          };
        } else if (shape.type === 'polygon') {
          // Move all points of the polygon
          const dx = point.x - dragOffset.x;
          const dy = point.y - dragOffset.y;
          dragOffset.x = point.x;
          dragOffset.y = point.y;
          
          return {
            ...shape,
            points: shape.points.map(point => ({
              x: point.x + dx,
              y: point.y + dy
            }))
          };
        }
      }
      return shape;
    });
    
    setShapes(updatedShapes);
    setSelectedShape(updatedShapes.find(shape => shape.id === selectedShape.id) || null);
  };

  // Handle mouse up event
  const endDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const point: Point = { x, y };
    
    if (activeTool === 'rectangle' && startPoint) {
      // Complete rectangle on mouse up
      const newRectangle = {
        id: uuidv4(),
        type: 'rectangle' as const,
        start: { ...startPoint },
        end: point,
        color: currentColor,
        fillColor: fillColor
      };
      
      setShapes([...shapes, newRectangle]);
      setIsDrawing(false);
      setStartPoint(null);
    }
    
    setIsDragging(false);
  };

  // Handle canvas click for single click operations
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // This is now empty as the clicks are handled directly in startDrawing
  };

  // Delete selected shape
  const deleteSelected = () => {
    if (selectedShape) {
      setShapes(shapes.filter(shape => shape.id !== selectedShape.id));
      setSelectedShape(null);
    }
  };

  // Clear the canvas
  const clearCanvas = () => {
    setShapes([]);
    setSelectedShape(null);
    setPolygonPoints([]);
    setStartPoint(null);
    setCurrentPoint(null);
    setIsDrawing(false);
    setPreviewLine(null);
  };

  // Redraw the canvas whenever shapes or selected shapes change
  useEffect(() => {
    redrawCanvas();
  }, [
    shapes,
    selectedShape,
    polygonPoints,
    activeTool,
    startPoint,
    currentPoint,
    previewLine
  ]);
  
  return {
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
  };
};
