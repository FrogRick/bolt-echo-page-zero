
import { useRef, useState, useEffect } from 'react';
import { drawShapes, drawInProgressPolygon, drawPreviewLine } from '@/utils/canvasDrawing';
import { useShapeDetection } from '@/hooks/useShapeDetection';
import { Tool, Point, Shape, PreviewLine } from '@/types/canvas';
import { generateId } from '@/utils/idGenerator';

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
  const [lineDrawMode, setLineDrawMode] = useState<'click' | 'drag'>('click');
  const [mouseMoved, setMouseMoved] = useState(false);
  
  // New state for snapping controls
  const [snapToAngle, setSnapToAngle] = useState<boolean>(true);
  const [snapToEndpoints, setSnapToEndpoints] = useState<boolean>(true);
  const [snapDistance, setSnapDistance] = useState<number>(10); // Pixels
  // Track connected lines for continuous rendering
  const [connectedLines, setConnectedLines] = useState<Map<string, string[]>>(new Map());

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

    // Draw preview line when using the line tool - only if we have a start and current point
    if (activeTool === 'line' && startPoint && currentPoint) {
      // Get the snapped point for preview
      let endPoint = currentPoint;
      
      // First check endpoint snapping
      const snappedToEndpoint = findNearestEndpoint(currentPoint);
      if (snappedToEndpoint) {
        endPoint = snappedToEndpoint;
      } else if (snapToAngle) {
        // If not snapped to endpoint, try angle snapping
        endPoint = snapAngleToGrid(startPoint, currentPoint);
      }
      
      // Draw only one line - the snapped one
      drawPreviewLine(ctx, startPoint, endPoint, currentColor);
    }
    
    // Draw preview line for single click line tool if previewLine exists
    else if (previewLine) {
      drawPreviewLine(ctx, previewLine.start, previewLine.end, currentColor);
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
    
    // Check if we're within the threshold (15 degrees) of a 45-degree increment
    const angleDiff = Math.abs((angle % 45) - 45) % 45;
    const shouldSnap = angleDiff < 15 || angleDiff > 30; // More forgiving threshold - within 15 degrees of a 45 degree angle
    
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
    } else if (activeTool === 'line') {
      // Check for endpoint snapping
      const snappedPoint = findNearestEndpoint(point) || point;
      
      // Start drawing a line - will detect if it's click or drag mode based on mouse movement
      handleLineToolMouseDown(snappedPoint);
      // Set isDrawing to true for potential drag mode
      setIsDrawing(true);
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
    
    if (isDrawing) {
      setMouseMoved(true);
      
      if (activeTool === 'line' && startPoint) {
        setLineDrawMode('drag');
      }
    }
    
    if (isDragging && selectedShape) {
      handleDragMove(point);
    } else if (activeTool === 'line' && startPoint) {
      // Update the current point for live line preview
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
    // If there's no start point, set it
    if (!startPoint) {
      setStartPoint(point);
      setCurrentPoint(point);
      // Don't set previewLine here - it will be drawn in redrawCanvas based on current point
    } else {
      // This will only happen in click mode
      completeLine(point);
    }
  };

  // Extract line completion logic for reuse
  const completeLine = (endPoint: Point) => {
    if (!startPoint) return;

    // Apply endpoint snapping for the final point if needed
    const snappedEndpoint = findNearestEndpoint(endPoint) || endPoint;
    
    // Apply angle snapping if not snapped to endpoint
    const finalEndpoint = snappedEndpoint === endPoint && snapToAngle ? 
      snapAngleToGrid(startPoint, endPoint) : 
      snappedEndpoint;

    const newLine = {
      id: generateId(),
      type: 'line' as const,
      start: { ...startPoint },
      end: finalEndpoint,
      color: currentColor,
      lineWidth: 8, // Make the line thicker
      strokeColor: '#000000' // Black border color
    };
    
    // Check if we're connecting to another line's endpoint
    const connectedToPoint = snappedEndpoint !== endPoint ? snappedEndpoint : null;
    if (connectedToPoint) {
      // Find which shape(s) have this endpoint
      const connections = shapes.filter(shape => {
        if (shape.type === 'line') {
          const isStartEqual = Math.abs(shape.start.x - connectedToPoint.x) < 1 && 
                               Math.abs(shape.start.y - connectedToPoint.y) < 1;
          const isEndEqual = Math.abs(shape.end.x - connectedToPoint.x) < 1 && 
                             Math.abs(shape.end.y - connectedToPoint.y) < 1;
          return isStartEqual || isEndEqual;
        }
        return false;
      }).map(shape => shape.id);
      
      // Update connections map
      if (connections.length > 0) {
        const newConnections = new Map(connectedLines);
        newConnections.set(newLine.id, connections);
        setConnectedLines(newConnections);
      }
    }
    
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
        const newPolygon = {
          id: generateId(),
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
        id: generateId(),
        type: 'rectangle' as const,
        start: { ...startPoint },
        end: point,
        color: currentColor,
        fillColor: fillColor
      };
      
      setShapes([...shapes, newRectangle]);
      setIsDrawing(false);
      setStartPoint(null);
    } else if (activeTool === 'line' && startPoint && isDrawing) {
      // If the mouse was moved while drawing, complete line in drag mode
      if (mouseMoved && lineDrawMode === 'drag') {
        // Apply snapping for the end point
        let endPoint = point;
        
        // First check endpoint snapping
        const snappedToEndpoint = findNearestEndpoint(point);
        if (snappedToEndpoint) {
          endPoint = snappedToEndpoint;
        } else if (snapToAngle) {
          // If not snapped to endpoint, try angle snapping
          endPoint = snapAngleToGrid(startPoint, point);
        }
        
        completeLine(endPoint);
        // Reset to click mode for next interaction
        setLineDrawMode('click');
      } else if (!mouseMoved) {
        // If mouse didn't move, keep the startPoint for click-point-click mode
        setIsDrawing(false);
      }
    }
    
    setIsDragging(false);
    setMouseMoved(false);
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

  // Toggle snap to angle
  const toggleSnapToAngle = () => {
    setSnapToAngle(!snapToAngle);
  };

  // Toggle snap to endpoints
  const toggleSnapToEndpoints = () => {
    setSnapToEndpoints(!snapToEndpoints);
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
    handleCanvasClick,
    snapToAngle,
    toggleSnapToAngle,
    snapToEndpoints,
    toggleSnapToEndpoints
  };
};
