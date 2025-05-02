
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface PDFCanvasEventHandlersProps {
  pdfContainerRef: React.RefObject<HTMLDivElement>;
  scale: number;
  panPosition: { x: number, y: number };
  setPanPosition: (pos: { x: number, y: number }) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  draggedSymbol: { id: string; initialX: number; initialY: number } | null;
  setDraggedSymbol: (symbol: { id: string; initialX: number; initialY: number } | null) => void;
  isPanning: boolean;
  setIsPanning: (panning: boolean) => void;
  lastMousePosition: { x: number, y: number };
  setLastMousePosition: (pos: { x: number, y: number }) => void;
  activeSymbolType: string | null;
  onSymbolPlace: (type: string, x: number, y: number) => void;
  onSymbolDragEnd: (symbolId: string, x: number, y: number) => void;
  setScale: (scale: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  pdfFile: File | null;
  similarityDetectionMode: boolean;
  drawingWallMode?: boolean;
  onWallPointSet?: (x: number, y: number) => void;
}

const MIN_SCALE = 1.0;
const MAX_SCALE = 3.0;

export const usePDFCanvasEventHandlers = ({
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
  onZoomIn,
  onZoomOut,
  pdfFile,
  drawingWallMode = false,
  onWallPointSet
}: PDFCanvasEventHandlersProps) => {
  const { toast } = useToast();
  
  // Empty canvas click handler - we handle clicks directly in PDFCanvas now
  const handleCanvasClick = () => {};

  // Handle mouse down for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    console.log("MouseDown event detected", { isPanning, drawingWallMode });
    
    if (!pdfContainerRef.current) return;
    
    // If we're in wall drawing mode, don't start panning
    if (drawingWallMode) return;
    
    // Handle panning - only if not in active drawing mode and zoomed in
    if (e.button === 0 && scale > 1 && !activeSymbolType && !drawingWallMode) {
      setIsPanning(true);
      setLastMousePosition({
        x: e.clientX,
        y: e.clientY,
      });
      e.preventDefault();
    }
  };

  // Mouse move for panning and drag operations
  const handleMouseMove = (e: React.MouseEvent) => {
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
      
      setPanPosition({ 
        x: panPosition.x + dx, 
        y: panPosition.y + dy 
      });
      
      setLastMousePosition({
        x: e.clientX,
        y: e.clientY
      });
    }
  };

  // Mouse up to end all interactions
  const handleMouseUp = () => {
    console.log("Mouse up", {
      drawingWallMode,
      isPanning,
      isDragging
    });
    
    setIsDragging(false);
    setDraggedSymbol(null);
    setIsPanning(false);
  };

  // Touch handlers for mobile support
  const handleTouchStart = (e: React.TouchEvent) => {
    // Only prevent default if zoomed in to allow normal scrolling at 100%
    if (scale > 1) {
      e.preventDefault();
    }
    
    // Handle panning
    if (e.touches.length === 1 && scale > 1 && !drawingWallMode) {
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
      
      setPanPosition({ 
        x: panPosition.x + dx, 
        y: panPosition.y + dy 
      });
      
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

  // Handle PDF upload with toast notification
  const handlePDFUpload = (file: File) => {
    toast({
      title: "PDF Uploaded Successfully",
      description: "You can now place elements on your floor plan.",
    });
  };

  // Handle wheel events for zooming
  useEffect(() => {
    const container = pdfContainerRef.current;
    if (!container) return;
    
    const handleWheelEvent = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY * -0.01;
        const newScale = Math.min(Math.max(scale + delta, MIN_SCALE), MAX_SCALE);
        setScale(newScale);
      }
    };
    
    container.addEventListener('wheel', handleWheelEvent, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheelEvent);
    };
  }, [scale, setScale, pdfContainerRef]);

  return {
    handleCanvasClick,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handlePDFUpload
  };
};
