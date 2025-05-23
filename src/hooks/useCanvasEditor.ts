import { useRef, useState, useEffect, useCallback } from "react";
import { Tool } from "@/types/canvas";

interface Point {
  x: number;
  y: number;
}

interface CanvasObject {
  id: string;
  type: string;
  points: Point[];
  color: string;
  fillColor?: string;
  strokeWidth: number;
  closed?: boolean;
}

interface UnderlayImageState {
  image: HTMLImageElement | null;
  rect: { x: number; y: number; width: number; height: number } | null;
  confirmed: boolean;
  opacity: number;
}

export const useCanvasEditor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [currentColor, setCurrentColor] = useState("#000000");
  const [fillColor, setFillColor] = useState("#ffffff");
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [objects, setObjects] = useState<CanvasObject[]>([]);
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [snapToAngle, setSnapToAngle] = useState(true);
  const [snapToEndpoints, setSnapToEndpoints] = useState(true);
  const [snapToLines, setSnapToLines] = useState(true);
  const [snapToExtensions, setSnapToExtensions] = useState(true);
  const [rectangleDrawMode, setRectangleDrawMode] = useState<"corner" | "center">("corner");

  // Underlay image state
  const [underlayImageState, setUnderlayImageState] = useState<UnderlayImageState>({
    image: null,
    rect: null,
    confirmed: false,
    opacity: 0.5
  });

  // Draw function that renders everything on canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw confirmed underlay image first (background layer)
    if (underlayImageState.image && underlayImageState.rect && underlayImageState.confirmed) {
      ctx.save();
      ctx.globalAlpha = underlayImageState.opacity;
      ctx.drawImage(
        underlayImageState.image,
        underlayImageState.rect.x,
        underlayImageState.rect.y,
        underlayImageState.rect.width,
        underlayImageState.rect.height
      );
      ctx.restore();
    }

    // Draw all canvas objects on top of the image
    objects.forEach((obj) => {
      if (obj.points.length < 2) return;

      ctx.save();
      ctx.strokeStyle = obj.color;
      ctx.lineWidth = obj.strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (obj.type === "wall") {
        // Draw walls as thick lines
        ctx.beginPath();
        ctx.moveTo(obj.points[0].x, obj.points[0].y);
        for (let i = 1; i < obj.points.length; i++) {
          ctx.lineTo(obj.points[i].x, obj.points[i].y);
        }
        ctx.stroke();
      } else if (obj.type.includes("polygon")) {
        // Draw polygons with fill and stroke
        ctx.beginPath();
        ctx.moveTo(obj.points[0].x, obj.points[0].y);
        for (let i = 1; i < obj.points.length; i++) {
          ctx.lineTo(obj.points[i].x, obj.points[i].y);
        }
        if (obj.closed) {
          ctx.closePath();
        }

        if (obj.fillColor && obj.closed) {
          ctx.fillStyle = obj.fillColor;
          ctx.fill();
        }
        ctx.stroke();
      } else {
        // Draw other objects (freehand, etc.)
        ctx.beginPath();
        ctx.moveTo(obj.points[0].x, obj.points[0].y);
        for (let i = 1; i < obj.points.length; i++) {
          ctx.lineTo(obj.points[i].x, obj.points[i].y);
        }
        ctx.stroke();
      }

      // Highlight selected object
      if (selectedObject === obj.id) {
        ctx.strokeStyle = "#ff0000";
        ctx.lineWidth = obj.strokeWidth + 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.restore();
    });

    // Draw current path being drawn
    if (currentPath.length > 0) {
      ctx.save();
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x, currentPath[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }
  }, [objects, selectedObject, currentPath, currentColor, underlayImageState]);

  // Redraw whenever relevant state changes
  useEffect(() => {
    draw();
  }, [draw]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === "select") return;

    const point = getMousePos(e);
    setIsDrawing(true);
    setCurrentPath([point]);
  };

  const drawPath = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeTool === "select") return;

    const point = getMousePos(e);
    setCurrentPath(prev => [...prev, point]);
  };

  const endDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || currentPath.length === 0) return;

    const newObject: CanvasObject = {
      id: Date.now().toString(),
      type: activeTool,
      points: [...currentPath],
      color: currentColor,
      fillColor: activeTool.includes("polygon") ? fillColor : undefined,
      strokeWidth: activeTool === "wall" ? 8 : 2,
      closed: activeTool.includes("polygon")
    };

    setObjects(prev => [...prev, newObject]);
    setCurrentPath([]);
    setIsDrawing(false);
  };

  const deleteSelected = () => {
    if (selectedObject) {
      setObjects(prev => prev.filter(obj => obj.id !== selectedObject));
      setSelectedObject(null);
    }
  };

  const clearCanvas = () => {
    setObjects([]);
    setSelectedObject(null);
    setCurrentPath([]);
  };

  const adjustCanvasSize = (width: number, height: number) => {
    setCanvasSize({ width, height });
    
    // Ensure underlay rect stays within canvas bounds when canvas size changes
    if (underlayImageState.rect) {
      const rect = { ...underlayImageState.rect };
      let needsUpdate = false;
      
      // Check if rectangle extends beyond new canvas size
      if (rect.x + rect.width > width) {
        if (rect.width > width) {
          // If rect is wider than canvas, resize it
          rect.width = width;
          rect.x = 0;
        } else {
          // Otherwise just move it to stay within bounds
          rect.x = width - rect.width;
        }
        needsUpdate = true;
      }
      
      if (rect.y + rect.height > height) {
        if (rect.height > height) {
          // If rect is taller than canvas, resize it
          rect.height = height;
          rect.y = 0;
        } else {
          // Otherwise just move it to stay within bounds
          rect.y = height - rect.height;
        }
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        setUnderlayImageState(prev => ({
          ...prev,
          rect
        }));
      }
    }
  };

  const toggleSnapToAngle = () => setSnapToAngle(!snapToAngle);
  const toggleSnapToEndpoints = () => setSnapToEndpoints(!snapToEndpoints);
  const toggleSnapToLines = () => setSnapToLines(!snapToLines);
  const toggleSnapToExtensions = () => setSnapToExtensions(!snapToExtensions);

  // Underlay image functions
  const addUnderlayImage = (file: File) => {
    const img = new Image();
    img.onload = () => {
      // When adding a new image, ensure the rect is within canvas boundaries
      let rect = underlayImageState.rect;
      
      if (rect) {
        // Constrain the existing rect to canvas boundaries
        if (rect.x < 0) rect.x = 0;
        if (rect.y < 0) rect.y = 0;
        if (rect.x + rect.width > canvasSize.width) {
          rect.x = Math.max(0, canvasSize.width - rect.width);
        }
        if (rect.y + rect.height > canvasSize.height) {
          rect.y = Math.max(0, canvasSize.height - rect.height);
        }
      }
      
      setUnderlayImageState(prev => ({
        ...prev,
        image: img,
        rect: rect,
        confirmed: false
      }));
    };
    img.src = URL.createObjectURL(file);
  };

  const removeUnderlayImage = () => {
    setUnderlayImageState({
      image: null,
      rect: null,
      confirmed: false,
      opacity: 0.5
    });
  };

  const confirmUnderlayImagePlacement = (rect: { x: number; y: number; width: number; height: number }) => {
    // Ensure the rect is within canvas boundaries before confirming
    const constrainedRect = {
      x: Math.max(0, Math.min(rect.x, canvasSize.width - rect.width)),
      y: Math.max(0, Math.min(rect.y, canvasSize.height - rect.height)),
      width: Math.min(rect.width, canvasSize.width),
      height: Math.min(rect.height, canvasSize.height)
    };
    
    setUnderlayImageState(prev => ({
      ...prev,
      rect: constrainedRect,
      confirmed: true
    }));
  };

  const adjustUnderlayOpacity = (opacity: number) => {
    setUnderlayImageState(prev => ({
      ...prev,
      opacity
    }));
  };

  return {
    canvasRef,
    activeTool,
    setActiveTool,
    currentColor,
    setCurrentColor,
    fillColor,
    setFillColor,
    startDrawing,
    draw: drawPath,
    endDrawing,
    deleteSelected,
    clearCanvas,
    canvasSize,
    adjustCanvasSize,
    snapToAngle,
    toggleSnapToAngle,
    snapToEndpoints,
    toggleSnapToEndpoints,
    snapToLines,
    toggleSnapToLines,
    snapToExtensions,
    toggleSnapToExtensions,
    rectangleDrawMode,
    // Underlay image exports
    underlayImage: underlayImageState.image,
    addUnderlayImage,
    removeUnderlayImage,
    confirmUnderlayImagePlacement,
    underlayOpacity: underlayImageState.opacity,
    adjustUnderlayOpacity,
    // Additional underlay state for external management
    underlayImageConfirmed: underlayImageState.confirmed,
    setUnderlayImageConfirmed: (confirmed: boolean) => {
      setUnderlayImageState(prev => ({ ...prev, confirmed }));
    }
  };
};
