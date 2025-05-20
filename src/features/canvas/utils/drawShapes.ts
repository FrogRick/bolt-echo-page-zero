
import { Shape, Point } from '../types/canvas';

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
