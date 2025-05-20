import { Point, Shape, PreviewLine } from '@/types/canvas';

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

// Check if a line segment intersects with another line segment
const doLinesIntersect = (
  line1Start: Point,
  line1End: Point,
  line2Start: Point,
  line2End: Point
): boolean => {
  // Calculate direction vectors
  const v1 = {
    x: line1End.x - line1Start.x,
    y: line1End.y - line1Start.y
  };
  
  const v2 = {
    x: line2End.x - line2Start.x,
    y: line2End.y - line2Start.y
  };
  
  // Calculate cross product of the vectors
  const cross = v1.x * v2.y - v1.y * v2.x;
  
  // If cross product is zero, lines are parallel or collinear (not intersecting in our context)
  if (Math.abs(cross) < 0.0001) return false;
  
  // Calculate the parameters for intersection point
  const s = (
    (line2Start.x - line1Start.x) * v2.y - (line2Start.y - line1Start.y) * v2.x
  ) / cross;
  
  const t = (
    (line2Start.x - line1Start.x) * v1.y - (line2Start.y - line1Start.y) * v1.x
  ) / cross;
  
  // Check if intersection point is within both line segments
  return s >= 0 && s <= 1 && t >= 0 && t <= 1;
}

// Check if a potential extension line is obstructed by any walls
const isExtensionLineObstructed = (
  startPoint: Point,
  endPoint: Point,
  shapes: Shape[]
): boolean => {
  // Filter for only line shapes (walls)
  const walls = shapes.filter(shape => shape.type === 'line');
  
  // Check each wall to see if it intersects with our extension line
  for (const wall of walls) {
    // Skip checking against very close/connected walls
    const distanceToStartWall = Math.sqrt(
      Math.pow(wall.start.x - startPoint.x, 2) + 
      Math.pow(wall.start.y - startPoint.y, 2)
    );
    
    const distanceToEndWall = Math.sqrt(
      Math.pow(wall.end.x - startPoint.x, 2) + 
      Math.pow(wall.end.y - startPoint.y, 2)
    );
    
    // Skip if this wall is the one we're extending from
    if (distanceToStartWall < 5 || distanceToEndWall < 5) {
      continue;
    }
    
    // Check if this wall obstructs our extension line
    if (doLinesIntersect(startPoint, endPoint, wall.start, wall.end)) {
      return true;  // This extension is obstructed
    }
  }
  
  return false;  // No obstructions found
}

// UPDATED: Modified to only find perpendicular extension points from existing lines
// Now also checks for obstructions
const findLineExtensionPoint = (
  startPoint: Point,
  currentPoint: Point,
  shapes: Shape[],
  threshold: number = 30
): { point: Point, referenceLineId: string, extendedLine: {start: Point, end: Point} } | null => {
  // We're only interested in perpendicular extensions now
  return findPerpendicularExtension(startPoint, currentPoint, shapes, threshold);
};

// UPDATED: Helper function to find perpendicular line extensions from endpoints
const findPerpendicularExtension = (
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
            // Check if this extension is obstructed by any walls
            const isObstructed = isExtensionLineObstructed(
              startPoint, 
              intersection, 
              shapes
            );
            
            // Only consider this extension if it's not obstructed
            if (!isObstructed) {
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
  }
  
  return closestIntersection;
};

// Helper function to find intersection point of two infinite lines
const findIntersectionPoint = (
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
      
      // Draw only fills in this pass - using full opacity (100%) for completed shapes
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
  
  // STEP 2: Draw all line borders at once first to ensure seamless connections
  const lineShapes = sortedShapes.filter(shape => shape.type === 'line');
  if (lineShapes.length > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    
    // Start a new path for all borders at once
    ctx.beginPath();
    
    // Add all lines to the path
    lineShapes.forEach(shape => {
      if (shape.type === 'line') {
        ctx.moveTo(shape.start.x, shape.start.y);
        ctx.lineTo(shape.end.x, shape.end.y);
      }
    });
    
    // Stroke all borders at once
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#000000';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    
    ctx.restore();
    
    // STEP 3: Draw all line fills at once to ensure seamless connections
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    
    // Start a new path for all fills
    ctx.beginPath();
    
    // Add all lines to the path
    lineShapes.forEach(shape => {
      if (shape.type === 'line') {
        ctx.moveTo(shape.start.x, shape.start.y);
        ctx.lineTo(shape.end.x, shape.end.y);
      }
    });
    
    // Stroke all inner lines at once
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#8E9196';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    
    ctx.restore();
  }

  // STEP 4: Highlight selected shape - always on top
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
  fillColor: string,
  isWallPolygon: boolean = false,
  showStartPoint: boolean = false
): void => {
  if (polygonPoints.length === 0) return;
  
  // Save original context state
  ctx.save();

  // Different styling based on polygon type
  if (isWallPolygon) {
    // Draw the polygon lines - wall style with thick black border and gray fill
    ctx.beginPath();
    ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
    
    for (let i = 1; i < polygonPoints.length; i++) {
      ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
    }
    
    if (currentPoint) {
      ctx.lineTo(currentPoint.x, currentPoint.y);
    }

    // Draw thick black border for each line
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#000000';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    
    // Draw gray inner line for each segment
    ctx.beginPath();
    ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
    
    for (let i = 1; i < polygonPoints.length; i++) {
      ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
    }
    
    if (currentPoint) {
      ctx.lineTo(currentPoint.x, currentPoint.y);
    }
    
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#8E9196';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  } else {
    // Regular polygon style
    ctx.strokeStyle = strokeColor;
    
    // Apply 50% opacity for in-progress polygons
    const baseColor = fillColor;
    // Extract the RGB components and create a semi-transparent version
    let semiTransparentColor = baseColor;
    
    // Handle both hex and rgb formats
    if (baseColor.startsWith('#')) {
      // Convert hex to rgba
      const r = parseInt(baseColor.slice(1, 3), 16);
      const g = parseInt(baseColor.slice(3, 5), 16);
      const b = parseInt(baseColor.slice(5, 7), 16);
      semiTransparentColor = `rgba(${r}, ${g}, ${b}, 0.5)`;
    } else if (baseColor.startsWith('rgb(')) {
      // Convert rgb to rgba
      semiTransparentColor = baseColor.replace(/rgb\((.+)\)/, 'rgba($1, 0.5)');
    }
    
    ctx.fillStyle = semiTransparentColor;
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
    
    // Close back to the first point for the fill
    if (currentPoint) {
      ctx.lineTo(polygonPoints[0].x, polygonPoints[0].y);
    }
    
    // Fill with the correct color at 50% opacity
    ctx.fill();
    
    // Then stroke the shape
    ctx.stroke();
  }
  
  // Draw a circle marker at the starting point for both types, but only if showStartPoint is true
  if (showStartPoint) {
    const startPoint = polygonPoints[0];
    ctx.beginPath();
    ctx.arc(startPoint.x, startPoint.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#FF0000'; // Red circle to indicate start point
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  
  // Restore context state
  ctx.restore();
};

export const drawPreviewLine = (
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  color: string
): void => {
  // Save the current state
  ctx.save();
  
  // Draw the black border first with round caps for a better look
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.lineWidth = 10; // Slightly wider than inner line
  ctx.strokeStyle = '#000000'; // Black border
  ctx.lineCap = 'round';
  ctx.stroke();
  
  // Then draw the gray line on top of the border
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#8E9196'; // Gray color for the main line
  ctx.lineCap = 'round';
  ctx.stroke();
  
  // Restore to default state
  ctx.restore();
};

// UPDATED: Extension line drawing with green color and better visual indicators
export const drawExtensionLine = (
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point
): void => {
  // Save the current state
  ctx.save();
  
  // Setup for dashed line (5px dash, 5px gap)
  ctx.setLineDash([5, 5]);
  ctx.lineDashOffset = 0;
  
  // Draw a green dashed line
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.lineWidth = 2; 
  ctx.strokeStyle = '#22c55e'; // Green color for the line
  ctx.stroke();
  
  // Draw a small X at the starting point to show where the extension is from
  const crossSize = 4;
  ctx.beginPath();
  ctx.moveTo(start.x - crossSize, start.y - crossSize);
  ctx.lineTo(start.x + crossSize, start.y + crossSize);
  ctx.moveTo(start.x + crossSize, start.y - crossSize);
  ctx.lineTo(start.x - crossSize, start.y + crossSize);
  ctx.strokeStyle = '#22c55e'; // Green color for the X
  ctx.lineWidth = 1.5;
  ctx.stroke();
  
  // Restore previous context settings
  ctx.restore();
};

// Export the helper functions for line snapping
export const lineSnappingHelpers = {
  findNearestPointOnAnyLine,
  findClosestPointOnLine,
  isPointOnLine,
  findLineExtensionPoint,
  isExtensionLineObstructed  // Export the new obstruction check function
};
