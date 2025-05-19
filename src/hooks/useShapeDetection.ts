
import { Shape, Point } from '@/types/canvas';

export const useShapeDetection = () => {
  // Check if a point is on a line
  const isPointOnLine = (point: Point, lineStart: Point, lineEnd: Point): boolean => {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) return false;
    
    const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (length * length);
    const clampedT = Math.max(0, Math.min(1, t));
    
    const closestX = lineStart.x + clampedT * dx;
    const closestY = lineStart.y + clampedT * dy;
    
    const distance = Math.sqrt(Math.pow(point.x - closestX, 2) + Math.pow(point.y - closestY, 2));
    return distance < 5; // 5px hit area
  };

  // Check if a point is inside a rectangle
  const isPointInRectangle = (point: Point, rectStart: Point, rectEnd: Point): boolean => {
    return (
      point.x >= Math.min(rectStart.x, rectEnd.x) &&
      point.x <= Math.max(rectStart.x, rectEnd.x) &&
      point.y >= Math.min(rectStart.y, rectEnd.y) &&
      point.y <= Math.max(rectStart.y, rectEnd.y)
    );
  };

  // Check if a point is inside a polygon
  const isPointInPolygon = (point: Point, points: Point[]): boolean => {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i].x, yi = points[i].y;
      const xj = points[j].x, yj = points[j].y;
      
      const intersect = ((yi > point.y) !== (yj > point.y)) && 
          (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      
      if (intersect) inside = !inside;
    }
    return inside;
  };

  // Find a shape under the specified point
  const findShapeAtPoint = (point: Point, shapes: Shape[]): Shape | null => {
    return shapes.find(shape => {
      if (shape.type === 'line') {
        return isPointOnLine(point, shape.start, shape.end);
      } else if (shape.type === 'rectangle') {
        return isPointInRectangle(point, shape.start, shape.end);
      } else if (shape.type === 'polygon') {
        return isPointInPolygon(point, shape.points);
      }
      return false;
    }) || null;
  };

  return {
    isPointOnLine,
    isPointInRectangle,
    isPointInPolygon,
    findShapeAtPoint
  };
};
