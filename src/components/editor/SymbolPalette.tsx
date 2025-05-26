import { Button } from "@/components/ui/button";
import { FireExtIcon, FireHoseIcon, FirstAidIcon, AssemblyPointIcon, DoorIcon, StairsIcon, WindowIcon, WallIcon } from "./SafetyIcons";
import { FloorplanDetection } from "./FloorplanDetection";
import { LayersPanel } from "./LayersPanel";
import { Layer } from "@/hooks/useEditorState";

interface SymbolPaletteProps {
  selectedSymbol: string | null;
  onSymbolSelect: (symbolType: string) => void;
  pdfFile: File | null;
  onElementsDetected?: (elements: any[]) => void;
  layers?: Layer[];
  onLayerVisibilityChange?: (layerId: string, visible: boolean) => void;
}

export const SymbolPalette = ({ 
  selectedSymbol, 
  onSymbolSelect,
  pdfFile,
  onElementsDetected,
  layers = [],
  onLayerVisibilityChange = () => {}
}: SymbolPaletteProps) => {
  return (
    <div className="space-y-6">
      {/* Layers Panel Section */}
      {layers.length > 0 && (
        <LayersPanel
          layers={layers}
          onLayerVisibilityChange={onLayerVisibilityChange}
        />
      )}
      
      {/* AI Detection Panel is now rendered in PDFSection component */}
      
      <div>
        <h3 className="font-medium mb-3">Evacuation Symbols</h3>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant={selectedSymbol === "exit" ? "default" : "outline"}
            className={`h-16 flex-col symbol-item ${selectedSymbol === "exit" ? "ring-2 ring-primary" : ""}`}
            onClick={() => onSymbolSelect("exit")}
          >
            <DoorIcon />
            <span className="text-xs">Exit</span>
          </Button>
          <Button
            variant={selectedSymbol === "fireExt" ? "default" : "outline"}
            className={`h-16 flex-col symbol-item ${selectedSymbol === "fireExt" ? "ring-2 ring-primary" : ""}`}
            onClick={() => onSymbolSelect("fireExt")}
          >
            <FireExtIcon />
            <span className="text-xs">Fire Ext.</span>
          </Button>
          <Button
            variant={selectedSymbol === "fireHose" ? "default" : "outline"}
            className={`h-16 flex-col symbol-item ${selectedSymbol === "fireHose" ? "ring-2 ring-primary" : ""}`}
            onClick={() => onSymbolSelect("fireHose")}
          >
            <FireHoseIcon />
            <span className="text-xs">Fire Hose</span>
          </Button>
          <Button
            variant={selectedSymbol === "firstAid" ? "default" : "outline"}
            className={`h-16 flex-col symbol-item ${selectedSymbol === "firstAid" ? "ring-2 ring-primary" : ""}`}
            onClick={() => onSymbolSelect("firstAid")}
          >
            <FirstAidIcon />
            <span className="text-xs">First Aid</span>
          </Button>
          <Button
            variant={selectedSymbol === "assembly" ? "default" : "outline"}
            className={`h-16 flex-col symbol-item ${selectedSymbol === "assembly" ? "ring-2 ring-primary" : ""}`}
            onClick={() => onSymbolSelect("assembly")}
          >
            <AssemblyPointIcon />
            <span className="text-xs">Assembly</span>
          </Button>
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-3">Building Elements</h3>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant={selectedSymbol === "wall" ? "default" : "outline"}
            className={`h-16 flex-col symbol-item ${selectedSymbol === "wall" ? "ring-2 ring-primary" : ""}`}
            onClick={() => onSymbolSelect("wall")}
          >
            <WallIcon />
            <span className="text-xs">Wall</span>
          </Button>
          <Button
            variant={selectedSymbol === "door" ? "default" : "outline"}
            className={`h-16 flex-col symbol-item ${selectedSymbol === "door" ? "ring-2 ring-primary" : ""}`}
            onClick={() => onSymbolSelect("door")}
          >
            <DoorIcon />
            <span className="text-xs">Door</span>
          </Button>
          <Button
            variant={selectedSymbol === "stairs" ? "default" : "outline"}
            className={`h-16 flex-col symbol-item ${selectedSymbol === "stairs" ? "ring-2 ring-primary" : ""}`}
            onClick={() => onSymbolSelect("stairs")}
          >
            <StairsIcon />
            <span className="text-xs">Stairs</span>
          </Button>
          <Button
            variant={selectedSymbol === "window" ? "default" : "outline"}
            className={`h-16 flex-col symbol-item ${selectedSymbol === "window" ? "ring-2 ring-primary" : ""}`}
            onClick={() => onSymbolSelect("window")}
          >
            <WindowIcon />
            <span className="text-xs">Window</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SymbolPalette;