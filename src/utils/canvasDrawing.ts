
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

export const drawShapes = (
  ctx: CanvasRenderingContext2D, 
  shapes: Shape[], 
  selectedShapeId: string | null, 
  defaultFillColor: string
): void => {
  // First pass: Draw all shapes except lines
  shapes.forEach(shape => {
    if (shape.type !== 'line') {
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = 2;
      ctx.fillStyle = 'fillColor' in shape ? shape.fillColor : defaultFillColor;

      if (shape.type === 'rectangle') {
        ctx.beginPath();
        ctx.rect(
          shape.start.x,
          shape.start.y,
          shape.end.x - shape.start.x,
          shape.end.y - shape.start.y
        );
        ctx.fill();
        ctx.stroke();
      } else if (shape.type === 'polygon') {
        if (shape.points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(shape.points[0].x, shape.points[0].y);
          
          for (let i = 1; i < shape.points.length; i++) {
            ctx.lineTo(shape.points[i].x, shape.points[i].y);
          }
          
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }
    }
  });

  // Second pass: Draw lines with special handling for connected lines
  shapes.forEach(shape => {
    if (shape.type === 'line') {
      // Find if any lines are connected to this line's start or end points
      const connectedToStart = findConnectedLines(shapes, shape.start, shape.id);
      const connectedToEnd = findConnectedLines(shapes, shape.end, shape.id);
      
      const lineWidth = 'lineWidth' in shape ? shape.lineWidth : 8;
      const strokeColor = 'strokeColor' in shape ? shape.strokeColor : '#000000';
      
      // Save the current state
      ctx.save();
      
      // Draw the thick gray line
      ctx.beginPath();
      ctx.moveTo(shape.start.x, shape.start.y);
      ctx.lineTo(shape.end.x, shape.end.y);
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = '#8E9196'; // Gray color for the main line
      ctx.lineCap = connectedToStart.length > 0 || connectedToEnd.length > 0 ? 'butt' : 'butt';
      ctx.stroke();
      
      // Draw the thin black border
      ctx.beginPath();
      ctx.moveTo(shape.start.x, shape.start.y);
      ctx.lineTo(shape.end.x, shape.end.y);
      ctx.lineWidth = lineWidth + 2; // 2px wider for the border
      ctx.strokeStyle = strokeColor;
      ctx.lineCap = connectedToStart.length > 0 || connectedToEnd.length > 0 ? 'butt' : 'butt';
      ctx.globalCompositeOperation = 'destination-over';
      ctx.stroke();
      
      // Restore to default state
      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();
    }
  });

  // Third pass - draw connection points at joints for seamless appearance
  const drawnJoints = new Set<string>();
  
  shapes.forEach(shape => {
    if (shape.type === 'line') {
      // Check each end of the line for connections
      [shape.start, shape.end].forEach(endpoint => {
        // Create a unique key for this joint to avoid drawing it multiple times
        const jointKey = `${Math.round(endpoint.x)},${Math.round(endpoint.y)}`;
        
        if (!drawnJoints.has(jointKey)) {
          const connectedLines = findConnectedLines(shapes, endpoint);
          
          // If we have multiple lines connected at this point, draw a joint
          if (connectedLines.length > 1) {
            // Save context
            ctx.save();
            
            // Find the line width to use for the joint radius (defaulting to 8 if not found)
            const firstLine = connectedLines[0];
            const defaultLineWidth = 8;
            const jointLineWidth = firstLine.type === 'line' && 'lineWidth' in firstLine 
              ? firstLine.lineWidth 
              : defaultLineWidth;
            
            // Calculate the joint radius - now about half the previous size
            const jointRadius = (jointLineWidth + 1) / 4; // Reduced to about half the previous size
            
            // Draw a filled circle at the connection point
            ctx.beginPath();
            ctx.arc(endpoint.x, endpoint.y, jointRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#8E9196'; // Same color as the line
            ctx.fill();
            
            // Draw the border
            ctx.beginPath();
            ctx.arc(endpoint.x, endpoint.y, jointRadius + 1, 0, Math.PI * 2); // Radius includes border
            ctx.fillStyle = '#000000'; // Border color
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fill();
            
            // Restore context
            ctx.globalCompositeOperation = 'source-over';
            ctx.restore();
            
            // Mark this joint as drawn
            drawnJoints.add(jointKey);
          }
        }
      });
    }
  });

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

export const drawInProgressPolygon = (
  ctx: CanvasRenderingContext2D,
  polygonPoints: Point[],
  currentPoint: Point | null,
  strokeColor: string,
  fillColor: string
): void => {
  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = fillColor;
  ctx.lineWidth = 2;
  
  ctx.beginPath();
  ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
  
  for (let i = 1; i < polygonPoints.length; i++) {
    ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
  }
  
  if (currentPoint) {
    ctx.lineTo(currentPoint.x, currentPoint.y);
  }
  
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
