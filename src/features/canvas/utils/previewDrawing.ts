
import { Point } from '../types/canvas';

// Draw in-progress polygon
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

// Draw preview line
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

// Extension line drawing with green color and visual indicators
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
