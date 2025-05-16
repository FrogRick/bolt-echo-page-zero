
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Pencil } from "lucide-react";

interface ManualWallDrawingProps {
  isActive: boolean;
  onDrawingModeToggle: (active: boolean) => void;
  wallThickness: number;
  onWallThicknessChange: (thickness: number) => void;
  snapToAngle: boolean;
  onSnapToAngleToggle: (enabled: boolean) => void;
  snapToWalls: boolean;
  onSnapToWallsToggle: (enabled: boolean) => void;
  onNext?: () => void;
  onBack?: () => void;
}

export const ManualWallDrawing = ({
  isActive,
  onDrawingModeToggle,
  wallThickness,
  onWallThicknessChange,
  snapToAngle,
  onSnapToAngleToggle,
  snapToWalls,
  onSnapToWallsToggle,
  onNext,
  onBack
}: ManualWallDrawingProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Wall Drawing Tools</h3>
        <p className="text-sm text-gray-500 mb-4">
          Draw walls by clicking on the canvas to set start and end points.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="drawing-mode" className="font-medium">Wall Drawing Mode</Label>
            <p className="text-xs text-gray-500">Click to place walls</p>
          </div>
          <Switch
            id="drawing-mode"
            checked={isActive}
            onCheckedChange={onDrawingModeToggle}
          />
        </div>
        
        <div>
          <Label htmlFor="wall-thickness" className="font-medium">Wall Thickness</Label>
          <div className="flex items-center space-x-2 mt-2">
            <Slider
              id="wall-thickness"
              min={1}
              max={10}
              step={1}
              value={[wallThickness]}
              onValueChange={(values) => onWallThicknessChange(values[0])}
              className="flex-1"
            />
            <span className="w-8 text-right text-sm">{wallThickness}px</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="snap-angle" className="font-medium">Snap to Angle</Label>
            <p className="text-xs text-gray-500">Align to 45° increments</p>
          </div>
          <Switch
            id="snap-angle"
            checked={snapToAngle}
            onCheckedChange={onSnapToAngleToggle}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="snap-walls" className="font-medium">Snap to Walls</Label>
            <p className="text-xs text-gray-500">Connect walls automatically</p>
          </div>
          <Switch
            id="snap-walls"
            checked={snapToWalls}
            onCheckedChange={onSnapToWallsToggle}
          />
        </div>
      </div>
      
      {isActive && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-600">
          <div className="flex items-center space-x-2 mb-1">
            <Pencil className="h-4 w-4" />
            <span className="font-medium">Drawing Mode Active</span>
          </div>
          <p>Click to set start point, then click again to draw wall.</p>
        </div>
      )}
      
      <div className="flex justify-between pt-4">
        {onBack ? (
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
        ) : (
          <div></div>
        )}
        
        {onNext && (
          <Button onClick={onNext}>
            Next: Add Symbols
          </Button>
        )}
      </div>
    </div>
  );
};
