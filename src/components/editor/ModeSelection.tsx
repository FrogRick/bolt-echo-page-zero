
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, FileText } from "lucide-react";

interface ModeSelectionProps {
  onModeSelect: (useManualWalls: boolean) => void;
}

export const ModeSelection = ({ onModeSelect }: ModeSelectionProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onModeSelect(false)}
      >
        <CardContent className="p-6 flex flex-col items-center">
          <FileText className="h-8 w-8 text-primary mb-4" />
          <h3 className="text-lg font-semibold mb-2">Use PDF as is</h3>
          <p className="text-center text-gray-500 text-sm mb-4">
            Skip wall drawing and use the PDF as your background.
          </p>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onModeSelect(true)}
      >
        <CardContent className="p-6 flex flex-col items-center">
          <Pencil className="h-8 w-8 text-primary mb-4" />
          <h3 className="text-lg font-semibold mb-2">Draw Walls Manually</h3>
          <p className="text-center text-gray-500 text-sm mb-4">
            Create walls manually to customize your floor plan.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
