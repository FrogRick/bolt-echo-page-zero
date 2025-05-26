import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FireExtIcon, FireHoseIcon, FirstAidIcon, AssemblyPointIcon, DoorIcon, StairsIcon, WindowIcon } from "./SafetyIcons";
import { useToast } from "@/hooks/use-toast";

interface EvacuationSymbolsPaletteProps {
  activeSymbolType: string | null;
  onSymbolSelect: (type: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const EvacuationSymbolsPalette = ({
  activeSymbolType,
  onSymbolSelect,
  onNext,
  onBack
}: EvacuationSymbolsPaletteProps) => {
  const { toast } = useToast();
  
  const symbols = [
    { id: 'exit', name: 'Exit', icon: <DoorIcon /> },
    { id: 'fireExt', name: 'Fire Extinguisher', icon: <FireExtIcon /> },
    { id: 'fireHose', name: 'Fire Hose', icon: <FireHoseIcon /> },
    { id: 'firstAid', name: 'First Aid', icon: <FirstAidIcon /> },
    { id: 'assembly', name: 'Assembly Point', icon: <AssemblyPointIcon /> },
    { id: 'stairs', name: 'Stairs', icon: <StairsIcon /> },
    { id: 'window', name: 'Window', icon: <WindowIcon /> }
  ];

  const handleSymbolSelect = (symbolId: string) => {
    onSymbolSelect(symbolId);
    
    if (symbolId === activeSymbolType) {
      toast({
        title: `${symbolId} symbol deselected`,
        description: "Click on another symbol or click on the canvas to continue.",
        duration: 3000
      });
    } else {
      toast({
        title: `${symbolId} symbol selected`,
        description: "Click on the canvas to place the symbol.",
        duration: 3000
      });
    }
  };

  return (
    <Card className="relative h-full flex flex-col max-w-3xl mx-auto bg-white">
      <CardHeader>
        <CardTitle className="text-lg">Evacuation Symbols</CardTitle>
        {activeSymbolType && (
          <p className="text-xs text-blue-600">
            Click on the canvas to place the selected symbol
          </p>
        )}
      </CardHeader>
      <CardContent className="p-4 flex-1 flex flex-col min-h-[500px]">
        <div className="flex-1 relative min-h-[500px] flex flex-col">
          <div className="grid grid-cols-2 gap-2">
            {symbols.map((symbol) => (
              <Button
                key={symbol.id}
                variant={activeSymbolType === symbol.id ? "default" : "outline"}
                className="h-16 flex-col relative group"
                onClick={() => handleSymbolSelect(symbol.id)}
              >
                <div className="mb-1">{symbol.icon}</div>
                <span className="text-xs">{symbol.name}</span>
                
                <div className={`absolute inset-0 rounded-md border-2 transition-opacity ${
                  activeSymbolType === symbol.id ? 'border-primary opacity-100' : 'border-transparent opacity-0 group-hover:opacity-50 group-hover:border-primary'
                }`}></div>
              </Button>
            ))}
          </div>
          
          {activeSymbolType && (
            <div className="mt-4 bg-blue-50 p-3 rounded-md text-sm">
              <p className="font-medium text-blue-700">
                {symbols.find(s => s.id === activeSymbolType)?.name} selected
              </p>
              <p className="text-blue-600 text-xs mt-1">
                Click on the canvas to place the symbol. Click the button again to deselect.
              </p>
            </div>
          )}
        </div>
      </CardContent>
      <div className="flex justify-between gap-4 px-6 pb-6 pt-2 mt-auto bg-white z-10 border-t">
        <Button variant="outline" onClick={onBack} disabled={!onBack}>Back</Button>
        <Button onClick={onNext}>Next</Button>
      </div>
    </Card>
  );
};