import { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Point, Tool, Shape, LineShape, RectangleShape, PolygonShape } from '@/types/canvas';
import { drawShapes, drawInProgressPolygon, drawPreviewLine, lineSnappingHelpers } from '@/utils/canvasDrawing';

// Type for rectangle drawing mode
type RectangleDrawMode = 'drag' | 'click';

export const useCanvasEditor = () => {
  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Canvas drawing state
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('#FFFF00');  // Default yellow fill
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [mouseMoved, setMouseMoved] = useState(false);
  const [selectedShape, setSelectedShape] = useState<Shape | null>(null);

  // Wall polygon points
  const [wallPolygonPoints, setWallPolygonPoints] = useState<Point[]>([]);
  // Polygon points
  const [polygonPoints, setPolygonPoints] = useState<Point[]>([]);

  // Rectangle drawing mode
  const [rectangleDrawMode, setRectangleDrawMode] = useState<RectangleDrawMode>('drag');
  const toggleRectangleDrawMode = () => {
    setRectangleDrawMode(prev => prev === 'drag' ? 'click' : 'drag');
  };

  // Snapping settings
  const [snapToAngle, setSnapToAngle] = useState(true);
  const [snapToEndpoints, setSnapToEndpoints] = useState(true);
  const [snapToLines, setSnapToLines] = useState(true);

  const toggleSnapToAngle = () => setSnapToAngle(prev => !prev);
  const toggleSnapToEndpoints = () => setSnapToEndpoints(prev => !prev);
  const toggleSnapToLines = () => setSnapToLines(prev => !prev);

  // Canvas size
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Helper function to find nearest endpoint for snapping
  const findNearestEndpoint = (point: Point, threshold: number = 15): Point | null => {
    if (!snapToEndpoints) return null;

    let nearestPoint = null;
    let minDistance = threshold;

    shapes.forEach(shape => {
      if (shape.type === 'line') {
        // Check start point
        const distToStart = Math.sqrt(
          Math.pow(point.x - shape.start.x, 2) + 
          Math.pow(point.y - shape.start.y, 2)
        );
        if (distToStart < minDistance) {
          minDistance = distToStart;
          nearestPoint = { ...shape.start };
        }

        // Check end point
        const distToEnd = Math.sqrt(
          Math.pow(point.x - shape.end.x, 2) + 
          Math.pow(point.y - shape.end.y, 2)
        );
        if (distToEnd < minDistance) {
          minDistance = distToEnd;
          nearestPoint = { ...shape.end };
        }
      }
      else if (shape.type === 'polygon') {
        // For polygons, check all points
        shape.points.forEach(polygonPoint => {
          const distToPoint = Math.sqrt(
            Math.pow(point.x - polygonPoint.x, 2) + 
            Math.pow(point.y - polygonPoint.y, 2)
          );
          if (distToPoint < minDistance) {
            minDistance = distToPoint;
            nearestPoint = { ...polygonPoint };
          }
        });
      }
    });

    return nearestPoint;
  };

  // Angle snapping helper
  const snapAngleToGrid = (startPoint: Point, endPoint: Point): Point => {
    if (!snapToAngle) return endPoint;
    
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    const angle = Math.atan2(dy, dx);
    
    // Snap to 45-degree increments (0, 45, 90, 135, 180, 225, 270, 315)
    const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
    
    // Calculate distance
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate new point based on snapped angle
    const newX = startPoint.x + distance * Math.cos(snapAngle);
    const newY = startPoint.y + distance * Math.sin(snapAngle);
    
    return { x: newX, y: newY };
  };

  // Handle selection and dragging
  const handleDragMove = (point: Point) => {
    if (selectedShape && isDragging) {
      const deltaX = point.x - (currentPoint?.x || 0);
      const deltaY = point.y - (currentPoint?.y || 0);

      let updatedShape: Shape;

      if (selectedShape.type === 'line') {
        updatedShape = {
          ...selectedShape,
          start: {
            x: selectedShape.start.x + deltaX,
            y: selectedShape.start.y + deltaY
          },
          end: {
            x: selectedShape.end.x + deltaX,
            y: selectedShape.end.y + deltaY
          }
        };
      } else if (selectedShape.type === 'rectangle') {
        updatedShape = {
          ...selectedShape,
          start: {
            x: selectedShape.start.x + deltaX,
            y: selectedShape.start.y + deltaY
          },
          end: {
            x: selectedShape.end.x + deltaX,
            y: selectedShape.end.y + deltaY
          }
        };
      } else if (selectedShape.type === 'polygon') {
        const updatedPoints = selectedShape.points.map(p => ({
          x: p.x + deltaX,
          y: p.y + deltaY
        }));
        
        updatedShape = {
          ...selectedShape,
          points: updatedPoints
        };
      } else {
        return; // Unknown shape type
      }

      // Update the shape in the shapes array
      setShapes(prev => 
        prev.map(shape => 
          shape.id === selectedShape.id ? updatedShape : shape
        )
      );

      // Update selected shape reference
      setSelectedShape(updatedShape);
    }
  };

  // Function to redraw the canvas
  const redrawCanvas = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw existing shapes
    drawShapes(ctx, shapes, selectedShapeId, fillColor);
    
    // Draw in-progress elements
    if (isDrawing || currentPoint) {
      if (activeTool === 'wall' && startPoint && currentPoint) {
        // For walls, draw a preview line
        drawPreviewLine(ctx, startPoint, currentPoint, '#8E9196');
      } 
      else if (activeTool === 'wall-polygon' && wallPolygonPoints.length > 0 && currentPoint) {
        // Draw wall polygon in progress - with wall style and NO red starting point
        drawInProgressPolygon(
          ctx, 
          wallPolygonPoints, 
          currentPoint, 
          '#000000', 
          '#8E9196',
          true, // isWallPolygon
          false // no start point
        );
      }
      else if (activeTool === 'yellow-polygon' && polygonPoints.length > 0 && currentPoint) {
        // For yellow polygon
        drawInProgressPolygon(
          ctx, 
          polygonPoints, 
          currentPoint, 
          currentColor, 
          fillColor
        );
      }
      else if (activeTool === 'green-polygon' && polygonPoints.length > 0 && currentPoint) {
        // For green polygon
        drawInProgressPolygon(
          ctx, 
          polygonPoints, 
          currentPoint, 
          currentColor, 
          '#00FF00' // Green filling
        );
      }
      else if ((activeTool === 'yellow-rectangle' || activeTool === 'green-rectangle') && 
                startPoint && currentPoint) {
        // Draw rectangle preview
        ctx.beginPath();
        const width = currentPoint.x - startPoint.x;
        const height = currentPoint.y - startPoint.y;
        
        ctx.rect(startPoint.x, startPoint.y, width, height);
        ctx.fillStyle = activeTool === 'green-rectangle' ? '#00FF00' : fillColor;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = currentColor;
        ctx.stroke();
      }
    }
  };

  // Draw function - handle mouse move events
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const point: Point = { x, y };
    
    setMouseMoved(true);
    
    // Always update the current point 
    setCurrentPoint(point);
    
    if (isDragging && selectedShape) {
      handleDragMove(point);
    } else if (activeTool === 'wall' && startPoint) {
      // Update the current point for line preview
      redrawCanvas();
    } else if (activeTool === 'wall-polygon' && wallPolygonPoints.length > 0) {
      // For wall-polygon, apply the same snapping as for walls
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
      // Apply angle snapping
      else if (snapToAngle && wallPolygonPoints.length > 0) {
        const lastPoint = wallPolygonPoints[wallPolygonPoints.length - 1];
        snappedPoint = snapAngleToGrid(lastPoint, snappedPoint);
      }
      
      // Update the current point with the snapped position
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

  // Handle mouse down event
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const clickPoint: Point = { x, y };
    
    setMouseMoved(false);
    
    // Handle based on active tool
    if (activeTool === 'select') {
      // Check if we clicked on a shape
      const clickedShape = findShapeAtPoint(clickPoint);
      if (clickedShape) {
        setSelectedShapeId(clickedShape.id);
        setSelectedShape(clickedShape);
        setIsDragging(true);
      } else {
        setSelectedShapeId(null);
        setSelectedShape(null);
      }
    } 
    else if (activeTool === 'wall') {
      // If we don't have a start point, set it
      if (!startPoint) {
        let snappedPoint = clickPoint;
        
        // First check if we can snap to a line
        if (snapToLines) {
          const lineSnap = lineSnappingHelpers.findNearestPointOnAnyLine(clickPoint, shapes);
          if (lineSnap) {
            snappedPoint = lineSnap.point;
          }
        }
        
        // Then check endpoint snapping (this takes priority)
        const endpointSnap = findNearestEndpoint(snappedPoint);
        if (endpointSnap) {
          snappedPoint = endpointSnap;
        }
        
        setStartPoint(snappedPoint);
        setCurrentPoint(snappedPoint);
      } else {
        // We have a start point, so create a line
        let endPoint = clickPoint;
        
        // Apply snapping
        if (snapToLines) {
          const lineSnap = lineSnappingHelpers.findNearestPointOnAnyLine(clickPoint, shapes);
          if (lineSnap) {
            endPoint = lineSnap.point;
          }
        }
        
        const endpointSnap = findNearestEndpoint(endPoint);
        if (endpointSnap) {
          endPoint = endpointSnap;
        } else if (snapToAngle) {
          endPoint = snapAngleToGrid(startPoint, endPoint);
        }
        
        // Create the new line
        const newLine: LineShape = {
          id: uuidv4(),
          type: 'line',
          start: { ...startPoint },
          end: { ...endPoint },
          color: currentColor,
          strokeColor: '#000000',
          lineWidth: 10
        };
        
        setShapes(prev => [...prev, newLine]);
        
        // Reset for the next line
        setStartPoint(null);
        setCurrentPoint(null);
      }
      
      redrawCanvas();
    }
    else if (activeTool === 'wall-polygon') {
      // Handle wall polygon drawing
      let snappedPoint = clickPoint;
      
      // First check if we can snap to a line
      if (snapToLines) {
        const lineSnap = lineSnappingHelpers.findNearestPointOnAnyLine(clickPoint, shapes);
        if (lineSnap) {
          snappedPoint = lineSnap.point;
        }
      }
      
      // Then check endpoint snapping (this takes priority)
      const endpointSnap = findNearestEndpoint(snappedPoint);
      if (endpointSnap) {
        snappedPoint = endpointSnap;
      } 
      // Apply angle snapping if not the first point
      else if (snapToAngle && wallPolygonPoints.length > 0) {
        const lastPoint = wallPolygonPoints[wallPolygonPoints.length - 1];
        snappedPoint = snapAngleToGrid(lastPoint, snappedPoint);
      }
      
      // If no points yet, start the polygon
      if (wallPolygonPoints.length === 0) {
        setWallPolygonPoints([snappedPoint]);
      } 
      // Check if we're closing the polygon
      else if (wallPolygonPoints.length > 2) {
        const firstPoint = wallPolygonPoints[0];
        const distToFirst = Math.sqrt(
          Math.pow(snappedPoint.x - firstPoint.x, 2) + 
          Math.pow(snappedPoint.y - firstPoint.y, 2)
        );
        
        if (distToFirst < 15) {
          // Close the polygon - create lines for each segment
          for (let i = 0; i < wallPolygonPoints.length; i++) {
            const start = wallPolygonPoints[i];
            const end = i === wallPolygonPoints.length - 1 
              ? wallPolygonPoints[0] 
              : wallPolygonPoints[i + 1];
              
            const newLine: LineShape = {
              id: uuidv4(),
              type: 'line',
              start: { ...start },
              end: { ...end },
              color: currentColor,
              strokeColor: '#000000',
              lineWidth: 10
            };
            
            setShapes(prev => [...prev, newLine]);
          }
          
          // Reset the polygon
          setWallPolygonPoints([]);
          setCurrentPoint(null);
        } else {
          // Add the point to the polygon
          setWallPolygonPoints(prev => [...prev, snappedPoint]);
        }
      } else {
        // Add the point to the polygon
        setWallPolygonPoints(prev => [...prev, snappedPoint]);
      }
      
      redrawCanvas();
    }
    else if (activeTool === 'yellow-rectangle' || activeTool === 'green-rectangle') {
      if (rectangleDrawMode === 'drag') {
        // Set start point for dragging
        setStartPoint(clickPoint);
        setIsDrawing(true);
      } else if (rectangleDrawMode === 'click') {
        // For click mode
        if (!startPoint) {
          // First click sets start point
          setStartPoint(clickPoint);
        } else {
          // Second click sets end point and creates rectangle
          const start = startPoint;
          const end = clickPoint;
          
          const newRect: RectangleShape = {
            id: uuidv4(),
            type: 'rectangle',
            start,
            end,
            color: currentColor,
            fillColor: activeTool === 'green-rectangle' ? '#00FF00' : fillColor
          };
          
          setShapes(prev => [...prev, newRect]);
          
          // Reset for next rectangle
          setStartPoint(null);
          setCurrentPoint(null);
        }
      }
      
      redrawCanvas();
    }
    else if (activeTool === 'yellow-polygon' || activeTool === 'green-polygon') {
      // If no points yet, start the polygon
      if (polygonPoints.length === 0) {
        setPolygonPoints([clickPoint]);
      } 
      // Check if we're closing the polygon
      else if (polygonPoints.length > 2) {
        const firstPoint = polygonPoints[0];
        const distToFirst = Math.sqrt(
          Math.pow(clickPoint.x - firstPoint.x, 2) + 
          Math.pow(clickPoint.y - firstPoint.y, 2)
        );
        
        if (distToFirst < 15) {
          // Close the polygon
          const newPolygon: PolygonShape = {
            id: uuidv4(),
            type: 'polygon',
            points: [...polygonPoints],
            color: currentColor,
            fillColor: activeTool === 'green-polygon' ? '#00FF00' : fillColor
          };
          
          setShapes(prev => [...prev, newPolygon]);
          
          // Reset the polygon
          setPolygonPoints([]);
          setCurrentPoint(null);
        } else {
          // Add the point to the polygon
          setPolygonPoints(prev => [...prev, clickPoint]);
        }
      } else {
        // Add the point to the polygon
        setPolygonPoints(prev => [...prev, clickPoint]);
      }
      
      redrawCanvas();
    }
  };

  // Handle mouse up event
  const endDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === 'select') {
      setIsDragging(false);
    }
    
    if ((activeTool === 'yellow-rectangle' || activeTool === 'green-rectangle') && 
        isDrawing && rectangleDrawMode === 'drag' && startPoint && currentPoint) {
      // Only create rectangle if mouse was moved
      if (mouseMoved) {
        // Create rectangle from start to current point
        const newRect: RectangleShape = {
          id: uuidv4(),
          type: 'rectangle',
          start: { ...startPoint },
          end: { ...currentPoint },
          color: currentColor,
          fillColor: activeTool === 'green-rectangle' ? '#00FF00' : fillColor
        };
        
        setShapes(prev => [...prev, newRect]);
      }
      
      // Reset dragging state
      setStartPoint(null);
      setIsDrawing(false);
    }
    
    redrawCanvas();
  };

  // Helper to find a shape at a point
  const findShapeAtPoint = (point: Point): Shape | null => {
    // First check for polygons or rectangles since they have area
    for (const shape of shapes) {
      if (shape.type === 'rectangle') {
        const minX = Math.min(shape.start.x, shape.end.x);
        const maxX = Math.max(shape.start.x, shape.end.x);
        const minY = Math.min(shape.start.y, shape.end.y);
        const maxY = Math.max(shape.start.y, shape.end.y);
        
        if (point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY) {
          return shape;
        }
      }
      else if (shape.type === 'polygon') {
        if (isPointInPolygon(point, shape.points)) {
          return shape;
        }
      }
    }
    
    // Then check for lines - thinner objects need selection precision
    for (const shape of shapes) {
      if (shape.type === 'line') {
        if (isPointNearLine(point, shape.start, shape.end, 10)) {
          return shape;
        }
      }
    }
    
    return null;
  };

  // Helper to check if a point is in a polygon
  const isPointInPolygon = (point: Point, polygonPoints: Point[]): boolean => {
    if (polygonPoints.length < 3) return false;
    
    let inside = false;
    for (let i = 0, j = polygonPoints.length - 1; i < polygonPoints.length; j = i++) {
      const xi = polygonPoints[i].x;
      const yi = polygonPoints[i].y;
      const xj = polygonPoints[j].x;
      const yj = polygonPoints[j].y;
      
      const intersect = ((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      
      if (intersect) inside = !inside;
    }
    
    return inside;
  };

  // Helper to check if a point is near a line
  const isPointNearLine = (point: Point, lineStart: Point, lineEnd: Point, threshold: number): boolean => {
    // Calculate the distance from point to line
    const lineLength = Math.sqrt(
      Math.pow(lineEnd.x - lineStart.x, 2) + 
      Math.pow(lineEnd.y - lineStart.y, 2)
    );
    
    if (lineLength === 0) return false;
    
    // Calculate distance from point to line using cross product
    const distance = Math.abs(
      (lineEnd.y - lineStart.y) * point.x - 
      (lineEnd.x - lineStart.x) * point.y + 
      lineEnd.x * lineStart.y - 
      lineEnd.y * lineStart.x
    ) / lineLength;
    
    // Also check if point is within the bounds of the line segment
    const dotProduct = 
      ((point.x - lineStart.x) * (lineEnd.x - lineStart.x) + 
       (point.y - lineStart.y) * (lineEnd.y - lineStart.y)) / 
      Math.pow(lineLength, 2);
    
    // If the dot product is between 0 and 1, then the closest point is on the line segment
    if (dotProduct < 0 || dotProduct > 1) {
      // Check distance to endpoints
      const distToStart = Math.sqrt(
        Math.pow(point.x - lineStart.x, 2) + 
        Math.pow(point.y - lineStart.y, 2)
      );
      const distToEnd = Math.sqrt(
        Math.pow(point.x - lineEnd.x, 2) + 
        Math.pow(point.y - lineEnd.y, 2)
      );
      
      return Math.min(distToStart, distToEnd) <= threshold;
    }
    
    return distance <= threshold;
  };

  // Delete selected shape
  const deleteSelected = () => {
    if (selectedShapeId) {
      setShapes(prev => prev.filter(shape => shape.id !== selectedShapeId));
      setSelectedShapeId(null);
      setSelectedShape(null);
      redrawCanvas();
    }
  };

  // Clear canvas
  const clearCanvas = () => {
    setShapes([]);
    setSelectedShapeId(null);
    setSelectedShape(null);
    setStartPoint(null);
    setCurrentPoint(null);
    setPolygonPoints([]);
    setWallPolygonPoints([]);
    redrawCanvas();
  };

  // Effect to initialize canvas and keep it updated
  useEffect(() => {
    redrawCanvas();
  }, [shapes, selectedShapeId, activeTool, currentColor, fillColor, rectangleDrawMode]);

  // Return everything needed for the canvas editor
  return {
    canvasRef,
    activeTool,
    setActiveTool,
    currentColor,
    setCurrentColor,
    fillColor,
    setFillColor,
    shapes,
    setShapes,
    selectedShapeId,
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
