
import { Button } from "@/components/ui/button";
import { Circle, Plus, Square, Triangle, DoorClosed, StepForward } from "lucide-react";
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
            <Square className="h-6 w-6 text-green-600 mb-1" />
            <span className="text-xs">Exit</span>
          </Button>
          <Button
            variant={selectedSymbol === "fireExt" ? "default" : "outline"}
            className={`h-16 flex-col symbol-item ${selectedSymbol === "fireExt" ? "ring-2 ring-primary" : ""}`}
            onClick={() => onSymbolSelect("fireExt")}
          >
            <Triangle className="h-6 w-6 text-red-600 mb-1" />
            <span className="text-xs">Fire Ext.</span>
          </Button>
          <Button
            variant={selectedSymbol === "fireAlarm" ? "default" : "outline"}
            className={`h-16 flex-col symbol-item ${selectedSymbol === "fireAlarm" ? "ring-2 ring-primary" : ""}`}
            onClick={() => onSymbolSelect("fireAlarm")}
          >
            <Circle className="h-6 w-6 text-red-600 mb-1" />
            <span className="text-xs">Fire Alarm</span>
          </Button>
          <Button
            variant={selectedSymbol === "firstAid" ? "default" : "outline"}
            className={`h-16 flex-col symbol-item ${selectedSymbol === "firstAid" ? "ring-2 ring-primary" : ""}`}
            onClick={() => onSymbolSelect("firstAid")}
          >
            <Plus className="h-6 w-6 text-blue-600 mb-1" />
            <span className="text-xs">First Aid</span>
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
            <Square className="h-6 w-6 text-gray-600 mb-1" />
            <span className="text-xs">Wall</span>
          </Button>
          <Button
            variant={selectedSymbol === "door" ? "default" : "outline"}
            className={`h-16 flex-col symbol-item ${selectedSymbol === "door" ? "ring-2 ring-primary" : ""}`}
            onClick={() => onSymbolSelect("door")}
          >
            <DoorClosed className="h-6 w-6 text-brown-600 mb-1" />
            <span className="text-xs">Door</span>
          </Button>
          <Button
            variant={selectedSymbol === "stairs" ? "default" : "outline"}
            className={`h-16 flex-col symbol-item ${selectedSymbol === "stairs" ? "ring-2 ring-primary" : ""}`}
            onClick={() => onSymbolSelect("stairs")}
          >
            <StepForward className="h-6 w-6 text-blue-600 mb-1" />
            <span className="text-xs">Stairs</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SymbolPalette;
