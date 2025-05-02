
import { useState, useCallback } from "react";
import { WallSymbol, EditorSymbol } from "@/types/editor";
import { useToast } from "@/hooks/use-toast";

interface UseWallDrawingProps {
  symbols: EditorSymbol[];
  setSymbols: (symbols: EditorSymbol[]) => void;
  scale: number;
  wallThickness: number;
  snapToAngle: boolean;
  snapToWalls: boolean;
}

export const useWallDrawing = ({
  symbols,
  setSymbols,
  scale,
  wallThickness,
  snapToAngle,
  snapToWalls
}: UseWallDrawingProps) => {
  const [isDrawingWall, setIsDrawingWall] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number, y: number } | null>(null);
  const { toast } = useToast();

  // Toggle drawing mode
  const toggleWallDrawingMode = useCallback((enabled: boolean) => {
    console.log("Wall drawing mode toggled:", enabled);
    setIsDrawingWall(enabled);
    
    // Clear start point when disabling drawing mode
    if (!enabled) {
      setStartPoint(null);
    }
  }, []);

  // Find the closest wall endpoint to snap to
  const findSnapPoint = useCallback((x: number, y: number): {x: number, y: number} | null => {
    if (!snapToWalls) return null;
    
    const snapDistance = 10 / scale; // Adjust snap distance based on scale
    let closestPoint = null;
    let minDistance = snapDistance;
    
    // Filter to wall symbols
    const walls = symbols.filter(s => s.type === 'wall') as WallSymbol[];
    
    for (const wall of walls) {
      if (wall.start && wall.end) {
        // Check start point
        const distToStart = Math.sqrt(
          Math.pow(wall.start.x - x, 2) + 
          Math.pow(wall.start.y - y, 2)
        );
        
        if (distToStart < minDistance) {
          minDistance = distToStart;
          closestPoint = { x: wall.start.x, y: wall.start.y };
        }
        
        // Check end point
        const distToEnd = Math.sqrt(
          Math.pow(wall.end.x - x, 2) + 
          Math.pow(wall.end.y - y, 2)
        );
        
        if (distToEnd < minDistance) {
          minDistance = distToEnd;
          closestPoint = { x: wall.end.x, y: wall.end.y };
        }
      }
    }
    
    return closestPoint;
  }, [snapToWalls, symbols, scale]);

  // Snap angle to nearest 45 degree increment
  const snapAngleToIncrement = useCallback((angle: number): number => {
    if (!snapToAngle) return angle;
    
    const ANGLES_TO_SNAP = [0, 45, 90, 135, 180, 225, 270, 315, 360];
    
    return ANGLES_TO_SNAP.reduce((closest, current) => {
      return Math.abs(current - angle) < Math.abs(closest - angle) ? current : closest;
    }, angle);
  }, [snapToAngle]);

  // Get snapped end point based on start point and current end point
  const getSnappedEndPoint = useCallback((
    startX: number, 
    startY: number, 
    endX: number, 
    endY: number
  ): {x: number, y: number} => {
    if (!snapToAngle) return { x: endX, y: endY };
    
    // Calculate current angle and distance
    const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);
    const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    
    // Get snapped angle
    const snappedAngle = snapAngleToIncrement((angle + 360) % 360);
    
    // Convert back to radians for trig functions
    const radians = snappedAngle * Math.PI / 180;
    
    // Calculate new end point based on snapped angle and original distance
    const newEndX = startX + distance * Math.cos(radians);
    const newEndY = startY + distance * Math.sin(radians);
    
    return { x: newEndX, y: newEndY };
  }, [snapToAngle, snapAngleToIncrement]);

  // Create a wall from start to end point
  const createWall = useCallback((
    start: {x: number, y: number}, 
    end: {x: number, y: number}
  ): WallSymbol => {
    // Calculate center point and angle
    const centerX = (start.x + end.x) / 2;
    const centerY = (start.y + end.y) / 2;
    const angle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI;
    
    // Calculate the length of the wall
    const length = Math.sqrt(
      Math.pow(end.x - start.x, 2) + 
      Math.pow(end.y - start.y, 2)
    );
    
    return {
      id: crypto.randomUUID(),
      type: 'wall',
      x: centerX,
      y: centerY,
      rotation: angle,
      size: length,
      start: { x: start.x, y: start.y },
      end: { x: end.x, y: end.y },
      thickness: wallThickness
    };
  }, [wallThickness]);

  // Direct handle for canvas click
  const handleCanvasClick = useCallback((x: number, y: number) => {
    console.log("Canvas clicked in wall drawing mode", { x, y, startPoint, isDrawingWall });
    
    if (!isDrawingWall) return;
    
    // If we don't have a start point yet, set it and wait for the end point
    if (!startPoint) {
      // Check if we should snap to existing walls
      let finalX = x;
      let finalY = y;
      
      const snapPoint = findSnapPoint(x, y);
      if (snapPoint) {
        finalX = snapPoint.x;
        finalY = snapPoint.y;
      }
      
      setStartPoint({ x: finalX, y: finalY });
      toast({
        title: "Start point set",
        description: "Now click to set the end point of the wall.",
        duration: 2000
      });
      return;
    }
    
    // We already have a start point, so this click is to set the end point
    let endX = x;
    let endY = y;
    
    // Check if we should snap to existing walls
    const snapPoint = findSnapPoint(x, y);
    if (snapPoint) {
      endX = snapPoint.x;
      endY = snapPoint.y;
    }
    
    // Check if we should snap to angles
    if (snapToAngle) {
      const snappedEndPoint = getSnappedEndPoint(
        startPoint.x, 
        startPoint.y, 
        endX, 
        endY
      );
      endX = snappedEndPoint.x;
      endY = snappedEndPoint.y;
    }
    
    // Create the wall
    const wall = createWall(
      startPoint,
      { x: endX, y: endY }
    );
    
    // Add the wall to the symbols
    setSymbols([...symbols, wall]);
    
    // Reset the start point to draw another wall
    setStartPoint(null);
    
    // Show success toast
    toast({
      title: "Wall added",
      description: "Click to set the start point for another wall.",
      duration: 2000
    });
  }, [startPoint, isDrawingWall, findSnapPoint, snapToAngle, getSnappedEndPoint, createWall, setSymbols, symbols, toast]);

  return {
    isDrawingWall,
    startPoint,
    toggleWallDrawingMode,
    handleCanvasClick
  };
};
