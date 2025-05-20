
import { useState, useEffect } from 'react';

export const usePDFState = (scale: number) => {
  // Dragging state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [draggedSymbol, setDraggedSymbol] = useState<{ id: string; initialX: number; initialY: number } | null>(null);
  
  // Panning state
  const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [lastMousePosition, setLastMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Error state
  const [pdfError, setPdfError] = useState<string | null>(null);
  
  // Reset pan position when scale changes to 1 (zoom out fully)
  useEffect(() => {
    if (scale <= 1.0) {
      setPanPosition({ x: 0, y: 0 });
    }
  }, [scale]);

  return {
    isDragging,
    setIsDragging,
    draggedSymbol,
    setDraggedSymbol,
    panPosition,
    setPanPosition,
    isPanning,
    setIsPanning,
    lastMousePosition,
    setLastMousePosition,
    pdfError,
    setPdfError
  };
};
