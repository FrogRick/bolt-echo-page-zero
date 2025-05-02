
import { WallSymbol, EditorSymbol } from "@/types/editor";

// Constants for snapping
const ANGLE_SNAP_THRESHOLD = 10; // degrees
const WALL_SNAP_DISTANCE = 10; // pixels
const ANGLES_TO_SNAP = [0, 45, 90, 135, 180, 225, 270, 315, 360];

export const wallDrawingService = {
  // Calculate angle between two points
  getAngle: (startX: number, startY: number, endX: number, endY: number): number => {
    const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);
    return (angle + 360) % 360; // Normalize to 0-360
  },
  
  // Snap angle to nearest 45/90 degree increment
  snapAngle: (angle: number): number => {
    return ANGLES_TO_SNAP.reduce((closest, current) => {
      return Math.abs(current - angle) < Math.abs(closest - angle) ? current : closest;
    }, angle);
  },
  
  // Adjust end point to match snapped angle
  getSnappedEndPoint: (
    startX: number, 
    startY: number, 
    endX: number, 
    endY: number, 
    snapToAngle: boolean
  ): {x: number, y: number} => {
    if (!snapToAngle) return { x: endX, y: endY };
    
    // Calculate current angle and distance
    const angle = wallDrawingService.getAngle(startX, startY, endX, endY);
    const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    
    // Get snapped angle
    const snappedAngle = wallDrawingService.snapAngle(angle);
    
    // Convert back to radians for trig functions
    const radians = snappedAngle * Math.PI / 180;
    
    // Calculate new end point based on snapped angle and original distance
    const newEndX = startX + distance * Math.cos(radians);
    const newEndY = startY + distance * Math.sin(radians);
    
    return { x: newEndX, y: newEndY };
  },
  
  // Find closest wall endpoint to snap to
  findSnapPoint: (
    x: number, 
    y: number, 
    scale: number,
    symbols: EditorSymbol[], 
    excludeWallId?: string
  ): {x: number, y: number} | null => {
    let closestPoint = null;
    let minDistance = WALL_SNAP_DISTANCE / scale; // Adjust snap distance based on scale
    
    // Filter to wall symbols
    const walls = symbols.filter(s => s.type === 'wall') as WallSymbol[];
    
    for (const wall of walls) {
      // Skip the wall being drawn
      if (excludeWallId && wall.id === excludeWallId) continue;
      
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
  },
  
  // Create a wall from start to end point
  createWall: (
    startPoint: {x: number, y: number}, 
    endPoint: {x: number, y: number},
    thickness: number
  ): WallSymbol => {
    // Calculate center point and angle
    const centerX = (startPoint.x + endPoint.x) / 2;
    const centerY = (startPoint.y + endPoint.y) / 2;
    const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x) * 180 / Math.PI;
    
    // Calculate the length of the wall
    const length = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) + 
      Math.pow(endPoint.y - startPoint.y, 2)
    );
    
    return {
      id: crypto.randomUUID(),
      type: 'wall',
      x: centerX,
      y: centerY,
      rotation: angle,
      size: length,
      start: { x: startPoint.x, y: startPoint.y },
      end: { x: endPoint.x, y: endPoint.y },
      thickness: thickness
    };
  }
};
