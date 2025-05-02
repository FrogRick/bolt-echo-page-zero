
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Search, Filter, RotateCcw, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SimilarityDetectionProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onElementDetected: (elements: any[]) => void;
  onClearElements?: () => void;
  onRedoDetection?: () => void;
}

export const SimilarityDetection = ({ 
  enabled, 
  onToggle, 
  onElementDetected, 
  onClearElements,
  onRedoDetection 
}: SimilarityDetectionProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const { toast } = useToast();
  
  // Auto-enable detection when component is clicked
  useEffect(() => {
    // Only auto-enable on initial render, not on every render
    if (!enabled) {
      onToggle(true);
      toast({
        title: "Wall Detection Enabled",
        description: "Select an area containing a wall in your PDF to detect it.",
      });
    }
  }, []);
  
  const handleToggle = () => {
    const newState = !enabled;
    onToggle(newState);
    
    if (newState) {
      toast({
        title: "Wall Detection Enabled",
        description: "Select an area containing a wall in your PDF to detect it.",
      });
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-red-600" />
              <h3 className="font-medium">Red Wall Detection</h3>
            </div>
            <Button variant="ghost" size="sm">
              {isOpen ? "Hide" : "Show"}
            </Button>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="pt-4 space-y-4">
          <p className="text-sm text-gray-600">
            <strong>Select an area containing a wall in your floorplan</strong> to detect and highlight it.
            The system will place a red wall directly on top of the wall in your PDF. 
            Use the Redo and Clear buttons to manage detected walls.
          </p>

          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Button
                onClick={handleToggle}
                variant={enabled ? "outline" : "default"}
                className={enabled ? "bg-red-100 border-red-300 text-red-700" : ""}
              >
                <Filter className="h-4 w-4 mr-2" />
                {enabled ? "Detection Active" : "Enable Wall Detection"}
              </Button>
            </div>
          </div>

          {enabled && (
            <div className="bg-red-50 p-3 rounded-md border border-red-100 mt-2">
              <p className="text-sm text-red-800">
                <strong>Detection mode enabled.</strong> Select an area containing a wall in your PDF 
                to place a red wall on top of it.
              </p>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
