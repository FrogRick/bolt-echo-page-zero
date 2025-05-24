
import { useState, useRef, useEffect, useCallback } from "react";
import { Tool, Shape, Point } from "@/types/canvas";
import { useShapeDetection } from "./useShapeDetection";
import { useCanvasDrawingLogic, DrawingState } from "./useCanvasDrawingLogic";
import { renderCanvas } from "@/utils/canvasRenderer";

export const useCanvasEditor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedShape, setSelectedShape] = useState<Shape | null>(null);
  const [currentColor, setCurrentColor] = useState("#000000");
  const [fillColor, setFillColor] = useState("#ffffff");
  const [fillOpacity, setFillOpacity] = useState(100);
  const [strokeOpacity, setStrokeOpacity] = useState(100);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  
  // Text-specific state
  const [textInput, setTextInput] = useState("");
  const [fontSize, setFontSize] = useState(16);
  const [isTextInputVisible, setIsTextInputVisible] = useState(false);
  const [textPosition, setTextPosition] = useState<Point | null>(null);
  
  // Drawing state
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    currentShape: null,
    startPoint: null,
    currentPoints: [],
  });

  // Snap settings
  const [snapToAngle, setSnapToAngle] = useState(false);
  const [snapToEndpoints, setSnapToEndpoints] = useState(false);
  const [snapToLines, setSnapToLines] = useState(false);
  const [snapToExtensions, setSnapToExtensions] = useState(false);
  
  // Underlay image state
  const [underlayImage, setUnderlayImage] = useState<HTMLImageElement | null>(null);
  const [underlayScale, setUnderlayScale] = useState(1);
  const [underlayOpacity, setUnderlayOpacity] = useState(0.5);

  const { findShapeAtPoint } = useShapeDetection();
  const { handleStartDrawing, handleDrawing, handleEndDrawing } = useCanvasDrawingLogic();

  // Get mouse position relative to canvas
  const getMousePos = useCallback((e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  // Start drawing
  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getMousePos(e);
    
    if (activeTool === "select") {
      const shape = findShapeAtPoint(point, shapes);
      setSelectedShape(shape);
      return;
    }

    if (activeTool === "text") {
      // Show text input at clicked position
      setTextPosition(point);
      setIsTextInputVisible(true);
      setTextInput("");
      return;
    }

    // Handle other drawing tools
    if (['line', 'rectangle', 'circle', 'free-line'].includes(activeTool)) {
      const newDrawingState = handleStartDrawing(
        activeTool, 
        point, 
        currentColor, 
        fillColor, 
        fillOpacity,
        strokeWidth
      );
      setDrawingState(newDrawingState);
    }
  }, [activeTool, getMousePos, findShapeAtPoint, shapes, handleStartDrawing, currentColor, fillColor, fillOpacity, strokeWidth]);

  // Continue drawing
  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingState.isDrawing) return;
    
    const point = getMousePos(e);
    const newDrawingState = handleDrawing(activeTool, point, drawingState);
    setDrawingState(newDrawingState);
  }, [drawingState, activeTool, getMousePos, handleDrawing]);

  // End drawing
  const endDrawing = useCallback(() => {
    if (!drawingState.isDrawing) return;
    
    const result = handleEndDrawing(activeTool, drawingState, shapes);
    setShapes(result.shapes);
    setDrawingState(result.drawingState);
  }, [drawingState, activeTool, shapes, handleEndDrawing]);

  // Handle text input confirmation
  const confirmTextInput = useCallback(() => {
    if (!textPosition || !textInput.trim()) {
      setIsTextInputVisible(false);
      return;
    }

    const newShape: Shape = {
      id: crypto.randomUUID(),
      type: 'text',
      start: textPosition,
      text: textInput,
      fontSize,
      strokeColor: currentColor,
      fillColor: fillColor,
      lineWidth: strokeWidth,
    };

    setShapes(prev => [...prev, newShape]);
    setIsTextInputVisible(false);
    setTextInput("");
    setTextPosition(null);
  }, [textPosition, textInput, fontSize, currentColor, fillColor, strokeWidth]);

  // Cancel text input
  const cancelTextInput = useCallback(() => {
    setIsTextInputVisible(false);
    setTextInput("");
    setTextPosition(null);
  }, []);

  // Delete selected shape
  const deleteSelected = useCallback(() => {
    if (selectedShape) {
      setShapes(prev => prev.filter(shape => shape.id !== selectedShape.id));
      setSelectedShape(null);
    }
  }, [selectedShape]);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    setShapes([]);
    setSelectedShape(null);
    setDrawingState({
      isDrawing: false,
      currentShape: null,
      startPoint: null,
      currentPoints: [],
    });
  }, []);

  // Adjust canvas size
  const adjustCanvasSize = useCallback((width: number, height: number) => {
    setCanvasSize({ width, height });
  }, []);

  // Toggle functions for snap settings
  const toggleSnapToAngle = useCallback(() => setSnapToAngle(prev => !prev), []);
  const toggleSnapToEndpoints = useCallback(() => setSnapToEndpoints(prev => !prev), []);
  const toggleSnapToLines = useCallback(() => setSnapToLines(prev => !prev), []);
  const toggleSnapToExtensions = useCallback(() => setSnapToExtensions(prev => !prev), []);

  // Underlay image functions
  const addUnderlayImage = useCallback((file: File) => {
    const img = new Image();
    img.onload = () => {
      setUnderlayImage(img);
    };
    img.src = URL.createObjectURL(file);
  }, []);

  const removeUnderlayImage = useCallback(() => {
    setUnderlayImage(null);
  }, []);

  const adjustUnderlayScale = useCallback((scale: number) => {
    setUnderlayScale(scale);
  }, []);

  const adjustUnderlayOpacity = useCallback((opacity: number) => {
    setUnderlayOpacity(opacity);
  }, []);

  // Render canvas whenever shapes or drawing state changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderCanvas(ctx, shapes, drawingState.currentShape, fillOpacity, strokeOpacity);
  }, [shapes, drawingState.currentShape, fillOpacity, strokeOpacity]);

  return {
    canvasRef,
    activeTool,
    setActiveTool,
    currentColor,
    setCurrentColor,
    fillColor,
    setFillColor,
    fillOpacity,
    setFillOpacity: (opacity: number) => setFillOpacity(opacity),
    strokeOpacity,
    setStrokeOpacity: (opacity: number) => setStrokeOpacity(opacity),
    strokeWidth,
    setStrokeWidth: (width: number) => setStrokeWidth(width),
    fontSize,
    setFontSize: (size: number) => setFontSize(size),
    textInput,
    setTextInput,
    isTextInputVisible,
    textPosition,
    confirmTextInput,
    cancelTextInput,
    startDrawing,
    draw,
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
    rectangleDrawMode: false, // Legacy property
    underlayImage,
    addUnderlayImage,
    removeUnderlayImage,
    underlayScale,
    adjustUnderlayScale,
    underlayOpacity,
    adjustUnderlayOpacity,
  };
};
