
import { useState, useEffect } from "react";

export const usePDFState = (scale: number) => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedSymbol, setDraggedSymbol] = useState<{ id: string; initialX: number; initialY: number } | null>(null);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePosition, setLastMousePosition] = useState({ x: 0, y: 0 });
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Reset pan position when scale changes to 1
  useEffect(() => {
    if (scale === 1) {
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

