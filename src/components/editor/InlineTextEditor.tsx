
import React, { useState, useEffect, useRef } from "react";
import { Shape, Point } from "@/types/canvas";

interface InlineTextEditorProps {
  text: Shape;
  onTextChange: (newText: string) => void;
  onPositionChange: (newPosition: Point) => void;
  onFinish: () => void;
  fontSize: number;
  color: string;
}

export const InlineTextEditor: React.FC<InlineTextEditorProps> = ({
  text,
  onTextChange,
  onPositionChange,
  onFinish,
  fontSize,
  color
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [localText, setLocalText] = useState(text.text || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === inputRef.current) return;
    
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart || !text.start) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    onPositionChange({
      x: text.start.x + deltaX,
      y: text.start.y + deltaY
    });
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setLocalText(newText);
    onTextChange(newText);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      onFinish();
    }
  };

  const handleBlur = () => {
    onFinish();
  };

  if (!text.start) return null;

  return (
    <div
      className="absolute cursor-move"
      style={{
        left: text.start.x,
        top: text.start.y - fontSize,
        fontSize: `${fontSize}px`,
        color: color,
        zIndex: 1000
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <input
        ref={inputRef}
        type="text"
        value={localText}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="bg-transparent border-none outline-none p-0 m-0"
        style={{
          fontSize: `${fontSize}px`,
          color: color,
          fontFamily: 'Arial',
          minWidth: '100px',
          cursor: isDragging ? 'move' : 'text'
        }}
        placeholder="Type text here..."
      />
    </div>
  );
};
