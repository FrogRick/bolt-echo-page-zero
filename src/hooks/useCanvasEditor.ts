import { useState, useRef, useEffect } from "react";

export type Tool = "select" | "line" | "rectangle" | "polygon";
export type CanvasObject = {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: { x: number; y: number }[];
  color: string;
  fillColor?: string;
  text?: string;
  filled?: boolean;
};

export const useCanvasEditor = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [objects, setObjects] = useState<CanvasObject[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [currentColor, setCurrentColor] = useState("#000000");
  const [fillColor, setFillColor] = useState("#9b87f5");
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [waitingForSecondClick, setWaitingForSecondClick] = useState(false);
  const [tempStartPoint, setTempStartPoint] = useState<{ x: number, y: number } | null>(null);
  const [polygonPoints, setPolygonPoints] = useState<{ x: number, y: number }[]>([]);

  // Initialize canvas
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvasSize.width;
      canvas.height = canvasSize.height;
      
      const context = canvas.getContext("2d");
      if (context) {
        context.lineCap = "round";
        context.strokeStyle = currentColor;
        context.lineWidth = 2;
        contextRef.current = context;
        
        // Initial clear
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw existing objects
        renderObjects();
      }
    }
  }, [canvasRef.current, canvasSize]);

  // Re-render when objects change
  useEffect(() => {
    renderObjects();
  }, [objects, selectedObject, currentColor]);

  const renderObjects = () => {
    if (!contextRef.current || !canvasRef.current) return;
    
    const ctx = contextRef.current;
    const canvas = canvasRef.current;
    
    // Clear canvas
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw all objects
    objects.forEach(obj => {
      // Set styles based on whether object is selected
      ctx.strokeStyle = obj.id === selectedObject ? "#1e88e5" : obj.color;
      ctx.fillStyle = obj.fillColor || fillColor;
      
      switch (obj.type) {
        case "rect":
          ctx.strokeRect(obj.x, obj.y, obj.width || 0, obj.height || 0);
          if (obj.filled) {
            ctx.fillRect(obj.x, obj.y, obj.width || 0, obj.height || 0);
          }
          break;
        case "line":
          if (obj.points && obj.points.length >= 2) {
            ctx.beginPath();
            ctx.moveTo(obj.points[0].x, obj.points[0].y);
            ctx.lineTo(obj.points[1].x, obj.points[1].y);
            ctx.stroke();
          }
          break;
        case "polygon":
          if (obj.points && obj.points.length > 2) {
            ctx.beginPath();
            ctx.moveTo(obj.points[0].x, obj.points[0].y);
            for (let i = 1; i < obj.points.length; i++) {
              ctx.lineTo(obj.points[i].x, obj.points[i].y);
            }
            ctx.closePath();
            if (obj.filled) {
              ctx.fill();
            }
            ctx.stroke();
          }
          break;
        case "path":
          if (obj.points && obj.points.length > 0) {
            ctx.beginPath();
            ctx.moveTo(obj.points[0].x, obj.points[0].y);
            for (let i = 1; i < obj.points.length; i++) {
              ctx.lineTo(obj.points[i].x, obj.points[i].y);
            }
            ctx.stroke();
          }
          break;
        case "text":
          if (obj.text) {
            ctx.font = "16px Arial";
            ctx.fillStyle = obj.color;
            ctx.fillText(obj.text, obj.x, obj.y);
          }
          break;
      }
      
      // Draw selection indicator if selected
      if (obj.id === selectedObject) {
        ctx.strokeStyle = "#1e88e5";
        ctx.setLineDash([5, 5]);
        
        if (obj.type === "rect") {
          ctx.strokeRect(obj.x - 5, obj.y - 5, (obj.width || 0) + 10, (obj.height || 0) + 10);
        } else if (obj.type === "line" && obj.points && obj.points.length >= 2) {
          ctx.beginPath();
          ctx.moveTo(obj.points[0].x, obj.points[0].y);
          ctx.lineTo(obj.points[1].x, obj.points[1].y);
          ctx.stroke();
        } else if (obj.type === "polygon" && obj.points && obj.points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(obj.points[0].x, obj.points[0].y);
          for (let i = 1; i < obj.points.length; i++) {
            ctx.lineTo(obj.points[i].x, obj.points[i].y);
          }
          ctx.closePath();
          ctx.stroke();
        }
        
        ctx.setLineDash([]);
      }
    });
    
    // Draw current polygon if in progress
    if (activeTool === "polygon" && polygonPoints.length > 0) {
      ctx.strokeStyle = currentColor;
      ctx.beginPath();
      ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
      
      for (let i = 1; i < polygonPoints.length; i++) {
        ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
      }
      
      // If user is currently drawing (moving mouse)
      if (isDrawing && tempStartPoint) {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = tempStartPoint.x;
        const y = tempStartPoint.y;
        ctx.lineTo(x, y);
      }
      
      ctx.stroke();
    }
    
    // Draw current line if in progress
    if (activeTool === "line" && waitingForSecondClick && tempStartPoint) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = tempStartPoint.x;
      const y = tempStartPoint.y;
      
      if (isDrawing && currentPoints.length > 0) {
        ctx.strokeStyle = currentColor;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(currentPoints[0].x, currentPoints[0].y);
        ctx.stroke();
      }
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (activeTool === "line") {
      if (!waitingForSecondClick) {
        // First click - store the starting point
        setTempStartPoint({ x, y });
        setWaitingForSecondClick(true);
      } else {
        // Second click - create the line
        if (tempStartPoint) {
          const newObject: CanvasObject = {
            id: crypto.randomUUID(),
            type: "line",
            x: 0, // Not really used for lines
            y: 0, // Not really used for lines
            points: [
              { x: tempStartPoint.x, y: tempStartPoint.y },
              { x, y }
            ],
            color: currentColor,
          };
          setObjects(prev => [...prev, newObject]);
        }
        // Reset for next line
        setWaitingForSecondClick(false);
        setTempStartPoint(null);
      }
    } else if (activeTool === "polygon") {
      // If this is a new polygon
      if (polygonPoints.length === 0) {
        setPolygonPoints([{ x, y }]);
        setTempStartPoint({ x, y }); // Set temp start point for preview
      } 
      // If clicking near the start point and we have at least 3 points, complete the polygon
      else if (
        polygonPoints.length > 2 && 
        Math.abs(x - polygonPoints[0].x) < 10 && 
        Math.abs(y - polygonPoints[0].y) < 10
      ) {
        const newObject: CanvasObject = {
          id: crypto.randomUUID(),
          type: "polygon",
          x: polygonPoints[0].x,
          y: polygonPoints[0].y,
          points: [...polygonPoints],
          color: currentColor,
          fillColor: fillColor,
          filled: true,
        };
        setObjects(prev => [...prev, newObject]);
        setPolygonPoints([]);
        setTempStartPoint(null);
      } 
      // Add a new point to the polygon
      else {
        setPolygonPoints(prev => [...prev, { x, y }]);
      }
    }
    
    // Re-render to show any changes
    renderObjects();
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    
    if (activeTool === "select") {
      // Select object
      const clicked = objects.findIndex(obj => {
        if (obj.type === "rect") {
          return x >= obj.x && x <= obj.x + (obj.width || 0) && 
                 y >= obj.y && y <= obj.y + (obj.height || 0);
        } else if (obj.type === "line" && obj.points && obj.points.length >= 2) {
          // Simple line click detection
          const p1 = obj.points[0];
          const p2 = obj.points[1];
          const distance = distanceToLine(p1.x, p1.y, p2.x, p2.y, x, y);
          return distance < 5; // 5px threshold for line selection
        } else if (obj.type === "polygon" && obj.points && obj.points.length > 2) {
          return isPointInPolygon(x, y, obj.points);
        }
        return false;
      });
      
      if (clicked !== -1) {
        setSelectedObject(objects[clicked].id);
      } else {
        setSelectedObject(null);
      }
    } else if (activeTool === "rectangle") {
      setCurrentPoints([{ x, y }]);
    } else if (activeTool === "line") {
      if (!waitingForSecondClick) {
        setTempStartPoint({ x, y });
        setWaitingForSecondClick(true);
      } else {
        setCurrentPoints([{ x, y }]);
      }
    } else if (activeTool === "polygon") {
      setTempStartPoint({ x, y });
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (activeTool === "rectangle") {
      // Update for preview
      if (currentPoints.length > 0) {
        renderObjects(); // Redraw existing objects
        
        if (contextRef.current) {
          const ctx = contextRef.current;
          ctx.strokeStyle = currentColor;
          
          const startX = currentPoints[0].x;
          const startY = currentPoints[0].y;
          const width = x - startX;
          const height = y - startY;
          
          ctx.strokeRect(startX, startY, width, height);
        }
      }
    } else if (activeTool === "line" && waitingForSecondClick && tempStartPoint) {
      renderObjects(); // Redraw existing objects
      
      if (contextRef.current) {
        const ctx = contextRef.current;
        ctx.strokeStyle = currentColor;
        
        ctx.beginPath();
        ctx.moveTo(tempStartPoint.x, tempStartPoint.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    } else if (activeTool === "polygon" && polygonPoints.length > 0) {
      // Update the temp point to the current mouse position for preview
      setTempStartPoint({ x, y });
      renderObjects();
    }
  };

  const endDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) {
      setIsDrawing(false);
      return;
    }
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (activeTool === "rectangle" && currentPoints.length > 0) {
      const startX = currentPoints[0].x;
      const startY = currentPoints[0].y;
      const width = x - startX;
      const height = y - startY;
      
      const newObject: CanvasObject = {
        id: crypto.randomUUID(),
        type: "rect",
        x: startX,
        y: startY,
        width,
        height,
        color: currentColor,
        fillColor: fillColor,
        filled: true
      };
      
      setObjects(prev => [...prev, newObject]);
    } else if (activeTool === "line" && waitingForSecondClick && tempStartPoint) {
      const newObject: CanvasObject = {
        id: crypto.randomUUID(),
        type: "line",
        x: 0, // These are not really used for lines
        y: 0,
        points: [
          { x: tempStartPoint.x, y: tempStartPoint.y },
          { x, y }
        ],
        color: currentColor,
      };
      
      setObjects(prev => [...prev, newObject]);
      setWaitingForSecondClick(false);
      setTempStartPoint(null);
    }
    
    setIsDrawing(false);
    setCurrentPoints([]);
  };
  
  // Utility function to check if a point is inside a polygon
  const isPointInPolygon = (x: number, y: number, points: {x: number, y: number}[]) => {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i].x, yi = points[i].y;
      const xj = points[j].x, yj = points[j].y;
      
      const intersect = ((yi > y) !== (yj > y))
          && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };
  
  // Utility function to calculate distance from a point to a line
  const distanceToLine = (x1: number, y1: number, x2: number, y2: number, x: number, y: number) => {
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;
    if (len_sq !== 0) param = dot / len_sq;
    
    let xx, yy;
    
    if (param < 0) {
      xx = x1;
      yy = y1;
    }
    else if (param > 1) {
      xx = x2;
      yy = y2;
    }
    else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    
    const dx = x - xx;
    const dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const addText = (text: string) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const newObject: CanvasObject = {
      id: crypto.randomUUID(),
      type: "text",
      x: canvas.width / 2,
      y: canvas.height / 2,
      color: currentColor,
      text,
    };
    
    setObjects(prev => [...prev, newObject]);
    setSelectedObject(newObject.id);
  };

  const deleteSelected = () => {
    if (!selectedObject) return;
    setObjects(prev => prev.filter(obj => obj.id !== selectedObject));
    setSelectedObject(null);
  };

  const clearCanvas = () => {
    setObjects([]);
    setSelectedObject(null);
    setPolygonPoints([]);
    setWaitingForSecondClick(false);
    setTempStartPoint(null);
    
    if (contextRef.current && canvasRef.current) {
      contextRef.current.fillStyle = "#ffffff";
      contextRef.current.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const setCanvasBackground = (color: string) => {
    if (contextRef.current && canvasRef.current) {
      contextRef.current.fillStyle = color;
      contextRef.current.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const resizeCanvas = (width: number, height: number) => {
    setCanvasSize({ width, height });
  };

  return {
    canvasRef,
    objects,
    activeTool,
    setActiveTool,
    currentColor,
    setCurrentColor,
    fillColor,
    setFillColor,
    selectedObject,
    startDrawing,
    draw,
    endDrawing,
    handleCanvasClick,
    addText,
    deleteSelected,
    clearCanvas,
    setCanvasBackground,
    resizeCanvas,
    canvasSize,
    isDrawing,
    waitingForSecondClick,
    polygonPoints
  };
};
