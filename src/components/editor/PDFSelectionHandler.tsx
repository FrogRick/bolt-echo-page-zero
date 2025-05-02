
import { useRef, useState, useEffect } from "react";
import { WallSymbol } from "@/types/editor";

interface PDFSelectionHandlerProps {
  pdfContainerRef: React.RefObject<HTMLDivElement>;
  scale: number;
  panPosition: { x: number, y: number };
  similarityDetectionMode: boolean;
  isPanning: boolean;
  onSelectionHandled: (walls: WallSymbol[]) => void;
  onExitDetectionMode?: () => void;
}

interface SelectionHandlerResult {
  isSelecting: boolean;
  handleSelectionStart: (e: React.MouseEvent) => void;
  handleSelectionMove: (e: React.MouseEvent) => void;
  resetSelection: () => void;
  selectionStart: {x: number, y: number} | null;
  selectionCurrent: {x: number, y: number} | null;
}

export const usePDFSelectionHandler = ({
  pdfContainerRef,
  scale,
  panPosition,
  similarityDetectionMode,
  isPanning,
  onSelectionHandled,
  onExitDetectionMode
}: PDFSelectionHandlerProps): SelectionHandlerResult => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{x: number, y: number} | null>(null);
  const [selectionCurrent, setSelectionCurrent] = useState<{x: number, y: number} | null>(null);
  const [selectionOverlay, setSelectionOverlay] = useState<HTMLDivElement | null>(null);

  // Create or get the selection overlay element
  const ensureSelectionOverlay = () => {
    if (!selectionOverlay) {
      const overlay = document.createElement('div');
      overlay.className = 'wall-selection-overlay';
      overlay.style.position = 'absolute';
      overlay.style.border = '2px dashed #3b82f6';
      overlay.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
      overlay.style.pointerEvents = 'none';
      overlay.style.zIndex = '9999';
      overlay.style.display = 'none';
      
      if (pdfContainerRef.current) {
        pdfContainerRef.current.appendChild(overlay);
      }
      
      setSelectionOverlay(overlay);
      return overlay;
    }
    return selectionOverlay;
  };

  // Handle mouse down for selection start
  const handleSelectionStart = (e: React.MouseEvent) => {
    if (!pdfContainerRef.current || !similarityDetectionMode || isPanning) return;
    
    const container = pdfContainerRef.current;
    const rect = container.getBoundingClientRect();
    
    // Get PDF coordinates
    const x = e.clientX - rect.left - panPosition.x;
    const y = e.clientY - rect.top - panPosition.y;
    
    setIsSelecting(true);
    setSelectionStart({ x, y });
    setSelectionCurrent({ x, y });
    
    // Ensure we have the selection overlay
    const overlay = ensureSelectionOverlay();
    overlay.style.display = 'block';
    overlay.style.left = `${x}px`;
    overlay.style.top = `${y}px`;
    overlay.style.width = '0px';
    overlay.style.height = '0px';
    
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle mouse move during selection
  const handleSelectionMove = (e: React.MouseEvent) => {
    if (!isSelecting || !pdfContainerRef.current || !selectionStart || !selectionOverlay) return;
    
    const container = pdfContainerRef.current;
    const rect = container.getBoundingClientRect();
    
    // Get updated position
    const x = e.clientX - rect.left - panPosition.x;
    const y = e.clientY - rect.top - panPosition.y;
    setSelectionCurrent({ x, y });
    
    // Calculate dimensions
    const width = Math.abs(x - selectionStart.x);
    const height = Math.abs(y - selectionStart.y);
    const left = Math.min(selectionStart.x, x);
    const top = Math.min(selectionStart.y, y);
    
    // Update overlay display
    selectionOverlay.style.left = `${left}px`;
    selectionOverlay.style.top = `${top}px`;
    selectionOverlay.style.width = `${width}px`;
    selectionOverlay.style.height = `${height}px`;
    
    e.preventDefault();
    e.stopPropagation();
  };

  // Reset selection state
  const resetSelection = () => {
    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionCurrent(null);
    
    if (selectionOverlay) {
      selectionOverlay.style.display = 'none';
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (selectionOverlay && pdfContainerRef.current) {
        try {
          pdfContainerRef.current.removeChild(selectionOverlay);
        } catch (e) {
          // Element might have been removed already
        }
      }
    };
  }, [selectionOverlay, pdfContainerRef]);

  return {
    isSelecting,
    handleSelectionStart,
    handleSelectionMove,
    resetSelection,
    selectionStart,
    selectionCurrent
  };
};
