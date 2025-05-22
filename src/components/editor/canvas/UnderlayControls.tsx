
import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ImageIcon, ImageOff, Upload } from "lucide-react";

interface UnderlayControlsProps {
  underlayImage: HTMLImageElement | null;
  addUnderlayImage: (file: File) => void;
  removeUnderlayImage: () => void;
  underlayScale: number;
  adjustUnderlayScale: (scale: number) => void;
  underlayOpacity: number;
  adjustUnderlayOpacity: (opacity: number) => void;
}

export const UnderlayControls: React.FC<UnderlayControlsProps> = ({
  underlayImage,
  addUnderlayImage,
  removeUnderlayImage,
  underlayScale,
  adjustUnderlayScale,
  underlayOpacity,
  adjustUnderlayOpacity
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      addUnderlayImage(e.target.files[0]);
    }
  };

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="border-l pl-4 flex items-center gap-3">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleUploadClick}
        className="flex items-center gap-1"
      >
        <Upload size={16} />
        <span>Underlay</span>
      </Button>
      <input 
        ref={fileInputRef}
        type="file" 
        accept="image/*" 
        onChange={handleFileChange} 
        className="hidden"
      />
      
      {underlayImage && (
        <>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={removeUnderlayImage} 
            className="flex items-center gap-1 text-red-500"
          >
            <ImageOff size={16} />
            <span>Remove</span>
          </Button>
          
          <div className="flex items-center gap-2">
            <ImageIcon size={16} className="text-gray-500" />
            <div className="w-24">
              <Slider 
                value={[underlayOpacity * 100]} 
                min={10} 
                max={100} 
                step={5}
                onValueChange={(value) => adjustUnderlayOpacity(value[0] / 100)}
              />
            </div>
            <span className="text-xs text-gray-500">{Math.round(underlayOpacity * 100)}%</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Scale:</span>
            <div className="w-24">
              <Slider 
                value={[underlayScale * 100]} 
                min={10} 
                max={200} 
                step={5}
                onValueChange={(value) => adjustUnderlayScale(value[0] / 100)}
              />
            </div>
            <span className="text-xs text-gray-500">{Math.round(underlayScale * 100)}%</span>
          </div>
        </>
      )}
    </div>
  );
};
