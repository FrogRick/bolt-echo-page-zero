
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WorkflowStage } from './WorkflowSteps';

interface WorkflowProgressProps {
  currentStage: WorkflowStage;
  onStageChange: (stage: WorkflowStage) => void;
}

export const WorkflowProgress: React.FC<WorkflowProgressProps> = ({ 
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
    <div className="flex justify-between bg-white border-b p-3">
      {stages.map((stage) => (
        <Button
          key={stage.id}
          variant={currentStage === stage.id ? "default" : "ghost"}
          size="sm"
          onClick={() => onStageChange(stage.id)}
          className="relative"
        >
          <span>{stage.label}</span>
          {currentStage === stage.id && (
            <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary"></span>
          )}
        </Button>
      ))}
    </div>
  );
};
