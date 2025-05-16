
import { useState, useEffect } from 'react';
import { Progress } from "@/components/ui/progress";
import { WorkflowStage } from './WorkflowSteps';
import { Check } from 'lucide-react';

interface WorkflowProgressProps {
  currentStage: WorkflowStage;
  onStageChange?: (stage: WorkflowStage) => void;
}

interface StageInfo {
  id: WorkflowStage;
  label: string;
  progress: number;
}

export const WorkflowProgress = ({ currentStage, onStageChange }: WorkflowProgressProps) => {
  const [stageProgress, setStageProgress] = useState(0);
  
  // Define all stages in order with their progress percentages
  const stages: StageInfo[] = [
    { id: 'draw_walls', label: 'Floor Plan', progress: 30 },
    { id: 'place_symbols', label: 'Add Symbols', progress: 60 },
    { id: 'review', label: 'Review', progress: 90 },
    { id: 'export', label: 'Export', progress: 100 }
  ];

  useEffect(() => {
    // Find the current stage in our stages array
    const currentStageInfo = stages.find(stage => stage.id === currentStage);
    if (currentStageInfo) {
      setStageProgress(currentStageInfo.progress);
    }
  }, [currentStage]);

  // Calculate currentStageIndex based on visible steps
  const visibleStageIds = stages.map(s => s.id);
  const currentStageIndex = visibleStageIds.indexOf(currentStage);

  return (
    <div className="w-full bg-white border-b py-4 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-3 flex justify-between">
          {stages.map((stage, idx) => {
            const isActive = idx === currentStageIndex;
            const isCompleted = idx < currentStageIndex;
            const isClickable = idx <= currentStageIndex && typeof onStageChange === 'function';
            
            return (
              <div 
                key={stage.id}
                className={`flex flex-col items-center ${isActive ? 'text-primary font-bold' : 
                          isCompleted ? 'text-primary' : 'text-gray-400'} 
                          ${isClickable ? 'cursor-pointer hover:underline' : 'cursor-not-allowed'}`}
                onClick={() => { if (isClickable) onStageChange?.(stage.id); }}
              >
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-1
                            ${isActive ? 'bg-primary text-white' : 
                            isCompleted ? 'bg-primary/20 text-primary' : 'bg-gray-200 text-gray-400'}`}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{idx + 1}</span>
                  )}
                </div>
                <span className="text-xs whitespace-nowrap">{stage.label}</span>
              </div>
            );
          })}
        </div>
        
        <Progress 
          value={(currentStageIndex / (stages.length - 1)) * 100}
          className="h-2"
        />
        
        {/* Current stage description */}
        <div className="flex justify-between mt-2 text-sm text-gray-500">
          <div className="font-medium">
            {currentStage === 'draw_walls' && "Create or edit walls in your floor plan"}
            {currentStage === 'place_symbols' && "Place evacuation symbols on your floor plan"}
            {currentStage === 'review' && "Review your completed evacuation plan"}
            {currentStage === 'export' && "Export your evacuation plan"}
          </div>
          <div>
            Step {currentStageIndex + 1} of {stages.length}
          </div>
        </div>
      </div>
    </div>
  );
};
