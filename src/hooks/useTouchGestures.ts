
import { useState } from 'react';

interface TouchGesturesProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onPan: (x: number, y: number) => void;
  onZoom: (scale: number) => void;
  isPanningEnabled?: boolean;
  scale: number;
  minScale: number;
  maxScale: number;
}

export const useTouchGestures = ({ 
  onZoomIn, 
  onZoomOut, 
  onPan, 
  onZoom,
  isPanningEnabled = true,
  scale,
  minScale,
  maxScale
}: TouchGesturesProps) => {
  const [touchStartTime, setTouchStartTime] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPosition, setLastPanPosition] = useState({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);

  // Calculate distance between two touch points
  const getTouchDistance = (touches: React.TouchList): number => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Get the center point between two touches
  const getTouchCenter = (touches: React.TouchList): { x: number, y: number } => {
    if (touches.length < 2) return { x: touches[0].clientX, y: touches[0].clientY };
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Initialize for pinch-to-zoom
      setLastTouchDistance(getTouchDistance(e.touches));
      e.preventDefault();
    } else if (e.touches.length === 1) {
      setTouchStartTime(Date.now());
      const touch = e.touches[0];
      setLastPanPosition({
        x: touch.clientX,
        y: touch.clientY
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Handle pinch-to-zoom with two fingers
    if (e.touches.length === 2) {
      e.preventDefault();
      const currentDistance = getTouchDistance(e.touches);
      
      if (lastTouchDistance) {
        const delta = currentDistance - lastTouchDistance;
        
        // Calculate new scale based on pinch gesture
        if (Math.abs(delta) > 5) { // threshold to avoid tiny movements
          const scaleFactor = 0.01; // adjust sensitivity
          const newScale = scale + (delta * scaleFactor);
          
          // Clamp the scale within bounds
          const clampedScale = Math.max(minScale, Math.min(maxScale, newScale));
          if (clampedScale !== scale) {
            onZoom(clampedScale);
          }
        }
      }
      
      setLastTouchDistance(currentDistance);
      return;
    }
    
    // Handle panning with one finger
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      
      // Only enable panning when zoomed in or after holding for a moment
      const shouldAllowPan = scale > 1 || (Date.now() - touchStartTime > 200);
      
      if (shouldAllowPan && isPanningEnabled) {
        if (!isPanning && Date.now() - touchStartTime > 200) {
          setIsPanning(true);
        }
        
        if (isPanning || scale > 1) {
          const dx = touch.clientX - lastPanPosition.x;
          const dy = touch.clientY - lastPanPosition.y;
          onPan(dx, dy);
          e.preventDefault(); // Prevent scrolling when panning
        }
      }
      
      setLastPanPosition({
        x: touch.clientX,
        y: touch.clientY
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPanning(false);
    setLastTouchDistance(null);
  };

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    isPanning
  };
};
