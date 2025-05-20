
import { useRef, useState, forwardRef, useImperativeHandle, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePDFState } from "@/hooks/usePDFState";
import { PDFCanvasContent } from "./PDFCanvasContent";
import { usePDFCanvasEventHandlers } from "./PDFCanvasEventHandlers";
import { PDFCanvasProps } from "./PDFCanvasProps";
import { useWallDrawing } from "@/hooks/useWallDrawing";
import { usePDFInteractions } from "@/hooks/usePDFInteractions";
import { usePDFCanvasCore } from "./PDFCanvasCore";
import { UnderlaySymbol, EditorSymbol } from "@/types/editor";

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

  // Use our PDF canvas event handlers
  const {
    handleCanvasClick,
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

  // Handle file upload for underlays (PDF, images)
  const handleFileUploadForUnderlay = (file: File) => {
    if (!file) return;

    // Create a URL for the file
    const fileUrl = URL.createObjectURL(file);
    
    // Default dimensions
    const defaultWidth = 300;
    const defaultHeight = 400;
    
    // Create a new underlay symbol
    const newUnderlay: UnderlaySymbol = {
      id: crypto.randomUUID(),
      type: 'underlay',
      x: 50,
      y: 50,
      rotation: 0,
      size: 1,  // Scale factor
      width: defaultWidth,
      height: defaultHeight,
      src: fileUrl,
      contentType: file.type,
      draggable: true,
      resizable: true
    };
    
    // Add the underlay to symbols
    if (setSymbols) {
      setSymbols(prevSymbols => [...prevSymbols, newUnderlay]);
    }
  };

  // Use our PDF canvas core hook
  const {
    cursorStyle,
    handleCanvasClickCustom,
    handleSelectionMove,
    handleSelectionEnd,
    isSelecting,
    clearDetectedWalls,
    redoWallDetection,
    findSimilarWalls,
    handleFileUpload
  } = usePDFCanvasCore({
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
    onExitDetectionMode: () => onSimilarityModeToggle && onSimilarityModeToggle(false),
    onCanvasClick: handleCanvasClick,
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
    onFileUploaded: handleFileUploadForUnderlay
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

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    pdfContainerRef,
    handleFileUpload
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
        handleCanvasClickCustom={handleCanvasClickCustom}
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
        setSymbols={setSymbols}
        onFileUploaded={handleFileUploadForUnderlay}
      />

      {/* Add file upload button for PDF/Image underlays */}
      <div className="absolute bottom-4 right-4 z-50">
        <label 
          htmlFor="underlay-upload" 
          className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload Image/PDF
        </label>
        <input 
          id="underlay-upload" 
          type="file" 
          className="hidden" 
          accept="application/pdf,image/jpeg,image/png"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
        />
      </div>
    </div>
  );
});

PDFCanvas.displayName = 'PDFCanvas';

