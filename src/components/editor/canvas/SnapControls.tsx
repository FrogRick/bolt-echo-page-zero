
import React from "react";
import { Toggle } from "@/components/ui/toggle";

interface SnapControlsProps {
  snapToEndpoints: boolean;
  toggleSnapToEndpoints: () => void;
  snapToLines: boolean;
  toggleSnapToLines: () => void;
  snapToAngle: boolean;
  toggleSnapToAngle: () => void;
  snapToExtensions: boolean;
  toggleSnapToExtensions: () => void;
}

export const SnapControls: React.FC<SnapControlsProps> = ({
  snapToEndpoints,
  toggleSnapToEndpoints,
  snapToLines,
  toggleSnapToLines,
  snapToAngle,
  toggleSnapToAngle,
  snapToExtensions,
  toggleSnapToExtensions
}) => {
  return (
    <div className="border-l pl-4 flex items-center gap-3">
      <Toggle 
        pressed={snapToEndpoints} 
        onPressedChange={toggleSnapToEndpoints}
        aria-label="Toggle snap to endpoints"
        className="data-[state=on]:bg-blue-500 data-[state=on]:text-white"
      >
        <span className="text-sm">Snap</span>
      </Toggle>
      
      <Toggle 
        pressed={snapToLines} 
        onPressedChange={toggleSnapToLines}
        aria-label="Toggle snap to lines"
        className="data-[state=on]:bg-blue-500 data-[state=on]:text-white"
      >
        <span className="text-sm">Lines</span>
      </Toggle>
      
      <Toggle 
        pressed={snapToAngle} 
        onPressedChange={toggleSnapToAngle}
        aria-label="Toggle snap to 45 degree angles"
        className="data-[state=on]:bg-blue-500 data-[state=on]:text-white"
      >
        <span className="text-sm">45°</span>
      </Toggle>

      <Toggle 
        pressed={snapToExtensions} 
        onPressedChange={toggleSnapToExtensions}
        aria-label="Toggle snap to extensions"
        className="data-[state=on]:bg-blue-500 data-[state=on]:text-white"
      >
        <span className="text-sm">Extension</span>
      </Toggle>
    </div>
  );
};
