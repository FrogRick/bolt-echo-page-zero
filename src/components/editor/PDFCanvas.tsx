
import { useRef, useState, forwardRef, useImperativeHandle, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePDFState } from "@/hooks/usePDFState";
import { PDFCanvasContent } from "./PDFCanvasContent";
import { usePDFCanvasEventHandlers } from "./PDFCanvasEventHandlers";
import { PDFCanvasProps } from "./PDFCanvasProps";
import { useWallDrawing } from "@/hooks/useWallDrawing";
import { usePDFInteractions } from "@/hooks/usePDFInteractions";

const MIN_SCALE = 1.0;
const MAX_SCALE = 3.0;

export const PDFCanvas = forwardRef<any, PDFCanvasProps>(({
  pdfFile,
  symbols,
  activeSymbolType,
  onPDFUpload,
  onDocumentLoadSuccess,
  onSymbolPlace,
  onSymbolDragEnd,
  onSymbolSelect,
  onSymbolDelete,
  pageNumber,
  scale,
  onZoomIn,
  onZoomOut,
  setScale,
  drawingWallMode,
  wallStartPoint,
  onWallPointSet,
  similarityDetectionMode = false,
  onSimilarWallsDetected,
  onSimilarityModeToggle,
  layers = [],
  hideBackgroundPDF = false,
  currentStage,
  useManualWalls = false,
  wallThickness = 5,
  onWallThicknessChange,
  snapToAngle = true,
  onSnapToAngleToggle,
  snapToWalls = true,
  onSnapToWallsToggle,
  setSymbols
}, ref) => {
  const isMobile = useIsMobile();
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  
  // Use PDF state hook
  const {
    isDragging,
    setIsDragging,
    draggedSymbol,
    setDraggedSymbol,
    panPosition,
    setPanPosition,
    isPanning,
    setIsPanning,
    lastMousePosition,
    setLastMousePosition,
    pdfError,
    setPdfError
  } = usePDFState(scale);

  // Use our wall drawing hook
  const wallDrawing = useWallDrawing({
    symbols,
    setSymbols,
    scale,
    wallThickness,
    snapToAngle,
    snapToWalls
  });

  // Use PDF interactions hook for more advanced interactions
  const interactions = usePDFInteractions({
    pdfContainerRef,
    scale,
    panPosition,
    setPanPosition,
    isDragging,
    setIsDragging,
    draggedSymbol,
    setDraggedSymbol,
    isPanning,
    setIsPanning,
    lastMousePosition,
    setLastMousePosition,
    activeSymbolType,
    onSymbolPlace,
    onSymbolDragEnd,
    setScale,
    minScale: MIN_SCALE,
    maxScale: MAX_SCALE,
    drawingWallMode,
    onWallPointSet
  });

  // Update wall drawing mode when prop changes
  useEffect(() => {
    wallDrawing.toggleWallDrawingMode(drawingWallMode);
  }, [drawingWallMode, wallDrawing]);

  // Determine cursor style based on current mode
  const getCursorStyle = () => {
    if (drawingWallMode) return "crosshair";
    if (isPanning) return "grabbing";
    if (activeSymbolType) return "copy";
    if (scale > 1) return "grab";
    return "default";
  };
  
  const cursorStyle = getCursorStyle();

  // Handle direct canvas click for wall drawing
  const handleDirectCanvasClick = (e: React.MouseEvent) => {
    if (!pdfContainerRef.current) return;
    
    const container = pdfContainerRef.current;
    const rect = container.getBoundingClientRect();
    
    // Calculate coordinates relative to the canvas, accounting for scaling and panning
    const x = (e.clientX - rect.left - panPosition.x) / scale;
    const y = (e.clientY - rect.top - panPosition.y) / scale;
    
    console.log("Direct canvas click:", { x, y, drawingWallMode, activeSymbolType });
    
    if (drawingWallMode) {
      e.preventDefault();
      e.stopPropagation();
      wallDrawing.handleCanvasClick(x, y);
      return;
    }
    
    // Handle symbol placement if not drawing walls
    if (activeSymbolType && onSymbolPlace) {
      onSymbolPlace(activeSymbolType, x, y);
    }
  };

  // Use our event handlers for other interactions
  const {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handlePDFUpload
  } = usePDFCanvasEventHandlers({
    pdfContainerRef,
    scale,
    panPosition,
    setPanPosition,
    isDragging,
    setIsDragging,
    draggedSymbol,
    setDraggedSymbol,
    isPanning,
    setIsPanning,
    lastMousePosition,
    setLastMousePosition,
    activeSymbolType,
    onSymbolPlace,
    onSymbolDragEnd,
    setScale,
    onZoomIn,
    onZoomOut,
    pdfFile,
    similarityDetectionMode,
    drawingWallMode,
    onWallPointSet
  });

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    pdfContainerRef
  }));

  // Prevent browser zoom on canvas
  useEffect(() => {
    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1 && pdfContainerRef.current?.contains(e.target as Node)) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchmove', preventZoom, { passive: false });
    
    return () => {
      document.removeEventListener('touchmove', preventZoom);
    };
  }, []);

  return (
    <div 
      className="pdf-canvas-container relative h-full w-full overflow-hidden"
      ref={pdfContainerRef}
      onClick={handleDirectCanvasClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{ 
        cursor: cursorStyle,
        touchAction: 'none',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      <PDFCanvasContent
        pdfFile={pdfFile}
        symbols={symbols}
        activeSymbolType={activeSymbolType}
        onPDFUpload={(file) => {
          setPdfError(null);
          onPDFUpload(file);
          handlePDFUpload(file);
        }}
        onDocumentLoadSuccess={onDocumentLoadSuccess}
        onSymbolPlace={onSymbolPlace}
        onSymbolDragEnd={onSymbolDragEnd}
        onSymbolSelect={onSymbolSelect}
        onSymbolDelete={onSymbolDelete}
        pageNumber={pageNumber}
        scale={scale}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        setScale={setScale}
        drawingWallMode={drawingWallMode}
        wallStartPoint={wallStartPoint}
        onWallPointSet={wallDrawing.handleCanvasClick}
        similarityDetectionMode={similarityDetectionMode}
        onSimilarWallsDetected={onSimilarWallsDetected}
        onSimilarityModeToggle={onSimilarityModeToggle}
        layers={layers}
        hideBackgroundPDF={hideBackgroundPDF}
        currentStage={currentStage}
        useManualWalls={useManualWalls}
        wallThickness={wallThickness}
        onWallThicknessChange={onWallThicknessChange}
        snapToAngle={snapToAngle}
        onSnapToAngleToggle={onSnapToAngleToggle}
        snapToWalls={snapToWalls}
        onSnapToWallsToggle={onSnapToWallsToggle}
        pdfContainerRef={pdfContainerRef}
        handleCanvasClickCustom={handleDirectCanvasClick}
        handleMouseDown={handleMouseDown}
        handleMouseMove={handleMouseMove}
        handleMouseUp={handleMouseUp}
        handleTouchStart={handleTouchStart}
        handleTouchMove={handleTouchMove}
        handleTouchEnd={handleTouchEnd}
        cursorStyle={cursorStyle}
        isDragging={isDragging}
        draggedSymbol={draggedSymbol}
        panPosition={panPosition}
        isPanning={isPanning}
        showDetectionHint={false}
        pdfError={pdfError}
        setPdfError={setPdfError}
        setSymbols={setSymbols}  // Pass this through to inner components
      />
    </div>
  );
});

PDFCanvas.displayName = 'PDFCanvas';
