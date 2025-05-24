
import React from "react";
import { Tool } from "@/types/canvas";
import { Button } from "@/components/ui/button";
import { MousePointer, Square, Triangle, Save, Trash2, X, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const { toast } = useToast();
  
  const selectTool = [
    { id: "select", icon: MousePointer, label: "Select" }
  ];

  const floorPlanTools = [
    { id: "wall", icon: Square, label: "Wall" },
    { id: "wall-polygon", icon: Square, label: "Wall Polygon" }
  ];

  const symbolTools = [
    { id: "yellow-rectangle", icon: Square, label: "Yellow Rectangle" },
    { id: "yellow-polygon", icon: Triangle, label: "Yellow Polygon" },
    { id: "green-rectangle", icon: Square, label: "Green Rectangle" },
    { id: "green-polygon", icon: Triangle, label: "Green Polygon" }
  ];

  const handleSave = () => {
    toast({
      title: "Canvas Saved",
      description: "Your canvas has been saved.",
    });
  };

  const renderSingleTool = (tool: typeof selectTool[0]) => (
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
  );

  const renderDropdownGroup = (tools: typeof floorPlanTools, groupLabel: string) => {
    const isAnyToolActive = tools.some(tool => activeTool === tool.id);
    const activeToolInGroup = tools.find(tool => activeTool === tool.id);
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={isAnyToolActive ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-1 px-3"
          >
            {activeToolInGroup ? (
              <>
                {React.createElement(activeToolInGroup.icon, { className: "h-4 w-4" })}
                <span className="hidden sm:inline">{activeToolInGroup.label}</span>
              </>
            ) : (
              <>
                {React.createElement(tools[0].icon, { className: "h-4 w-4" })}
                <span className="hidden sm:inline">{groupLabel}</span>
              </>
            )}
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-white border shadow-md z-50">
          {tools.map((tool) => (
            <DropdownMenuItem
              key={tool.id}
              onClick={() => onToolChange(tool.id as Tool)}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-100"
            >
              {React.createElement(tool.icon, { className: "h-4 w-4" })}
              <span>{tool.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div className="p-2 bg-white border-b flex items-center gap-3 flex-wrap">
      {/* Select Tool */}
      {renderSingleTool(selectTool[0])}
      
      <Separator orientation="vertical" className="h-8" />
      
      {/* Floor Plan Tools Dropdown */}
      {renderDropdownGroup(floorPlanTools, "Floor Plan")}
      
      <Separator orientation="vertical" className="h-8" />
      
      {/* Symbol Tools Dropdown */}
      {renderDropdownGroup(symbolTools, "Symbols")}
      
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200 flex items-center gap-1"
        >
          <Trash2 className="h-4 w-4" />
          <span>Delete Selected</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          className="bg-gray-50 hover:bg-gray-100 flex items-center gap-1"
        >
          <X className="h-4 w-4" />
          <span>Clear Canvas</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200 flex items-center gap-1"
        >
          <Save className="h-4 w-4" />
          <span>Save</span>
        </Button>
      </div>
    </div>
  );
};
