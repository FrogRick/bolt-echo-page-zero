
import { Point, Shape, PreviewLine, ExtensionLine } from '@/types/canvas';

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

// COMPLETELY REWRITTEN: Check if a line segment intersects with another line segment
// Returns true if they intersect, false otherwise
const doLinesIntersect = (
  line1Start: Point,
  line1End: Point,
  line2Start: Point,
  line2End: Point
): boolean => {
  // Calculate line vectors
  const v1x = line1End.x - line1Start.x;
  const v1y = line1End.y - line1Start.y;
  const v2x = line2End.x - line2Start.x;
  const v2y = line2End.y - line2Start.y;
  
  // Calculate the cross products
  const cross1 = (line2Start.x - line1Start.x) * v1y - (line2Start.y - line1Start.y) * v1x;
  const cross2 = (line2End.x - line1Start.x) * v1y - (line2End.y - line1Start.y) * v1x;
  
  // If the signs of the cross products are the same, there's no intersection
  if (cross1 * cross2 > 0) return false;
  
  const cross3 = (line1Start.x - line2Start.x) * v2y - (line1Start.y - line2Start.y) * v2x;
  const cross4 = (line1End.x - line2Start.x) * v2y - (line1End.y - line2Start.y) * v2x;
  
  // Same check for the other line
  if (cross3 * cross4 > 0) return false;
  
  // Edge case: collinear lines
  if (cross1 === 0 && cross2 === 0 && cross3 === 0 && cross4 === 0) {
    // Check if one segment contains at least one endpoint of the other
    const t0 = ((line2Start.x - line1Start.x) * v1x + (line2Start.y - line1Start.y) * v1y) / 
               (v1x * v1x + v1y * v1y);
    const t1 = ((line2End.x - line1Start.x) * v1x + (line2End.y - line1Start.y) * v1y) / 
               (v1x * v1x + v1y * v1y);
    
    return (t0 >= 0 && t0 <= 1) || (t1 >= 0 && t1 <= 1);
  }
  
  // If we made it here, the segments intersect
  return true;
};

// COMPLETELY REWRITTEN: Check if a line from start to end is obstructed by any walls
// Returns true if obstructed, false otherwise
const isLineObstructed = (
  startPoint: Point,
  endPoint: Point,
  walls: Shape[],
  tolerance: number = 0.1
): boolean => {
  // Filter to include only wall shapes
  const wallShapes = walls.filter(shape => shape.type === 'line');
  
  // Check if either point is very close to a wall endpoint - if so, don't count as obstructed
  // This allows for connecting to existing walls
  const isCloseToWallEndpoint = (point: Point): boolean => {
    for (const wall of wallShapes) {
      const distToStart = Math.sqrt(
        Math.pow(point.x - wall.start.x, 2) + Math.pow(point.y - wall.start.y, 2)
      );
      const distToEnd = Math.sqrt(
        Math.pow(point.x - wall.end.x, 2) + Math.pow(point.y - wall.end.y, 2)
      );
      
      if (distToStart < 5 || distToEnd < 5) {
        return true;
      }
    }
    return false;
  };
  
  // If either endpoint is close to a wall endpoint, we'll allow the connection
  if (isCloseToWallEndpoint(startPoint) || isCloseToWallEndpoint(endPoint)) {
    return false;
  }
  
  // Create a slightly shorter version of our line to prevent false positives at endpoints
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  if (length < 1) return false; // Very short line, can't be obstructed
  
  // Get the unit vector
  const unitX = dx / length;
  const unitY = dy / length;
  
  // Shorten the line slightly from both ends to avoid false positives
  const shrinkFactor = Math.min(tolerance, length / 3); // Don't shrink more than a third of the line
  
  const adjustedStart = {
    x: startPoint.x + unitX * shrinkFactor,
    y: startPoint.y + unitY * shrinkFactor
  };
  
  const adjustedEnd = {
    x: endPoint.x - unitX * shrinkFactor,
    y: endPoint.y - unitY * shrinkFactor
  };
  
  // For each wall, check if it intersects with our adjusted line
  for (const wall of wallShapes) {
    if (doLinesIntersect(adjustedStart, adjustedEnd, wall.start, wall.end)) {
      return true; // Line is obstructed
    }
  }
  
  return false; // No obstructions found
};

// COMPLETELY REWRITTEN: Find perpendicular extension without obstructions
const findPerpendicularExtension = (
  startPoint: Point,
  currentPoint: Point,
  shapes: Shape[],
  threshold: number = 30
): { point: Point, referenceLineId: string, extendedLine: {start: Point, end: Point} } | null => {
  // Filter to only get walls (line shapes)
  const walls = shapes.filter(shape => shape.type === 'line');
  
  // Return early if there are no walls
  if (walls.length === 0) return null;
  
  // Create an array to store all potential extension points
  const potentialExtensions: Array<{
    point: Point, 
    referenceLineId: string, 
    extendedLine: {start: Point, end: Point},
    distance: number
  }> = [];

  // Calculate the direction vector from start to current point
  const directVector = {
    x: currentPoint.x - startPoint.x,
    y: currentPoint.y - startPoint.y
  };
  
  const directLength = Math.sqrt(directVector.x * directVector.x + directVector.y * directVector.y);
  if (directLength === 0) return null;
  
  // For each wall, check for potential perpendicular extensions
  for (const wall of walls) {
    // For walls, we want to extend perpendicular from both endpoints
    const endpoints = [wall.start, wall.end];
    
    for (const endpoint of endpoints) {
      // Calculate perpendicular vector from the wall
      const wallVector = {
        x: wall.end.x - wall.start.x,
        y: wall.end.y - wall.start.y
      };
      
      // Perpendicular = rotate 90 degrees
      const perpVector = {
        x: -wallVector.y,
        y: wallVector.x
      };
      
      // Normalize perpendicular vector
      const perpLength = Math.sqrt(perpVector.x * perpVector.x + perpVector.y * perpVector.y);
      if (perpLength === 0) continue;
      
      const normalizedPerpVector = {
        x: perpVector.x / perpLength,
        y: perpVector.y / perpLength
      };
      
      // Create extended point in both perpendicular directions
      const directions = [1, -1]; // Try both directions
      
      for (const direction of directions) {
        // Calculate the direction to extend (perpendicular to wall)
        const extensionVector = {
          x: normalizedPerpVector.x * direction,
          y: normalizedPerpVector.y * direction
        };
        
        // Create a point far enough in the perpendicular direction to find intersection
        const extendedPoint = {
          x: endpoint.x + extensionVector.x * 1000, // Long enough to intersect
          y: endpoint.y + extensionVector.y * 1000
        };
        
        // Create an infinite line from our drawing point in the current direction
        const drawingEndPoint = { 
          x: startPoint.x + directVector.x * 1000, 
          y: startPoint.y + directVector.y * 1000 
        };
        
        // Find intersection between our drawing line and this perpendicular line
        const intersection = findIntersectionPoint(
          startPoint, 
          drawingEndPoint,
          endpoint, 
          extendedPoint
        );
        
        if (intersection) {
          // Calculate distance from current mouse position to intersection
          const distToIntersection = Math.sqrt(
            Math.pow(intersection.x - currentPoint.x, 2) + 
            Math.pow(intersection.y - currentPoint.y, 2)
          );
          
          // Only consider if within threshold
          if (distToIntersection < threshold) {
            // Now check if the path is clear - no walls blocking the extension
            const isPathClear = !isLineObstructed(startPoint, intersection, walls);
            
            // Only add clear paths
            if (isPathClear) {
              potentialExtensions.push({
                point: intersection,
                referenceLineId: wall.id,
                extendedLine: { start: endpoint, end: intersection },
                distance: distToIntersection
              });
            }
          }
        }
      }
    }
  }
  
  // If we have any valid extensions, return the closest one
  if (potentialExtensions.length > 0) {
    // Sort by distance
    potentialExtensions.sort((a, b) => a.distance - b.distance);
    
    // Return the closest unobstructed extension
    return {
      point: potentialExtensions[0].point,
      referenceLineId: potentialExtensions[0].referenceLineId,
      extendedLine: potentialExtensions[0].extendedLine
    };
  }
  
  // No valid extensions found
  return null;
};

// Wrap the key function we need to export
const findLineExtensionPoint = (
  startPoint: Point,
  currentPoint: Point,
  shapes: Shape[],
  threshold: number = 30
): { point: Point, referenceLineId: string, extendedLine: {start: Point, end: Point} } | null => {
  return findPerpendicularExtension(startPoint, currentPoint, shapes, threshold);
};

// Helper function to draw elements based on their type with proper type differentiation
export const drawSelectedElements = (
  ctx: CanvasRenderingContext2D, 
  elements: any[]
): void => {
  if (!elements.length) return;
  
  ctx.save();
  ctx.strokeStyle = "#3b82f6"; // Blue selection color
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 3]); // Dashed line for selection
  
  elements.forEach(element => {
    if (element.type === "image") {
      // Draw selection border around images
      ctx.strokeRect(
        element.x - 5, 
        element.y - 5, 
        element.width + 10, 
        element.height + 10
      );
      
      // Draw resize handles
      const handleSize = 8;
      const halfHandle = handleSize / 2;
      
      // Draw handles at corners and midpoints
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 1;
      ctx.setLineDash([]); // Solid line for handles
      
      // Define handle positions (8 handles around the image)
      const handles = [
        { x: element.x, y: element.y }, // Top left
        { x: element.x + element.width/2, y: element.y }, // Top middle
        { x: element.x + element.width, y: element.y }, // Top right
        { x: element.x + element.width, y: element.y + element.height/2 }, // Right middle
        { x: element.x + element.width, y: element.y + element.height }, // Bottom right
        { x: element.x + element.width/2, y: element.y + element.height }, // Bottom middle
        { x: element.x, y: element.y + element.height }, // Bottom left
        { x: element.x, y: element.y + element.height/2 } // Left middle
      ];
      
      // Draw all handles
      handles.forEach(handle => {
        ctx.beginPath();
        ctx.rect(handle.x - halfHandle, handle.y - halfHandle, handleSize, handleSize);
        ctx.fill();
        ctx.stroke();
      });
    } else if (element.points) {
      // Draw selection for vector elements
      ctx.beginPath();
      
      // Start at the first point
      ctx.moveTo(element.points[0].x, element.points[0].y);
      
      // Connect all points
      for (let i = 1; i < element.points.length; i++) {
        ctx.lineTo(element.points[i].x, element.points[i].y);
      }
      
      // Close the shape if it's a polygon
      if (element.type.includes("polygon")) {
        ctx.closePath();
      }
      
      // Stroke the selection
      ctx.stroke();
      
      // Draw control points at each vertex
      ctx.fillStyle = "#ffffff";
      ctx.setLineDash([]);
      
      element.points.forEach((point: Point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
    }
  });
  
  ctx.restore();
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

// Draw a preview wall line
export const drawPreviewWall = (
  ctx: CanvasRenderingContext2D,
  points: Point[],
  currentPoint: Point | null,
  color: string
): void => {
  if (!points.length) return;
  
  // Save the current canvas state
  ctx.save();
  
  // Draw existing segments with the wall style (thick black border with gray fill)
  if (points.length > 1) {
    for (let i = 0; i < points.length - 1; i++) {
      // Draw the black border first
      ctx.beginPath();
      ctx.moveTo(points[i].x, points[i].y);
      ctx.lineTo(points[i + 1].x, points[i + 1].y);
      ctx.lineWidth = 10;
      ctx.strokeStyle = '#000000';
      ctx.lineCap = 'round';
      ctx.stroke();
      
      // Draw the gray inner line
      ctx.beginPath();
      ctx.moveTo(points[i].x, points[i].y);
      ctx.lineTo(points[i + 1].x, points[i + 1].y);
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#8E9196';
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }
  
  // Draw the preview segment to the current mouse position
  if (currentPoint && points.length > 0) {
    const lastPoint = points[points.length - 1];
    
    // Draw the black border first
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#000000';
    ctx.lineCap = 'round';
    ctx.stroke();
    
    // Draw the gray inner line
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#8E9196';
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  
  // Restore the canvas state
  ctx.restore();
};

// Draw a preview rectangle
export const drawPreviewRectangle = (
  ctx: CanvasRenderingContext2D,
  firstPoint: Point,
  currentPoint: Point,
  strokeColor: string,
  fillColor: string
): void => {
  // Save the current canvas state
  ctx.save();
  
  // Calculate rectangle coordinates
  const x = Math.min(firstPoint.x, currentPoint.x);
  const y = Math.min(firstPoint.y, currentPoint.y);
  const width = Math.abs(currentPoint.x - firstPoint.x);
  const height = Math.abs(currentPoint.y - firstPoint.y);
  
  // Set styles
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2;
  
  // Create a semi-transparent fill color with 50% opacity
  let semiTransparentFill;
  if (fillColor.startsWith('#')) {
    // Convert hex to rgba
    const r = parseInt(fillColor.slice(1, 3), 16);
    const g = parseInt(fillColor.slice(3, 5), 16);
    const b = parseInt(fillColor.slice(5, 7), 16);
    semiTransparentFill = `rgba(${r}, ${g}, ${b}, 0.5)`;
  } else if (fillColor.startsWith('rgb(')) {
    // Convert rgb to rgba
    semiTransparentFill = fillColor.replace('rgb', 'rgba').replace(')', ', 0.5)');
  } else {
    semiTransparentFill = fillColor;
  }
  
  ctx.fillStyle = semiTransparentFill;
  
  // Draw the rectangle
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.fill();
  ctx.stroke();
  
  // Restore the canvas state
  ctx.restore();
};

// Draw preview polygon
export const drawPreviewPolygon = (
  ctx: CanvasRenderingContext2D,
  polygonPoints: Point[],
  currentPoint: Point | null,
  strokeColor: string,
  fillColor: string,
  showStartPoint: boolean = true
): void => {
  if (polygonPoints.length === 0) return;
  
  // Save original context state
  ctx.save();

  // Different styling based on polygon type
  if (strokeColor === '#FF0000') {
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

export const drawInProgressPolygon = (
  ctx: CanvasRenderingContext2D,
  polygonPoints: Point[],
  currentPoint: Point | null,
  strokeColor: string,
  fillColor: string,
  isWallPolygon: boolean = false,
  showStartPoint: boolean = true  // Changed default to true to fix the red dot issue
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

// Draw a preview circle
export const drawPreviewCircle = (
  ctx: CanvasRenderingContext2D,
  center: Point,
  radius: number,
  strokeColor: string,
  fillColor: string
): void => {
  // Save the current canvas state
  ctx.save();
  
  // Set styles
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2;
  
  // Create a semi-transparent fill color with 50% opacity
  let semiTransparentFill;
  if (fillColor.startsWith('#')) {
    // Convert hex to rgba
    const r = parseInt(fillColor.slice(1, 3), 16);
    const g = parseInt(fillColor.slice(3, 5), 16);
    const b = parseInt(fillColor.slice(5, 7), 16);
    semiTransparentFill = `rgba(${r}, ${g}, ${b}, 0.5)`;
  } else if (fillColor.startsWith('rgb(')) {
    // Convert rgb to rgba
    semiTransparentFill = fillColor.replace('rgb', 'rgba').replace(')', ', 0.5)');
  } else {
    semiTransparentFill = fillColor;
  }
  
  ctx.fillStyle = semiTransparentFill;
  
  // Draw the circle
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Restore the canvas state
  ctx.restore();
};

// Updated extension line drawing - removed "blocked" status since we won't suggest blocked lines at all
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
  
  // Green color for valid extensions (we won't draw blocked ones anymore)
  const lineColor = '#22c55e'; 
  
  // Draw a dashed line
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.lineWidth = 2; 
  ctx.strokeStyle = lineColor;
  ctx.stroke();
  
  // Draw a small X at the starting point to show where the extension is from
  const crossSize = 4;
  ctx.beginPath();
  ctx.moveTo(start.x - crossSize, start.y - crossSize);
  ctx.lineTo(start.x + crossSize, start.y + crossSize);
  ctx.moveTo(start.x + crossSize, start.y - crossSize);
  ctx.lineTo(start.x - crossSize, start.y + crossSize);
  ctx.strokeStyle = lineColor;
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
  isLineObstructed
};

