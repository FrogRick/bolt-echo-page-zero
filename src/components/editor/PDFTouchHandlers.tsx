
import { useEffect } from "react";

interface PDFTouchHandlersProps {
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: (e: React.TouchEvent) => void;
  scale: number;
  pdfFile: File | null;
}

export const PDFTouchHandlers = ({ 
  handleTouchStart, 
  handleTouchMove, 
  handleTouchEnd,
  scale,
  pdfFile
}: PDFTouchHandlersProps) => {
  
  // Set up event listeners for zoom and scroll prevention
  useEffect(() => {
    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length === 2 && pdfFile) {
        e.preventDefault();
      }
    };

    const preventScroll = (e: TouchEvent) => {
      if (scale > 1 && pdfFile) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchmove', preventZoom, { passive: false });
    document.addEventListener('touchmove', preventScroll, { passive: false });
    
    return () => {
      document.removeEventListener('touchmove', preventZoom);
      document.removeEventListener('touchmove', preventScroll);
    };
  }, [scale, pdfFile]);
  
  return null; // This component doesn't render anything, just handles events
};
