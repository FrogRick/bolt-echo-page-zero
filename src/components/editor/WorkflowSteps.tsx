
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
      
      <div className="flex justify-center mb-4">
        <div className="grid grid-cols-5 gap-2">
          {steps.map((step, index) => {
            if (step.optional && !hasManualWalls) return null;
            
            const isActive = step.id === currentStage;
            const isPast = step.completed;
            const isClickable = isPast || isActive;
            
            return (
              <div 
                key={step.id} 
                className={`flex flex-col items-center p-2 rounded ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'} transition-all ${
                  isActive 
                    ? 'bg-primary/10 border border-primary' 
                    : isPast 
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
                      : 'bg-gray-50 text-gray-400'
                }`}
                onClick={() => {
                  if (isClickable) {
                    onStageChange(step.id as WorkflowStage);
                  }
                }}
                title={isClickable ? `Go to ${step.title}` : "Complete previous steps first"}
              >
                <div className={`rounded-full p-2 ${
                  isActive 
                    ? 'bg-primary text-white' 
                    : isPast 
                      ? 'bg-gray-200 text-gray-600' 
                      : 'bg-gray-100 text-gray-400'
                }`}>
                  <step.icon className="h-4 w-4" />
                </div>
                <span className="text-xs mt-1 font-medium">{step.title}</span>
                <div className="h-1 w-full mt-2">
                  {index < steps.length - 1 && (
                    <div className={`h-0.5 w-full ${
                      isPast ? 'bg-primary' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
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
