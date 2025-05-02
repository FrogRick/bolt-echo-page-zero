
import React, { useEffect, useRef, useState } from 'react';
import { WallSymbol } from '@/types/editor';
import { Badge } from '@/components/ui/badge';

interface DetectionInfoPanelProps {
  detectedWall: WallSymbol | null;
}

export const DetectionInfoPanel: React.FC<DetectionInfoPanelProps> = ({ detectedWall }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Set up the canvas for visualization when a wall is detected
  useEffect(() => {
    if (!canvasRef.current || !detectedWall) return;
    setIsLoading(true);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set canvas dimensions
    const canvasWidth = 280;
    const canvasHeight = 180;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // If we have a stored preview image from OpenCV processing, use it
    if (detectedWall.previewImage) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Draw detection metadata on the image
        drawDetectionMetadata(ctx, detectedWall, canvasWidth, canvasHeight);
        setIsLoading(false);
      };
      img.onerror = () => {
        drawFallbackVisualization(ctx, detectedWall, canvasWidth, canvasHeight);
        setIsLoading(false);
      };
      img.src = detectedWall.previewImage;
    } else {
      // Draw a fallback visualization without OpenCV
      drawFallbackVisualization(ctx, detectedWall, canvasWidth, canvasHeight);
      setIsLoading(false);
    }
  }, [detectedWall]);
  
  // Function to draw line detection metadata on top of the processed image
  const drawDetectionMetadata = (
    ctx: CanvasRenderingContext2D, 
    wall: WallSymbol, 
    width: number, 
    height: number
  ) => {
    if (!wall.detectionData) return;
    
    // Highlight the selected area if available
    if (wall.detectionData.selectionRect) {
      // Draw a semi-transparent overlay to show the selected area
      const { selectionRect } = wall.detectionData;
      
      // Calculate proportional dimensions for the canvas
      const scaleX = width / wall.detectionData.roiWidth;
      const scaleY = height / wall.detectionData.roiHeight;
      
      // Draw a dashed rectangle for the selection area
      ctx.setLineDash([5, 3]);
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, width, height);
      ctx.setLineDash([]);
    }
    
    // Highlight the detected wall
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
    ctx.stroke();
    
    // Draw detection point
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    const centerX = width / 2;
    const centerY = height / 2;
    ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Add a semi-transparent overlay to make annotations more visible
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, height - 30, width, 30);
    
    // Add annotation text
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px sans-serif';
    ctx.fillText('Selected area + Detected wall (red)', 10, height - 12);
  };
  
  // Function to draw a fallback visualization when no OpenCV data is available
  const drawFallbackVisualization = (
    ctx: CanvasRenderingContext2D, 
    wall: WallSymbol, 
    width: number, 
    height: number
  ) => {
    if (!wall.start || !wall.end) return;
    
    // Calculate scaled points that fit within our canvas
    // First determine the extents of the wall with some padding
    const padding = 30;
    const minX = Math.min(wall.start.x, wall.end.x) - padding;
    const minY = Math.min(wall.start.y, wall.end.y) - padding;
    const maxX = Math.max(wall.start.x, wall.end.x) + padding;
    const maxY = Math.max(wall.start.y, wall.end.y) + padding;
    
    const boundWidth = maxX - minX;
    const boundHeight = maxY - minY;
    
    // Scale to fit canvas
    const scaleX = width / boundWidth;
    const scaleY = height / boundHeight;
    const scale = Math.min(scaleX, scaleY);
    
    // Map wall start and end to canvas coordinates
    const canvasStartX = (wall.start.x - minX) * scale;
    const canvasStartY = (wall.start.y - minY) * scale;
    const canvasEndX = (wall.end.x - minX) * scale;
    const canvasEndY = (wall.end.y - minY) * scale;
    
    // Draw a light gray background to simulate PDF background
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, width, height);
    
    // If we have selection data, draw it
    if (wall.detectionData?.selectionRect) {
      const { startX, startY, width: selWidth, height: selHeight } = wall.detectionData.selectionRect;
      
      // Convert selection coords to canvas space
      const selCanvasX = (startX - minX) * scale;
      const selCanvasY = (startY - minY) * scale;
      const selCanvasW = selWidth * scale;
      const selCanvasH = selHeight * scale;
      
      // Draw selection rectangle with dashed line
      ctx.setLineDash([5, 3]);
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
      ctx.lineWidth = 1;
      ctx.strokeRect(selCanvasX, selCanvasY, selCanvasW, selCanvasH);
      ctx.setLineDash([]);
    }
    
    // First draw a thin black line to simulate the actual wall on the PDF
    ctx.lineWidth = wall.thickness * 0.6;
    ctx.strokeStyle = '#222222';
    ctx.beginPath();
    ctx.moveTo(canvasStartX, canvasStartY);
    ctx.lineTo(canvasEndX, canvasEndY);
    ctx.stroke();
    
    // Now draw the detected wall overlay
    ctx.lineWidth = wall.thickness;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
    ctx.beginPath();
    ctx.moveTo(canvasStartX, canvasStartY);
    ctx.lineTo(canvasEndX, canvasEndY);
    ctx.stroke();
    
    // Draw click point
    const clickX = (wall.x - minX) * scale;
    const clickY = (wall.y - minY) * scale;
    
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(clickX, clickY, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Add a semi-transparent overlay at bottom
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, height - 30, width, 30);
    
    // Add annotation text
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px sans-serif';
    ctx.fillText('Selected area + Detected wall (red)', 10, height - 12);
  };
  
  if (!detectedWall) {
    return (
      <div className="absolute bottom-4 right-4 z-[100] bg-white p-4 rounded-lg shadow-md w-64 pointer-events-auto">
        <h3 className="font-medium text-sm mb-2">Detection Information</h3>
        <p className="text-xs text-gray-500">No wall detected. Select an area around a wall to detect it.</p>
      </div>
    );
  }

  // Calculate wall length
  const length = detectedWall.start && detectedWall.end ? 
    Math.sqrt(
      Math.pow(detectedWall.end.x - detectedWall.start.x, 2) + 
      Math.pow(detectedWall.end.y - detectedWall.start.y, 2)
    ).toFixed(1) : 'N/A';

  // Is the wall vertical or horizontal
  const angle = detectedWall.start && detectedWall.end ? 
    Math.atan2(
      detectedWall.end.y - detectedWall.start.y, 
      detectedWall.end.x - detectedWall.start.x
    ) * (180 / Math.PI) : 0;
  
  const orientation = 
    (angle > -45 && angle < 45) ? 'Horizontal' :
    (angle >= 45 && angle < 135) || (angle < -45 && angle >= -135) ? 'Vertical' :
    'Diagonal';

  // If we have selection data, get the size
  let selectionSize = '';
  if (detectedWall.detectionData?.selectionRect) {
    const area = Math.round(
      detectedWall.detectionData.selectionRect.width * 
      detectedWall.detectionData.selectionRect.height
    );
    selectionSize = `${Math.round(detectedWall.detectionData.selectionRect.width)}×${Math.round(detectedWall.detectionData.selectionRect.height)} (${area} sq)`;
  }

  return (
    <div className="absolute bottom-4 right-4 z-[100] bg-white p-4 rounded-lg shadow-md w-[300px] pointer-events-auto">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-sm">Wall Detection</h3>
        <Badge variant="outline" className="bg-red-50 text-red-800 text-xs">
          OpenCV Analysis
        </Badge>
      </div>
      
      {/* Visual detection preview */}
      <div className="border border-gray-200 rounded-md mb-3">
        {isLoading ? (
          <div className="w-full h-[180px] flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <canvas 
            ref={canvasRef} 
            className="w-full h-[180px]" 
            width="280" 
            height="180"
          />
        )}
        <div className="bg-gray-50 p-1.5 text-xs text-gray-500 border-t border-gray-200">
          <span className="font-medium">Wall Detection Analysis</span>
          <span className="block text-[10px] opacity-80">
            The image above shows the selected area and detected wall
          </span>
        </div>
      </div>
      
      <div className="space-y-1">
        <div className="grid grid-cols-2 text-xs">
          <span className="text-gray-500">Type:</span>
          <span>Wall</span>
        </div>
        
        <div className="grid grid-cols-2 text-xs">
          <span className="text-gray-500">Position:</span>
          <span>
            ({detectedWall.x.toFixed(0)}, {detectedWall.y.toFixed(0)})
          </span>
        </div>
        
        {selectionSize && (
          <div className="grid grid-cols-2 text-xs">
            <span className="text-gray-500">Selection Size:</span>
            <span>{selectionSize}</span>
          </div>
        )}
        
        <div className="grid grid-cols-2 text-xs">
          <span className="text-gray-500">Length:</span>
          <span>{length} units</span>
        </div>
        
        <div className="grid grid-cols-2 text-xs">
          <span className="text-gray-500">Thickness:</span>
          <span>{detectedWall.thickness.toFixed(1)} units</span>
        </div>
        
        <div className="grid grid-cols-2 text-xs">
          <span className="text-gray-500">Orientation:</span>
          <span>{orientation}</span>
        </div>
        
        <div className="grid grid-cols-2 text-xs">
          <span className="text-gray-500">Angle:</span>
          <span>{angle.toFixed(1)}°</span>
        </div>
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Select different areas to detect more walls, or use the Redo/Clear buttons.
        </p>
      </div>
    </div>
  );
};
