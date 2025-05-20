
import { Point, Shape } from '../types/canvas';

// Helper function to check if two points are close enough to be considered connected
export const arePointsConnected = (point1: Point, point2: Point, threshold: number = 1): boolean => {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  return Math.sqrt(dx * dx + dy * dy) <= threshold;
};

// Find all lines connected to a specific point
export const findConnectedLines = (
  shapes: Shape[], 
  connectionPoint: Point,
  currentShapeId?: string
): Shape[] => {
  return shapes.filter(shape => 
    shape.type === 'line' && 
    (currentShapeId ? shape.id !== currentShapeId : true) &&
    (arePointsConnected(shape.start, connectionPoint) || 
     arePointsConnected(shape.end, connectionPoint))
  );
};

// Check if a point lies on a line
export const isPointOnLine = (
  point: Point, 
  lineStart: Point, 
  lineEnd: Point,
  threshold: number = 5
): boolean => {
  // Convert line to parametric form
  const lineLength = Math.sqrt(
    Math.pow(lineEnd.x - lineStart.x, 2) + 
    Math.pow(lineEnd.y - lineStart.y, 2)
  );
  
  if (lineLength === 0) return false;
  
  // Calculate distance from point to line
  const dist = Math.abs(
    (lineEnd.x - lineStart.x) * (lineStart.y - point.y) - 
    (lineStart.x - point.x) * (lineEnd.y - lineStart.y)
  ) / lineLength;
  
  // Check if point is close enough to line
  if (dist > threshold) return false;
  
  // Check if point is within line segment bounds (not just on the infinite line)
  const dotProduct = 
    ((point.x - lineStart.x) * (lineEnd.x - lineStart.x) + 
    (point.y - lineStart.y) * (lineEnd.y - lineStart.y)) / 
    (lineLength * lineLength);
  
  return dotProduct >= 0 && dotProduct <= 1;
};

// Find lines that this point intersects with (connects in the middle)
export const findIntersectingLines = (
  shapes: Shape[],
  point: Point,
  currentShapeId?: string
): Shape[] => {
  return shapes.filter(shape => 
    shape.type === 'line' && 
    (currentShapeId ? shape.id !== currentShapeId : true) &&
    !arePointsConnected(shape.start, point) && 
    !arePointsConnected(shape.end, point) &&
    isPointOnLine(point, shape.start, shape.end)
  );
};

// Find the closest point on a line to a given point
export const findClosestPointOnLine = (
  point: Point,
  lineStart: Point,
  lineEnd: Point
): Point => {
  const lineLength = Math.sqrt(
    Math.pow(lineEnd.x - lineStart.x, 2) + 
    Math.pow(lineEnd.y - lineStart.y, 2)
  );
  
  if (lineLength === 0) return lineStart;
  
  // Calculate projection of point onto line
  const dotProduct = 
    ((point.x - lineStart.x) * (lineEnd.x - lineStart.x) + 
    (point.y - lineStart.y) * (lineEnd.y - lineStart.y)) / 
    (lineLength * lineLength);
  
  // Clamp to line segment
  const t = Math.max(0, Math.min(1, dotProduct));
  
  // Calculate the closest point on the line
  return {
    x: lineStart.x + t * (lineEnd.x - lineStart.x),
    y: lineStart.y + t * (lineEnd.y - lineStart.y)
  };
};

// Find the nearest point on any line in the shapes
export const findNearestPointOnAnyLine = (
  point: Point,
  shapes: Shape[],
  currentShapeId?: string,
  threshold: number = 10
): { point: Point, distance: number } | null => {
  let closestPoint = null;
  let minDistance = threshold;
  
  shapes.forEach(shape => {
    if (shape.type === 'line' && (currentShapeId ? shape.id !== currentShapeId : true)) {
      const pointOnLine = findClosestPointOnLine(point, shape.start, shape.end);
      
      const distance = Math.sqrt(
        Math.pow(point.x - pointOnLine.x, 2) + 
        Math.pow(point.y - pointOnLine.y, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = { point: pointOnLine, distance };
      }
    }
  });
  
  return closestPoint;
};

// Find intersection point of two infinite lines
export const findIntersectionPoint = (
  line1Start: Point, 
  line1End: Point,
  line2Start: Point, 
  line2End: Point
): Point | null => {
  const x1 = line1Start.x, y1 = line1Start.y;
  const x2 = line1End.x, y2 = line1End.y;
  const x3 = line2Start.x, y3 = line2Start.y;
  const x4 = line2End.x, y4 = line2End.y;

  // Calculate denominators
  const den = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (Math.abs(den) < 0.001) return null; // Lines are nearly parallel

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / den;
  
  // For infinite lines, we only need to calculate the intersection point
  // (not check if it's contained in the line segments)
  const x = x1 + ua * (x2 - x1);
  const y = y1 + ua * (y2 - y1);
  
  return { x, y };
};

// Helper function to find intersection point of two lines if they intersect
export const findLineIntersection = (line1: Shape, line2: Shape): Point | null => {
  if (line1.type !== 'line' || line2.type !== 'line') return null;

  const x1 = line1.start.x, y1 = line1.start.y;
  const x2 = line1.end.x, y2 = line1.end.y;
  const x3 = line2.start.x, y3 = line2.start.y;
  const x4 = line2.end.x, y4 = line2.end.y;

  // Calculate denominators
  const den = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (den === 0) return null; // Lines are parallel

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / den;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / den;

  // Check if intersection is within both line segments
  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    const x = x1 + ua * (x2 - x1);
    const y = y1 + ua * (y2 - y1);
    return { x, y };
  }

  return null;
};
