import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Layers, MousePointer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EditorSymbol, WallSymbol } from "@/types/editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

declare global {
  interface Window {
    cv: any;
  }
}

interface FloorplanDetectionProps {
  pdfFile: File | null;
  pageNumber: number;
  scale: number;
  onElementsDetected: (elements: EditorSymbol[]) => void;
  drawingWallMode: boolean;
  onDrawingWallModeToggle: (enabled: boolean) => void;
}

export const FloorplanDetection = ({ 
  pdfFile, 
  pageNumber,
  scale,
  onElementsDetected,
  drawingWallMode,
  onDrawingWallModeToggle
}: FloorplanDetectionProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOpenCVLoaded, setIsOpenCVLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("basic");
  const [detectionParams, setDetectionParams] = useState({
    // Basic parameters
    cannyThreshold1: 50,
    cannyThreshold2: 150,
    houghThreshold: 50,
    minLineLength: 50,
    maxLineGap: 10,
    
    // Advanced parameters
    blurSize: 5,
    adaptiveThresholdBlockSize: 11,
    adaptiveThresholdConstant: 2,
    dilationSize: 3,
    lineThickness: 5,
    minLineAngleDiff: 5,
    lineGroupingDistance: 15
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Load OpenCV.js dynamically with progress tracking
  useEffect(() => {
    if (window.cv) {
      setIsOpenCVLoaded(true);
      return;
    }

    setLoadingProgress(10);
    
    const script = document.createElement('script');
    script.src = 'https://docs.opencv.org/4.7.0/opencv.js';
    script.async = true;
    
    const loadProgressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 90) {
          clearInterval(loadProgressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);
    
    script.onload = () => {
      console.log('OpenCV.js loaded');
      setIsOpenCVLoaded(true);
      setLoadingProgress(100);
      clearInterval(loadProgressInterval);
    };
    
    script.onerror = () => {
      clearInterval(loadProgressInterval);
      toast({
        title: "Failed to load OpenCV",
        description: "The detection library failed to load.",
        variant: "destructive"
      });
    };
    
    document.body.appendChild(script);

    return () => {
      clearInterval(loadProgressInterval);
      document.body.removeChild(script);
    };
  }, [toast]);

  // Function to render a PDF page to an image for processing
  const renderPDFPageToImage = async (): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      try {
        // Find the PDF document in the DOM
        const pdfCanvas = document.querySelector('.react-pdf__Page__canvas') as HTMLCanvasElement;
        
        if (!pdfCanvas) {
          reject(new Error('PDF canvas not found. Please make sure the PDF is loaded.'));
          return;
        }

        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load PDF as image'));
        img.src = pdfCanvas.toDataURL('image/png');
      } catch (error) {
        reject(error);
      }
    });
  };

  // Enhanced wall detection with noise reduction and line grouping
  const detectWalls = (src: any, dst: any): WallSymbol[] => {
    const walls: WallSymbol[] = [];
    const lines = new window.cv.Mat();
    const gray = new window.cv.Mat();
    
    // Convert to grayscale
    window.cv.cvtColor(src, gray, window.cv.COLOR_RGBA2GRAY);
    
    // Apply Gaussian blur for noise reduction
    const blurred = new window.cv.Mat();
    window.cv.GaussianBlur(gray, blurred, new window.cv.Size(detectionParams.blurSize, detectionParams.blurSize), 0);
    
    // Apply adaptive thresholding for better edge detection in varying conditions
    const thresholded = new window.cv.Mat();
    window.cv.adaptiveThreshold(
      blurred,
      thresholded,
      255,
      window.cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      window.cv.THRESH_BINARY_INV,
      detectionParams.adaptiveThresholdBlockSize,
      detectionParams.adaptiveThresholdConstant
    );
    
    // Apply Canny edge detection
    const edges = new window.cv.Mat();
    window.cv.Canny(
      thresholded, 
      edges, 
      detectionParams.cannyThreshold1, 
      detectionParams.cannyThreshold2
    );
    
    // Dilate edges to connect broken lines
    const kernel = window.cv.Mat.ones(detectionParams.dilationSize, detectionParams.dilationSize, window.cv.CV_8U);
    const dilated = new window.cv.Mat();
    window.cv.dilate(edges, dilated, kernel);
    
    // Apply Hough Line Transform to detect lines
    window.cv.HoughLinesP(
      dilated, 
      lines, 
      1, 
      Math.PI / 180, 
      detectionParams.houghThreshold, 
      detectionParams.minLineLength, 
      detectionParams.maxLineGap
    );
    
    // Process detected lines
    const rawLines = [];
    for (let i = 0; i < lines.rows; i++) {
      const coords = lines.data32S;
      const x1 = coords[i * 4];
      const y1 = coords[i * 4 + 1];
      const x2 = coords[i * 4 + 2];
      const y2 = coords[i * 4 + 3];
      
      // Calculate length and angle
      const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
      
      // Only include lines over a minimum length
      if (length > detectionParams.minLineLength) {
        rawLines.push({
          x1, y1, x2, y2,
          length,
          angle: angle < 0 ? angle + 360 : angle,
          midX: (x1 + x2) / 2,
          midY: (y1 + y2) / 2
        });
      }
    }

    // Group similar lines to prevent duplicates
    const groupedLines = [];
    const usedIndices = new Set();

    for (let i = 0; i < rawLines.length; i++) {
      if (usedIndices.has(i)) continue;
      
      const currentLine = rawLines[i];
      const similarLines = [currentLine];
      usedIndices.add(i);
      
      for (let j = i + 1; j < rawLines.length; j++) {
        if (usedIndices.has(j)) continue;
        
        const otherLine = rawLines[j];
        
        // Check if lines are close and have similar angles
        const distanceBetweenMids = Math.sqrt(
          Math.pow(currentLine.midX - otherLine.midX, 2) + 
          Math.pow(currentLine.midY - otherLine.midY, 2)
        );
        
        // Calculate angle difference, accounting for 180-degree symmetry
        const angleDiff = Math.min(
          Math.abs(currentLine.angle - otherLine.angle),
          Math.abs(Math.abs(currentLine.angle - otherLine.angle) - 180)
        );
        
        if (distanceBetweenMids < detectionParams.lineGroupingDistance && 
            angleDiff < detectionParams.minLineAngleDiff) {
          similarLines.push(otherLine);
          usedIndices.add(j);
        }
      }
      
      // Use the longest line from each group
      const longestLine = similarLines.reduce(
        (longest, current) => current.length > longest.length ? current : longest,
        similarLines[0]
      );
      
      groupedLines.push(longestLine);
    }

    // Create wall symbols from grouped lines
    for (const line of groupedLines) {
      const { x1, y1, x2, y2, angle } = line;
      
      // Midpoint of the line
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      
      // Create wall symbol
      walls.push({
        id: crypto.randomUUID(),
        type: 'wall',
        x: midX / scale,
        y: midY / scale,
        rotation: angle,
        size: 30,
        start: { x: x1 / scale, y: y1 / scale },
        end: { x: x2 / scale, y: y2 / scale },
        thickness: detectionParams.lineThickness
      });
      
      // Draw the wall on preview image
      window.cv.line(dst, new window.cv.Point(x1, y1), new window.cv.Point(x2, y2), [0, 255, 0, 255], 2);
    }
    
    // Clean up memory
    gray.delete();
    blurred.delete();
    thresholded.delete();
    edges.delete();
    dilated.delete();
    kernel.delete();
    lines.delete();
    
    return walls;
  };

  const handleParamChange = (param: string, value: number) => {
    setDetectionParams(prev => ({
      ...prev,
      [param]: value
    }));
  };

  const analyzeFloorplan = async () => {
    if (!isOpenCVLoaded || !pdfFile) {
      toast({
        title: "Detection not ready",
        description: isOpenCVLoaded 
          ? "Please upload a PDF first." 
          : "OpenCV library is still loading.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Render current PDF page to image
      const image = await renderPDFPageToImage();
      
      // Create canvas and context for OpenCV processing
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;
      
      // Set canvas size
      canvasRef.current.width = image.width;
      canvasRef.current.height = image.height;
      
      // Draw image on canvas
      ctx.drawImage(image, 0, 0);
      
      // Get image data for processing
      const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      // Process with OpenCV
      const src = window.cv.matFromImageData(imageData);
      const dst = src.clone();
      
      // Detect walls
      const walls = detectWalls(src, dst);
      
      // Show preview with detections
      window.cv.imshow(canvasRef.current, dst);
      setPreviewImage(canvasRef.current.toDataURL());
      
      // Clean up
      src.delete();
      dst.delete();
      
      // Notify parent component
      onElementsDetected(walls);
      
      toast({
        title: "Walls detected",
        description: `Found ${walls.length} wall segments in the drawing`,
      });
    } catch (error) {
      console.error("Error analyzing floorplan:", error);
      toast({
        title: "Detection failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`space-y-4 bg-white p-4 rounded-lg shadow-md ${pdfFile ? 'border-2 border-blue-200 pulse-animation' : ''}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-blue-700">Wall Detection</h3>
        <div className="flex space-x-2">
          <Button
            onClick={() => onDrawingWallModeToggle(!drawingWallMode)}
            variant={drawingWallMode ? "default" : "outline"}
            className="gap-2"
          >
            <MousePointer className="h-4 w-4" />
            {drawingWallMode ? "Drawing Walls" : "Draw Walls"}
          </Button>
          
          <Button 
            onClick={analyzeFloorplan}
            disabled={isProcessing || !isOpenCVLoaded || !pdfFile}
            variant={pdfFile ? "default" : "outline"}
            className="gap-2"
          >
            <Layers className="h-4 w-4" />
            {isProcessing ? "Processing..." : "Auto-Detect"}
          </Button>
        </div>
      </div>
      
      {!isOpenCVLoaded ? (
        <div className="text-sm text-gray-500">
          <p className="mb-2">Loading detection engine...</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
        </div>
      ) : !pdfFile ? (
        <p className="text-sm text-gray-500">Upload a PDF to enable detection</p>
      ) : drawingWallMode ? (
        <div className="text-sm">
          <p className="font-medium text-blue-600">Click to set the start and end points of each wall</p>
          <p className="mt-2 text-gray-500 italic">Click once for the start point, then again for the end point of each wall</p>
        </div>
      ) : (
        <div className="text-sm">
          <p className="font-medium text-blue-600">Click the button above to automatically identify walls in your drawing</p>
          <p className="mt-2 text-gray-500 italic">Detection works best on clean drawings with good contrast</p>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Parameters</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Parameters</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-2">
              <div className="space-y-1">
                <label className="block text-xs text-gray-500">Canny Threshold 1: {detectionParams.cannyThreshold1}</label>
                <input 
                  type="range" 
                  min="10" 
                  max="250" 
                  value={detectionParams.cannyThreshold1} 
                  onChange={(e) => handleParamChange('cannyThreshold1', parseInt(e.target.value))} 
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              <div className="space-y-1">
                <label className="block text-xs text-gray-500">Canny Threshold 2: {detectionParams.cannyThreshold2}</label>
                <input 
                  type="range" 
                  min="50" 
                  max="500" 
                  value={detectionParams.cannyThreshold2} 
                  onChange={(e) => handleParamChange('cannyThreshold2', parseInt(e.target.value))} 
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              <div className="space-y-1">
                <label className="block text-xs text-gray-500">Hough Threshold: {detectionParams.houghThreshold}</label>
                <input 
                  type="range" 
                  min="10" 
                  max="150" 
                  value={detectionParams.houghThreshold} 
                  onChange={(e) => handleParamChange('houghThreshold', parseInt(e.target.value))} 
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              <div className="space-y-1">
                <label className="block text-xs text-gray-500">Min Line Length: {detectionParams.minLineLength}</label>
                <input 
                  type="range" 
                  min="10" 
                  max="200" 
                  value={detectionParams.minLineLength} 
                  onChange={(e) => handleParamChange('minLineLength', parseInt(e.target.value))} 
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              <div className="space-y-1">
                <label className="block text-xs text-gray-500">Max Line Gap: {detectionParams.maxLineGap}</label>
                <input 
                  type="range" 
                  min="1" 
                  max="50" 
                  value={detectionParams.maxLineGap} 
                  onChange={(e) => handleParamChange('maxLineGap', parseInt(e.target.value))} 
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="advanced" className="space-y-2">
              <div className="space-y-1">
                <label className="block text-xs text-gray-500">Blur Size: {detectionParams.blurSize}</label>
                <input 
                  type="range" 
                  min="3" 
                  max="11" 
                  step="2"
                  value={detectionParams.blurSize} 
                  onChange={(e) => handleParamChange('blurSize', parseInt(e.target.value))} 
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              <div className="space-y-1">
                <label className="block text-xs text-gray-500">Adaptive Threshold Block Size: {detectionParams.adaptiveThresholdBlockSize}</label>
                <input 
                  type="range" 
                  min="3" 
                  max="21" 
                  step="2"
                  value={detectionParams.adaptiveThresholdBlockSize} 
                  onChange={(e) => handleParamChange('adaptiveThresholdBlockSize', parseInt(e.target.value))} 
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              <div className="space-y-1">
                <label className="block text-xs text-gray-500">Dilation Size: {detectionParams.dilationSize}</label>
                <input 
                  type="range" 
                  min="1" 
                  max="7" 
                  value={detectionParams.dilationSize} 
                  onChange={(e) => handleParamChange('dilationSize', parseInt(e.target.value))} 
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              <div className="space-y-1">
                <label className="block text-xs text-gray-500">Wall Thickness: {detectionParams.lineThickness}</label>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={detectionParams.lineThickness} 
                  onChange={(e) => handleParamChange('lineThickness', parseInt(e.target.value))} 
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              <div className="space-y-1">
                <label className="block text-xs text-gray-500">Line Grouping Distance: {detectionParams.lineGroupingDistance}</label>
                <input 
                  type="range" 
                  min="5" 
                  max="50" 
                  value={detectionParams.lineGroupingDistance} 
                  onChange={(e) => handleParamChange('lineGroupingDistance', parseInt(e.target.value))} 
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
      
      {previewImage && (
        <div className="mt-2 border rounded-md p-2 h-48 overflow-auto">
          <p className="text-xs text-gray-500 mb-1">Wall detection preview:</p>
          <div className="relative">
            <img 
              src={previewImage} 
              alt="Detection preview" 
              className="max-w-full h-auto"
            />
          </div>
        </div>
      )}
      
      <canvas ref={canvasRef} className="hidden" />

      <style>
        {`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          }
        }
        .pulse-animation {
          animation: pulse 2s infinite;
        }
        `}
      </style>
    </div>
  );
};
