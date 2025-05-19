
import React from "react";
import { Tool } from "@/hooks/useCanvasEditor";
import { Square, Circle, Line, Move, Trash, ArrowLeft, ArrowRight } from "lucide-react";

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
    <div className="bg-white border-b p-2 flex items-center gap-1">
      <ToolButton 
        active={activeTool === 'select'} 
        onClick={() => onToolChange('select')} 
        title="Select"
      >
        <Move size={18} />
      </ToolButton>
      
      <ToolButton 
        active={activeTool === 'line'} 
        onClick={() => onToolChange('line')} 
        title="Line"
      >
        <Line size={18} />
      </ToolButton>
      
      <ToolButton 
        active={activeTool === 'rectangle'} 
        onClick={() => onToolChange('rectangle')} 
        title="Rectangle"
      >
        <Square size={18} />
      </ToolButton>
      
      <ToolButton 
        active={activeTool === 'polygon'} 
        onClick={() => onToolChange('polygon')} 
        title="Polygon"
      >
        <Circle size={18} />
      </ToolButton>

      <div className="h-6 w-px bg-gray-300 mx-1"></div>
      
      <ToolButton 
        onClick={onDelete} 
        title="Delete Selected"
        disabled={false}
      >
        <Trash size={18} className="text-red-500" />
      </ToolButton>

      <div className="h-6 w-px bg-gray-300 mx-1"></div>
      
      <button
        onClick={onClear}
        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
        title="Clear Canvas"
      >
        Clear All
      </button>
    </div>
  );
};

interface ToolButtonProps {
  active?: boolean;
  onClick: () => void;
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
}

const ToolButton: React.FC<ToolButtonProps> = ({ 
  active, 
  onClick, 
  title, 
  disabled = false, 
  children 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-2 rounded ${
        active 
          ? 'bg-blue-100 text-blue-700 border border-blue-300' 
          : 'hover:bg-gray-100'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      title={title}
    >
      {children}
    </button>
  );
};
