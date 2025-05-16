
import React, { forwardRef } from "react";
import { PDFCanvas } from "./PDFCanvas";
import { EditorSymbol, WallSymbol } from "@/types/editor";
import { Layer } from "@/hooks/useEditorState";
import { WorkflowStage } from "./WorkflowSteps";

interface PDFSectionProps {
  pdfFile: File | null;
  pageNumber: number;
  scale: number;
  setScale: (scale: number) => void;
  symbols: EditorSymbol[];
  setSymbols: (symbols: EditorSymbol[]) => void;
  onPDFUpload: (file: File) => void;
  onDocumentLoadSuccess: ({ numPages }: { numPages: number }) => void;
  activeSymbolType: string | null;
  setActiveSymbolType: (type: string | null) => void;
  selectedSymbol: EditorSymbol | null;
  setSelectedSymbol: (symbol: EditorSymbol | null) => void;
  drawingWallMode: boolean;
  setDrawingWallMode: (mode: boolean) => void;
  wallStartPoint: {x: number, y: number} | null;
  setWallStartPoint: (point: {x: number, y: number} | null) => void;
  layers?: Layer[];
  setLayers?: (layers: Layer[]) => void;
  similarityDetectionMode?: boolean;
  setSimilarityDetectionMode?: (enabled: boolean) => void;
  onSimilarWallsDetected?: (walls: WallSymbol[]) => void;
  currentStage?: WorkflowStage;
  useManualWalls?: boolean;
  setUseManualWalls?: (use: boolean) => void;
  wallThickness?: number;
  snapToAngle?: boolean;
  snapToWalls?: boolean;
  hideBackgroundPDF?: boolean;
}

export const PDFSection = forwardRef<any, PDFSectionProps>((props, ref) => {
  // Handle zoom functionality
  const handleZoomIn = () => {
    props.setScale(Math.min(props.scale + 0.1, 3.0));
  };

  const handleZoomOut = () => {
    props.setScale(Math.max(props.scale - 0.1, 1.0));
  };

  // Handle symbol operations
  const handleSymbolPlace = (type: string, x: number, y: number) => {
    // Create a new symbol
    const newSymbol: EditorSymbol = {
      id: crypto.randomUUID(),
      type,
      x,
      y,
      rotation: 0,
      size: 30
    };
    
    props.setSymbols([...props.symbols, newSymbol]);
  };

  const handleSymbolDragEnd = (symbolId: string, x: number, y: number) => {
    const updatedSymbols = props.symbols.map(symbol => 
      symbol.id === symbolId ? { ...symbol, x, y } : symbol
    );
    props.setSymbols(updatedSymbols);
  };

  const handleSymbolSelect = (symbol: EditorSymbol) => {
    props.setSelectedSymbol(symbol);
  };

  const handleSymbolDelete = (symbolId: string) => {
    const updatedSymbols = props.symbols.filter(symbol => symbol.id !== symbolId);
    props.setSymbols(updatedSymbols);
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-gray-100 relative overflow-hidden">
      <div className="flex-1 w-full flex items-center justify-center">
        <PDFCanvas
          ref={ref}
          pdfFile={props.pdfFile}
          symbols={props.symbols}
          activeSymbolType={props.activeSymbolType}
          onPDFUpload={props.onPDFUpload}
          onDocumentLoadSuccess={props.onDocumentLoadSuccess}
          onSymbolPlace={handleSymbolPlace}
          onSymbolDragEnd={handleSymbolDragEnd}
          onSymbolSelect={handleSymbolSelect}
          onSymbolDelete={handleSymbolDelete}
          pageNumber={props.pageNumber || 1}
          scale={props.scale}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          setScale={props.setScale}
          drawingWallMode={props.drawingWallMode}
          wallStartPoint={props.wallStartPoint}
          onWallPointSet={(x, y) => {
            if (!props.wallStartPoint) {
              props.setWallStartPoint({ x, y });
            } else {
              // Create wall logic (handled in parent component)
              props.setWallStartPoint(null);
            }
          }}
          similarityDetectionMode={props.similarityDetectionMode}
          onSimilarWallsDetected={props.onSimilarWallsDetected}
          onSimilarityModeToggle={props.setSimilarityDetectionMode}
          layers={props.layers}
          hideBackgroundPDF={props.hideBackgroundPDF}
          currentStage={props.currentStage}
          useManualWalls={props.useManualWalls}
          wallThickness={props.wallThickness}
          snapToAngle={props.snapToAngle}
          snapToWalls={props.snapToWalls}
          setSymbols={props.setSymbols}
        />
      </div>
    </div>
  );
});

PDFSection.displayName = "PDFSection";
