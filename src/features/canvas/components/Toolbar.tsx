
import React from "react";
import { Button } from "@/components/ui/button";
import { 
  MousePointer, 
  Square, 
  Hexagon, 
  Trash, 
  BrickWall, 
  TrafficCone
} from "lucide-react";
import { Tool } from "../types/canvas";

interface ToolbarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  onDelete: () => void;
  onClear: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ 
  activeTool, 
  onToolChange,
  onDelete,
  onClear
}) => {
  return (
    <div className="flex items-center gap-1 p-2 bg-white border-b overflow-x-auto">
      <Button
        variant={activeTool === "select" ? "default" : "outline"}
        size="sm"
        onClick={() => onToolChange("select")}
        className="flex items-center gap-1"
        title="Select Tool"
      >
        <MousePointer className="h-4 w-4" />
        <span className="hidden sm:inline">Select</span>
      </Button>
      
      <Button
        variant={activeTool === "wall" ? "default" : "outline"}
        size="sm"
        onClick={() => onToolChange("wall")}
        className="flex items-center gap-1"
        title="Wall Tool"
      >
        <BrickWall className="h-4 w-4" />
        <span className="hidden sm:inline">Wall</span>
      </Button>

      <Button
        variant={activeTool === "wall-polygon" ? "default" : "outline"}
        size="sm"
        onClick={() => onToolChange("wall-polygon")}
        className="flex items-center gap-1"
        title="Wall Polygon Tool"
      >
        <Hexagon className="h-4 w-4" />
        <span className="hidden sm:inline">Wall Polygon</span>
      </Button>
      
      <Button
        variant={activeTool === "yellow-rectangle" ? "default" : "outline"}
        size="sm"
        onClick={() => onToolChange("yellow-rectangle")}
        className="flex items-center gap-1"
        title="Yellow Rectangle Tool"
      >
        <Square className="h-4 w-4 text-yellow-400" />
        <span className="hidden sm:inline">Yellow Area</span>
      </Button>
      
      <Button
        variant={activeTool === "yellow-polygon" ? "default" : "outline"}
        size="sm"
        onClick={() => onToolChange("yellow-polygon")}
        className="flex items-center gap-1"
        title="Yellow Polygon Tool"
      >
        <Hexagon className="h-4 w-4 text-yellow-400" />
        <span className="hidden sm:inline">Yellow Shape</span>
      </Button>
      
      <Button
        variant={activeTool === "green-rectangle" ? "default" : "outline"}
        size="sm"
        onClick={() => onToolChange("green-rectangle")}
        className="flex items-center gap-1"
        title="Green Rectangle Tool"
      >
        <Square className="h-4 w-4 text-green-500" />
        <span className="hidden sm:inline">Green Area</span>
      </Button>
      
      <Button
        variant={activeTool === "green-polygon" ? "default" : "outline"}
        size="sm"
        onClick={() => onToolChange("green-polygon")}
        className="flex items-center gap-1"
        title="Green Polygon Tool"
      >
        <Hexagon className="h-4 w-4 text-green-500" />
        <span className="hidden sm:inline">Green Shape</span>
      </Button>
      
      <div className="border-l h-8 mx-1" />
      
      <Button
        variant="outline"
        size="sm"
        onClick={onDelete}
        className="flex items-center gap-1"
        title="Delete Selected"
      >
        <Trash className="h-4 w-4" />
        <span className="hidden sm:inline">Delete</span>
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onClear}
        className="flex items-center gap-1"
        title="Clear Canvas"
      >
        <TrafficCone className="h-4 w-4" />
        <span className="hidden sm:inline">Clear All</span>
      </Button>
    </div>
  );
};
