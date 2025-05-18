
import { useState, useRef, useEffect } from "react";

export type Tool = "select" | "draw" | "rectangle" | "circle" | "text" | "eraser";
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
  text?: string;
};

export const useCanvasEditor = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [objects, setObjects] = useState<CanvasObject[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [currentColor, setCurrentColor] = useState("#000000");
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

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
      ctx.fillStyle = obj.color;
      
      switch (obj.type) {
        case "rect":
          ctx.strokeRect(obj.x, obj.y, obj.width || 0, obj.height || 0);
          break;
        case "circle":
          ctx.beginPath();
          ctx.arc(obj.x, obj.y, obj.radius || 0, 0, Math.PI * 2);
          ctx.stroke();
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
        } else if (obj.type === "circle") {
          ctx.beginPath();
          ctx.arc(obj.x, obj.y, (obj.radius || 0) + 5, 0, Math.PI * 2);
          ctx.stroke();
        }
        
        ctx.setLineDash([]);
      }
    });
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (activeTool === "select") {
      // Select object
      const clicked = objects.findIndex(obj => {
        if (obj.type === "rect") {
          return x >= obj.x && x <= obj.x + (obj.width || 0) && 
                 y >= obj.y && y <= obj.y + (obj.height || 0);
        } else if (obj.type === "circle") {
          const distance = Math.sqrt(Math.pow(x - obj.x, 2) + Math.pow(y - obj.y, 2));
          return distance <= (obj.radius || 0);
        }
        return false;
      });
      
      if (clicked !== -1) {
        setSelectedObject(objects[clicked].id);
      } else {
        setSelectedObject(null);
      }
    } else if (activeTool === "draw") {
      setIsDrawing(true);
      setCurrentPoints([{ x, y }]);
    } else if (activeTool === "rectangle" || activeTool === "circle") {
      setIsDrawing(true);
      setCurrentPoints([{ x, y }]);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (activeTool === "draw") {
      setCurrentPoints(prev => [...prev, { x, y }]);
      
      // Live preview
      if (contextRef.current && currentPoints.length > 0) {
        const ctx = contextRef.current;
        ctx.strokeStyle = currentColor;
        ctx.beginPath();
        ctx.moveTo(currentPoints[currentPoints.length - 1].x, currentPoints[currentPoints.length - 1].y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    } else if (activeTool === "rectangle" || activeTool === "circle") {
      // Update for preview
      if (currentPoints.length > 0) {
        renderObjects(); // Redraw existing objects
        
        if (contextRef.current) {
          const ctx = contextRef.current;
          ctx.strokeStyle = currentColor;
          
          const startX = currentPoints[0].x;
          const startY = currentPoints[0].y;
          
          if (activeTool === "rectangle") {
            const width = x - startX;
            const height = y - startY;
            ctx.strokeRect(startX, startY, width, height);
          } else {
            const radius = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2));
            ctx.beginPath();
            ctx.arc(startX, startY, radius, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }
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
    
    if (activeTool === "draw" && currentPoints.length > 0) {
      const newObject: CanvasObject = {
        id: crypto.randomUUID(),
        type: "path",
        x: currentPoints[0].x,
        y: currentPoints[0].y,
        points: [...currentPoints, { x, y }],
        color: currentColor,
      };
      
      setObjects(prev => [...prev, newObject]);
    } else if (activeTool === "rectangle" && currentPoints.length > 0) {
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
      };
      
      setObjects(prev => [...prev, newObject]);
    } else if (activeTool === "circle" && currentPoints.length > 0) {
      const startX = currentPoints[0].x;
      const startY = currentPoints[0].y;
      const radius = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2));
      
      const newObject: CanvasObject = {
        id: crypto.randomUUID(),
        type: "circle",
        x: startX,
        y: startY,
        radius,
        color: currentColor,
      };
      
      setObjects(prev => [...prev, newObject]);
    }
    
    setIsDrawing(false);
    setCurrentPoints([]);
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
    selectedObject,
    startDrawing,
    draw,
    endDrawing,
    addText,
    deleteSelected,
    clearCanvas,
    setCanvasBackground,
    resizeCanvas,
    canvasSize
  };
};
