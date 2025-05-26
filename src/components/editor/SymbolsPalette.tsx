import { Button } from "@/components/ui/button";
import { FireExtIcon, FireHoseIcon, FirstAidIcon, AssemblyPointIcon, DoorIcon, StairsIcon, WindowIcon } from "./SafetyIcons";

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
          <DoorIcon />
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
          <FireExtIcon />
          <span className="text-xs">Fire Ext.</span>
        </Button>
        <Button
          variant="outline"
          className="h-16 flex-col symbol-item"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", "fireHose");
          }}
          onClick={() => onSelectSymbol("fireHose")}
        >
          <FireHoseIcon />
          <span className="text-xs">Fire Hose</span>
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
          <FirstAidIcon />
          <span className="text-xs">First Aid</span>
        </Button>
        <Button
          variant="outline"
          className="h-16 flex-col symbol-item"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", "assembly");
          }}
          onClick={() => onSelectSymbol("assembly")}
        >
          <AssemblyPointIcon />
          <span className="text-xs">Assembly</span>
        </Button>
        <Button
          variant="outline"
          className="h-16 flex-col symbol-item"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", "stairs");
          }}
          onClick={() => onSelectSymbol("stairs")}
        >
          <StairsIcon />
          <span className="text-xs">Stairs</span>
        </Button>
      </div>
    </div>
  );
};

export default SymbolsPalette;