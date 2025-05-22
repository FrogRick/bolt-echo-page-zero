
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrientationSelectProps {
  orientation: "portrait" | "landscape";
  handleOrientationChange: (value: string) => void;
}

export const OrientationSelect: React.FC<OrientationSelectProps> = ({
  orientation,
  handleOrientationChange
}) => {
  return (
    <div className="border-l pl-4 flex items-center gap-3">
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium">Orientation:</span>
        <Select
          value={orientation}
          onValueChange={handleOrientationChange}
        >
          <SelectTrigger className="w-28 h-8 text-xs">
            <SelectValue placeholder="Portrait" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="portrait">Portrait</SelectItem>
            <SelectItem value="landscape">Landscape</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
