
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

  // Clear the canvas with a normal composite operation
  ctx.globalCompositeOperation = 'source-over';
  
  // STEP 1: Draw all fills for rectangles and polygons first
  sortedShapes.forEach(shape => {
    if (shape.type !== 'line') {
      // Save context state
      ctx.save();
      
      // Draw only fills in this pass
      if (shape.type === 'rectangle') {
        ctx.fillStyle = 'fillColor' in shape ? shape.fillColor : defaultFillColor;
        ctx.beginPath();
        ctx.rect(
          shape.start.x,
          shape.start.y,
          shape.end.x - shape.start.x,
          shape.end.y - shape.start.y
        );
        ctx.fill();
      } else if (shape.type === 'polygon') {
        ctx.fillStyle = 'fillColor' in shape ? shape.fillColor : defaultFillColor;
        
        if (shape.points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(shape.points[0].x, shape.points[0].y);
          
          for (let i = 1; i < shape.points.length; i++) {
            ctx.lineTo(shape.points[i].x, shape.points[i].y);
          }
          
          ctx.closePath();
          ctx.fill();
        }
      }
      
      // Restore context state
      ctx.restore();
    }
  });

  // STEP 2: Draw all the lines with their borders on top of the fills
  sortedShapes.forEach(shape => {
    if (shape.type === 'line') {
      const lineWidth = 'lineWidth' in shape ? shape.lineWidth : 8;
      const strokeColor = 'strokeColor' in shape ? shape.strokeColor : '#000000';
      
      // Save the current state
      ctx.save();
      
      // Draw the black border first using source-over
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();
      ctx.moveTo(shape.start.x, shape.start.y);
      ctx.lineTo(shape.end.x, shape.end.y);
      ctx.lineWidth = lineWidth + 2; // 2px wider for the border
      ctx.strokeStyle = strokeColor;
      ctx.lineCap = 'butt';
      ctx.stroke();
      
      // Then draw the gray line on top of the border
      ctx.beginPath();
      ctx.moveTo(shape.start.x, shape.start.y);
      ctx.lineTo(shape.end.x, shape.end.y);
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = '#8E9196'; // Gray color for the main line
      ctx.lineCap = 'butt';
      ctx.stroke();
      
      // Restore to default state
      ctx.restore();
    }
  });

  // Create a collection to track all welding points to draw
  const weldingPoints: Point[] = [];
  
  // STEP 3: Find all intersection points first
  sortedShapes.forEach((shape1) => {
    if (shape1.type === 'line') {
      // Check for line endpoints that connect with other lines
      [shape1.start, shape1.end].forEach(endpoint => {
        const connectedLines = findConnectedLines(shapes, endpoint, shape1.id);
        if (connectedLines.length > 0) {
          // Add this endpoint for welding
          weldingPoints.push(endpoint);
        }
      });
      
      // Check for intersections with other lines
      sortedShapes.forEach((shape2) => {
        if (shape2.type === 'line' && shape2.id !== shape1.id) {
          const intersection = findLineIntersection(shape1, shape2);
          if (intersection) {
            // Add this intersection point for welding
            weldingPoints.push(intersection);
          }
        }
      });
    }
  });
  
  // STEP 4: Draw all welding points at once with the same style for consistency
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  
  weldingPoints.forEach(point => {
    // Calculate the appropriate size for the welding point
    const jointSize = 8; // Default line width
    
    // Draw the welding circle
    ctx.beginPath();
    ctx.arc(point.x, point.y, jointSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#8E9196'; // Gray color matching the line
    ctx.fill();
    
    // Draw a black border around the welding point for seamless look
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000000';
    ctx.stroke();
  });
  
  ctx.restore();
  
  // STEP 5: Draw end caps for lines that aren't connected
  sortedShapes.forEach(shape => {
    if (shape.type === 'line') {
      // Calculate the angle of the line
      const angle = Math.atan2(shape.end.y - shape.start.y, shape.end.x - shape.start.x);
      
      // Calculate perpendicular angle for end caps (90 degrees to the line)
      const perpAngle = angle + Math.PI / 2;
      const lineWidth = 'lineWidth' in shape ? shape.lineWidth : 8;
      const strokeColor = 'strokeColor' in shape ? shape.strokeColor : '#000000';
      const dx = Math.cos(perpAngle) * (lineWidth / 2);
      const dy = Math.sin(perpAngle) * (lineWidth / 2);
      
      // Draw end caps for lines that aren't connected
      ctx.save();
      const borderThickness = 1;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = borderThickness;
      
      // Draw cap at start point if not connected or intersecting
      const connectedToStart = findConnectedLines(shapes, shape.start, shape.id);
      const intersectingWithStart = findIntersectingLines(shapes, shape.start, shape.id);
      if (connectedToStart.length === 0 && intersectingWithStart.length === 0) {
        ctx.beginPath();
        ctx.moveTo(shape.start.x - dx, shape.start.y - dy);
        ctx.lineTo(shape.start.x + dx, shape.start.y + dy);
        ctx.stroke();
      }
      
      // Draw cap at end point if not connected or intersecting
      const connectedToEnd = findConnectedLines(shapes, shape.end, shape.id);
      const intersectingWithEnd = findIntersectingLines(shapes, shape.end, shape.id);
      if (connectedToEnd.length === 0 && intersectingWithEnd.length === 0) {
        ctx.beginPath();
        ctx.moveTo(shape.end.x - dx, shape.end.y - dy);
        ctx.lineTo(shape.end.x + dx, shape.end.y + dy);
        ctx.stroke();
      }
      
      ctx.restore();
    }
  });

  // STEP 6: Highlight selected shape - always on top
  if (selectedShapeId) {
    const selectedShape = shapes.find(shape => shape.id === selectedShapeId);
    if (selectedShape) {
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
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
      
      ctx.restore();
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
  
  // Draw the black border first
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.lineWidth = 8 + 2; // 2px wider for the border
  ctx.strokeStyle = '#000000'; // Black border
  ctx.lineCap = 'butt';
  ctx.stroke();
  
  // Then draw the gray line on top of the border
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#8E9196'; // Gray color for the main line
  ctx.lineCap = 'butt'; 
  ctx.stroke();
  
  // Restore to default state
  ctx.restore();
};

// Export the helper functions for line snapping
export const lineSnappingHelpers = {
  findNearestPointOnAnyLine,
  findClosestPointOnLine,
  isPointOnLine
};
