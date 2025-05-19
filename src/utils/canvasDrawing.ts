
import { Shape, Point, LineShape, RectangleShape, PolygonShape } from '@/types/canvas';

// Draw all shapes on the canvas
export const drawShapes = (
  ctx: CanvasRenderingContext2D, 
  shapes: Shape[], 
  selectedShapeId: string | null,
  fillColor: string
): void => {
  shapes.forEach(shape => {
    ctx.strokeStyle = shape.color;
    ctx.lineWidth = 2;
    ctx.fillStyle = (shape as RectangleShape | PolygonShape).fillColor || fillColor;

    if (shape.type === 'line') {
      drawLine(ctx, shape as LineShape);
    } else if (shape.type === 'rectangle') {
      drawRectangle(ctx, shape as RectangleShape);
    } else if (shape.type === 'polygon') {
      drawPolygon(ctx, shape as PolygonShape);
    }

    // Highlight selected shape
    if (selectedShapeId && shape.id === selectedShapeId) {
      highlightShape(ctx, shape);
    }
  });
};

// Draw a line
export const drawLine = (ctx: CanvasRenderingContext2D, line: LineShape): void => {
  ctx.beginPath();
  ctx.moveTo(line.start.x, line.start.y);
  ctx.lineTo(line.end.x, line.end.y);
  ctx.stroke();
};

// Draw a rectangle
export const drawRectangle = (ctx: CanvasRenderingContext2D, rect: RectangleShape): void => {
  ctx.beginPath();
  ctx.rect(
    rect.start.x,
    rect.start.y,
    rect.end.x - rect.start.x,
    rect.end.y - rect.start.y
  );
  ctx.fill();
  ctx.stroke();
};

// Draw a polygon
export const drawPolygon = (ctx: CanvasRenderingContext2D, polygon: PolygonShape): void => {
  if (polygon.points.length > 0) {
    ctx.beginPath();
    ctx.moveTo(polygon.points[0].x, polygon.points[0].y);
    
    for (let i = 1; i < polygon.points.length; i++) {
      ctx.lineTo(polygon.points[i].x, polygon.points[i].y);
    }
    
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
};

// Highlight a selected shape
export const highlightShape = (ctx: CanvasRenderingContext2D, shape: Shape): void => {
  ctx.strokeStyle = '#0000FF';
  ctx.lineWidth = 3;
  
  if (shape.type === 'line') {
    drawLine(ctx, shape as LineShape);
  } else if (shape.type === 'rectangle') {
    const rect = shape as RectangleShape;
    ctx.strokeRect(
      rect.start.x,
      rect.start.y,
      rect.end.x - rect.start.x,
      rect.end.y - rect.start.y
    );
  } else if (shape.type === 'polygon') {
    drawPolygon(ctx, shape as PolygonShape);
  }
};

// Draw polygon in progress
export const drawInProgressPolygon = (
  ctx: CanvasRenderingContext2D,
  polygonPoints: Point[],
  currentPoint: Point | null,
  strokeColor: string,
  fillColor: string
): void => {
  if (polygonPoints.length > 0) {
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
  }
};

// Draw preview line
export const drawPreviewLine = (
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  color: string
): void => {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
};
