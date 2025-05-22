
import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  Pencil, 
  Square, 
  Circle, 
  MousePointer, 
  Trash2, 
  Eraser, 
  Type, 
  Hexagon,
  Hand,
  GitBranch,
  Save
} from "lucide-react";
import { Tool } from "@/types/canvas";

interface ToolbarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  onDelete: () => void;
  onClear: () => void;
  onSave?: () => void;
  projectId?: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({ 
  activeTool, 
  onToolChange, 
  onDelete, 
  onClear,
  onSave,
  projectId
}) => {
  return (
    <div className="p-2 bg-white border-b flex flex-wrap items-center justify-between">
      <div className="flex items-center gap-1 flex-wrap">
        <Button
          size="sm"
          variant={activeTool === "select" ? "default" : "outline"}
          onClick={() => onToolChange("select")}
          className="flex items-center gap-1"
        >
          <MousePointer size={16} />
          <span className="hidden sm:inline">Select</span>
        </Button>
        
        <Button
          size="sm"
          variant={activeTool === "pencil" ? "default" : "outline"}
          onClick={() => onToolChange("pencil")}
          className="flex items-center gap-1"
        >
          <Pencil size={16} />
          <span className="hidden sm:inline">Pencil</span>
        </Button>
        
        <Button
          size="sm"
          variant={activeTool === "rectangle" ? "default" : "outline"}
          onClick={() => onToolChange("rectangle")}
          className="flex items-center gap-1"
        >
          <Square size={16} />
          <span className="hidden sm:inline">Rectangle</span>
        </Button>
        
        <Button
          size="sm"
          variant={activeTool === "circle" ? "default" : "outline"}
          onClick={() => onToolChange("circle")}
          className="flex items-center gap-1"
        >
          <Circle size={16} />
          <span className="hidden sm:inline">Circle</span>
        </Button>
        
        <Button
          size="sm"
          variant={activeTool === "text" ? "default" : "outline"}
          onClick={() => onToolChange("text")}
          className="flex items-center gap-1"
        >
          <Type size={16} />
          <span className="hidden sm:inline">Text</span>
        </Button>
        
        <Button
          size="sm"
          variant={activeTool === "eraser" ? "default" : "outline"}
          onClick={() => onToolChange("eraser")}
          className="flex items-center gap-1"
        >
          <Eraser size={16} />
          <span className="hidden sm:inline">Eraser</span>
        </Button>
        
        <Button
          size="sm"
          variant={activeTool === "wall" ? "default" : "outline"}
          onClick={() => onToolChange("wall")}
          className="flex items-center gap-1"
        >
          <GitBranch size={16} />
          <span className="hidden sm:inline">Wall</span>
        </Button>
        
        <Button
          size="sm"
          variant={activeTool === "wall-polygon" ? "default" : "outline"}
          onClick={() => onToolChange("wall-polygon")}
          className="flex items-center gap-1"
        >
          <Hexagon size={16} />
          <span className="hidden sm:inline">Polygon</span>
        </Button>
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={onDelete}
          className="flex items-center gap-1 text-red-500 hover:text-red-700"
        >
          <Trash2 size={16} />
          <span className="hidden sm:inline">Delete</span>
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={onClear}
          className="flex items-center gap-1"
        >
          <Eraser size={16} />
          <span className="hidden sm:inline">Clear Canvas</span>
        </Button>
        
        {onSave && (
          <Button
            size="sm"
            variant="default"
            onClick={onSave}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save size={16} />
            <span className="hidden sm:inline">Save</span>
          </Button>
        )}
      </div>
    </div>
  );
};
