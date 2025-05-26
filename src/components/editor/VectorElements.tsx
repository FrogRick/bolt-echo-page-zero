import React, { useState, useEffect } from 'react';
import { EditorSymbol, WallSymbol } from '@/types/editor';
import { Trash2, RotateCcw, Move, Square } from 'lucide-react';

interface VectorElementsProps {
  symbols: EditorSymbol[];
  scale: number;
  isDragging: boolean;
  draggedSymbolId: string | null;
  onSymbolMouseDown: (e: React.MouseEvent, symbol: EditorSymbol) => void;
  onSymbolSelect: (symbol: EditorSymbol) => void;
  onSymbolDelete: (symbolId: string) => void;
  currentStage?: string;
  useManualWalls?: boolean;
  snapToWalls?: boolean;
}

export const VectorElements = ({
  symbols,
  scale,
  isDragging,
  draggedSymbolId,
  onSymbolMouseDown,
  onSymbolSelect,
  onSymbolDelete,
  currentStage,
  useManualWalls = false,
  snapToWalls = true
}: VectorElementsProps) => {
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);
  const [hoveredWallId, setHoveredWallId] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [rotationStartAngle, setRotationStartAngle] = useState(0);
  const [rotationCenter, setRotationCenter] = useState<{x: number, y: number}>({x: 0, y: 0});
  const [moveStartPos, setMoveStartPos] = useState<{x: number, y: number}>({x: 0, y: 0});

  // Determine wall color based on stage
  const getWallColor = (): string => {
    if (currentStage === 'draw_walls' && useManualWalls) {
      return '#ff0000'; // Red for wall drawing stage
    }
    return '#000000'; // Black for other stages
  };
  
  const wallColor = getWallColor();

  // Clear selection when clicking away
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // Check if click is on a wall element or control button
      const targetElement = e.target as HTMLElement;
      if (targetElement.closest('.vector-element')) {
        return; // Don't clear if clicking on a vector element
      }
      setSelectedWallId(null);
    };
    
    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  const handleWallSelect = (e: React.MouseEvent, symbol: EditorSymbol) => {
    e.stopPropagation();
    setSelectedWallId(symbol.id);
    onSymbolSelect(symbol);
  };

  const handleRotateStart = (e: React.MouseEvent, wall: WallSymbol) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!wall.start || !wall.end) return;
    
    // Calculate the center point of the wall
    const centerX = (wall.start.x + wall.end.x) / 2;
    const centerY = (wall.start.y + wall.end.y) / 2;
    
    setIsRotating(true);
    setRotationCenter({x: centerX * scale, y: centerY * scale});
    
    // Calculate the initial angle between mouse and center
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const initialAngle = Math.atan2(mouseY - centerY * scale, mouseX - centerX * scale);
    setRotationStartAngle(initialAngle);
  };

  const handleRotateMove = (e: React.MouseEvent) => {
    if (!isRotating || !selectedWallId) return;
    
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    // Calculate the current angle
    const currentAngle = Math.atan2(mouseY - rotationCenter.y, mouseX - rotationCenter.x);
    
    // Calculate the angle difference in degrees
    const angleDifference = (currentAngle - rotationStartAngle) * (180 / Math.PI);
    
    // Find the selected wall
    const wall = symbols.find(s => s.id === selectedWallId) as WallSymbol | undefined;
    if (wall && wall.start && wall.end) {
      // Rotate the wall by calculating new start and end points
      const centerX = (wall.start.x + wall.end.x) / 2;
      const centerY = (wall.start.y + wall.end.y) / 2;
      
      // Update the wall data
      const updatedWall: WallSymbol = {
        ...wall,
        rotation: wall.rotation + angleDifference,
      };
      
      // Update the wall in the symbols array
      onSymbolSelect(updatedWall);
    }
    
    // Reset for next movement
    setRotationStartAngle(currentAngle);
  };
  
  const handleRotateEnd = () => {
    setIsRotating(false);
  };

  // Implement move functionality
  const handleMoveStart = (e: React.MouseEvent, wall: WallSymbol) => {
    e.stopPropagation();
    e.preventDefault();
    
    setIsMoving(true);
    setMoveStartPos({ x: e.clientX, y: e.clientY });
  };
  
  const handleMoveMove = (e: React.MouseEvent) => {
    if (!isMoving || !selectedWallId) return;
    
    // Calculate the movement delta
    const deltaX = (e.clientX - moveStartPos.x) / scale;
    const deltaY = (e.clientY - moveStartPos.y) / scale;
    
    // Find the selected wall
    const wall = symbols.find(s => s.id === selectedWallId) as WallSymbol | undefined;
    if (wall && wall.start && wall.end) {
      // Create an updated wall with new position
      const updatedWall: WallSymbol = {
        ...wall,
        x: wall.x + deltaX,
        y: wall.y + deltaY,
        start: {
          x: wall.start.x + deltaX,
          y: wall.start.y + deltaY
        },
        end: {
          x: wall.end.x + deltaX,
          y: wall.end.y + deltaY
        }
      };
      
      // Update the wall in the symbols array
      onSymbolSelect(updatedWall);
    }
    
    // Reset for next movement
    setMoveStartPos({ x: e.clientX, y: e.clientY });
  };
  
  const handleMoveEnd = () => {
    setIsMoving(false);
  };

  // Add event listeners for mouse move and up when rotating or moving
  useEffect(() => {
    if (isRotating) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        handleRotateMove(e as unknown as React.MouseEvent);
      };
      
      const handleGlobalMouseUp = () => {
        handleRotateEnd();
      };
      
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
    
    if (isMoving) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        handleMoveMove(e as unknown as React.MouseEvent);
      };
      
      const handleGlobalMouseUp = () => {
        handleMoveEnd();
      };
      
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isRotating, isMoving, selectedWallId]);

  const renderWall = (symbol: WallSymbol) => {
    if (!symbol.start || !symbol.end) return null;
    
    // Calculate the actual pixel coordinates based on the scale
    const startX = symbol.start.x * scale;
    const startY = symbol.start.y * scale;
    const endX = symbol.end.x * scale;
    const endY = symbol.end.y * scale;
    
    // Calculate length and angle for proper positioning
    const length = Math.sqrt(
      Math.pow(endX - startX, 2) + 
      Math.pow(endY - startY, 2)
    );
    
    // Calculate the rotation angle in degrees
    const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);
    
    const thickness = (symbol.thickness || 5) * scale;
    
    const isSelected = selectedWallId === symbol.id;
    const isHovered = hoveredWallId === symbol.id;
    
    return (
      <div 
        className={`absolute ${isSelected ? 'ring-2 ring-blue-500' : ''} ${isHovered ? 'cursor-move' : ''}`}
        style={{
          width: `${length}px`,
          height: `${thickness}px`,
          position: 'absolute',
          left: `${startX}px`,
          top: `${startY - thickness/2}px`,
          transformOrigin: '0 50%',
          transform: `rotate(${angle}deg)`,
          opacity: isSelected || isHovered ? 0.9 : 0.7,
          pointerEvents: 'auto', // Make sure the wall is clickable
          zIndex: isSelected ? 55 : 50,
          transition: 'opacity 0.2s ease, box-shadow 0.2s ease',
          boxShadow: isSelected || isHovered ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : 'none',
          backgroundColor: wallColor,
        }}
        onMouseEnter={() => setHoveredWallId(symbol.id)}
        onMouseLeave={() => setHoveredWallId(null)}
        onClick={(e) => handleWallSelect(e, symbol)}
        onMouseDown={(e) => onSymbolMouseDown(e, symbol)}
      />
    );
  };

  // Filter only wall symbols
  const wallSymbols = symbols.filter(symbol => symbol.type === 'wall');

  return (
    <>
      {wallSymbols.map((symbol) => {
        if (symbol.type === 'wall' && 'start' in symbol && symbol.start && symbol.end) {
          // For walls, we'll render them directly based on their start and end coordinates
          const centerX = ((symbol.start.x + symbol.end.x) / 2) * scale;
          const centerY = ((symbol.start.y + symbol.end.y) / 2) * scale;
          
          const isSelected = selectedWallId === symbol.id;
          const isHovered = hoveredWallId === symbol.id;
          const showControls = isSelected; // Only show controls when selected
          
          return (
            <div
              key={symbol.id}
              className="vector-element absolute"
              onClick={(e) => handleWallSelect(e, symbol)}
            >
              {renderWall(symbol as WallSymbol)}
              
              {/* Only show controls when selected */}
              {showControls && (
                <>
                  {/* Delete button */}
                  <button
                    className="delete-btn absolute bg-red-500 text-white rounded-full p-1 opacity-80 hover:opacity-100 transition-opacity pointer-events-auto"
                    style={{
                      left: `${centerX}px`,
                      top: `${centerY - 15}px`,
                      zIndex: 100
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSymbolDelete(symbol.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                  
                  {/* Rotation handle */}
                  <button
                    className="rotate-btn absolute bg-blue-500 text-white rounded-full p-1 opacity-80 hover:opacity-100 transition-opacity pointer-events-auto"
                    style={{
                      left: `${centerX + 15}px`,
                      top: `${centerY}px`,
                      zIndex: 100
                    }}
                    onMouseDown={(e) => handleRotateStart(e, symbol as WallSymbol)}
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>
                  
                  {/* Move handle */}
                  <button
                    className="move-btn absolute bg-green-500 text-white rounded-full p-1 opacity-80 hover:opacity-100 transition-opacity pointer-events-auto"
                    style={{
                      left: `${centerX - 15}px`,
                      top: `${centerY}px`,
                      zIndex: 100
                    }}
                    onMouseDown={(e) => handleMoveStart(e, symbol as WallSymbol)}
                  >
                    <Move className="h-3 w-3" />
                  </button>
                </>
              )}
            </div>
          );
        }
        return null;
      })}
    </>
  );
};