
import { useEffect } from "react";

interface PDFZoomHandlerProps {
  containerRef: React.RefObject<HTMLDivElement>;
  scale: number;
  setScale: (scale: number) => void;
  minScale: number;
  maxScale: number;
}

export const PDFZoomHandler = ({
  containerRef,
  scale,
  setScale,
  minScale,
  maxScale
}: PDFZoomHandlerProps) => {
  
  // Set up wheel event handler for zooming
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleWheelEvent = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY * -0.01;
        const newScale = Math.min(Math.max(scale + delta, minScale), maxScale);
        setScale(newScale);
      }
    };
    
    container.addEventListener('wheel', handleWheelEvent, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheelEvent);
    };
  }, [scale, setScale, containerRef, minScale, maxScale]);
  
  return null; // This component doesn't render anything, just handles events
};
