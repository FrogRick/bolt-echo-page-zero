
import { useRef, useState, useEffect } from 'react';
import { 
  drawShapes, 
  drawInProgressPolygon, 
  drawPreviewLine, 
  drawExtensionLine, 
  lineSnappingHelpers 
} from '../utils';
import { useShapeDetection } from '@/hooks/useShapeDetection';
import { Tool, Point, Shape, PreviewLine } from '../types/canvas';
import { generateId } from '@/utils/idGenerator';
import { useSnapping } from './useSnapping';
import { useShapeOperations } from './useShapeOperations';

export const useCanvasEditor = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [currentColor, setCurrentColor] = useState<string>('#000000');
  const [fillColor, setFillColor] = useState<string>('#FFFBCC'); // Light yellow
  const [greenFillColor, setGreenFillColor] = useState<string>('#C9E5D1'); // Green fill color
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [polygonPoints, setPolygonPoints] = useState<Point[]>([]);
  const [wallPolygonPoints, setWallPolygonPoints] = useState<Point[]>([]);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedShape, setSelectedShape] = useState<Shape | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
  const [previewLine, setPreviewLine] = useState<PreviewLine | null>(null);
  const [mouseMoved, setMouseMoved] = useState(false);
  const [extensionLine, setExtensionLine] = useState<{start: Point, end: Point} | null>(null);
  
  // Rectangle drawing mode: 'click' for click-release-click or 'drag' for click-drag-release
  const [rectangleDrawMode, setRectangleDrawMode] = useState<'click' | 'drag'>('drag');

  // Import shape detection functions
  const { findShapeAtPoint } = useShapeDetection();
  
  // Get snapping functionality
  const snapping = useSnapping();
  
  // Get shape operations
  const shapeOperations = useShapeOperations({
    shapes,
    setShapes,
    currentColor,
    fillColor, 
    greenFillColor,
    activeTool
  });

  // Function to cancel the current drawing operation
  const cancelDrawing = () => {
    if (activeTool === 'wall' && startPoint) {
      // Cancel wall drawing - clear the start point
      setStartPoint(null);
      setPreviewLine(null);
      setIsDrawing(false);
    } else if (activeTool === 'wall-polygon' && wallPolygonPoints.length > 0) {
      // Cancel wall polygon drawing - clear all wall polygon points
      setWallPolygonPoints([]);
      setIsDrawing(false);
    } else if ((activeTool === 'yellow-rectangle' || activeTool === 'green-rectangle')) {
      // Cancel rectangle drawing - clear the start point
      if (rectangleDrawMode === 'click' && startPoint) {
        setStartPoint(null);
        setCurrentPoint(null);
      }
      setIsDrawing(false);
    } else if ((activeTool === 'yellow-polygon' || activeTool === 'green-polygon') && polygonPoints.length > 0) {
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

    // Draw wall polygon in progress (using same drawing function as regular polygon)
    // This is drawn FIRST (before regular polygons) so it appears below other elements
    if (activeTool === 'wall-polygon' && wallPolygonPoints.length > 0) {
      // For wall polygon, we draw lines without fill - use black border and gray fill like walls
      // Pass false for showStartPoint to hide the red circle
      drawInProgressPolygon(ctx, wallPolygonPoints, currentPoint, '#000000', 'transparent', true, false);
      
      // Draw dotted extension line if there is one - same as for wall tool
      if (extensionLine) {
        drawExtensionLine(ctx, extensionLine.start, extensionLine.end);
      }
    }

    // Draw polygon in progress
    if ((activeTool === 'yellow-polygon' || activeTool === 'green-polygon') && polygonPoints.length > 0) {
      const polygonFillColor = activeTool === 'green-polygon' ? greenFillColor : fillColor;
      drawInProgressPolygon(ctx, polygonPoints, currentPoint, currentColor, polygonFillColor);
    }

    // Draw preview line when using the wall tool - only if we have a start and current point
    if (activeTool === 'wall' && startPoint && currentPoint) {
      // Snap the endpoint using all active snapping rules
      const snappedEndpoint = snapping.snapPoint(
        currentPoint, 
        startPoint, 
        shapes, 
        setExtensionLine,
        undefined,
        isDragging
      );
      
      // Draw the preview line with the snapped endpoint
      drawPreviewLine(ctx, startPoint, snappedEndpoint, currentColor);
      
      // Draw dotted extension line if there is one
      if (extensionLine) {
        drawExtensionLine(ctx, extensionLine.start, extensionLine.end);
      }
    }
    
    // Draw preview line for single click line tool if previewLine exists
    else if (previewLine) {
      drawPreviewLine(ctx, previewLine.start, previewLine.end, currentColor);
    }
    
    // Draw preview rectangle if we're in click mode and have a start point
    if ((activeTool === 'yellow-rectangle' || activeTool === 'green-rectangle') && rectangleDrawMode === 'click' && startPoint && currentPoint) {
      const rectFillColor = activeTool === 'green-rectangle' ? greenFillColor : fillColor;
      
      // Create semi-transparent fill color for in-progress rectangles (50% opacity)
      let semiTransparentColor = rectFillColor;
      
      // Handle both hex and rgb formats
      if (rectFillColor.startsWith('#')) {
        // Convert hex to rgba
        const r = parseInt(rectFillColor.slice(1, 3), 16);
        const g = parseInt(rectFillColor.slice(3, 5), 16);
        const b = parseInt(rectFillColor.slice(5, 7), 16);
        semiTransparentColor = `rgba(${r}, ${g}, ${b}, 0.5)`;
      } else if (rectFillColor.startsWith('rgb(')) {
        // Convert rgb to rgba
        semiTransparentColor = rectFillColor.replace(/rgb\((.+)\)/, 'rgba($1, 0.5)');
      }
      
      ctx.fillStyle = semiTransparentColor;
      ctx.beginPath();
      ctx.rect(
        startPoint.x,
        startPoint.y,
        currentPoint.x - startPoint.x,
        currentPoint.y - startPoint.y
      );
      ctx.fill();
      
      // Add a subtle border
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = 1;
      ctx.stroke();
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
    setMouseMoved(false);
    
    if (activeTool === 'select') {
      handleSelectToolMouseDown(point);
    } else if (activeTool === 'wall') {
      // Apply snapping before starting to draw
      let snappedPoint = snapping.snapPoint(point, null, shapes);
      handleLineToolClick(snappedPoint);
    } else if (activeTool === 'wall-polygon') {
      handleWallPolygonToolMouseDown(point);
    } else if (activeTool === 'yellow-rectangle' || activeTool === 'green-rectangle') {
      if (rectangleDrawMode === 'click') {
        // In click mode, first click sets start point, second click completes
        if (!startPoint) {
          setStartPoint(point);
          setCurrentPoint(point);
        } else {
          // Complete the rectangle on second click
          shapeOperations.completeRectangle(startPoint, point);
          setStartPoint(null);
          setCurrentPoint(null);
        }
      } else {
        // Traditional drag mode
        handleRectangleToolMouseDown(point);
      }
    } else if (activeTool === 'yellow-polygon' || activeTool === 'green-polygon') {
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
    } else if (activeTool === 'wall' && startPoint) {
      // For wall tool, snap according to all enabled snapping rules
      const snappedPoint = snapping.snapPoint(
        point, 
        startPoint, 
        shapes, 
        setExtensionLine,
        undefined,
        isDragging
      );
      
      // Set the current point to the snapped point
      setCurrentPoint(snappedPoint);
      
      // Update for line preview
      redrawCanvas();
    } 
    else if (activeTool === 'wall-polygon' && wallPolygonPoints.length > 0) {
      // For wall-polygon, apply the same snapping as wall tool during mouse movement
      
      // Create a temporary array that includes both shapes and the current in-progress wall polygon
      const temporaryLines: Shape[] = [...shapes];
      
      // Add the current wall polygon segments as temporary lines for snapping
      if (wallPolygonPoints.length > 1) {
        for (let i = 0; i < wallPolygonPoints.length - 1; i++) {
          temporaryLines.push({
            id: `temp-wall-polygon-${i}`,
            type: 'line',
            start: { ...wallPolygonPoints[i] },
            end: { ...wallPolygonPoints[i + 1] },
            color: currentColor,
            lineWidth: 8
          });
        }
      }
      
      // Get the last point from the wall polygon points array
      const lastPoint = wallPolygonPoints[wallPolygonPoints.length - 1];
      
      // Apply snapping from the last polygon point to current mouse position
      const snappedPoint = snapping.snapPoint(
        point,
        lastPoint,
        temporaryLines,
        setExtensionLine,
        undefined,
        isDragging
      );
      
      // Set the current point to the snapped point
      setCurrentPoint(snappedPoint);
      
      redrawCanvas();
    } else if (isDrawing && (activeTool === 'yellow-rectangle' || activeTool === 'green-rectangle') && rectangleDrawMode === 'drag') {
      redrawCanvas();
    } else if ((activeTool === 'yellow-rectangle' || activeTool === 'green-rectangle') && rectangleDrawMode === 'click' && startPoint) {
      // Update preview for click mode rectangle
      redrawCanvas();
    } else if ((activeTool === 'yellow-polygon' || activeTool === 'green-polygon') && polygonPoints.length > 0) {
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
      // Snap the endpoint using all active snapping rules
      const finalEndpoint = snapping.snapPoint(
        point, 
        startPoint, 
        shapes, 
        undefined,
        undefined,
        isDragging
      );
      
      // Complete the line with the snapped endpoint
      shapeOperations.completeLine(startPoint, finalEndpoint);
      setStartPoint(null);
      setPreviewLine(null);
      setIsDrawing(false);
    }
  };
  
  // Handle wall polygon tool mouse down - multiple connected lines
  const handleWallPolygonToolMouseDown = (point: Point) => {
    // Create a temporary array that includes both shapes and the current in-progress wall polygon
    const temporaryLines: Shape[] = [...shapes];
    
    // Add the current wall polygon segments as temporary lines for snapping
    if (wallPolygonPoints.length > 1) {
      for (let i = 0; i < wallPolygonPoints.length - 1; i++) {
        temporaryLines.push({
          id: `temp-wall-polygon-${i}`,
          type: 'line',
          start: { ...wallPolygonPoints[i] },
          end: { ...wallPolygonPoints[i + 1] },
          color: currentColor,
          lineWidth: 8
        });
      }
    }
    
    // Apply snapping to the point
    const lastPoint = wallPolygonPoints.length > 0 
      ? wallPolygonPoints[wallPolygonPoints.length - 1] 
      : null;
    
    const snappedPoint = snapping.snapPoint(
      point,
      lastPoint,
      temporaryLines,
      undefined,
      undefined,
      isDragging
    );
    
    // If we don't have any points yet, add this as the first point
    if (wallPolygonPoints.length === 0) {
      setWallPolygonPoints([snappedPoint]);
      setIsDrawing(true);
    } else {
      // If we already have points, check if this is a double-click (close to last point)
      const lastPoint = wallPolygonPoints[wallPolygonPoints.length - 1];
      const distance = Math.sqrt(
        Math.pow(snappedPoint.x - lastPoint.x, 2) + 
        Math.pow(snappedPoint.y - lastPoint.y, 2)
      );
      
      if (distance < 10) {
        // Double-click detected, complete the wall polygon
        setWallPolygonPoints(shapeOperations.completeWallPolygon(wallPolygonPoints));
      } else {
        // Add this as a new point
        setWallPolygonPoints([...wallPolygonPoints, snappedPoint]);
        // Clear extension line after adding a point
        setExtensionLine(null);
      }
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
        setPolygonPoints(shapeOperations.completePolygon(polygonPoints));
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
    
    if ((activeTool === 'yellow-rectangle' || activeTool === 'green-rectangle') && rectangleDrawMode === 'drag' && startPoint) {
      // Complete rectangle on mouse up with no border
      shapeOperations.completeRectangle(startPoint, point);
      setIsDrawing(false);
      setStartPoint(null);
    }
    
    setIsDragging(false);
    setMouseMoved(false);
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
      if ((activeTool === 'yellow-polygon' || activeTool === 'green-polygon') && polygonPoints.length >= 3) {
        if (e.key === 'Enter') {
          // Close the polygon on Enter
          setPolygonPoints(shapeOperations.completePolygon(polygonPoints));
        }
      }
      
      // If we're in wall polygon drawing mode with at least 2 points
      if (activeTool === 'wall-polygon' && wallPolygonPoints.length >= 2) {
        if (e.key === 'Enter') {
          // Complete the wall polygon on Enter
          setWallPolygonPoints(shapeOperations.completeWallPolygon(wallPolygonPoints));
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTool, polygonPoints, wallPolygonPoints, startPoint, rectangleDrawMode]);

  // Redraw the canvas whenever shapes or selected shapes change
  useEffect(() => {
    redrawCanvas();
  }, [
    shapes,
    selectedShape,
    polygonPoints,
    wallPolygonPoints,
    activeTool,
    startPoint,
    currentPoint,
    previewLine,
    extensionLine
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
    deleteSelected: () => selectedShape && shapeOperations.deleteShape(selectedShape.id),
    clearCanvas: shapeOperations.clearAllShapes,
    canvasSize,
    snapToAngle: snapping.snapToAngle,
    toggleSnapToAngle: snapping.toggleSnapToAngle,
    snapToEndpoints: snapping.snapToEndpoints,
    toggleSnapToEndpoints: snapping.toggleSnapToEndpoints,
    snapToLines: snapping.snapToLines,
    toggleSnapToLines: snapping.toggleSnapToLines,
    snapToExtensions: snapping.snapToExtensions,
    toggleSnapToExtensions: snapping.toggleSnapToExtensions,
    rectangleDrawMode,
    toggleRectangleDrawMode
  };
};
