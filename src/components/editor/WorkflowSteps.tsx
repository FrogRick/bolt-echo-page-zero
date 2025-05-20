import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Pencil, Map, FileText } from "lucide-react";

export type WorkflowStage = 
  | 'choose_mode'   // Initial stage - choose between as-is or manual walls
  | 'draw_walls'    // Drawing walls manually
  | 'place_symbols' // Placing evacuation symbols
  | 'review'        // Review the drawing in a template
  | 'export';       // Choose export format and options

interface WorkflowStepsProps {
  currentStage: WorkflowStage;
  onStageChange: (stage: WorkflowStage) => void;
  hasManualWalls: boolean;
  canProceed: boolean;
}

export const WorkflowSteps = ({ 
  currentStage, 
  onStageChange, 
  hasManualWalls,
  canProceed = true // Make it true by default to ensure users can proceed
}: WorkflowStepsProps) => {
  
  // Define all steps in the workflow
  const steps = [
    { 
      id: 'choose_mode', 
      title: 'Choose Mode',
      description: 'Keep PDF as is or draw walls manually',
      icon: FileText,
      completed: currentStage !== 'choose_mode'
    },
    { 
      id: 'draw_walls', 
      title: 'Draw Walls',
      description: 'Create walls for your evacuation plan',
      icon: Pencil,
      completed: currentStage !== 'draw_walls' && currentStage !== 'choose_mode',
      optional: !hasManualWalls // Skip if not using manual walls
    },
    { 
      id: 'place_symbols', 
      title: 'Place Symbols',
      description: 'Add evacuation symbols to your plan',
      icon: Map,
      completed: currentStage !== 'place_symbols' && currentStage !== 'draw_walls' && currentStage !== 'choose_mode'
    },
    { 
      id: 'review', 
      title: 'Review',
      description: 'Preview your evacuation plan',
      icon: Check,
      completed: currentStage === 'export'
    },
    { 
      id: 'export', 
      title: 'Export',
      description: 'Choose format and export options',
      icon: FileText,
      completed: false
    }
  ];

  return (
    <div className="flex flex-col bg-white p-4 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4 text-center">Evacuation Plan Workflow</h2>
      
      <div className="mt-auto flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            // Logic to go back one step
            if (currentStage === 'draw_walls') {
              onStageChange('choose_mode');
            } else if (currentStage === 'place_symbols') {
              onStageChange(hasManualWalls ? 'draw_walls' : 'choose_mode');
            } else if (currentStage === 'review') {
              onStageChange('place_symbols');
            } else if (currentStage === 'export') {
              onStageChange('review');
            }
          }}
          disabled={currentStage === 'choose_mode'}
        >
          Back
        </Button>
        
        <Button
          onClick={() => {
            // Logic to advance to next step - always allow proceeding
            if (currentStage === 'choose_mode') {
              onStageChange(hasManualWalls ? 'draw_walls' : 'place_symbols');
            } else if (currentStage === 'draw_walls') {
              onStageChange('place_symbols');
            } else if (currentStage === 'place_symbols') {
              onStageChange('review');
            } else if (currentStage === 'review') {
              onStageChange('export');
            }
          }}
        >
          {currentStage === 'export' ? 'Finish' : 'Next'}
        </Button>
      </div>
    </div>
  );
};
