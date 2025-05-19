
import { Point, Shape } from '@/types/canvas';

export const drawShapes = (
  ctx: CanvasRenderingContext2D, 
  shapes: Shape[], 
  selectedShapeId: string | null, 
  defaultFillColor: string
): void => {
  // Draw all saved shapes
  shapes.forEach(shape => {
    ctx.strokeStyle = shape.color;
    ctx.lineWidth = 2;
    ctx.fillStyle = 'fillColor' in shape ? shape.fillColor : defaultFillColor;

    if (shape.type === 'line') {
      ctx.beginPath();
      ctx.moveTo(shape.start.x, shape.start.y);
      ctx.lineTo(shape.end.x, shape.end.y);
      ctx.stroke();
    } else if (shape.type === 'rectangle') {
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

    // Highlight selected shape
    if (selectedShapeId && shape.id === selectedShapeId) {
      ctx.strokeStyle = '#0000FF';
      ctx.lineWidth = 3;
      
      if (shape.type === 'line') {
        ctx.beginPath();
        ctx.moveTo(shape.start.x, shape.start.y);
        ctx.lineTo(shape.end.x, shape.end.y);
        ctx.stroke();
      } else if (shape.type === 'rectangle') {
        ctx.strokeRect(
          shape.start.x,
          shape.start.y,
          shape.end.x - shape.start.x,
          shape.end.y - shape.start.y
        );
      } else if (shape.type === 'polygon') {
        if (shape.points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(shape.points[0].x, shape.points[0].y);
          
          for (let i = 1; i < shape.points.length; i++) {
            ctx.lineTo(shape.points[i].x, shape.points[i].y);
          }
          
          ctx.closePath();
          ctx.stroke();
        }
      }
    }
  });
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
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
};
