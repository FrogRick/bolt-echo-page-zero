
import { Point, Shape } from '../types/canvas';
import { findIntersectionPoint } from './line-snapping';

// Find perpendicular extension point from existing lines
export const findLineExtensionPoint = (
  startPoint: Point,
  currentPoint: Point,
  shapes: Shape[],
  threshold: number = 30
): { point: Point, referenceLineId: string, extendedLine: {start: Point, end: Point} } | null => {
  // We're only interested in perpendicular extensions now
  return findPerpendicularExtension(startPoint, currentPoint, shapes, threshold);
};

// Helper function to find perpendicular line extensions from endpoints
export const findPerpendicularExtension = (
  startPoint: Point,
  currentPoint: Point,
  shapes: Shape[],
  threshold: number = 30
): { point: Point, referenceLineId: string, extendedLine: {start: Point, end: Point} } | null => {
  let closestIntersection = null;
  let minDistance = Number.MAX_VALUE;

  for (const shape of shapes) {
    if (shape.type !== 'line') continue;
    
    // Check perpendicular projections from both endpoints of each line
    const endpoints = [shape.start, shape.end];
    
    for (const endpoint of endpoints) {
      // Calculate perpendicular line from the endpoint
      const lineVector = {
        x: shape.end.x - shape.start.x,
        y: shape.end.y - shape.start.y
      };
      
      // Create a perpendicular vector (rotated 90 degrees)
      const perpVector = {
        x: -lineVector.y,
        y: lineVector.x
      };
      
      // Normalize perpendicular vector
      const perpLength = Math.sqrt(perpVector.x * perpVector.x + perpVector.y * perpVector.y);
      if (perpLength === 0) continue;
      
      const perpNormalized = {
        x: perpVector.x / perpLength,
        y: perpVector.y / perpLength
      };
      
      // Create a perpendicular line from endpoint (extend in both directions)
      const perpLine1 = {
        start: endpoint,
        end: {
          x: endpoint.x + perpNormalized.x * 1000,
          y: endpoint.y + perpNormalized.y * 1000
        }
      };
      
      const perpLine2 = {
        start: endpoint,
        end: {
          x: endpoint.x - perpNormalized.x * 1000,
          y: endpoint.y - perpNormalized.y * 1000
        }
      };
      
      // Check if our current drawing line intersects with either perpendicular line
      // Create extended line from startPoint through currentPoint
      const dx = currentPoint.x - startPoint.x;
      const dy = currentPoint.y - startPoint.y;
      
      if (dx === 0 && dy === 0) continue;
      
      const currentDist = Math.sqrt(dx * dx + dy * dy);
      const dirX = dx / currentDist;
      const dirY = dy / currentDist;
      
      const extendedEnd = {
        x: startPoint.x + dirX * 1000,
        y: startPoint.y + dirY * 1000
      };
      
      // Check intersection with both perpendicular lines
      for (const perpLine of [perpLine1, perpLine2]) {
        const intersection = findIntersectionPoint(
          startPoint,
          extendedEnd,
          perpLine.start,
          perpLine.end
        );
        
        if (intersection) {
          const distToIntersection = Math.sqrt(
            Math.pow(intersection.x - currentPoint.x, 2) + 
            Math.pow(intersection.y - currentPoint.y, 2)
          );
          
          if (distToIntersection < threshold && distToIntersection < minDistance) {
            minDistance = distToIntersection;
            closestIntersection = {
              point: intersection,
              referenceLineId: shape.id,
              extendedLine: {
                start: endpoint,  // Start from the endpoint of the reference line
                end: intersection // End at the intersection point
              }
            };
          }
        }
      }
    }
  }
  
  return closestIntersection;
};
