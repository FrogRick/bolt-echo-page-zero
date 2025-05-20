
import { useState, useRef } from "react";
import { PDFSection } from "./PDFSection";
import { EditorSymbol, WallSymbol } from "@/types/editor";
import { useEditorState } from "@/hooks/useEditorState";
import { Toolbar } from "./Toolbar";
import { TopMenu } from "./TopMenu";
import { ExportOptions } from "./ExportOptions";

const Canvas = () => {
  const {
    pdfFile,
    setPdfFile,
    numPages,
    setNumPages,
    pageNumber,
    setPageNumber,
    symbols,
    setSymbols,
    scale,
    setScale,
    selectedSymbol,
    setSelectedSymbol,
    activeSymbolType,
    setActiveSymbolType,
    drawingWallMode,
    setDrawingWallMode,
    wallStartPoint,
    setWallStartPoint,
    layers,
    setLayers,
    similarityDetectionMode,
    setSimilarityDetectionMode,
    wallThickness,
    setWallThickness,
    snapToAngle,
    setSnapToAngle,
    snapToWalls,
    setSnapToWalls,
    currentStage,
    setCurrentStage,
    useManualWalls,
    setUseManualWalls,
    exportSettings,
    setExportSettings
  } = useEditorState();
  
  const pdfRef = useRef(null);
  
  // Handle document load success
  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  // Handle similar walls detected from the PDF
  const handleSimilarWallsDetected = (walls: WallSymbol[]) => {
    if (walls && walls.length > 0) {
      setSymbols(prevSymbols => [...prevSymbols, ...walls]);
      setSimilarityDetectionMode(false);
    }
  };

  // Handle export
  const handleExport = () => {
    console.log("Exporting with settings:", exportSettings);
    // Implement actual export logic here
  };

  return (
    <div className="canvas-container h-full flex flex-col">
      <TopMenu 
        pdfFile={pdfFile}
        numPages={numPages}
        pageNumber={pageNumber}
        setPageNumber={setPageNumber}
        currentStage={currentStage}
        setCurrentStage={setCurrentStage}
      />

      <div className="flex flex-1 overflow-hidden">
        <Toolbar 
          activeSymbolType={activeSymbolType}
          setActiveSymbolType={setActiveSymbolType}
          drawingWallMode={drawingWallMode}
          setDrawingWallMode={setDrawingWallMode}
          similarityDetectionMode={similarityDetectionMode}
          setSimilarityDetectionMode={setSimilarityDetectionMode}
          layers={layers}
          setLayers={setLayers}
          wallThickness={wallThickness}
          setWallThickness={setWallThickness}
          snapToAngle={snapToAngle} 
          setSnapToAngle={setSnapToAngle}
          snapToWalls={snapToWalls}
          setSnapToWalls={setSnapToWalls}
          useManualWalls={useManualWalls}
          setUseManualWalls={setUseManualWalls}
        />

        <div className="flex-1 relative overflow-hidden">
          <PDFSection
            ref={pdfRef}
            pdfFile={pdfFile}
            pageNumber={pageNumber}
            scale={scale}
            setScale={setScale}
            symbols={symbols}
            setSymbols={setSymbols}
            onPDFUpload={setPdfFile}
            onDocumentLoadSuccess={handleDocumentLoadSuccess}
            activeSymbolType={activeSymbolType}
            setActiveSymbolType={setActiveSymbolType}
            selectedSymbol={selectedSymbol}
            setSelectedSymbol={setSelectedSymbol}
            drawingWallMode={drawingWallMode}
            setDrawingWallMode={setDrawingWallMode}
            wallStartPoint={wallStartPoint}
            setWallStartPoint={setWallStartPoint}
            layers={layers}
            setLayers={setLayers}
            similarityDetectionMode={similarityDetectionMode}
            setSimilarityDetectionMode={setSimilarityDetectionMode}
            onSimilarWallsDetected={handleSimilarWallsDetected}
            currentStage={currentStage}
            useManualWalls={useManualWalls}
            setUseManualWalls={setUseManualWalls}
            wallThickness={wallThickness}
            snapToAngle={snapToAngle}
            snapToWalls={snapToWalls}
            hideBackgroundPDF={false}
          />
        </div>

        {/* Right sidebar for properties or export */}
        {exportSettings && (
          <div className="w-80 border-l border-gray-200 p-4 overflow-y-auto">
            <ExportOptions
              pdfFile={pdfFile}
              symbols={symbols}
              project={null}
              exportSettings={exportSettings}
              setExportSettings={setExportSettings}
              onExport={handleExport}
              customLogoAllowed={true}
              qrCodeAllowed={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Canvas;
