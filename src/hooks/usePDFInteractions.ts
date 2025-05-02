import { EditorSymbol } from "@/types/editor";
import { MouseEvent } from "react";

interface PDFInteractionsProps {
  pdfContainerRef: React.RefObject<HTMLDivElement>;
  scale: number;
  panPosition: { x: number; y: number };
  setPanPosition: (pos: { x: number; y: number }) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  draggedSymbol: { id: string; initialX: number; initialY: number } | null;
  setDraggedSymbol: (symbol: { id: string; initialX: number; initialY: number } | null) => void;
  isPanning: boolean;
  setIsPanning: (panning: boolean) => void;
  lastMousePosition: { x: number; y: number };
  setLastMousePosition: (pos: { x: number; y: number }) => void;
  activeSymbolType: string | null;
  onSymbolPlace: (type: string, x: number, y: number) => void;
  onSymbolDragEnd: (symbolId: string, x: number, y: number) => void;
  setScale: (scale: number) => void;
  minScale: number;
  maxScale: number;
  drawingWallMode?: boolean;
  onWallPointSet?: (x: number, y: number) => void;
}

export const usePDFInteractions = ({
  pdfContainerRef,
  scale,
  panPosition,
  setPanPosition,
  isDragging,
  setIsDragging,
  draggedSymbol,
  setDraggedSymbol,
  isPanning,
  setIsPanning,
  lastMousePosition,
  setLastMousePosition,
  activeSymbolType,
  onSymbolPlace,
  onSymbolDragEnd,
  setScale,
  minScale,
  maxScale,
  drawingWallMode = false,
  onWallPointSet
}: PDFInteractionsProps) => {
  
  const handleCanvasClick = (e: MouseEvent) => {
    if (!pdfContainerRef.current || isPanning) return;
    
    const container = pdfContainerRef.current;
    const rect = container.getBoundingClientRect();
    
    const x = (e.clientX - rect.left - panPosition.x) / scale;
    const y = (e.clientY - rect.top - panPosition.y) / scale;
    
    console.log("Canvas click handler called", {
      drawingWallMode,
      activeSymbolType,
      x,
      y,
      isPanning
    });
    
    // Handle wall drawing mode with highest priority
    if (drawingWallMode && onWallPointSet) {
      console.log("Wall point set at:", x, y);
      onWallPointSet(x, y);
      return;
    }
    
    // Handle symbol placement second
    if (activeSymbolType) {
      console.log("Symbol placed:", activeSymbolType, "at", x, y);
      onSymbolPlace(activeSymbolType, x, y);
      return;
    }
  };

  const handleMouseDown = (e: MouseEvent, symbol?: EditorSymbol) => {
    if (!pdfContainerRef.current) return;
    
    console.log("Mouse down", {
      symbol,
      drawingWallMode,
      activeSymbolType
    });

    // Handle symbol dragging
    if (symbol) {
      e.stopPropagation();
      setIsDragging(true);
      setDraggedSymbol({
        id: symbol.id,
        initialX: e.clientX - symbol.x * scale - panPosition.x,
        initialY: e.clientY - symbol.y * scale - panPosition.y,
      });
      return;
    } 
    
    // Handle wall drawing with highest priority
    if (drawingWallMode && onWallPointSet && pdfContainerRef.current) {
      const container = pdfContainerRef.current;
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left - panPosition.x) / scale;
      const y = (e.clientY - rect.top - panPosition.y) / scale;
      
      console.log("Starting wall at:", x, y);
      onWallPointSet(x, y);
      return;
    }
    
    // Handle panning - only if not in active drawing mode and zoomed in
    if (e.button === 0 && scale > 1 && !activeSymbolType && !drawingWallMode) {
      console.log("Starting panning");
      setIsPanning(true);
      setLastMousePosition({
        x: e.clientX,
        y: e.clientY,
      });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!pdfContainerRef.current) return;

    // Handle symbol dragging
    if (isDragging && draggedSymbol) {
      const x = (e.clientX - draggedSymbol.initialX - panPosition.x) / scale;
      const y = (e.clientY - draggedSymbol.initialY - panPosition.y) / scale;
      onSymbolDragEnd(draggedSymbol.id, x, y);
    } 
    // Handle panning
    else if (isPanning && scale > 1) {
      const dx = e.clientX - lastMousePosition.x;
      const dy = e.clientY - lastMousePosition.y;
      
      const newX = panPosition.x + dx;
      const newY = panPosition.y + dy;
      setPanPosition({ x: newX, y: newY });
      
      setLastMousePosition({
        x: e.clientX,
        y: e.clientY
      });
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    console.log("Mouse up", {
      drawingWallMode,
      isPanning,
      isDragging
    });
    
    setIsDragging(false);
    setDraggedSymbol(null);
    setIsPanning(false);
  };

  // Handle touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    // Only prevent default if zoomed in to allow normal scrolling at 100%
    if (scale > 1) {
      e.preventDefault();
    }

    // Handle wall drawing mode with priority
    if (drawingWallMode && onWallPointSet && pdfContainerRef.current && e.touches.length === 1) {
      const container = pdfContainerRef.current;
      const rect = container.getBoundingClientRect();
      const touch = e.touches[0];
      const x = (touch.clientX - rect.left - panPosition.x) / scale;
      const y = (touch.clientY - rect.top - panPosition.y) / scale;
      
      console.log("Starting wall at (touch):", x, y);
      onWallPointSet(x, y);
      return;
    }
    
    // Handle panning
    if (e.touches.length === 1 && scale > 1) {
      setIsPanning(true);
      setLastMousePosition({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Only handle panning when zoomed in
    if (isPanning && scale > 1 && e.touches.length === 1) {
      const touch = e.touches[0];
      const dx = touch.clientX - lastMousePosition.x;
      const dy = touch.clientY - lastMousePosition.y;
      
      const newX = panPosition.x + dx;
      const newY = panPosition.y + dy;
      setPanPosition({ x: newX, y: newY });
      
      setLastMousePosition({
        x: touch.clientX,
        y: touch.clientY
      });
      
      e.preventDefault(); // Prevent scrolling
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isPanning && scale > 1) {
      e.preventDefault();
    }
    
    setIsPanning(false);
  };

  // Handle direct zoom adjustment
  const handleZoomAdjust = (newScale: number) => {
    if (newScale >= minScale && newScale <= maxScale) {
      setScale(newScale);
    }
  };

  // Handle wheel zoom
  const handleWheel = (e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY * -0.01;
      const newScale = Math.min(Math.max(scale + delta, minScale), maxScale);
      handleZoomAdjust(newScale);
    }
  };

  return {
    handleCanvasClick,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleZoomAdjust,
    handleWheel
  };
};
