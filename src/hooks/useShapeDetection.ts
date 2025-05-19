
import { Shape, Point } from '@/types/canvas';

export const useShapeDetection = () => {
  const findShapeAtPoint = (point: Point, shapes: Shape[]): Shape | null => {
    // Reverse the order to check the most recently added shapes first
    // This helps with proper selection when shapes overlap
    return [...shapes].reverse().find(shape => {
      if (shape.type === 'line') {
        // Simple distance-based hit test for lines
        const dx = shape.end.x - shape.start.x;
        const dy = shape.end.y - shape.start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length === 0) return false;
        
        const t = ((point.x - shape.start.x) * dx + (point.y - shape.start.y) * dy) / (length * length);
        const clampedT = Math.max(0, Math.min(1, t));
        
        const closestX = shape.start.x + clampedT * dx;
        const closestY = shape.start.y + clampedT * dy;
        
        const distance = Math.sqrt(Math.pow(point.x - closestX, 2) + Math.pow(point.y - closestY, 2));
        return distance < 5; // 5px hit area
      } else if (shape.type === 'rectangle') {
        return (
          point.x >= Math.min(shape.start.x, shape.end.x) &&
          point.x <= Math.max(shape.start.x, shape.end.x) &&
          point.y >= Math.min(shape.start.y, shape.end.y) &&
          point.y <= Math.max(shape.start.y, shape.end.y)
        );
      } else if (shape.type === 'polygon') {
        // Check if point is inside polygon
        let inside = false;
        for (let i = 0, j = shape.points.length - 1; i < shape.points.length; j = i++) {
          const xi = shape.points[i].x, yi = shape.points[i].y;
          const xj = shape.points[j].x, yj = shape.points[j].y;
          
          const intersect = ((yi > point.y) !== (yj > point.y)) && 
              (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
          if (intersect) inside = !inside;
        }
        return inside;
      }
      return false;
    }) || null;
  };

  return { findShapeAtPoint };
};
