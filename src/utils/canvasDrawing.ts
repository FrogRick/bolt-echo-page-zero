
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
        ctx.strokeStyle = shape.color;
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
      ctx.lineCap = 'butt'; // Ensure flat ends
      ctx.stroke();
      
      // Draw the thin black border
      ctx.beginPath();
      ctx.moveTo(shape.start.x, shape.start.y);
      ctx.lineTo(shape.end.x, shape.end.y);
      ctx.lineWidth = lineWidth + 2; // 2px wider for the border
      ctx.strokeStyle = strokeColor;
      ctx.lineCap = 'butt'; // Ensure flat ends
      ctx.globalCompositeOperation = 'destination-over';
      ctx.stroke();
      
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
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = borderThickness;
      
      // Draw cap at start point if not connected
      if (connectedToStart.length === 0) {
        ctx.beginPath();
        ctx.moveTo(shape.start.x - dx, shape.start.y - dy);
        ctx.lineTo(shape.start.x + dx, shape.start.y + dy);
        ctx.stroke();
      }
      
      // Draw cap at end point if not connected
      if (connectedToEnd.length === 0) {
        ctx.beginPath();
        ctx.moveTo(shape.end.x - dx, shape.end.y - dy);
        ctx.lineTo(shape.end.x + dx, shape.end.y + dy);
        ctx.stroke();
      }
      
      // Restore to default state
      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();
    }
  });

  // Third pass - draw connection points at joints to ensure proper welding
  const drawnJoints = new Set<string>();
  
  shapes.forEach(shape => {
    if (shape.type === 'line') {
      // Check each end of the line for connections
      [shape.start, shape.end].forEach(endpoint => {
        // Create a unique key for this joint to avoid drawing it multiple times
        const jointKey = `${Math.round(endpoint.x)},${Math.round(endpoint.y)}`;
        
        if (!drawnJoints.has(jointKey)) {
          const connectedLines = findConnectedLines(shapes, endpoint);
          
          // If we have multiple lines connected at this point, add a welding circle
          if (connectedLines.length > 1) {
            // Find the line width to use for the joint (defaulting to 8 if not found)
            const firstLine = connectedLines[0];
            const lineWidth = firstLine.type === 'line' && 'lineWidth' in firstLine
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
