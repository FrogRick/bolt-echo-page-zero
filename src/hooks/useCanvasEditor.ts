import { useRef, useState, useEffect } from 'react';
import { drawShapes, drawInProgressPolygon, drawPreviewLine, lineSnappingHelpers } from '@/utils/canvasDrawing';
import { useShapeDetection } from '@/hooks/useShapeDetection';
import { Tool, Point, Shape, PreviewLine } from '@/types/canvas';
import { generateId } from '@/utils/idGenerator';

export const useCanvasEditor = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [currentColor, setCurrentColor] = useState<string>('#000000');
  const [fillColor, setFillColor] = useState<string>('#FFFBCC'); // Light yellow
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
  const [mouseMoved, setMouseMoved] = useState(false);
  
  // Rectangle drawing mode: 'click' for click-release-click or 'drag' for click-drag-release
  const [rectangleDrawMode, setRectangleDrawMode] = useState<'click' | 'drag'>('click');
  
  // New state for snapping controls
  const [snapToAngle, setSnapToAngle] = useState<boolean>(true);
  const [snapToEndpoints, setSnapToEndpoints] = useState<boolean>(true);
  const [snapDistance, setSnapDistance] = useState<number>(10); // Pixels
  
  // Add a state for line-to-line snapping
  const [snapToLines, setSnapToLines] = useState<boolean>(true);

  // Import shape detection functions
  const { findShapeAtPoint } = useShapeDetection();

  // Function to cancel the current drawing operation
  const cancelDrawing = () => {
    if ((activeTool === 'wall' || activeTool === 'wall-alt') && startPoint) {
      // Cancel wall drawing - clear the start point
      setStartPoint(null);
      setPreviewLine(null);
      setIsDrawing(false);
    } else if ((activeTool === 'yellow-rectangle' || activeTool === 'yellow-rectangle-alt')) {
      // Cancel rectangle drawing - clear the start point
      if (rectangleDrawMode === 'click' && startPoint) {
        setStartPoint(null);
        setCurrentPoint(null);
      }
      setIsDrawing(false);
    } else if ((activeTool === 'yellow-polygon' || activeTool === 'yellow-polygon-alt') && polygonPoints.length > 0) {
      // Cancel polygon drawing - clear all polygon points
      setPolygonPoints([]);
    }
    // Force redraw of the canvas to remove any in-progress elements
    redrawCanvas();
  };

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

    // Draw preview line when using the line tool - only if we have a start and current point
    if (activeTool === 'line' && startPoint && currentPoint) {
      // Get the snapped point for preview
      let endPoint = currentPoint;
      
      // First check if we should snap to an existing line
      if (snapToLines) {
        const lineSnap = lineSnappingHelpers.findNearestPointOnAnyLine(currentPoint, shapes);
        if (lineSnap) {
          endPoint = lineSnap.point;
        }
      }
      
      // Then check endpoint snapping (takes priority over line snapping)
      const snappedToEndpoint = findNearestEndpoint(endPoint);
      if (snappedToEndpoint) {
        endPoint = snappedToEndpoint;
      } else if (snapToAngle) {
        // If not snapped to endpoint, try angle snapping
        endPoint = snapAngleToGrid(startPoint, endPoint);
      }
      
      // Draw only one line - the snapped one
      drawPreviewLine(ctx, startPoint, endPoint, currentColor);
    }
    
    // Draw preview line for single click line tool if previewLine exists
    else if (previewLine) {
      drawPreviewLine(ctx, previewLine.start, previewLine.end, currentColor);
    }
    
    // Draw preview rectangle if we're in click mode and have a start point
    if (activeTool === 'rectangle' && rectangleDrawMode === 'click' && startPoint && currentPoint) {
      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.rect(
        startPoint.x,
        startPoint.y,
        currentPoint.x - startPoint.x,
        currentPoint.y - startPoint.y
      );
      ctx.fill();
    }
  };

  // Function to snap angle to nearest 45 degrees if within threshold
  const snapAngleToGrid = (startPoint: Point, endPoint: Point): Point => {
    if (!snapToAngle) return endPoint;

    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    
    // Calculate angle in radians and convert to degrees
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    // Determine nearest 45 degree increment
    const snapAngle = Math.round(angle / 45) * 45;
    
    // Check if we're within the threshold (5 degrees) of a 45-degree increment - stricter threshold
    const angleDiff = Math.abs((angle % 45) - 45) % 45;
    const shouldSnap = angleDiff < 5 || angleDiff > 40; // Much stricter threshold - within 5 degrees of a 45 degree angle
    
    if (!shouldSnap) return endPoint;
    
    // Convert back to radians
    const snapRadians = snapAngle * (Math.PI / 180);
    
    // Calculate distance
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate new endpoint
    return {
      x: startPoint.x + distance * Math.cos(snapRadians),
      y: startPoint.y + distance * Math.sin(snapRadians)
    };
  };

  // Function to find nearest endpoint to snap to
  const findNearestEndpoint = (point: Point): Point | null => {
    if (!snapToEndpoints) return null;
    
    let closestPoint: Point | null = null;
    let minDistance = snapDistance;
    
    shapes.forEach(shape => {
      if (shape.type === 'line') {
        // Check distance to start point
        const distToStart = Math.sqrt(
          Math.pow(shape.start.x - point.x, 2) + 
          Math.pow(shape.start.y - point.y, 2)
        );
        if (distToStart < minDistance) {
          minDistance = distToStart;
          closestPoint = { ...shape.start };
        }
        
        // Check distance to end point
        const distToEnd = Math.sqrt(
          Math.pow(shape.end.x - point.x, 2) + 
          Math.pow(shape.end.y - point.y, 2)
        );
        if (distToEnd < minDistance) {
          minDistance = distToEnd;
          closestPoint = { ...shape.end };
        }
      }
      // Add support for rectangle and polygon endpoints if needed
    });
    
    return closestPoint;
  };

  // Complete the polygon drawing and save it
  const completePolygon = () => {
    if (polygonPoints.length < 3) {
      // Need at least 3 points to form a polygon
      setPolygonPoints([]);
      return;
    }
    
    const newPolygon = {
      id: generateId(),
      type: 'polygon' as const,
      points: [...polygonPoints],
      color: 'transparent', // Make the border transparent
      fillColor: fillColor
    };
    
    setShapes([...shapes, newPolygon]);
    setPolygonPoints([]);
  };

  // Handle mouse down event
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const point: Point = { x, y };
    setMouseMoved(false);
    
    if (activeTool === 'select') {
      handleSelectToolMouseDown(point);
    } else if (activeTool === 'wall' || activeTool === 'wall-alt') {
      // Apply both endpoint and line snapping before starting to draw
      let snappedPoint = point;
      
      // First check if we can snap to a line
      if (snapToLines) {
        const lineSnap = lineSnappingHelpers.findNearestPointOnAnyLine(point, shapes);
        if (lineSnap) {
          snappedPoint = lineSnap.point;
        }
      }
      
      // Then check endpoint snapping (this takes priority)
      const endpointSnap = findNearestEndpoint(snappedPoint);
      if (endpointSnap) {
        snappedPoint = endpointSnap;
      }
      
      // Use click-point-click mode exclusively for lines
      handleLineToolClick(snappedPoint);
    } else if (activeTool === 'yellow-rectangle' || activeTool === 'yellow-rectangle-alt') {
      if (rectangleDrawMode === 'click') {
        // In click mode, first click sets start point, second click completes
        if (!startPoint) {
          setStartPoint(point);
          setCurrentPoint(point);
        } else {
          // Complete the rectangle on second click
          const newRectangle = {
            id: generateId(),
            type: 'rectangle' as const,
            start: { ...startPoint },
            end: point,
            color: 'transparent',
            fillColor: fillColor
          };
          
          setShapes([...shapes, newRectangle]);
          setStartPoint(null);
          setCurrentPoint(null);
        }
      } else {
        // Traditional drag mode
        handleRectangleToolMouseDown(point);
      }
    } else if (activeTool === 'yellow-polygon' || activeTool === 'yellow-polygon-alt') {
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
    } else if ((activeTool === 'wall' || activeTool === 'wall-alt') && startPoint) {
      // Update the current point for line preview
      redrawCanvas();
    } else if (isDrawing && (activeTool === 'yellow-rectangle' || activeTool === 'yellow-rectangle-alt') && rectangleDrawMode === 'drag') {
      redrawCanvas();
    } else if ((activeTool === 'yellow-rectangle' || activeTool === 'yellow-rectangle-alt') && rectangleDrawMode === 'click' && startPoint) {
      // Update preview for click mode rectangle
      redrawCanvas();
    } else if ((activeTool === 'yellow-polygon' || activeTool === 'yellow-polygon-alt') && polygonPoints.length > 0) {
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

  // Handle line tool mouse down - exclusively click-point-click mode
  const handleLineToolClick = (point: Point) => {
    // If there's no start point, set it
    if (!startPoint) {
      setStartPoint(point);
      setCurrentPoint(point);
    } else {
      // Complete the line on second click
      completeLine(point);
    }
  };

  // Extract line completion logic for reuse
  const completeLine = (endPoint: Point) => {
    if (!startPoint) return;

    // First check if we can snap to a line
    let finalEndpoint = endPoint;
    
    if (snapToLines) {
      const lineSnap = lineSnappingHelpers.findNearestPointOnAnyLine(endPoint, shapes);
      if (lineSnap) {
        finalEndpoint = lineSnap.point;
      }
    }
    
    // Apply endpoint snapping for the final point if needed (takes priority)
    const snappedEndpoint = findNearestEndpoint(finalEndpoint);
    if (snappedEndpoint) {
      finalEndpoint = snappedEndpoint;
    } 
    // Apply angle snapping if not snapped to endpoint or line
    else if (snapToAngle && finalEndpoint === endPoint) { 
      finalEndpoint = snapAngleToGrid(startPoint, endPoint);
    }

    const newLine = {
      id: generateId(),
      type: 'line' as const,
      start: { ...startPoint },
      end: finalEndpoint,
      color: currentColor,
      lineWidth: 8, // Make the line thicker
      strokeColor: '#000000' // Black border color
    };
    
    setShapes([...shapes, newLine]);
    setStartPoint(null);
    setPreviewLine(null);
    setIsDrawing(false);
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
        completePolygon();
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
    
    if ((activeTool === 'yellow-rectangle' || activeTool === 'yellow-rectangle-alt') && rectangleDrawMode === 'drag' && startPoint) {
      // Complete rectangle on mouse up with no border
      const newRectangle = {
        id: generateId(),
        type: 'rectangle' as const,
        start: { ...startPoint },
        end: point,
        color: 'transparent', // Make the border transparent
        fillColor: fillColor
      };
      
      setShapes([...shapes, newRectangle]);
      setIsDrawing(false);
      setStartPoint(null);
    }
    
    setIsDragging(false);
    setMouseMoved(false);
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

  // Toggle snap to angle
  const toggleSnapToAngle = () => {
    setSnapToAngle(!snapToAngle);
  };

  // Toggle snap to endpoints
  const toggleSnapToEndpoints = () => {
    setSnapToEndpoints(!snapToEndpoints);
  };
  
  // Toggle snap to lines
  const toggleSnapToLines = () => {
    setSnapToLines(!snapToLines);
  };

  // Toggle rectangle drawing mode
  const toggleRectangleDrawMode = () => {
    setRectangleDrawMode(rectangleDrawMode === 'click' ? 'drag' : 'click');
  };

  // Handle keyboard events for polygon escape and enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If escape key is pressed, cancel the current drawing operation
      if (e.key === 'Escape') {
        cancelDrawing();
        return;
      }
      
      // If we're in polygon drawing mode with at least 3 points
      if ((activeTool === 'yellow-polygon' || activeTool === 'yellow-polygon-alt') && polygonPoints.length >= 3) {
        if (e.key === 'Enter') {
          // Close the polygon on Enter
          completePolygon();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTool, polygonPoints, startPoint, rectangleDrawMode]);

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
    snapToAngle,
    toggleSnapToAngle,
    snapToEndpoints,
    toggleSnapToEndpoints,
    snapToLines,
    toggleSnapToLines,
    rectangleDrawMode,
    toggleRectangleDrawMode
  };
};
