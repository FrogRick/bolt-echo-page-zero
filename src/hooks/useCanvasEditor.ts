import { useRef, useState, useEffect } from 'react';
import { Point, Shape, Tool, PreviewLine, ExtensionLine } from '@/types/canvas';
import { drawShapes, drawInProgressPolygon, drawPreviewLine, drawExtensionLine, lineSnappingHelpers } from '@/utils/canvasDrawing';

export const useCanvasEditor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const startPoint = useRef<Point | null>(null);
  const lastPoint = useRef<Point | null>(null);
  const currentPoint = useRef<Point | null>(null);
  const inProgressPolygon = useRef<Point[]>([]);
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('#FFFFFF');
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 });
  const [snapToAngle, setSnapToAngle] = useState(true);
  const [snapToEndpoints, setSnapToEndpoints] = useState(true);
  const [snapToLines, setSnapToLines] = useState(true);
  const [snapToExtensions, setSnapToExtensions] = useState(true);
  const [rectangleDrawMode, setRectangleDrawMode] = useState<'corner-to-corner' | 'center-out'>('corner-to-corner');
  
  // Toggle functions for snap settings
  const toggleSnapToAngle = () => setSnapToAngle(!snapToAngle);
  const toggleSnapToEndpoints = () => setSnapToEndpoints(!snapToEndpoints);
  const toggleSnapToLines = () => setSnapToLines(!snapToLines);
  const toggleSnapToExtensions = () => setSnapToExtensions(!snapToExtensions);
  
  // Toggle rectangle draw mode
  const toggleRectangleDrawMode = () => {
    setRectangleDrawMode(prev => 
      prev === 'corner-to-corner' ? 'center-out' : 'corner-to-corner'
    );
  };

  // Modified startDrawing function with improved logging and state management
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>, xPos?: number, yPos?: number) => {
    console.log("startDrawing called", { xPos, yPos, activeTool, currentIsDrawing: isDrawing });
    
    // If already drawing, don't start a new drawing operation
    if (isDrawing) return;
    
    setIsDrawing(true);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use provided coordinates if available, otherwise calculate them
    let x, y;
    if (xPos !== undefined && yPos !== undefined) {
      x = xPos;
      y = yPos;
    } else {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      x = (e.clientX - rect.left) * scaleX;
      y = (e.clientY - rect.top) * scaleY;
    }
    
    console.log("Setting start point:", { x, y });

    // Store the starting point
    startPoint.current = { x, y };
    lastPoint.current = { x, y };
    currentPoint.current = { x, y };

    // If selecting, start the selection process
    if (activeTool === 'select') {
      // Check if we clicked on a shape
      const clickedShape = findShapeAtPoint({ x, y });
      if (clickedShape) {
        setSelectedShapeId(clickedShape.id);
      } else {
        setSelectedShapeId(null);
      }
    } 
    // If drawing wall lines 
    else if (activeTool === 'wall') {
      // For wall tool, we'll start drawing a preview line
      // The actual wall will be created on mouse up
      console.log("Drawing wall from", { x, y });
    }
    // If drawing polygons (any type)
    else if (['wall-polygon', 'yellow-polygon', 'green-polygon'].includes(activeTool)) {
      // If this is the first point, start a new polygon
      if (inProgressPolygon.current.length === 0) {
        console.log("Starting new polygon at", { x, y });
        inProgressPolygon.current = [{ x, y }];
      } else {
        // Check if we're closing the polygon (clicking near the first point)
        const firstPoint = inProgressPolygon.current[0];
        const distance = Math.sqrt(
          Math.pow(x - firstPoint.x, 2) + Math.pow(y - firstPoint.y, 2)
        );
        
        if (distance < 20 && inProgressPolygon.current.length > 2) {
          // Close the polygon
          console.log("Closing polygon");
          finishPolygon();
        } else {
          // Add a new point to the polygon
          console.log("Adding point to polygon", { x, y });
          inProgressPolygon.current = [...inProgressPolygon.current, { x, y }];
        }
      }
      
      // Redraw the canvas
      redrawCanvas();
    }
  };

  // Updated draw function with improved coordinates handling and logging
  const draw = (e: React.MouseEvent<HTMLCanvasElement>, xPos?: number, yPos?: number) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use provided coordinates if available, otherwise calculate them
    let x, y;
    if (xPos !== undefined && yPos !== undefined) {
      x = xPos;
      y = yPos;
    } else {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      x = (e.clientX - rect.left) * scaleX;
      y = (e.clientY - rect.top) * scaleY;
    }

    // Update the current mouse position
    currentPoint.current = { x, y };

    // Clear the canvas or keep existing drawings based on tool
    if (activeTool === 'select') {
      // If we're selecting and have a selected shape, handle dragging
      if (selectedShapeId && startPoint.current) {
        const dx = x - startPoint.current.x;
        const dy = y - startPoint.current.y;
        
        // Update the shape's position
        setShapes(prevShapes => 
          prevShapes.map(shape => 
            shape.id === selectedShapeId
              ? moveShape(shape, dx, dy)
              : shape
          )
        );
        
        // Update the start point for the next move
        startPoint.current = { x, y };
        
        // Redraw the canvas
        redrawCanvas();
      }
    } 
    // Handle wall drawing
    else if (activeTool === 'wall') {
      // Redraw the canvas with the preview line
      redrawCanvas();
      
      if (startPoint.current) {
        let endX = x;
        let endY = y;
        
        // Apply snapping if enabled
        if (snapToAngle) {
          const angle = Math.atan2(y - startPoint.current.y, x - startPoint.current.x);
          const distance = Math.sqrt(
            Math.pow(x - startPoint.current.x, 2) + 
            Math.pow(y - startPoint.current.y, 2)
          );
          
          // Snap to 45-degree increments
          const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
          endX = startPoint.current.x + distance * Math.cos(snappedAngle);
          endY = startPoint.current.y + distance * Math.sin(snappedAngle);
        }
        
        // Check for endpoint snapping
        if (snapToEndpoints) {
          const snapPoint = findNearestEndpoint({ x: endX, y: endY });
          if (snapPoint) {
            endX = snapPoint.x;
            endY = snapPoint.y;
          }
        }
        
        // Check for line snapping
        if (snapToLines) {
          const snapPoint = lineSnappingHelpers.findNearestPointOnAnyLine(
            { x: endX, y: endY },
            shapes.filter(s => s.type === 'line')
          );
          
          if (snapPoint) {
            endX = snapPoint.point.x;
            endY = snapPoint.point.y;
          }
        }
        
        // Draw the preview line
        drawPreviewLine(ctx, startPoint.current, { x: endX, y: endY }, currentColor);
        
        // Draw extension lines if enabled
        if (snapToExtensions && startPoint.current) {
          const extension = lineSnappingHelpers.findLineExtensionPoint(
            startPoint.current,
            { x: endX, y: endY },
            shapes.filter(s => s.type === 'line')
          );
          
          if (extension) {
            // Draw the extension line
            drawExtensionLine(ctx, extension.extendedLine.start, extension.extendedLine.end);
            
            // Update the end point to the extension point
            endX = extension.point.x;
            endY = extension.point.y;
            
            // Redraw the preview line with the updated end point
            drawPreviewLine(ctx, startPoint.current, { x: endX, y: endY }, currentColor);
          }
        }
      }
    } 
    // Handle polygon drawing
    else if (['wall-polygon', 'yellow-polygon', 'green-polygon'].includes(activeTool)) {
      // Redraw the canvas with the in-progress polygon
      redrawCanvas();
      
      if (inProgressPolygon.current.length > 0) {
        // Get the appropriate fill color based on the tool
        let polygonFillColor = fillColor;
        if (activeTool === 'yellow-polygon') {
          polygonFillColor = '#FFEB3B';
        } else if (activeTool === 'green-polygon') {
          polygonFillColor = '#4CAF50';
        }
        
        // Draw the in-progress polygon
        drawInProgressPolygon(
          ctx,
          inProgressPolygon.current,
          { x, y },
          currentColor,
          polygonFillColor,
          activeTool === 'wall-polygon'
        );
      }
    }
  };

  // Updated endDrawing function with improved state management
  const endDrawing = () => {
    console.log("endDrawing called", { 
      currentIsDrawing: isDrawing, 
      activeTool, 
      hasStartPoint: !!startPoint.current,
      hasCurrentPoint: !!currentPoint.current,
      polygonPoints: inProgressPolygon.current.length
    });
    
    // If we weren't drawing, nothing to end
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Handle the end of drawing based on the active tool
    if (activeTool === 'wall' && startPoint.current && currentPoint.current) {
      // Create a new wall line
      const newShape: Shape = {
        id: crypto.randomUUID(),
        type: 'line',
        start: { ...startPoint.current },
        end: { ...currentPoint.current },
        color: currentColor
      };
      
      console.log("Created new wall", newShape);
      setShapes([...shapes, newShape]);
    }
    
    // Reset drawing state
    setIsDrawing(false);
    
    // Don't reset startPoint for polygon drawing
    if (!['wall-polygon', 'yellow-polygon', 'green-polygon'].includes(activeTool)) {
      startPoint.current = null;
    }
    
    lastPoint.current = null;
    currentPoint.current = null;
    
    // Redraw the canvas
    redrawCanvas();
  };

  // Helper function to finish a polygon
  const finishPolygon = () => {
    if (inProgressPolygon.current.length < 3) return;
    
    // Create a new polygon shape
    const newShape: Shape = {
      id: crypto.randomUUID(),
      type: activeTool === 'wall-polygon' ? 'wall-polygon' : 'polygon',
      points: [...inProgressPolygon.current],
      color: currentColor,
      fillColor: activeTool === 'yellow-polygon' 
        ? '#FFEB3B' 
        : activeTool === 'green-polygon'
          ? '#4CAF50'
          : fillColor
    };
    
    // Add the new shape
    console.log("Creating finished polygon", { 
      type: newShape.type,
      points: newShape.points.length,
      color: newShape.color,
      fillColor: newShape.fillColor
    });
    
    setShapes([...shapes, newShape]);
    
    // Reset the in-progress polygon
    inProgressPolygon.current = [];
    
    // Reset drawing state
    setIsDrawing(false);
  };

  // Helper function to find a shape at a specific point
  const findShapeAtPoint = (point: Point): Shape | null => {
    // Check shapes in reverse order (top to bottom)
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];
      
      if (shape.type === 'line') {
        // Check if point is on the line
        if (isPointOnLine(point, shape.start, shape.end)) {
          return shape;
        }
      } else if (shape.type === 'rectangle') {
        // Check if point is inside the rectangle
        if (
          point.x >= Math.min(shape.start.x, shape.end.x) &&
          point.x <= Math.max(shape.start.x, shape.end.x) &&
          point.y >= Math.min(shape.start.y, shape.end.y) &&
          point.y <= Math.max(shape.start.y, shape.end.y)
        ) {
          return shape;
        }
      } else if (shape.type === 'polygon' || shape.type === 'wall-polygon') {
        // Check if point is inside the polygon
        if (isPointInPolygon(point, shape.points)) {
          return shape;
        }
      }
    }
    
    return null;
  };

  // Helper function to check if a point is on a line
  const isPointOnLine = (point: Point, lineStart: Point, lineEnd: Point): boolean => {
    const lineLength = Math.sqrt(
      Math.pow(lineEnd.x - lineStart.x, 2) + Math.pow(lineEnd.y - lineStart.y, 2)
    );
    
    if (lineLength === 0) return false;
    
    // Calculate distance from point to line
    const distance = Math.abs(
      (lineEnd.y - lineStart.y) * point.x -
      (lineEnd.x - lineStart.x) * point.y +
      lineEnd.x * lineStart.y -
      lineEnd.y * lineStart.x
    ) / lineLength;
    
    // Check if point is close enough to the line
    if (distance > 5) return false;
    
    // Check if point is within the line segment
    const dotProduct = 
      ((point.x - lineStart.x) * (lineEnd.x - lineStart.x) +
       (point.y - lineStart.y) * (lineEnd.y - lineStart.y)) / 
      (lineLength * lineLength);
    
    return dotProduct >= 0 && dotProduct <= 1;
  };

  // Helper function to check if a point is inside a polygon
  const isPointInPolygon = (point: Point, polygon: Point[]): boolean => {
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      
      const intersect = 
        ((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      
      if (intersect) inside = !inside;
    }
    
    return inside;
  };

  // Helper function to move a shape
  const moveShape = (shape: Shape, dx: number, dy: number): Shape => {
    if (shape.type === 'line') {
      return {
        ...shape,
        start: {
          x: shape.start.x + dx,
          y: shape.start.y + dy
        },
        end: {
          x: shape.end.x + dx,
          y: shape.end.y + dy
        }
      };
    } else if (shape.type === 'rectangle') {
      return {
        ...shape,
        start: {
          x: shape.start.x + dx,
          y: shape.start.y + dy
        },
        end: {
          x: shape.end.x + dx,
          y: shape.end.y + dy
        }
      };
    } else if (shape.type === 'polygon' || shape.type === 'wall-polygon') {
      return {
        ...shape,
        points: shape.points.map(point => ({
          x: point.x + dx,
          y: point.y + dy
        }))
      };
    }
    
    return shape;
  };

  // Helper function to find the nearest endpoint for snapping
  const findNearestEndpoint = (point: Point): Point | null => {
    const snapDistance = 10;
    let closestPoint = null;
    let minDistance = snapDistance;
    
    for (const shape of shapes) {
      if (shape.type === 'line') {
        // Check distance to start point
        const distToStart = Math.sqrt(
          Math.pow(shape.start.x - point.x, 2) + Math.pow(shape.start.y - point.y, 2)
        );
        
        if (distToStart < minDistance) {
          minDistance = distToStart;
          closestPoint = { ...shape.start };
        }
        
        // Check distance to end point
        const distToEnd = Math.sqrt(
          Math.pow(shape.end.x - point.x, 2) + Math.pow(shape.end.y - point.y, 2)
        );
        
        if (distToEnd < minDistance) {
          minDistance = distToEnd;
          closestPoint = { ...shape.end };
        }
      } else if (shape.type === 'polygon' || shape.type === 'wall-polygon') {
        // Check distance to each vertex
        for (const vertex of shape.points) {
          const dist = Math.sqrt(
            Math.pow(vertex.x - point.x, 2) + Math.pow(vertex.y - point.y, 2)
          );
          
          if (dist < minDistance) {
            minDistance = dist;
            closestPoint = { ...vertex };
          }
        }
      }
    }
    
    return closestPoint;
  };

  // Function to delete the selected shape
  const deleteSelected = () => {
    if (selectedShapeId) {
      setShapes(shapes.filter(shape => shape.id !== selectedShapeId));
      setSelectedShapeId(null);
    }
  };

  // Function to clear the canvas
  const clearCanvas = () => {
    setShapes([]);
    setSelectedShapeId(null);
    inProgressPolygon.current = [];
    redrawCanvas();
  };

  // Function to redraw the canvas
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw all shapes
    drawShapes(ctx, shapes, selectedShapeId, fillColor);
    
    // Draw the in-progress polygon if applicable
    if (inProgressPolygon.current.length > 0 && currentPoint.current) {
      // Get the appropriate fill color based on the tool
      let polygonFillColor = fillColor;
      if (activeTool === 'yellow-polygon') {
        polygonFillColor = '#FFEB3B';
      } else if (activeTool === 'green-polygon') {
        polygonFillColor = '#4CAF50';
      }
      
      drawInProgressPolygon(
        ctx,
        inProgressPolygon.current,
        currentPoint.current,
        currentColor,
        polygonFillColor,
        activeTool === 'wall-polygon'
      );
    }
  };

  // Effect to redraw the canvas when shapes or selected shape changes
  useEffect(() => {
    redrawCanvas();
  }, [shapes, selectedShapeId, fillColor]);

  // Effect to handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      // Update canvas size based on parent container
      const parent = canvas.parentElement;
      if (parent) {
        setCanvasSize({
          width: parent.clientWidth,
          height: parent.clientHeight
        });
      }
    };
    
    // Initial resize
    handleResize();
    
    // Add resize event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Effect to update canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    
    redrawCanvas();
  }, [canvasSize]);

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
    setSelectedShapeId,
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
    snapToExtensions,
    toggleSnapToExtensions,
    rectangleDrawMode,
    toggleRectangleDrawMode,
    isDrawing  // Expose the isDrawing state to the component
  };
};
