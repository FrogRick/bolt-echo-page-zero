import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Pencil, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ManualWallDrawingProps {
  isActive: boolean;
  onDrawingModeToggle: (enabled: boolean) => void;
  wallThickness: number;
  onWallThicknessChange: (thickness: number) => void;
  snapToAngle: boolean;
  onSnapToAngleToggle: (enabled: boolean) => void;
  snapToWalls: boolean;
  onSnapToWallsToggle: (enabled: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}

export const ManualWallDrawing = ({
  isActive,
  onDrawingModeToggle,
  wallThickness = 5,
  onWallThicknessChange,
  snapToAngle = true,
  onSnapToAngleToggle,
  snapToWalls = true,
  onSnapToWallsToggle,
  onNext,
  onBack
}: ManualWallDrawingProps) => {
  const { toast } = useToast();
  
  const toggleDrawingMode = () => {
    const newMode = !isActive;
    onDrawingModeToggle(newMode);
    if (newMode) {
      toast({
        title: "Wall Drawing Mode Activated",
        description: "Click to set start point, then click again to place end point.",
        duration: 3000
      });
    }
  };
  
  return (
    <Card className="relative h-full flex flex-col max-w-3xl mx-auto">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Pencil className="h-4 w-4" />
          Draw Walls
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex-1 flex flex-col min-h-[500px]">
        <div className="flex-1 relative min-h-[500px] flex flex-col space-y-4">
          <Button 
            variant={isActive ? "default" : "outline"}
            className="w-full" 
            onClick={toggleDrawingMode}
          >
            {isActive ? "Drawing Mode Active - Click to Disable" : "Start Drawing"}
          </Button>
          
          {isActive && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-sm text-blue-800 dark:text-blue-300">
              Click once to set the start point, then click again to complete the wall.
            </div>
          )}
          
          <div className="space-y-6 border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium flex items-center gap-1">
                <Settings className="h-4 w-4" /> Wall Settings
              </h3>
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="thickness">Wall Thickness</Label>
              <div className="flex items-center gap-4">
                <Slider 
                  id="thickness" 
                  value={[wallThickness]} 
                  min={1} 
                  max={10} 
                  step={1} 
                  onValueChange={value => onWallThicknessChange?.(value[0])} 
                />
                <span className="w-6 text-right">{wallThickness}px</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="snap-angle">Snap to 45° angles</Label>
              <Switch 
                id="snap-angle" 
                checked={snapToAngle} 
                onCheckedChange={onSnapToAngleToggle} 
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="snap-walls">Snap to existing walls</Label>
              <Switch 
                id="snap-walls" 
                checked={snapToWalls} 
                onCheckedChange={onSnapToWallsToggle} 
              />
            </div>
          </div>
        </div>
      </CardContent>
      <div className="flex justify-between gap-4 px-6 pb-6 pt-2 mt-auto bg-white z-10 border-t">
        <Button variant="outline" onClick={onBack} disabled={!onBack}>Back</Button>
        <Button onClick={onNext}>Next</Button>
      </div>
    </Card>
  );
};
