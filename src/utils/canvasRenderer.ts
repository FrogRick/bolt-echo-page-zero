
import { Shape } from "@/types/canvas";

export const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape, fillOpacity: number = 50) => {
  if (!ctx) return;

  ctx.save();
  
  // Set common properties
  ctx.strokeStyle = shape.strokeColor || shape.color || '#000000';
  ctx.lineWidth = shape.lineWidth || 2;
  
  if (shape.fillColor) {
    // Convert fillOpacity percentage to alpha
    const alpha = fillOpacity / 100;
    const fillColorWithAlpha = shape.fillColor + Math.round(alpha * 255).toString(16).padStart(2, '0');
    ctx.fillStyle = fillColorWithAlpha;
  }

  switch (shape.type) {
    case 'line':
      if (shape.start && shape.end) {
        ctx.beginPath();
        ctx.moveTo(shape.start.x, shape.start.y);
        ctx.lineTo(shape.end.x, shape.end.y);
        ctx.stroke();
      }
      break;

    case 'rectangle':
      if (shape.start && shape.end) {
        const x = Math.min(shape.start.x, shape.end.x);
        const y = Math.min(shape.start.y, shape.end.y);
        const width = Math.abs(shape.end.x - shape.start.x);
        const height = Math.abs(shape.end.y - shape.start.y);
        
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        
        if (shape.fillColor) {
          ctx.fill();
        }
        ctx.stroke();
      }
      break;

    case 'circle':
      if (shape.start && shape.radius) {
        ctx.beginPath();
        ctx.arc(shape.start.x, shape.start.y, shape.radius, 0, 2 * Math.PI);
        
        if (shape.fillColor) {
          ctx.fill();
        }
        ctx.stroke();
      }
      break;

    case 'free-line':
      if (shape.points && shape.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(shape.points[0].x, shape.points[0].y);
        
        for (let i = 1; i < shape.points.length; i++) {
          ctx.lineTo(shape.points[i].x, shape.points[i].y);
        }
        ctx.stroke();
      }
      break;

    case 'text':
      if (shape.start && shape.text) {
        ctx.font = `${shape.fontSize || 16}px Arial`;
        ctx.fillStyle = shape.strokeColor || shape.color || '#000000';
        ctx.fillText(shape.text, shape.start.x, shape.start.y);
      }
      break;

    case 'polygon':
      if (shape.points && shape.points.length > 2) {
        ctx.beginPath();
        ctx.moveTo(shape.points[0].x, shape.points[0].y);
        
        for (let i = 1; i < shape.points.length; i++) {
          ctx.lineTo(shape.points[i].x, shape.points[i].y);
        }
        ctx.closePath();
        
        if (shape.fillColor) {
          ctx.fill();
        }
        ctx.stroke();
      }
      break;
  }

  ctx.restore();
};

export const renderCanvas = (
  ctx: CanvasRenderingContext2D, 
  shapes: Shape[], 
  currentShape: Shape | null,
  fillOpacity: number = 50
) => {
  if (!ctx) return;

  // Clear the canvas
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Draw all completed shapes
  shapes.forEach(shape => drawShape(ctx, shape, fillOpacity));

  // Draw the current shape being drawn
  if (currentShape) {
    drawShape(ctx, currentShape, fillOpacity);
  }
};
