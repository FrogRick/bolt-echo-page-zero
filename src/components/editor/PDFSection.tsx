import React, { forwardRef } from "react";
import { EditorSymbol } from "@/types/editor";
import { Card, CardContent } from "@/components/ui/card";
import { PDFCanvas } from "./PDFCanvas";
import { ZoomControls } from "./ZoomControls";
import { Layer } from "@/hooks/useEditorState";
import PDFUploader from "./PDFUploader";

interface PDFSectionProps {
  pdfFile: File | null;
  symbols: EditorSymbol[];
  setSymbols: (symbols: EditorSymbol[]) => void; // Add setSymbols to interface
  activeSymbolType: string | null;
  scale: number;
  setScale: (scale: number) => void;
  pageNumber: number;
  onPDFUpload: (file: File) => void;
  onDocumentLoadSuccess: ({ numPages }: { numPages: number }) => void;
  onSymbolPlace: (type: string, x: number, y: number) => void;
  onSymbolDragEnd: (symbolId: string, x: number, y: number) => void;
  onSymbolSelect: (symbol: EditorSymbol) => void;
  onSymbolDelete: (symbolId: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  drawingWallMode: boolean;
  onDrawingWallModeToggle: (enabled: boolean) => void;
  wallStartPoint: {x: number, y: number} | null;
  onWallPointSet: (x: number, y: number) => void;
  layers?: Layer[];
  hideBackgroundPDF?: boolean;
  currentStage?: string;
  useManualWalls?: boolean;
  wallThickness?: number;
  onWallThicknessChange?: (thickness: number) => void;
  snapToAngle?: boolean;
  onSnapToAngleToggle?: (enabled: boolean) => void;
  snapToWalls?: boolean;
  onSnapToWallsToggle?: (enabled: boolean) => void;
}

export const PDFSection = forwardRef<any, PDFSectionProps>(({
  pdfFile,
  symbols,
  setSymbols, // Add setSymbols param
  activeSymbolType,
  scale,
  setScale,
  pageNumber,
  onPDFUpload,
  onDocumentLoadSuccess,
  onSymbolPlace,
  onSymbolDragEnd,
  onSymbolSelect,
  onSymbolDelete,
  onZoomIn,
  onZoomOut,
  drawingWallMode,
  onDrawingWallModeToggle,
  wallStartPoint,
  onWallPointSet,
  layers = [],
  hideBackgroundPDF = false,
  currentStage,
  useManualWalls = false,
  wallThickness = 5,
  onWallThicknessChange,
  snapToAngle = true,
  onSnapToAngleToggle,
  snapToWalls = true,
  onSnapToWallsToggle
}, ref) => {
  // Determine if we should hide the PDF background
  // Hide when using manual walls and we're past the draw_walls stage
  const shouldHidePDF = useManualWalls && 
    (currentStage === 'place_symbols' || currentStage === 'review' || currentStage === 'export');

  return (
    <Card className="relative h-full flex flex-col">
      <CardContent className="p-4 flex-1 flex flex-col min-h-[500px]">
        <div className="flex-1 relative min-h-[500px]">
          {pdfFile ? (
            <PDFCanvas
              ref={ref}
              pdfFile={pdfFile}
              symbols={symbols}
              setSymbols={setSymbols}
              activeSymbolType={activeSymbolType}
              onPDFUpload={onPDFUpload}
              onDocumentLoadSuccess={onDocumentLoadSuccess}
              onSymbolPlace={onSymbolPlace}
              onSymbolDragEnd={onSymbolDragEnd}
              onSymbolSelect={onSymbolSelect}
              onSymbolDelete={onSymbolDelete}
              pageNumber={pageNumber}
              scale={scale}
              setScale={setScale}
              onZoomIn={onZoomIn}
              onZoomOut={onZoomOut}
              drawingWallMode={drawingWallMode}
              wallStartPoint={wallStartPoint}
              onWallPointSet={onWallPointSet}
              layers={layers}
              hideBackgroundPDF={shouldHidePDF || hideBackgroundPDF}
              currentStage={currentStage}
              useManualWalls={useManualWalls}
              wallThickness={wallThickness}
              onWallThicknessChange={onWallThicknessChange}
              snapToAngle={snapToAngle}
              onSnapToAngleToggle={onSnapToAngleToggle}
              snapToWalls={snapToWalls}
              onSnapToWallsToggle={onSnapToWallsToggle}
            />
          ) : (
            <PDFUploader onUpload={onPDFUpload} multipleUploads={true} />
          )}
        </div>
        
        <div className="absolute bottom-4 right-4 z-10">
          <ZoomControls
            scale={scale}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            minScale={0.5}
            maxScale={3.0}
          />
        </div>
      </CardContent>
    </Card>
  );
});

PDFSection.displayName = "PDFSection";
