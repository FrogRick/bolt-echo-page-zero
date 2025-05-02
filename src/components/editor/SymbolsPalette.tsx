
import { Button } from "@/components/ui/button";
import { Circle, Plus, Square, Triangle } from "lucide-react";

interface SymbolsPaletteProps {
  onSelectSymbol: (symbolType: string) => void;
}

const SymbolsPalette = ({ onSelectSymbol }: SymbolsPaletteProps) => {
  return (
    <div>
      <h3 className="font-medium mb-3">Evacuation Symbols</h3>
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-16 flex-col symbol-item"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", "exit");
          }}
          onClick={() => onSelectSymbol("exit")}
        >
          <Square className="h-6 w-6 text-green-600 mb-1" />
          <span className="text-xs">Exit</span>
        </Button>
        <Button
          variant="outline"
          className="h-16 flex-col symbol-item"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", "fireExt");
          }}
          onClick={() => onSelectSymbol("fireExt")}
        >
          <Triangle className="h-6 w-6 text-red-600 mb-1" />
          <span className="text-xs">Fire Ext.</span>
        </Button>
        <Button
          variant="outline"
          className="h-16 flex-col symbol-item"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", "fireAlarm");
          }}
          onClick={() => onSelectSymbol("fireAlarm")}
        >
          <Circle className="h-6 w-6 text-red-600 mb-1" />
          <span className="text-xs">Fire Alarm</span>
        </Button>
        <Button
          variant="outline"
          className="h-16 flex-col symbol-item"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", "firstAid");
          }}
          onClick={() => onSelectSymbol("firstAid")}
        >
          <Plus className="h-6 w-6 text-blue-600 mb-1" />
          <span className="text-xs">First Aid</span>
        </Button>
      </div>
    </div>
  );
};

export default SymbolsPalette;
