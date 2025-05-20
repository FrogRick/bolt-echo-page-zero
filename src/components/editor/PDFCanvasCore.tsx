
import React, { useRef, useState, useEffect } from "react";
import { EditorSymbol, WallSymbol, UnderlaySymbol } from "@/types/editor";
import { useToast } from "@/hooks/use-toast";
import { PDFCursor } from "./PDFCursor";
import { usePDFOpenCVHandler } from "./PDFOpenCVHandler";
import { usePDFCanvasInteractions } from "./PDFCanvasInteractions";

interface PDFCanvasCoreProps {
  pdfFile: File | null;
  scale: number;
  panPosition: { x: number, y: number };
  isPanning: boolean;
  setIsPanning: (isPanning: boolean) => void;
  similarityDetectionMode: boolean;
  drawingWallMode: boolean;
  activeSymbolType: string | null;
  onWallPointSet: (x: number, y: number) => void;
  onSymbolPlace: (type: string, x: number, y: number) => void;
  onSimilarWallsDetected?: (walls: WallSymbol[]) => void;
  symbols: EditorSymbol[];
  onExitDetectionMode?: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onFileUploaded?: (file: File) => void;
}

interface PDFCanvasCoreResult {
  pdfContainerRef: React.RefObject<HTMLDivElement>;
  cursorStyle: string;
  handleCanvasClickCustom: (e: React.MouseEvent) => void;
  handleSelectionMove: (e: React.MouseEvent) => void;
  handleSelectionEnd: (e: React.MouseEvent) => void;
  isSelecting: boolean;
  clearDetectedWalls: () => void;
  redoWallDetection: () => void;
  findSimilarWalls: () => WallSymbol[];
  handleFileUpload: (file: File) => void;
}

export const usePDFCanvasCore = ({
  pdfFile,
  scale,
  panPosition,
  isPanning,
  setIsPanning,
  similarityDetectionMode,
  drawingWallMode,
  activeSymbolType,
  onWallPointSet,
  onSymbolPlace,
  onSimilarWallsDetected,
  symbols,
  onExitDetectionMode,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onFileUploaded
}: PDFCanvasCoreProps): PDFCanvasCoreResult => {
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Add state for detected wall visualization
  const [detectedWall, setDetectedWall] = useState<WallSymbol | null>(null);

  // Use the OpenCV handler
  const { openCVLoaded, isDebugMode } = usePDFOpenCVHandler(pdfContainerRef);

  // Use the PDFCanvasInteractions hook
  const { 
    handleCanvasClickCustom, 
    handleSelectionMove,
    handleSelectionEnd,
    clearDetectedWalls, 
    redoWallDetection,
    findSimilarWalls,
    getLastDetectedWall,
    isSelecting
  } = usePDFCanvasInteractions({
    pdfContainerRef,
    scale,
    panPosition,
    similarityDetectionMode,
    drawingWallMode,
    activeSymbolType,
    isPanning,
    onWallPointSet,
    onSymbolPlace,
    onSimilarWallsDetected: (walls) => {
      // Update detected wall for visualization
      if (walls && walls.length > 0) {
        setDetectedWall(walls[0]);
      } else {
        setDetectedWall(null);
      }
      
      // Also call the original handler
      if (onSimilarWallsDetected) {
        onSimilarWallsDetected(walls);
      }
    },
    symbols,
    toast,
    onExitDetectionMode
  });

  const cursorStyle = PDFCursor({
    similarityDetectionMode,
    drawingWallMode,
    isPanning,
    scale
  });

  // Handle file upload for underlays (PDF, images)
  const handleFileUpload = (file: File) => {
    if (!file) return;

    console.log("PDFCanvasCore - handleFileUpload called with:", file.name, file.type, file.size);

    // Check if it's a PDF or image
    if (file.type === "application/pdf" || file.type.startsWith("image/")) {
      // Show toast notification
      toast({
        title: "File format supported",
        description: `${file.name} will be added to canvas.`,
        variant: "success",
      });
      
      // Call the parent callback if provided
      if (onFileUploaded) {
        console.log("PDFCanvasCore - Calling onFileUploaded callback");
        onFileUploaded(file);
      } else {
        console.warn("PDFCanvasCore - onFileUploaded callback is not provided");
      }
    } else {
      toast({
        title: "Unsupported file",
        description: "Only PDF, JPEG, and PNG files are supported.",
        variant: "destructive",
      });
    }
  };

  // Debug logging for uploaded file
  useEffect(() => {
    console.log("PDFCanvasCore - Current symbols count:", symbols.length);
    console.log("PDFCanvasCore - Underlays count:", symbols.filter(s => s.type === 'underlay').length);
  }, [symbols]);

  useEffect(() => {
    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length === 2 && pdfFile) {
        e.preventDefault();
      }
    };

    const preventScroll = (e: TouchEvent) => {
      if (scale > 1 && pdfFile) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchmove', preventZoom, { passive: false });
    document.addEventListener('touchmove', preventScroll, { passive: false });
    
    return () => {
      document.removeEventListener('touchmove', preventZoom);
      document.removeEventListener('touchmove', preventScroll);
    };
  }, [scale, pdfFile]);

  return {
    pdfContainerRef,
    cursorStyle,
    handleCanvasClickCustom,
    handleSelectionMove,
    handleSelectionEnd,
    isSelecting,
    clearDetectedWalls,
    redoWallDetection,
    findSimilarWalls,
    handleFileUpload
  };
};
