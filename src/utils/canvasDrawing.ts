
import { Point, Shape } from '@/types/canvas';

// Helper function to check if two points are close enough to be considered connected
const arePointsConnected = (point1: Point, point2: Point, threshold: number = 1): boolean => {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  return Math.sqrt(dx * dx + dy * dy) <= threshold;
};

// Find all lines connected to a specific point
const findConnectedLines = (
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

// New helper function to check if a point lies on a line
const isPointOnLine = (
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
const findIntersectingLines = (
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
const findClosestPointOnLine = (
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
const findNearestPointOnAnyLine = (
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

export const drawShapes = (
  ctx: CanvasRenderingContext2D, 
  shapes: Shape[], 
  selectedShapeId: string | null, 
  defaultFillColor: string
): void => {
  // Sort shapes to ensure rectangles and polygons are drawn first (below lines)
  const sortedShapes = [...shapes].sort((a, b) => {
    // Lines should be drawn last (on top)
    if (a.type === 'line' && b.type !== 'line') return 1;
    if (a.type !== 'line' && b.type === 'line') return -1;
    return 0;
  });

  // Clear the canvas with a new composite operation to ensure clean state
  ctx.globalCompositeOperation = 'source-over';

  // First pass: Draw all shapes except lines
  sortedShapes.forEach(shape => {
    if (shape.type !== 'line') {
      if (shape.type === 'rectangle') {
        // For rectangles, only fill with color and no stroke
        ctx.fillStyle = 'fillColor' in shape ? shape.fillColor : defaultFillColor;
        ctx.beginPath();
        ctx.rect(
          shape.start.x,
          shape.start.y,
          shape.end.x - shape.start.x,
          shape.end.y - shape.start.y
        );
        ctx.fill();
        // No stroke for rectangles
      } else if (shape.type === 'polygon') {
        // Use transparent stroke for completed polygons
        ctx.strokeStyle = shape.color; // 'transparent' for completed polygons
        ctx.lineWidth = 2;
        ctx.fillStyle = 'fillColor' in shape ? shape.fillColor : defaultFillColor;
        
        if (shape.points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(shape.points[0].x, shape.points[0].y);
          
          for (let i = 1; i < shape.points.length; i++) {
            ctx.lineTo(shape.points[i].x, shape.points[i].y);
          }
          
          ctx.closePath();
          ctx.fill();
          
          // Only stroke if the color isn't transparent
          if (shape.color !== 'transparent') {
            ctx.stroke();
          }
        }
      }
    }
  });

  // Reset composite operation - this is crucial for lines to draw properly
  ctx.globalCompositeOperation = 'source-over';

  // Second pass: Draw lines with special handling for connected lines and intersections
  sortedShapes.forEach(shape => {
    if (shape.type === 'line') {
      // Find if any lines are connected to this line's start or end points
      const connectedToStart = findConnectedLines(shapes, shape.start, shape.id);
      const connectedToEnd = findConnectedLines(shapes, shape.end, shape.id);
      
      // Find if any lines are intersected by this line's start or end points
      const intersectingWithStart = findIntersectingLines(shapes, shape.start, shape.id);
      const intersectingWithEnd = findIntersectingLines(shapes, shape.end, shape.id);
      
      const lineWidth = 'lineWidth' in shape ? shape.lineWidth : 8;
      const strokeColor = 'strokeColor' in shape ? shape.strokeColor : '#000000';
      
      // Save the current state
      ctx.save();
      
      // Make sure we're drawing lines on top - this ensures they appear above rectangles and polygons
      ctx.globalCompositeOperation = 'source-over';
      
      // Draw the thick gray line
      ctx.beginPath();
      ctx.moveTo(shape.start.x, shape.start.y);
      ctx.lineTo(shape.end.x, shape.end.y);
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = '#8E9196'; // Gray color for the main line
      ctx.lineCap = 'butt'; // Ensure flat ends
      ctx.stroke();
      
      // Draw the thin black border
      ctx.beginPath();
      ctx.moveTo(shape.start.x, shape.start.y);
      ctx.lineTo(shape.end.x, shape.end.y);
      ctx.lineWidth = lineWidth + 2; // 2px wider for the border
      ctx.strokeStyle = strokeColor;
      ctx.lineCap = 'butt'; // Ensure flat ends
      // Change to destination-over to ensure the black border is drawn behind the gray line
      ctx.globalCompositeOperation = 'destination-over';
      ctx.stroke();
      
      // Reset composite operation for end caps
      ctx.globalCompositeOperation = 'source-over';
      
      // Add end caps for non-connected ends (thin lines at the beginning/end)
      // Only add caps where there's no connection
      const borderThickness = 1; // Reduced from 2 to 1 for less thick end caps
      
      // Calculate the angle of the line
      const angle = Math.atan2(shape.end.y - shape.start.y, shape.end.x - shape.start.x);
      
      // Calculate perpendicular angle for end caps (90 degrees to the line)
      const perpAngle = angle + Math.PI / 2;
      const dx = Math.cos(perpAngle) * (lineWidth / 2);
      const dy = Math.sin(perpAngle) * (lineWidth / 2);
      
      // Reset composite operation
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = borderThickness;
      
      // Draw cap at start point if not connected or intersecting
      if (connectedToStart.length === 0 && intersectingWithStart.length === 0) {
        ctx.beginPath();
        ctx.moveTo(shape.start.x - dx, shape.start.y - dy);
        ctx.lineTo(shape.start.x + dx, shape.start.y + dy);
        ctx.stroke();
      }
      
      // Draw cap at end point if not connected or intersecting
      if (connectedToEnd.length === 0 && intersectingWithEnd.length === 0) {
        ctx.beginPath();
        ctx.moveTo(shape.end.x - dx, shape.end.y - dy);
        ctx.lineTo(shape.end.x + dx, shape.end.y + dy);
        ctx.stroke();
      }
      
      // Restore to default state
      ctx.restore();
    }
  });

  // Ensure we're back to normal composite operation before drawing joints
  ctx.globalCompositeOperation = 'source-over';

  // Third pass - draw connection points at joints AND intersection points to ensure proper welding
  const drawnJoints = new Set<string>();
  
  shapes.forEach(shape => {
    if (shape.type === 'line') {
      // Check each end of the line for connections and intersections
      [shape.start, shape.end].forEach(endpoint => {
        // Create a unique key for this joint to avoid drawing it multiple times
        const jointKey = `${Math.round(endpoint.x)},${Math.round(endpoint.y)}`;
        
        if (!drawnJoints.has(jointKey)) {
          const connectedLines = findConnectedLines(shapes, endpoint);
          const intersectingLines = findIntersectingLines(shapes, endpoint);
          
          // If we have multiple lines connected at this point OR any intersecting lines, add a welding circle
          if (connectedLines.length > 1 || intersectingLines.length > 0) {
            // Find the line width to use for the joint (defaulting to 8 if not found)
            const firstLine = connectedLines.length > 0 ? connectedLines[0] : 
                              intersectingLines.length > 0 ? intersectingLines[0] : null;
                              
            const lineWidth = firstLine && firstLine.type === 'line' && 'lineWidth' in firstLine
              ? firstLine.lineWidth
              : 8;
            
            // Add a small filled circle at the joint for seamless welding
            ctx.save();
            
            // Draw the gray center circle that matches the line color
            ctx.beginPath();
            ctx.arc(endpoint.x, endpoint.y, lineWidth / 2, 0, Math.PI * 2);
            ctx.fillStyle = '#8E9196'; // Same gray color as the lines
            ctx.fill();
            
            // Draw the black border circle behind it
            ctx.beginPath();
            ctx.arc(endpoint.x, endpoint.y, lineWidth / 2 + 1, 0, Math.PI * 2);
            ctx.fillStyle = '#000000'; // Border color
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fill();
            
            ctx.restore();
            
            // Mark this joint as processed
            drawnJoints.add(jointKey);
          }
        }
      });
      
      // Also check for intersections along the line
      shapes.forEach(otherShape => {
        if (otherShape.type === 'line' && otherShape.id !== shape.id) {
          // Check if the lines intersect
          const intersection = findLineIntersection(shape, otherShape);
          if (intersection) {
            const intersectionKey = `${Math.round(intersection.x)},${Math.round(intersection.y)}`;
            
            if (!drawnJoints.has(intersectionKey)) {
              // Add welding circle at intersection
              const lineWidth = 'lineWidth' in shape ? shape.lineWidth : 8;
              
              ctx.save();
              
              // Make sure we're drawing on top
              ctx.globalCompositeOperation = 'source-over';
              
              // Draw gray center circle
              ctx.beginPath();
              ctx.arc(intersection.x, intersection.y, lineWidth / 2, 0, Math.PI * 2);
              ctx.fillStyle = '#8E9196';
              ctx.fill();
              
              // Draw black border circle
              ctx.beginPath();
              ctx.arc(intersection.x, intersection.y, lineWidth / 2 + 1, 0, Math.PI * 2);
              ctx.fillStyle = '#000000';
              ctx.globalCompositeOperation = 'destination-over';
              ctx.fill();
              
              ctx.restore();
              
              drawnJoints.add(intersectionKey);
            }
          }
        }
      });
    }
  });

  // Reset composite operation for the final pass
  ctx.globalCompositeOperation = 'source-over';

  // Final pass: Highlight selected shape
  if (selectedShapeId) {
    const selectedShape = shapes.find(shape => shape.id === selectedShapeId);
    if (selectedShape) {
      ctx.strokeStyle = '#0000FF';
      ctx.lineWidth = 3;
      
      if (selectedShape.type === 'line') {
        ctx.beginPath();
        ctx.moveTo(selectedShape.start.x, selectedShape.start.y);
        ctx.lineTo(selectedShape.end.x, selectedShape.end.y);
        ctx.stroke();
      } else if (selectedShape.type === 'rectangle') {
        // Draw only a selection border for rectangles
        ctx.strokeRect(
          selectedShape.start.x,
          selectedShape.start.y,
          selectedShape.end.x - selectedShape.start.x,
          selectedShape.end.y - selectedShape.start.y
        );
      } else if (selectedShape.type === 'polygon') {
        if (selectedShape.points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(selectedShape.points[0].x, selectedShape.points[0].y);
          
          for (let i = 1; i < selectedShape.points.length; i++) {
            ctx.lineTo(selectedShape.points[i].x, selectedShape.points[i].y);
          }
          
          ctx.closePath();
          ctx.stroke();
        }
      }
    }
  }
};

// Helper function to find intersection point of two lines if they intersect
const findLineIntersection = (line1: Shape, line2: Shape): Point | null => {
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

export const drawInProgressPolygon = (
  ctx: CanvasRenderingContext2D,
  polygonPoints: Point[],
  currentPoint: Point | null,
  strokeColor: string,
  fillColor: string
): void => {
  if (polygonPoints.length === 0) return;
  
  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = fillColor;
  ctx.lineWidth = 2;
  
  // Draw the polygon lines
  ctx.beginPath();
  ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
  
  for (let i = 1; i < polygonPoints.length; i++) {
    ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
  }
  
  if (currentPoint) {
    ctx.lineTo(currentPoint.x, currentPoint.y);
  }
  
  // Draw circle at the starting point to indicate where to close the polygon
  const startPoint = polygonPoints[0];
  
  // First fill with semi-transparent yellow
  ctx.fillStyle = 'rgba(255, 251, 204, 0.5)';
  if (currentPoint) {
    // Close back to the first point for the fill
    ctx.lineTo(startPoint.x, startPoint.y);
  }
  ctx.fill();
  
  // Now stroke the shape
  ctx.stroke();
  
  // Draw a circle marker at the starting point
  ctx.beginPath();
  ctx.arc(startPoint.x, startPoint.y, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#FF0000'; // Red circle to indicate start point
  ctx.fill();
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.stroke();
};

export const drawPreviewLine = (
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  color: string
): void => {
  // Save the current state
  ctx.save();
  
  // Draw the thick gray preview line
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#8E9196'; // Gray color
  ctx.lineCap = 'butt'; // Flat ends for the gray part
  ctx.stroke();
  
  // Draw the thin black border with consistent 2px width
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.lineWidth = 8 + 2; // Consistently 2px wider for border
  ctx.strokeStyle = '#000000'; // Black border
  ctx.lineCap = 'butt'; // Match the gray line's end style
  ctx.globalCompositeOperation = 'destination-over';
  ctx.stroke();
  
  // Restore to default state
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
};

// Export the helper functions for line snapping
export const lineSnappingHelpers = {
  findNearestPointOnAnyLine,
  findClosestPointOnLine,
  isPointOnLine
};
