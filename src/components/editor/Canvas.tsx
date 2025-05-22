import React, { useEffect, useState, useRef } from "react";
import { useCanvasEditor } from "@/hooks/useCanvasEditor";
import { Tool } from "@/types/canvas";
import { Toolbar } from "./Toolbar";
import { Toggle } from "@/components/ui/toggle";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { ImageIcon, ImageOff, Upload } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

// Use only A3 size in mm (ISO A series)
const A3_SIZE = { width: 297, height: 420 };

// Dynamic scaling factor that will be adjusted based on viewport
const INITIAL_SCALE_FACTOR = 2.5;

const Canvas: React.FC = () => {
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [scaleFactor, setScaleFactor] = useState(INITIAL_SCALE_FACTOR);
  
  const {
    canvasRef,
    activeTool,
    setActiveTool,
    currentColor,
    setCurrentColor,
    fillColor,
    setFillColor,
    startDrawing,
    draw,
    endDrawing,
    deleteSelected,
    clearCanvas,
    canvasSize,
    adjustCanvasSize,
    snapToAngle,
    toggleSnapToAngle,
    snapToEndpoints,
    toggleSnapToEndpoints,
    snapToLines,
    toggleSnapToLines,
    snapToExtensions,
    toggleSnapToExtensions,
    rectangleDrawMode,
    // Underlay image controls
    underlayImage,
    addUnderlayImage,
    removeUnderlayImage,
    underlayScale,
    adjustUnderlayScale,
    underlayOpacity,
    adjustUnderlayOpacity
  } = useCanvasEditor();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
  
  // Handle orientation change
  const handleOrientationChange = (value: string) => {
    setOrientation(value as "portrait" | "landscape");
    updateCanvasSize(value as "portrait" | "landscape");
  };
  
  // Calculate the appropriate scale factor based on container size
  const calculateScaleFactor = () => {
    if (!containerRef.current) return INITIAL_SCALE_FACTOR;
    
    const containerWidth = containerRef.current.clientWidth - 32; // Subtract padding
    const containerHeight = containerRef.current.clientHeight - 80; // Adjusted for top/bottom margins
    
    let width = A3_SIZE.width;
    let height = A3_SIZE.height;
    
    if (orientation === "landscape") {
      width = A3_SIZE.height;
      height = A3_SIZE.width;
    }
    
    // Calculate scaling factors for width and height
    const widthScale = containerWidth / width;
    const heightScale = containerHeight / height;
    
    // Use the smaller scale to ensure the canvas fits within container
    const newScaleFactor = Math.min(widthScale, heightScale) * 0.95; // 95% of available space
    
    return Math.max(1, Math.min(newScaleFactor, 4)); // Limit between 1 and 4
  };
  
  // Update container size on window resize
  useEffect(() => {
    const handleResize = () => {
      const newScaleFactor = calculateScaleFactor();
      setScaleFactor(newScaleFactor);
      updateCanvasSize(orientation, newScaleFactor);
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Calculate on mount
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [orientation, containerRef.current]);
  
  // Update canvas size based on orientation and scale factor
  const updateCanvasSize = (orient: "portrait" | "landscape", scale = scaleFactor) => {
    if (orient === "portrait") {
      adjustCanvasSize(
        Math.round(A3_SIZE.width * scale),
        Math.round(A3_SIZE.height * scale)
      );
    } else {
      adjustCanvasSize(
        Math.round(A3_SIZE.height * scale),
        Math.round(A3_SIZE.width * scale)
      );
    }
  };

  // Initialize canvas size
  useEffect(() => {
    updateCanvasSize(orientation);
  }, [scaleFactor]);

  // Force canvas redraw when tool or styling changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Force a clean redraw by clearing and triggering the redraw in useCanvasEditor
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // This will trigger the redraw effect in useCanvasEditor
        setActiveTool(activeTool);
      }
    }
  }, [activeTool, currentColor, fillColor, snapToAngle, snapToEndpoints, snapToLines, snapToExtensions, canvasRef, setActiveTool]);

  // Determine if the current tool uses snapping features
  const isSnappingTool = activeTool === 'wall' || 
                         activeTool === 'wall-polygon' || 
                         activeTool === 'yellow-polygon' || 
                         activeTool === 'green-polygon';

  return (
    <div className="flex flex-col h-full">
      <Toolbar 
        activeTool={activeTool}
        onToolChange={setActiveTool}
        onDelete={deleteSelected}
        onClear={clearCanvas}
      />
      
      <div className="p-2 bg-white border-b flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label htmlFor="colorPicker" className="text-sm font-medium">Stroke:</label>
          <input
            id="colorPicker"
            type="color"
            value={currentColor}
            onChange={(e) => setCurrentColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="fillColorPicker" className="text-sm font-medium">Fill:</label>
          <input
            id="fillColorPicker"
            type="color"
            value={fillColor}
            onChange={(e) => setFillColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer"
          />
        </div>
        
        {/* Orientation control */}
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
        
        {/* Underlay image controls */}
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
      </div>
      
      <div 
        ref={containerRef} 
        className="flex-grow flex items-center justify-center bg-gray-50 overflow-auto"
        style={{ 
          height: "100%",
          paddingTop: "10px", // Reduced top margin
          paddingBottom: "80px" // Increased bottom margin
        }}
      >
        <div className="flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={endDrawing}
            onMouseLeave={endDrawing}
            className={`bg-white border border-gray-200 rounded-lg shadow-md ${
              activeTool === "select" 
                ? (underlayImage ? "cursor-move" : "cursor-default")
                : (activeTool === "wall" || activeTool === "wall-polygon" || activeTool === "yellow-polygon" || activeTool === "green-polygon")
                  ? "cursor-crosshair" 
                  : "cursor-crosshair"
            }`}
          />
        </div>
      </div>
    </div>
  );
};

export default Canvas;
