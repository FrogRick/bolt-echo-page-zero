import { useState, useEffect } from 'react';
import { Progress } from "@/components/ui/progress";
import { WorkflowStage } from './WorkflowSteps';

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
    // { id: 'choose_mode', label: 'Upload', progress: 25 }, // Dold i indikatorn
    { id: 'draw_walls', label: 'Floor plan', progress: 50 },
    { id: 'place_symbols', label: 'Add Symbols', progress: 75 },
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

  // Räkna ut currentStageIndex baserat på synliga steg
  const visibleStageIds = stages.map(s => s.id);
  const currentStageIndex = visibleStageIds.indexOf(currentStage);

  return (
    <div className="w-full mb-6 px-4">
      <div className="mb-2 flex justify-between">
        {stages.map((stage, idx) => {
          const isActive = idx === currentStageIndex;
          const isCompleted = currentStageIndex > 0 && idx < currentStageIndex;
          // Om vi är på första steget, ingen är completed
          const showCompleted = currentStageIndex > 0 && isCompleted;
          const isClickable = idx <= currentStageIndex && typeof onStageChange === 'function';
          // console.log(stage.label, {isActive, isCompleted, currentStage, stageId: stage.id});
          return (
            <div 
              key={stage.id}
              className={`flex flex-col items-center ${isActive ? 'text-primary font-bold' : 
                        showCompleted ? 'text-primary' : 'text-gray-400'} ${isClickable ? 'cursor-pointer hover:underline' : 'cursor-not-allowed'}`}
              onClick={() => { if (isClickable) onStageChange?.(stage.id); }}
            >
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center mb-1
                          ${isActive ? 'bg-primary text-white' : 
                          showCompleted ? 'bg-primary/20 text-primary' : 'bg-gray-200 text-gray-400'}`}
              >
                {showCompleted ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
                       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                ) : (
                  idx + 1
                )}
              </div>
              <span className="text-xs whitespace-nowrap">{stage.label}</span>
            </div>
          );
        })}
      </div>
      
      <Progress 
        value={currentStageIndex === 0 ? 0 : (currentStageIndex / (stages.length - 1)) * 100}
        className={`h-2 ${currentStageIndex === 0 ? 'bg-gray-200 [&>div]:bg-gray-300' : ''}`}
      />
    </div>
  );
};
