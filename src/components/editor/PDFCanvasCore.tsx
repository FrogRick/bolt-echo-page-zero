
import React, { useRef, useState, useEffect } from "react";
import { EditorSymbol, WallSymbol } from "@/types/editor";
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
  onCanvasClick: (e: React.MouseEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
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
  handleImageUpload?: (file: File) => void;
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
  onCanvasClick,
  onMouseDown,
  onMouseMove,
  onMouseUp
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

  // Handle image upload
  const handleImageUpload = (file: File) => {
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a valid image file (JPG or PNG).",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        // Image loaded successfully
        toast({
          title: "Image uploaded",
          description: "You can now place and position the image on the canvas."
        });
      }
    };
    reader.readAsDataURL(file);
  };

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
    handleImageUpload
  };
};
