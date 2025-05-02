import { useRef, useState, useEffect } from "react";
import { EditorSymbol, WallSymbol } from "@/types/editor";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    cv: any;
  }
}

interface PDFCanvasInteractionsProps {
  pdfContainerRef: React.RefObject<HTMLDivElement>;
  scale: number;
  panPosition: { x: number, y: number };
  similarityDetectionMode: boolean;
  drawingWallMode: boolean;
  activeSymbolType: string | null;
  isPanning: boolean;
  onWallPointSet: (x: number, y: number) => void;
  onSymbolPlace: (type: string, x: number, y: number) => void;
  onSimilarWallsDetected?: (walls: WallSymbol[]) => void;
  symbols: EditorSymbol[];
  toast: (props: { title: string; description: string }) => void;
  onExitDetectionMode?: () => void;
}

export const usePDFCanvasInteractions = ({
  pdfContainerRef,
  scale,
  panPosition,
  similarityDetectionMode,
  drawingWallMode,
  activeSymbolType,
  isPanning,
  onWallPointSet,
  onSymbolPlace,
  onSimilarWallsDetected,
  symbols,
  toast,
  onExitDetectionMode
}: PDFCanvasInteractionsProps) => {
  
  // State to store the last detected walls for redo functionality
  const [lastDetectedWalls, setLastDetectedWalls] = useState<WallSymbol[]>([]);
  const [openCVLoaded, setOpenCVLoaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Selection rectangle state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{x: number, y: number} | null>(null);
  const [selectionCurrent, setSelectionCurrent] = useState<{x: number, y: number} | null>(null);
  const [selectionOverlay, setSelectionOverlay] = useState<HTMLDivElement | null>(null);
  
  // Initialize OpenCV.js
  useEffect(() => {
    if (window.cv) {
      setOpenCVLoaded(true);
      return;
    }

    // We should only load OpenCV.js once
    if (document.querySelector('script[src*="opencv.js"]')) {
      console.log('OpenCV.js script already exists, waiting for it to load');
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://docs.opencv.org/4.7.0/opencv.js';
    script.async = true;
    
    script.onload = () => {
      console.log('OpenCV.js loaded successfully');
      setOpenCVLoaded(true);
    };
    
    script.onerror = () => {
      console.error('Failed to load OpenCV.js');
      toast({
        title: "Error",
        description: "Failed to load OpenCV.js for wall detection"
      });
    };
    
    document.body.appendChild(script);
    
    return () => {
      // We don't want to remove the script since it would affect other components
      // using OpenCV.js
    };
  }, [toast]);

  // Create a canvas when needed
  const ensureCanvas = () => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
      canvasRef.current.width = 300;
      canvasRef.current.height = 300;
    }
    return canvasRef.current;
  };

  // Create or get the selection overlay element
  const ensureSelectionOverlay = () => {
    if (!selectionOverlay) {
      const overlay = document.createElement('div');
      overlay.className = 'wall-selection-overlay';
      overlay.style.position = 'absolute';
      overlay.style.border = '2px dashed #3b82f6';
      overlay.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
      overlay.style.pointerEvents = 'none';
      overlay.style.zIndex = '9999';
      overlay.style.display = 'none';
      
      if (pdfContainerRef.current) {
        pdfContainerRef.current.appendChild(overlay);
      }
      
      setSelectionOverlay(overlay);
      return overlay;
    }
    return selectionOverlay;
  };

  // Enhanced wall detection using OpenCV.js with area selection
  const detectWallWithOpenCV = async (
    selectionRect: {startX: number, startY: number, width: number, height: number}
  ): Promise<WallSymbol | null> => {
    if (!openCVLoaded || !window.cv) {
      toast({
        title: "OpenCV Not Ready",
        description: "Wall detection library is still loading. Please try again."
      });
      return null;
    }
    
    try {
      console.log(`Detecting wall in selected area: ${JSON.stringify(selectionRect)}`);
      
      // Get the PDF canvas from the DOM
      const pdfCanvas = document.querySelector('.react-pdf__Page__canvas') as HTMLCanvasElement;
      
      if (!pdfCanvas) {
        console.error('PDF canvas element not found');
        return null;
      }
      
      // Create a working canvas
      const canvas = ensureCanvas();
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      
      // Define the region of interest based on the selection rectangle
      const roiLeft = Math.max(0, Math.round(selectionRect.startX));
      const roiTop = Math.max(0, Math.round(selectionRect.startY));
      const roiWidth = Math.min(pdfCanvas.width - roiLeft, selectionRect.width);
      const roiHeight = Math.min(pdfCanvas.height - roiTop, selectionRect.height);
      
      // Set canvas size to match ROI
      canvas.width = roiWidth;
      canvas.height = roiHeight;
      
      // Draw the portion of the PDF on our canvas
      ctx.drawImage(
        pdfCanvas,
        roiLeft, roiTop, roiWidth, roiHeight,
        0, 0, roiWidth, roiHeight
      );
      
      // Convert canvas to OpenCV Mat
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const src = window.cv.matFromImageData(imageData);
      const dst = new window.cv.Mat();
      
      // Convert to grayscale
      const gray = new window.cv.Mat();
      window.cv.cvtColor(src, gray, window.cv.COLOR_RGBA2GRAY);
      
      // Apply Gaussian blur to reduce noise
      const blurred = new window.cv.Mat();
      window.cv.GaussianBlur(gray, blurred, new window.cv.Size(5, 5), 0);
      
      // Apply adaptive threshold
      const threshold = new window.cv.Mat();
      window.cv.adaptiveThreshold(
        blurred,
        threshold,
        255,
        window.cv.ADAPTIVE_THRESH_GAUSSIAN_C,
        window.cv.THRESH_BINARY_INV,
        11,
        2
      );
      
      // Apply Canny edge detection
      const edges = new window.cv.Mat();
      window.cv.Canny(threshold, edges, 50, 150);
      
      // Find lines using Hough Line Transform
      const lines = new window.cv.Mat();
      window.cv.HoughLinesP(edges, lines, 1, Math.PI / 180, 50, 50, 10);
      
      // Process detected lines
      const detectedLines = [];
      for (let i = 0; i < lines.rows; i++) {
        const x1 = lines.data32S[i * 4];
        const y1 = lines.data32S[i * 4 + 1];
        const x2 = lines.data32S[i * 4 + 2];
        const y2 = lines.data32S[i * 4 + 3];
        
        detectedLines.push({
          x1, y1, x2, y2,
          length: Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
          angle: Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI,
          midX: (x1 + x2) / 2,
          midY: (y1 + y2) / 2
        });
      }
      
      // Find the most prominent line
      let mainLine = null;
      if (detectedLines.length > 0) {
        // Sort lines by length (longest first)
        detectedLines.sort((a, b) => b.length - a.length);
        mainLine = detectedLines[0];
        
        // Draw the detected line on the preview
        window.cv.line(
          dst, 
          new window.cv.Point(mainLine.x1, mainLine.y1),
          new window.cv.Point(mainLine.x2, mainLine.y2),
          [255, 0, 0, 255], 
          2
        );
        
        // Convert back the line coordinates to original PDF space
        const origX1 = mainLine.x1 + roiLeft;
        const origY1 = mainLine.y1 + roiTop;
        const origX2 = mainLine.x2 + roiLeft;
        const origY2 = mainLine.y2 + roiTop;
        
        // Calculate mid point and angle
        const midX = (origX1 + origX2) / 2;
        const midY = (origY1 + origY2) / 2;
        const angle = Math.atan2(origY2 - origY1, origX2 - origX1) * 180 / Math.PI;
        const thickness = 3 + (Math.random() * 3); // Random thickness between 3-6
        
        // Create the wall symbol with calculated properties
        const wall: WallSymbol = {
          id: `wall-${Date.now()}`,
          type: 'wall',
          x: midX / scale,
          y: midY / scale,
          rotation: angle,
          size: 30,
          start: { x: origX1 / scale, y: origY1 / scale },
          end: { x: origX2 / scale, y: origY2 / scale },
          thickness: thickness,
          previewImage: canvas.toDataURL(), // Store the processed preview image
          detectionData: {  // Store additional detection data for visualization
            roiLeft, roiTop, roiWidth, roiHeight, 
            selectionRect: {
              startX: selectionRect.startX,
              startY: selectionRect.startY,
              width: selectionRect.width,
              height: selectionRect.height
            },
            lines: detectedLines.slice(0, 5) // Store top 5 detected lines
          }
        };
        
        console.log("Created wall using OpenCV:", wall);
        setLastDetectedWalls(prev => [...prev, wall]);
        
        // Clean up OpenCV resources
        src.delete();
        dst.delete();
        gray.delete();
        blurred.delete();
        threshold.delete();
        edges.delete();
        lines.delete();
        
        return wall;
      } else {
        console.log("No lines detected");
        
        // Clean up OpenCV resources
        src.delete();
        dst.delete();
        gray.delete();
        blurred.delete();
        threshold.delete();
        edges.delete();
        lines.delete();
        
        return null;
      }
    } catch (error) {
      console.error('Error in OpenCV wall detection:', error);
      toast({
        title: "Detection Error",
        description: "An error occurred during wall detection"
      });
      return null;
    }
  };
  
  // Fallback wall detection when OpenCV is not available
  const detectWallFallback = (
    selectionRect: {startX: number, startY: number, width: number, height: number}
  ): WallSymbol | null => {
    console.log(`Using fallback detection for area: ${JSON.stringify(selectionRect)}`);
    
    // Use the center of the selection as the base point
    const centerX = selectionRect.startX + (selectionRect.width / 2);
    const centerY = selectionRect.startY + (selectionRect.height / 2);
    
    // Create a "semi-random" angle based on selection dimensions
    // Use width/height ratio to determine if the line should be more horizontal or vertical
    const isMoreVertical = selectionRect.height > selectionRect.width;
    const angle = isMoreVertical ? 90 : 0;
    
    // Wall thickness varies based on selection size
    const wallThickness = Math.max(2, Math.min(5, selectionRect.width / 30));
    
    // Wall length is based on the selection size
    const baseLength = isMoreVertical ? selectionRect.height * 0.8 : selectionRect.width * 0.8;
    
    // Calculate start and end points based on the angle
    const radians = angle * (Math.PI / 180);
    const halfLength = baseLength / 2;
    
    const startX = centerX - (Math.cos(radians) * halfLength);
    const startY = centerY - (Math.sin(radians) * halfLength);
    const endX = centerX + (Math.cos(radians) * halfLength);
    const endY = centerY + (Math.sin(radians) * halfLength);
    
    // Create the wall symbol with these calculated properties
    const wall: WallSymbol = {
      id: `wall-${Date.now()}`,
      type: 'wall',
      x: centerX / scale,
      y: centerY / scale,
      rotation: angle,
      size: 30,
      start: { x: startX / scale, y: startY / scale },
      end: { x: endX / scale, y: endY / scale },
      thickness: wallThickness,
      detectionData: {
        roiLeft: selectionRect.startX,
        roiTop: selectionRect.startY,
        roiWidth: selectionRect.width,
        roiHeight: selectionRect.height,
        selectionRect: {
          startX: selectionRect.startX,
          startY: selectionRect.startY,
          width: selectionRect.width,
          height: selectionRect.height
        }
      }
    };
    
    console.log("Created wall (fallback):", wall);
    setLastDetectedWalls(prev => [...prev, wall]);
    return wall;
  };
  
  // Main detection function that tries OpenCV first, then falls back if needed
  const detectWall = async (
    selectionRect: {startX: number, startY: number, width: number, height: number}
  ): Promise<WallSymbol | null> => {
    // Try OpenCV detection first if it's loaded
    if (openCVLoaded && window.cv) {
      const wallFromCV = await detectWallWithOpenCV(selectionRect);
      if (wallFromCV) {
        return wallFromCV;
      }
    }
    
    // Fall back to algorithmic detection if OpenCV failed or isn't loaded
    return detectWallFallback(selectionRect);
  };
  
  // Find similar walls in the PDF based on previously detected wall thickness
  const findSimilarWalls = (): WallSymbol[] => {
    if (!openCVLoaded || !window.cv) {
      toast({
        title: "OpenCV Not Ready",
        description: "Wall detection library is still loading. Please try again."
      });
      return [];
    }
    
    try {
      // Check if we have any detected walls to use as reference
      if (lastDetectedWalls.length === 0) {
        toast({
          title: "No Reference Wall",
          description: "Please detect a wall first to use as reference"
        });
        return [];
      }
      
      // Use the most recently detected wall as reference
      const referenceWall = lastDetectedWalls[lastDetectedWalls.length - 1];
      const referenceThickness = referenceWall.thickness || 5;
      
      console.log(`Finding walls with similar thickness to: ${referenceThickness}`);
      
      // Get the PDF canvas from the DOM
      const pdfCanvas = document.querySelector('.react-pdf__Page__canvas') as HTMLCanvasElement;
      
      if (!pdfCanvas) {
        console.error('PDF canvas element not found');
        return [];
      }
      
      // Create a working canvas for the full PDF
      const canvas = ensureCanvas();
      canvas.width = pdfCanvas.width;
      canvas.height = pdfCanvas.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return [];
      
      // Draw the entire PDF on our canvas
      ctx.drawImage(pdfCanvas, 0, 0);
      
      // Convert canvas to OpenCV Mat
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const src = window.cv.matFromImageData(imageData);
      
      // Convert to grayscale
      const gray = new window.cv.Mat();
      window.cv.cvtColor(src, gray, window.cv.COLOR_RGBA2GRAY);
      
      // Apply Gaussian blur
      const blurred = new window.cv.Mat();
      window.cv.GaussianBlur(gray, blurred, new window.cv.Size(5, 5), 0);
      
      // Apply adaptive threshold
      const threshold = new window.cv.Mat();
      window.cv.adaptiveThreshold(
        blurred,
        threshold,
        255,
        window.cv.ADAPTIVE_THRESH_GAUSSIAN_C,
        window.cv.THRESH_BINARY_INV,
        11,
        2
      );
      
      // Apply Canny edge detection
      const edges = new window.cv.Mat();
      window.cv.Canny(threshold, edges, 50, 150);
      
      // Find lines using Hough Line Transform - use more aggressive parameters
      const lines = new window.cv.Mat();
      window.cv.HoughLinesP(edges, lines, 1, Math.PI / 180, 40, 30, 10);
      
      console.log(`Found ${lines.rows} potential lines`);
      
      // Process detected lines
      const detectedLines = [];
      const detectedWalls: WallSymbol[] = [];
      const existingWallCoordinates = new Set();
      
      // Add existing wall coordinates to the set to avoid duplicates
      symbols.forEach(symbol => {
        if (symbol.type === 'wall' && 'start' in symbol && symbol.start && symbol.end) {
          const wallSymbol = symbol as WallSymbol;
          const key = `${Math.round(wallSymbol.start.x)}-${Math.round(wallSymbol.start.y)}-${Math.round(wallSymbol.end.x)}-${Math.round(wallSymbol.end.y)}`;
          existingWallCoordinates.add(key);
        }
      });
      
      // Process detected lines to create wall symbols
      for (let i = 0; i < lines.rows; i++) {
        const x1 = lines.data32S[i * 4];
        const y1 = lines.data32S[i * 4 + 1];
        const x2 = lines.data32S[i * 4 + 2];
        const y2 = lines.data32S[i * 4 + 3];
        
        const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
        
        // Only consider lines that are longer than a minimum threshold
        if (length > 30) {
          const scaledX1 = x1 / scale;
          const scaledY1 = y1 / scale;
          const scaledX2 = x2 / scale;
          const scaledY2 = y2 / scale;
          
          // Create a key to check for duplicates
          const key = `${Math.round(scaledX1)}-${Math.round(scaledY1)}-${Math.round(scaledX2)}-${Math.round(scaledY2)}`;
          const reverseKey = `${Math.round(scaledX2)}-${Math.round(scaledY2)}-${Math.round(scaledX1)}-${Math.round(scaledY1)}`;
          
          // Skip if this wall already exists
          if (existingWallCoordinates.has(key) || existingWallCoordinates.has(reverseKey)) {
            continue;
          }
          
          // Create a new wall
          const newWall: WallSymbol = {
            id: `wall-${Date.now()}-${i}`,
            type: 'wall',
            x: ((x1 + x2) / 2) / scale,
            y: ((y1 + y2) / 2) / scale,
            rotation: angle,
            size: 30,
            start: { x: scaledX1, y: scaledY1 },
            end: { x: scaledX2, y: scaledY2 },
            thickness: referenceThickness,
            similarToWall: referenceWall.id
          };
          
          detectedWalls.push(newWall);
          existingWallCoordinates.add(key); // Mark as processed
        }
      }
      
      // Clean up OpenCV resources
      src.delete();
      gray.delete();
      blurred.delete();
      threshold.delete();
      edges.delete();
      lines.delete();
      
      console.log(`Created ${detectedWalls.length} similar walls`);
      
      // Add new walls to lastDetectedWalls for redo functionality
      setLastDetectedWalls(prev => [...prev, ...detectedWalls]);
      
      return detectedWalls;
    } catch (error) {
      console.error('Error finding similar walls:', error);
      toast({
        title: "Detection Error",
        description: "An error occurred while finding similar walls"
      });
      return [];
    }
  };
  
  // Handle mouse down for selection start
  const handleSelectionStart = (e: React.MouseEvent) => {
    if (!pdfContainerRef.current || !similarityDetectionMode || isPanning) return;
    
    const container = pdfContainerRef.current;
    const rect = container.getBoundingClientRect();
    
    // Get PDF coordinates
    const x = e.clientX - rect.left - panPosition.x;
    const y = e.clientY - rect.top - panPosition.y;
    
    setIsSelecting(true);
    setSelectionStart({ x, y });
    setSelectionCurrent({ x, y });
    
    // Ensure we have the selection overlay
    const overlay = ensureSelectionOverlay();
    overlay.style.display = 'block';
    overlay.style.left = `${x}px`;
    overlay.style.top = `${y}px`;
    overlay.style.width = '0px';
    overlay.style.height = '0px';
    
    e.preventDefault();
    e.stopPropagation();
  };
  
  // Handle mouse move during selection
  const handleSelectionMove = (e: React.MouseEvent) => {
    if (!isSelecting || !pdfContainerRef.current || !selectionStart || !selectionOverlay) return;
    
    const container = pdfContainerRef.current;
    const rect = container.getBoundingClientRect();
    
    // Get updated position
    const x = e.clientX - rect.left - panPosition.x;
    const y = e.clientY - rect.top - panPosition.y;
    setSelectionCurrent({ x, y });
    
    // Calculate dimensions
    const width = Math.abs(x - selectionStart.x);
    const height = Math.abs(y - selectionStart.y);
    const left = Math.min(selectionStart.x, x);
    const top = Math.min(selectionStart.y, y);
    
    // Update overlay display
    selectionOverlay.style.left = `${left}px`;
    selectionOverlay.style.top = `${top}px`;
    selectionOverlay.style.width = `${width}px`;
    selectionOverlay.style.height = `${height}px`;
    
    e.preventDefault();
    e.stopPropagation();
  };
  
  // Handle mouse up to complete selection
  const handleSelectionEnd = async (e: React.MouseEvent) => {
    if (!isSelecting || !pdfContainerRef.current || !selectionStart || !selectionCurrent) return;
    
    // Calculate selection rectangle in PDF coordinates
    const width = Math.abs(selectionCurrent.x - selectionStart.x);
    const height = Math.abs(selectionCurrent.y - selectionStart.y);
    
    // Only process if selection has reasonable size
    if (width < 10 || height < 10) {
      resetSelection();
      return;
    }
    
    const startX = Math.min(selectionStart.x, selectionCurrent.x);
    const startY = Math.min(selectionStart.y, selectionCurrent.y);
    
    // Convert to original PDF coordinates
    const selectionRect = {
      startX: startX / scale,
      startY: startY / scale,
      width: width / scale, 
      height: height / scale
    };
    
    // Detect walls in the selected area
    const detectedWall = await detectWall(selectionRect);
    
    if (onSimilarWallsDetected && detectedWall) {
      // First detect the initial wall
      onSimilarWallsDetected([detectedWall]);
      
      // Then automatically find and add similar walls
      if (openCVLoaded && window.cv) {
        const similarWalls = findSimilarWalls();
        if (similarWalls && similarWalls.length > 0) {
          // Add the similar walls to the already detected wall
          onSimilarWallsDetected([detectedWall, ...similarWalls]);
          
          toast({
            title: "Walls Detected",
            description: `Detected the selected wall and ${similarWalls.length} additional similar walls.`
          });
        } else {
          toast({
            title: "Wall Detected",
            description: "Detected the selected wall. No similar walls were found."
          });
        }
      } else {
        toast({
          title: "Wall Detected",
          description: "A wall has been placed. OpenCV is not loaded for similar wall detection."
        });
      }
      
      // Exit detection mode after successful detection if the callback exists
      if (onExitDetectionMode) {
        onExitDetectionMode();
      }
    } else {
      toast({
        title: "No Wall Detected",
        description: "Could not detect a wall in the selected area."
      });
    }
    
    // Reset selection state
    resetSelection();
    
    e.preventDefault();
    e.stopPropagation();
  };
  
  // Reset selection state
  const resetSelection = () => {
    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionCurrent(null);
    
    if (selectionOverlay) {
      selectionOverlay.style.display = 'none';
    }
  };
  
  // Custom handler for canvas clicks that handles multiple modes
  const handleCanvasClickCustom = (e: React.MouseEvent) => {
    if (!pdfContainerRef.current) return;
    
    // Check if the click is on buttons, in which case we should not process it
    // Look for parent with className containing "pointer-events-auto"
    let target = e.target as HTMLElement;
    while (target) {
      if (target.classList && 
          (target.classList.contains('pointer-events-auto') || 
           target.tagName === 'BUTTON')) {
        console.log('Click on control element - ignoring for wall detection');
        return;
      }
      target = target.parentElement as HTMLElement;
      if (!target) break;
    }
    
    const container = pdfContainerRef.current;
    const rect = container.getBoundingClientRect();
    
    // Get true PDF coordinates that will be consistent regardless of pan/zoom
    const x = (e.clientX - rect.left - panPosition.x) / scale;
    const y = (e.clientY - rect.top - panPosition.y) / scale;

    // If in similarity detection mode, start area selection
    if (similarityDetectionMode) {
      handleSelectionStart(e);
      return;
    }

    if (drawingWallMode) {
      onWallPointSet(x, y);
    } else if (activeSymbolType && !isPanning) {
      onSymbolPlace(activeSymbolType, x, y);
    }
  };
  
  // Function to clear all walls
  const clearDetectedWalls = () => {
    console.log("Clearing all detected walls");
    if (onSimilarWallsDetected) {
      // Create an empty array to clear all walls
      onSimilarWallsDetected([]);
      setLastDetectedWalls([]); // Also clear the saved walls
      toast({
        title: "Walls Cleared",
        description: "All detected walls have been removed."
      });
    }
  };
  
  // Function to redo the last detection
  const redoWallDetection = () => {
    console.log("Redoing wall detection", lastDetectedWalls);
    if (onSimilarWallsDetected && lastDetectedWalls.length > 0) {
      onSimilarWallsDetected([...lastDetectedWalls]); // Use a copy to ensure state updates
      toast({
        title: "Detection Redone",
        description: `Restored ${lastDetectedWalls.length} previously detected walls.`
      });
    } else {
      toast({
        title: "Nothing to Redo",
        description: "No previous wall detection to restore."
      });
    }
  };
  
  // Function to expose the last detected wall for visualization
  const getLastDetectedWall = (): WallSymbol | null => {
    return lastDetectedWalls.length > 0 ? lastDetectedWalls[lastDetectedWalls.length - 1] : null;
  };
  
  return { 
    handleCanvasClickCustom,
    handleSelectionMove,
    handleSelectionEnd,
    clearDetectedWalls,
    redoWallDetection,
    findSimilarWalls,
    getLastDetectedWall,
    openCVLoaded,
    isSelecting
  };
};
