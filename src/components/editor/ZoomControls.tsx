
import React from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut } from "lucide-react";

interface ZoomControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  minScale?: number;
  maxScale?: number;
}

export const ZoomControls = ({ 
  scale, 
  onZoomIn, 
  onZoomOut, 
  minScale = 0.5, 
  maxScale = 3.0 
}: ZoomControlsProps) => {
  const formattedScale = Math.round(scale * 100);
  const isMinScale = scale <= minScale;
  const isMaxScale = scale >= maxScale;
  
  return (
    <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm p-1 rounded-lg shadow-sm">
      <Button
        variant="outline"
        size="icon"
        onClick={onZoomOut}
        disabled={isMinScale}
        className="h-7 w-7"
      >
        <ZoomOut size={14} />
      </Button>
      <span className="text-xs font-medium w-12 text-center">{formattedScale}%</span>
      <Button
        variant="outline"
        size="icon"
        onClick={onZoomIn}
        disabled={isMaxScale}
        className="h-7 w-7"
      >
        <ZoomIn size={14} />
      </Button>
    </div>
  );
};
