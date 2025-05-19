
import React from "react";
import { Tool } from "@/hooks/useCanvasEditor";
import { Button } from "@/components/ui/button";
import { Square, MoveHorizontal, LineChart, Triangle } from "lucide-react";

interface ToolbarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  onClear: () => void;
  onDelete: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  onToolChange,
  onClear,
  onDelete,
}) => {
  const tools = [
    { id: "select", icon: MoveHorizontal, label: "Select" },
    { id: "line", icon: LineChart, label: "Line" },
    { id: "rectangle", icon: Square, label: "Rectangle" },
    { id: "polygon", icon: Triangle, label: "Polygon" },
  ];

  return (
    <div className="p-2 bg-white border-b flex items-center gap-2">
      <div className="flex items-center gap-1">
        {tools.map((tool) => (
          <Button
            key={tool.id}
            variant={activeTool === tool.id as Tool ? "default" : "outline"}
            size="sm"
            onClick={() => onToolChange(tool.id as Tool)}
            className="flex items-center gap-1 px-3"
          >
            <tool.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tool.label}</span>
          </Button>
        ))}
      </div>
      
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
        >
          Delete Selected
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          className="bg-gray-50 hover:bg-gray-100"
        >
          Clear Canvas
        </Button>
      </div>
    </div>
  );
};
