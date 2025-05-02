
import { Symbol } from "@/types/editor";
import { FireExtIcon, FireHoseIcon, FirstAidIcon, AssemblyPointIcon, WallIcon, DoorIcon, StairsIcon } from "./SafetyIcons";
import { useState } from "react";
import { Trash2 } from "lucide-react";

interface PDFSymbolsProps {
  symbols: Symbol[];
  isDragging: boolean;
  draggedSymbolId: string | null;
  onSymbolMouseDown: (e: React.MouseEvent, symbol: Symbol) => void;
  onSymbolSelect: (symbol: Symbol) => void;
  onSymbolDelete: (symbolId: string) => void;
}

const renderSymbolIcon = (type: string) => {
  switch (type) {
    case 'fireExt':
      return <FireExtIcon />;
    case 'fireHose':
      return <FireHoseIcon />;
    case 'firstAid':
      return <FirstAidIcon />;
    case 'assembly':
      return <AssemblyPointIcon />;
    case 'wall':
      return <WallIcon />;
    case 'door':
      return <DoorIcon />;
    case 'stairs':
      return <StairsIcon />;
    default:
      return null;
  }
};

export const PDFSymbols = ({
  symbols,
  isDragging,
  draggedSymbolId,
  onSymbolMouseDown,
  onSymbolSelect,
  onSymbolDelete
}: PDFSymbolsProps) => {
  const [hoveredSymbolId, setHoveredSymbolId] = useState<string | null>(null);
  const [selectedSymbolId, setSelectedSymbolId] = useState<string | null>(null);
  
  return (
    <>
      {symbols.map((symbol) => {
        const isWall = symbol.type === 'wall';
        const isSelected = selectedSymbolId === symbol.id;
        const isHovered = hoveredSymbolId === symbol.id;
        const showDeleteButton = isSelected; // Only show delete button when selected, not on hover
        
        return (
          <div
            key={symbol.id}
            className={`absolute cursor-move transition-transform ${
              isDragging && draggedSymbolId === symbol.id ? '' : 'duration-100'
            }`}
            style={{
              left: `${symbol.x}px`,
              top: `${symbol.y}px`,
              transform: `translate(-50%, -50%) rotate(${symbol.rotation}deg)`,
              transition: isDragging && draggedSymbolId === symbol.id ? 'none' : 'all 0.1s ease-out',
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onSymbolMouseDown(e, symbol);
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedSymbolId(symbol.id);
              onSymbolSelect(symbol);
            }}
            onMouseEnter={() => setHoveredSymbolId(symbol.id)}
            onMouseLeave={() => setHoveredSymbolId(null)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onSymbolDelete(symbol.id);
            }}
          >
            {renderSymbolIcon(symbol.type)}
            
            {/* Delete button only visible when selected */}
            {showDeleteButton && (
              <div 
                className="absolute -right-6 -top-6 bg-red-100 p-1 rounded-full cursor-pointer hover:bg-red-200 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onSymbolDelete(symbol.id);
                }}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};
