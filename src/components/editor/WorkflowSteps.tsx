
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export type WorkflowStage = 'draw_walls' | 'add_doors' | 'add_windows' | 'add_furniture' | 'add_safety' | 'export';

interface WorkflowStepsProps {
  currentStage: WorkflowStage;
  onStageChange: (stage: WorkflowStage) => void;
}

export const WorkflowSteps: React.FC<WorkflowStepsProps> = ({ 
  currentStage,
  onStageChange 
}) => {
  const stages: { id: WorkflowStage; label: string; description: string }[] = [
    { id: 'draw_walls', label: 'Draw Walls', description: 'Create the building structure' },
    { id: 'add_doors', label: 'Add Doors', description: 'Position doors and entrances' },
    { id: 'add_windows', label: 'Add Windows', description: 'Add windows to your plan' },
    { id: 'add_furniture', label: 'Add Furniture', description: 'Place furniture items' },
    { id: 'add_safety', label: 'Safety Items', description: 'Add emergency equipment' },
    { id: 'export', label: 'Export', description: 'Export your floorplan' },
  ];

  return (
    <div className="flex flex-col space-y-2">
      <h3 className="text-sm font-medium mb-1">Workflow</h3>
      <div className="space-y-1.5">
        {stages.map((stage) => (
          <Button
            key={stage.id}
            variant={currentStage === stage.id ? "default" : "outline"}
            size="sm"
            className="w-full justify-start"
            onClick={() => onStageChange(stage.id)}
          >
            <span className="truncate">
              {stage.label}
              {currentStage === stage.id && (
                <Badge className="ml-2 bg-blue-100 text-blue-800 text-xs">Active</Badge>
              )}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
};
