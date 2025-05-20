
import { useCallback, useEffect, useRef, useState } from "react";
import { Tool, Point } from "@/types/canvas";
import { drawPreviewWall, drawPreviewRectangle, drawPreviewPolygon, drawSelectedElements, drawPreviewCircle, drawPreviewLine } from "@/utils/canvasDrawing";
import { v4 as uuidv4 } from "uuid";

interface CanvasSize {
  width: number;
  height: number;
}

type CanvasElement = {
  id: string;
  type: string;
  points: { x: number; y: number }[];
  color: string;
  fillColor?: string;
  selected?: boolean;
};

type ImageElement = {
  id: string;
  type: "image";
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
  contentType: string;
  selected?: boolean;
};

export const useCanvasEditor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [elements, setElements] = useState<(CanvasElement | ImageElement)[]>([]);
  const [drawingPoints, setDrawingPoints] = useState<{ x: number; y: number }[]>([]);
  const [currentColor, setCurrentColor] = useState("#ff0000");
  const [fillColor, setFillColor] = useState("#ffff00");
  
  // Rectangle specific state
  const [isFirstPointSet, setIsFirstPointSet] = useState(false);
  const [firstPoint, setFirstPoint] = useState<{ x: number; y: number } | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  
  // Snap settings
  const [snapToAngle, setSnapToAngle] = useState(true);
  const [snapToEndpoints, setSnapToEndpoints] = useState(true);
  const [snapToLines, setSnapToLines] = useState(true);
  const [snapToExtensions, setSnapToExtensions] = useState(true);
  
  // Canvas panning
  const [isPanning, setIsPanning] = useState(false);
  const [startPanPoint, setStartPanPoint] = useState<{ x: number; y: number } | null>(null);
  const [canvasOffset, setCanvasOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  const canvasSize: CanvasSize = {
    width: 800,
    height: 600,
  };

  // Function to load an image and get its dimensions
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = src;
    });
  };

  // Add image to canvas
  const addImage = async (src: string, contentType: string) => {
    try {
      const img = await loadImage(src);
      
      // Calculate dimensions to fit within canvas while maintaining aspect ratio
      let width = img.width;
      let height = img.height;
      const maxWidth = canvasSize.width * 0.8;
      const maxHeight = canvasSize.height * 0.8;
      
      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = height * ratio;
      }
      
      if (height > maxHeight) {
        const ratio = maxHeight / height;
        height = maxHeight;
        width = width * ratio;
      }
      
      // Position the image in the center of the canvas
      const x = (canvasSize.width - width) / 2;
      const y = (canvasSize.height - height) / 2;
      
      const newImage: ImageElement = {
        id: uuidv4(),
        type: "image",
        x,
        y,
        width,
        height,
        src,
        contentType,
        selected: false
      };
      
      setElements(prev => [...prev, newImage]);
      redrawCanvas();
    } catch (error) {
      console.error("Failed to add image:", error);
      throw error;
    }
  };

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply canvas offset for panning
    ctx.save();
    ctx.translate(canvasOffset.x, canvasOffset.y);
    
    // Draw all elements
    elements.forEach(element => {
      if (element.type === "image") {
        // Draw image elements
        const imgEl = element as ImageElement;
        const img = new Image();
        img.src = imgEl.src;
        
        if (imgEl.selected) {
          // Draw selection border
          ctx.strokeStyle = "#3b82f6";
          ctx.lineWidth = 2;
          ctx.strokeRect(imgEl.x - 5, imgEl.y - 5, imgEl.width + 10, imgEl.height + 10);
        }
        
        ctx.drawImage(img, imgEl.x, imgEl.y, imgEl.width, imgEl.height);
      } else {
        // Draw vector elements
        const vecEl = element as CanvasElement;
        switch (vecEl.type) {
          case "wall":
            ctx.beginPath();
            ctx.strokeStyle = vecEl.color;
            ctx.lineWidth = 3;
            
            vecEl.points.forEach((point, index) => {
              if (index === 0) {
                ctx.moveTo(point.x, point.y);
              } else {
                ctx.lineTo(point.x, point.y);
              }
            });
            
            ctx.stroke();
            break;
          case "yellow-rectangle":
          case "green-rectangle":
            if (vecEl.points.length === 2) {
              ctx.beginPath();
              ctx.strokeStyle = vecEl.color;
              ctx.fillStyle = vecEl.fillColor || "transparent";
              ctx.lineWidth = 2;
              
              const x = Math.min(vecEl.points[0].x, vecEl.points[1].x);
              const y = Math.min(vecEl.points[0].y, vecEl.points[1].y);
              const width = Math.abs(vecEl.points[1].x - vecEl.points[0].x);
              const height = Math.abs(vecEl.points[1].y - vecEl.points[0].y);
              
              ctx.rect(x, y, width, height);
              ctx.fill();
              ctx.stroke();
            }
            break;
          case "wall-polygon":
          case "yellow-polygon":
          case "green-polygon":
            if (vecEl.points.length > 1) {
              ctx.beginPath();
              ctx.strokeStyle = vecEl.color;
              ctx.fillStyle = vecEl.fillColor || "transparent";
              ctx.lineWidth = 2;
              
              ctx.moveTo(vecEl.points[0].x, vecEl.points[0].y);
              
              for (let i = 1; i < vecEl.points.length; i++) {
                ctx.lineTo(vecEl.points[i].x, vecEl.points[i].y);
              }
              
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
              
              // Add red dot to the start point for polygon if it's not a wall
              if (vecEl.type !== "wall-polygon") {
                ctx.beginPath();
                ctx.fillStyle = "red";
                ctx.arc(vecEl.points[0].x, vecEl.points[0].y, 5, 0, Math.PI * 2);
                ctx.fill();
              }
            }
            break;
        }
        
        // Draw selection if element is selected
        if (vecEl.selected) {
          drawSelectedElements(ctx, [vecEl]);
        }
      }
    });
    
    // Draw preview elements
    if (activeTool === "wall" && drawingPoints.length > 0) {
      drawPreviewWall(ctx, drawingPoints, mousePosition, currentColor);
    } else if ((activeTool === "yellow-rectangle" || activeTool === "green-rectangle") && isFirstPointSet && firstPoint && mousePosition) {
      const color = activeTool === "yellow-rectangle" ? "#FFD700" : "#00FF00";
      const fillColorValue = activeTool === "yellow-rectangle" ? "rgba(255, 215, 0, 0.5)" : "rgba(0, 255, 0, 0.5)";
      drawPreviewRectangle(ctx, firstPoint, mousePosition, color, fillColorValue);
    } else if (["wall-polygon", "yellow-polygon", "green-polygon"].includes(activeTool) && drawingPoints.length > 0) {
      const color = 
        activeTool === "yellow-polygon" ? "#FFD700" : 
        activeTool === "green-polygon" ? "#00FF00" : "#FF0000";
      const fillColorValue = 
        activeTool === "yellow-polygon" ? "rgba(255, 215, 0, 0.5)" : 
        activeTool === "green-polygon" ? "rgba(0, 255, 0, 0.5)" : "transparent";
      const isWall = activeTool === "wall-polygon";
      drawPreviewPolygon(ctx, drawingPoints, mousePosition, color, fillColorValue, !isWall);
    }
    
    ctx.restore();
  }, [
    elements, 
    drawingPoints, 
    activeTool, 
    currentColor, 
    mousePosition, 
    isFirstPointSet, 
    firstPoint, 
    canvasOffset
  ]);

  // Redraw canvas whenever elements or drawing points change
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Handle element selection and dragging
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - canvasOffset.x;
    const y = e.clientY - rect.top - canvasOffset.y;
    
    // Handle panning (with middle mouse button or when holding down Alt)
    if (e.button === 1 || e.altKey) {
      setIsPanning(true);
      setStartPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }
    
    // Handle panning with left click if no tool is active and mouse is held down
    if (e.button === 0 && !isPanning) {
      const mouseMoveStart = Date.now();
      const startX = e.clientX;
      const startY = e.clientY;
      
      const mouseMoveTimeout = setTimeout(() => {
        if (Math.abs(e.clientX - startX) < 5 && Math.abs(e.clientY - startY) < 5) {
          setIsPanning(true);
          setStartPanPoint({ x: e.clientX, y: e.clientY });
        }
      }, 200); // Wait 200ms before activating pan mode
      
      const clearMouseMoveTimeout = () => {
        clearTimeout(mouseMoveTimeout);
        window.removeEventListener('mouseup', clearMouseMoveTimeout);
      };
      
      window.addEventListener('mouseup', clearMouseMoveTimeout);
      return;
    }
    
    // If we're in selection mode, check if we clicked on an element
    if (activeTool === "select") {
      // First check for image elements as they're rectangular
      let selectedImage: ImageElement | undefined = elements.find(el => 
        el.type === "image" && 
        x >= (el as ImageElement).x && x <= (el as ImageElement).x + (el as ImageElement).width && 
        y >= (el as ImageElement).y && y <= (el as ImageElement).y + (el as ImageElement).height
      ) as ImageElement | undefined;
      
      // Then check other elements
      let selectedElement = !selectedImage ? elements.find(el => {
        if (el.type === "image") return false; // Skip images as we already checked them
        
        const vecEl = el as CanvasElement;
        if (vecEl.type.includes("rectangle") && vecEl.points.length === 2) {
          const minX = Math.min(vecEl.points[0].x, vecEl.points[1].x);
          const maxX = Math.max(vecEl.points[0].x, vecEl.points[1].x);
          const minY = Math.min(vecEl.points[0].y, vecEl.points[1].y);
          const maxY = Math.max(vecEl.points[0].y, vecEl.points[1].y);
          
          return x >= minX && x <= maxX && y >= minY && y <= maxY;
        }
        
        return false;
      }) : undefined;
      
      // Update element selection state
      setElements(prev => prev.map(el => ({
        ...el,
        selected: (el === selectedImage || el === selectedElement)
      })));
      
      redrawCanvas();
      return;
    }
    
    // Handle drawing based on active tool
    switch (activeTool) {
      case "wall":
        if (drawingPoints.length === 0) {
          setDrawingPoints([{ x, y }]);
        } else {
          setDrawingPoints(prev => [...prev, { x, y }]);
        }
        break;
        
      case "yellow-rectangle":
      case "green-rectangle":
        if (!isFirstPointSet) {
          setFirstPoint({ x, y });
          setIsFirstPointSet(true);
        } else {
          // Complete the rectangle
          const newElement: CanvasElement = {
            id: uuidv4(),
            type: activeTool,
            points: [firstPoint!, { x, y }],
            color: activeTool === "yellow-rectangle" ? "#FFD700" : "#00FF00",
            fillColor: activeTool === "yellow-rectangle" ? "#FFFF00" : "#00FF00",
          };
          
          setElements(prev => [...prev, newElement]);
          setIsFirstPointSet(false);
          setFirstPoint(null);
        }
        break;
        
      case "wall-polygon":
      case "yellow-polygon":
      case "green-polygon":
        if (drawingPoints.length === 0) {
          setDrawingPoints([{ x, y }]);
        } else {
          // Check if we're closing the polygon (clicking near the first point)
          const firstPoint = drawingPoints[0];
          const distance = Math.sqrt(
            Math.pow(x - firstPoint.x, 2) + Math.pow(y - firstPoint.y, 2)
          );
          
          if (drawingPoints.length > 2 && distance < 20) {
            // Close the polygon
            const newElement: CanvasElement = {
              id: uuidv4(),
              type: activeTool,
              points: [...drawingPoints],
              color: 
                activeTool === "yellow-polygon" ? "#FFD700" : 
                activeTool === "green-polygon" ? "#00FF00" : currentColor,
              fillColor: 
                activeTool === "yellow-polygon" ? "#FFFF00" : 
                activeTool === "green-polygon" ? "#00FF00" : undefined,
            };
            
            setElements(prev => [...prev, newElement]);
            setDrawingPoints([]);
          } else {
            // Add a new point
            setDrawingPoints(prev => [...prev, { x, y }]);
          }
        }
        break;
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - canvasOffset.x;
    const y = e.clientY - rect.top - canvasOffset.y;
    
    // Handle panning
    if (isPanning && startPanPoint) {
      const deltaX = e.clientX - startPanPoint.x;
      const deltaY = e.clientY - startPanPoint.y;
      setCanvasOffset(prev => ({ 
        x: prev.x + deltaX, 
        y: prev.y + deltaY 
      }));
      setStartPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }
    
    setMousePosition({ x, y });
    redrawCanvas();
  };

  const endDrawing = () => {
    setIsPanning(false);
    setStartPanPoint(null);
    
    // For other tools, we handle completion in startDrawing
    // So nothing to do here
  };

  const deleteSelected = () => {
    setElements(prev => prev.filter(el => !el.selected));
  };

  const clearCanvas = () => {
    setElements([]);
    setDrawingPoints([]);
    setFirstPoint(null);
    setIsFirstPointSet(false);
    setCanvasOffset({ x: 0, y: 0 });
  };

  const toggleSnapToAngle = () => setSnapToAngle(prev => !prev);
  const toggleSnapToEndpoints = () => setSnapToEndpoints(prev => !prev);
  const toggleSnapToLines = () => setSnapToLines(prev => !prev);
  const toggleSnapToExtensions = () => setSnapToExtensions(prev => !prev);

  return {
    canvasRef,
    activeTool,
    setActiveTool,
    elements,
    setElements,
    drawingPoints,
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
    snapToExtensions,
    toggleSnapToExtensions,
    addImage,
    rectangleDrawMode: !isFirstPointSet ? "first-point" : "second-point"
  };
};
