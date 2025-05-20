
import { Point, Shape } from '../types/canvas';

// Function to find nearest endpoint to snap to
export const findNearestEndpoint = (
  point: Point, 
  shapes: Shape[], 
  snapDistance: number = 10, 
  snapToEndpoints: boolean = true
): Point | null => {
  if (!snapToEndpoints) return null;
  
  let closestPoint: Point | null = null;
  let minDistance = snapDistance;
  
  shapes.forEach(shape => {
    if (shape.type === 'line') {
      // Check distance to start point
      const distToStart = Math.sqrt(
        Math.pow(shape.start.x - point.x, 2) + 
        Math.pow(shape.start.y - point.y, 2)
      );
      if (distToStart < minDistance) {
        minDistance = distToStart;
        closestPoint = { ...shape.start };
      }
      
      // Check distance to end point
      const distToEnd = Math.sqrt(
        Math.pow(shape.end.x - point.x, 2) + 
        Math.pow(shape.end.y - point.y, 2)
      );
      if (distToEnd < minDistance) {
        minDistance = distToEnd;
        closestPoint = { ...shape.end };
      }
    }
    // Add support for rectangle and polygon endpoints if needed
  });
  
  return closestPoint;
};
