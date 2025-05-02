
import { useState, useEffect } from 'react';
import { Progress } from "@/components/ui/progress";
import { WorkflowStage } from './WorkflowSteps';

interface WorkflowProgressProps {
  currentStage: WorkflowStage;
}

interface StageInfo {
  id: WorkflowStage;
  label: string;
  progress: number;
}

export const WorkflowProgress = ({ currentStage }: WorkflowProgressProps) => {
  const [stageProgress, setStageProgress] = useState(0);
  
  // Define all stages in order with their progress percentages
  const stages: StageInfo[] = [
    { id: 'choose_mode', label: 'Upload', progress: 25 },
    { id: 'draw_walls', label: 'Edit Plan', progress: 50 },
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

  return (
    <div className="w-full mb-6 px-4">
      <div className="mb-2 flex justify-between">
        {stages.map((stage) => {
          // Determine if this stage is current or completed
          const isActive = stage.id === currentStage;
          const isCompleted = stages.findIndex(s => s.id === currentStage) >= 
                              stages.findIndex(s => s.id === stage.id);
          
          return (
            <div 
              key={stage.id}
              className={`flex flex-col items-center ${isActive ? 'text-primary font-bold' : 
                        isCompleted ? 'text-primary' : 'text-gray-400'}`}
            >
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center mb-1
                          ${isActive ? 'bg-primary text-white' : 
                          isCompleted ? 'bg-primary/20 text-primary' : 'bg-gray-200 text-gray-400'}`}
              >
                {isCompleted ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
                       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                ) : (
                  stages.findIndex(s => s.id === stage.id) + 1
                )}
              </div>
              <span className="text-xs whitespace-nowrap">{stage.label}</span>
            </div>
          );
        })}
      </div>
      
      <Progress 
        value={stageProgress}
        className="h-2"
      />
    </div>
  );
};
