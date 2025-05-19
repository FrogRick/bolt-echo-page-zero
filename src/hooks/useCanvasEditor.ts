import { useRef, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export type Tool = 'select' | 'line' | 'rectangle' | 'polygon';

export const useCanvasEditor = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [currentColor, setCurrentColor] = useState<string>('#000000');
  const [fillColor, setFillColor] = useState<string>('#ffffff');
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number, y: number } | null>(null);
  const [currentPoint, setCurrentPoint] = useState<{ x: number, y: number } | null>(null);
  const [polygonPoints, setPolygonPoints] = useState<Array<{ x: number, y: number }>>([]);
  const [shapes, setShapes] = useState<any[]>([]);
  const [selectedShape, setSelectedShape] = useState<any | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [previewLine, setPreviewLine] = useState<{ start: { x: number, y: number }, end: { x: number, y: number } } | null>(null);

  // Clear the canvas and redraw all shapes
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all saved shapes
    shapes.forEach(shape => {
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = 2;
      ctx.fillStyle = shape.fillColor || fillColor;

      if (shape.type === 'line') {
        ctx.beginPath();
        ctx.moveTo(shape.start.x, shape.start.y);
        ctx.lineTo(shape.end.x, shape.end.y);
        ctx.stroke();
      } else if (shape.type === 'rectangle') {
        ctx.beginPath();
        ctx.rect(
          shape.start.x,
          shape.start.y,
          shape.end.x - shape.start.x,
          shape.end.y - shape.start.y
        );
        ctx.fill();
        ctx.stroke();
      } else if (shape.type === 'polygon') {
        if (shape.points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(shape.points[0].x, shape.points[0].y);
          
          for (let i = 1; i < shape.points.length; i++) {
            ctx.lineTo(shape.points[i].x, shape.points[i].y);
          }
          
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }

      // Highlight selected shape
      if (selectedShape && shape.id === selectedShape.id) {
        ctx.strokeStyle = '#0000FF';
        ctx.lineWidth = 3;
        
        if (shape.type === 'line') {
          ctx.beginPath();
          ctx.moveTo(shape.start.x, shape.start.y);
          ctx.lineTo(shape.end.x, shape.end.y);
          ctx.stroke();
        } else if (shape.type === 'rectangle') {
          ctx.strokeRect(
            shape.start.x,
            shape.start.y,
            shape.end.x - shape.start.x,
            shape.end.y - shape.start.y
          );
        } else if (shape.type === 'polygon') {
          if (shape.points.length > 0) {
            ctx.beginPath();
            ctx.moveTo(shape.points[0].x, shape.points[0].y);
            
            for (let i = 1; i < shape.points.length; i++) {
              ctx.lineTo(shape.points[i].x, shape.points[i].y);
            }
            
            ctx.closePath();
            ctx.stroke();
          }
        }
      }
    });

    // Draw polygon in progress
    if (activeTool === 'polygon' && polygonPoints.length > 0) {
      ctx.strokeStyle = currentColor;
      ctx.fillStyle = fillColor;
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
      
      for (let i = 1; i < polygonPoints.length; i++) {
        ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
      }
      
      if (currentPoint) {
        ctx.lineTo(currentPoint.x, currentPoint.y);
      }
      
      ctx.stroke();
    }

    // Draw preview line when using the line tool
    if (activeTool === 'line' && startPoint && currentPoint) {
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(currentPoint.x, currentPoint.y);
      ctx.stroke();
    }
    
    // Draw preview line for single click line tool
    if (previewLine) {
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.moveTo(previewLine.start.x, previewLine.start.y);
      ctx.lineTo(previewLine.end.x, previewLine.end.y);
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
    
    if (activeTool === 'select') {
      // Check if we clicked on a shape
      const clickedShape = shapes.find(shape => {
        if (shape.type === 'line') {
          // Simple distance-based hit test for lines
          const dx = shape.end.x - shape.start.x;
          const dy = shape.end.y - shape.start.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          
          if (length === 0) return false;
          
          const t = ((x - shape.start.x) * dx + (y - shape.start.y) * dy) / (length * length);
          const clampedT = Math.max(0, Math.min(1, t));
          
          const closestX = shape.start.x + clampedT * dx;
          const closestY = shape.start.y + clampedT * dy;
          
          const distance = Math.sqrt(Math.pow(x - closestX, 2) + Math.pow(y - closestY, 2));
          return distance < 5; // 5px hit area
        } else if (shape.type === 'rectangle') {
          return (
            x >= Math.min(shape.start.x, shape.end.x) &&
            x <= Math.max(shape.start.x, shape.end.x) &&
            y >= Math.min(shape.start.y, shape.end.y) &&
            y <= Math.max(shape.start.y, shape.end.y)
          );
        } else if (shape.type === 'polygon') {
          // Check if point is inside polygon
          let inside = false;
          for (let i = 0, j = shape.points.length - 1; i < shape.points.length; j = i++) {
            const xi = shape.points[i].x, yi = shape.points[i].y;
            const xj = shape.points[j].x, yj = shape.points[j].y;
            
            const intersect = ((yi > y) !== (yj > y)) && 
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
          }
          return inside;
        }
        return false;
      });
      
      if (clickedShape) {
        setSelectedShape(clickedShape);
        setIsDragging(true);
        setDragOffset({
          x: clickedShape.type === 'rectangle' ? x - clickedShape.start.x : x,
          y: clickedShape.type === 'rectangle' ? y - clickedShape.start.y : y
        });
      } else {
        setSelectedShape(null);
      }
    } else if (activeTool === 'line') {
      // Updated line tool behavior for the new workflow:
      // If there's no start point, set it and show preview immediately
      if (!startPoint) {
        setStartPoint({ x, y });
        setCurrentPoint({ x, y });
        setPreviewLine({
          start: { x, y },
          end: { x, y }
        });
      } else {
        // If there's already a start point, complete the line and reset
        const shape = {
          id: uuidv4(),
          type: 'line',
          start: { ...startPoint },
          end: { x, y },
          color: currentColor
        };
        
        setShapes([...shapes, shape]);
        setStartPoint(null);
        setPreviewLine(null);
        
        // No longer automatically switch back to select tool
        // The user must click again to start a new line
      }
    } else if (activeTool === 'rectangle') {
      setStartPoint({ x, y });
      setIsDrawing(true);
    } else if (activeTool === 'polygon') {
      if (polygonPoints.length === 0) {
        // First point of a new polygon
        setPolygonPoints([{ x, y }]);
      } else {
        // Check if we're closing the polygon (clicking near the first point)
        const firstPoint = polygonPoints[0];
        const distance = Math.sqrt(Math.pow(x - firstPoint.x, 2) + Math.pow(y - firstPoint.y, 2));
        
        if (polygonPoints.length > 2 && distance < 10) {
          // Close the polygon and save it
          const shape = {
            id: uuidv4(),
            type: 'polygon',
            points: [...polygonPoints],
            color: currentColor,
            fillColor: fillColor
          };
          
          setShapes([...shapes, shape]);
          setPolygonPoints([]);
        } else {
          // Add a new point to the polygon
          setPolygonPoints([...polygonPoints, { x, y }]);
        }
      }
    }
  };

  // Handle mouse move event
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCurrentPoint({ x, y });
    
    if (isDragging && selectedShape) {
      // Move the selected shape
      const updatedShapes = shapes.map(shape => {
        if (shape.id === selectedShape.id) {
          if (shape.type === 'line') {
            const dx = x - dragOffset.x;
            const dy = y - dragOffset.y;
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
              start: { x: x - dragOffset.x, y: y - dragOffset.y },
              end: {
                x: x - dragOffset.x + (shape.end.x - shape.start.x),
                y: y - dragOffset.y + (shape.end.y - shape.start.y)
              }
            };
          } else if (shape.type === 'polygon') {
            // Move all points of the polygon
            const dx = x - dragOffset.x;
            const dy = y - dragOffset.y;
            dragOffset.x = x;
            dragOffset.y = y;
            
            return {
              ...shape,
              points: shape.points.map((point: {x: number, y: number}) => ({
                x: point.x + dx,
                y: point.y + dy
              }))
            };
          }
        }
        return shape;
      });
      
      setShapes(updatedShapes);
      setSelectedShape(updatedShapes.find(shape => shape.id === selectedShape.id));
    } else if (activeTool === 'line' && startPoint) {
      // Update the preview line as mouse moves
      setPreviewLine({
        start: startPoint,
        end: { x, y }
      });
      redrawCanvas();
    } else if (isDrawing) {
      if (activeTool === 'rectangle') {
        redrawCanvas();
      }
    } else if (activeTool === 'polygon' && polygonPoints.length > 0) {
      // Update the current point for polygon preview
      redrawCanvas();
    }
  };

  // Handle mouse up event
  const endDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (activeTool === 'rectangle' && startPoint) {
      // Complete rectangle on mouse up
      const shape = {
        id: uuidv4(),
        type: 'rectangle',
        start: { ...startPoint },
        end: { x, y },
        color: currentColor,
        fillColor: fillColor
      };
      
      setShapes([...shapes, shape]);
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
