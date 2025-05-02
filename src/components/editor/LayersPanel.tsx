
import { Eye, EyeOff, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { Layer } from "@/hooks/useEditorState";

interface LayersPanelProps {
  layers: Layer[];
  onLayerVisibilityChange: (layerId: string, visible: boolean) => void;
}

export const LayersPanel = ({ layers, onLayerVisibilityChange }: LayersPanelProps) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="space-y-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between cursor-pointer py-2 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Layers className="h-5 w-5 text-gray-600" />
              <h3 className="font-medium">Layers</h3>
            </div>
            <Button variant="ghost" size="sm">
              {isOpen ? "Hide" : "Show"}
            </Button>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="pt-2">
          <ul className="space-y-2">
            {layers.map((layer) => (
              <li key={layer.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                <span className="text-sm font-medium">{layer.name}</span>
                <Button
                  variant="ghost" 
                  size="sm"
                  onClick={() => onLayerVisibilityChange(layer.id, !layer.visible)}
                  className={`${layer.visible ? 'text-blue-600' : 'text-gray-400'}`}
                >
                  {layer.visible ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </Button>
              </li>
            ))}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
