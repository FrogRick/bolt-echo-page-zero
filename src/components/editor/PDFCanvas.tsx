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
import { useToast } from "@/hooks/use-toast";

const MIN_SCALE = 1.0;
const MAX_SCALE = 3.0;

// Forward ref without named export
const PDFCanvas = forwardRef<any, PDFCanvasProps>(({
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
  const { toast } = useToast();
  
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

  // Handle file upload for underlays (PDF, images)
  const handleFileUploadForUnderlay = (file: File) => {
    if (!file) {
      console.log("PDFCanvas - handleFileUploadForUnderlay called with no file");
      return;
    }

    console.log("🔄 PDFCanvas - handleFileUploadForUnderlay called with:", file.name, file.type, file.size);
    console.trace("🔍 PDFCanvas - Upload trace:");
    
    try {
      // Create a URL for the file
      const fileUrl = URL.createObjectURL(file);
      console.log("PDFCanvas - Created file URL:", fileUrl);
      
      // Default dimensions - make them larger for better visibility
      const defaultWidth = 500;
      const defaultHeight = 600;
      
      // Create a new underlay symbol
      const newUnderlay = {
        id: crypto.randomUUID(),
        type: 'underlay',
        x: 100,  // Position more centrally
        y: 100,  // Position more centrally
        rotation: 0,
        size: 1,  // Scale factor
        width: defaultWidth,
        height: defaultHeight,
        src: fileUrl,
        contentType: file.type,
        draggable: true,
        resizable: true
      };
      
      console.log("✨ PDFCanvas - Created new underlay:", newUnderlay);
      
      // Add the underlay to symbols
      setSymbols(prevSymbols => {
        const updatedSymbols = [...prevSymbols, newUnderlay];
        console.log("📊 PDFCanvas - Updated symbols array:", updatedSymbols.length, "items including underlays:", updatedSymbols.filter(s => s.type === 'underlay').length);
        return updatedSymbols;
      });
      
      // Verify in the console immediately after state update
      console.log("🔍 PDFCanvas - Current symbols state after update attempt:", symbols);
      
      // Also log after a delay to check if state is updated
      setTimeout(() => {
        console.log("⏱️ PDFCanvas - After setSymbols delay - Symbols count:", symbols.length, 
          "Underlays:", symbols.filter(s => s.type === 'underlay').length);
      }, 500);
      
      // Show success toast
      toast({
        title: "Underlay added",
        description: `${file.name} has been added to the canvas`,
        variant: "success"
      });
    } catch (error) {
      console.error("❌ PDFCanvas - Error in handleFileUploadForUnderlay:", error);
      toast({
        title: "Upload failed",
        description: "There was an error adding your file to the canvas",
        variant: "destructive"
      });
    }
  };

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

  // Handle direct canvas click for wall drawing or symbol placement
  const handleDirectCanvasClick = (e: React.MouseEvent) => {
    if (!pdfContainerRef.current) return;
    
    const container = pdfContainerRef.current;
    const rect = container.getBoundingClientRect();
    
    // Calculate coordinates relative to the canvas, accounting for scaling and panning
    const x = (e.clientX - rect.left - panPosition.x) / scale;
    const y = (e.clientY - rect.top - panPosition.y) / scale;
    
    console.log("PDFCanvas - Direct canvas click:", { x, y, drawingWallMode, activeSymbolType });
    
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

  // Debug logging for symbols to check if underlays are present
  useEffect(() => {
    const underlays = symbols.filter(s => s.type === 'underlay');
    console.log("PDFCanvas - Symbols array length:", symbols.length);
    if (underlays.length > 0) {
      console.log("PDFCanvas - Current underlays:", underlays.length, underlays);
    } else {
      console.log("PDFCanvas - No underlays found in symbols array");
    }
  }, [symbols]);

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
          console.log("PDFCanvas - PDF upload triggered with file:", file.name, file.type, file.size);
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
          onClick={() => console.log("🖱️ PDFCanvas - Add Image button clicked")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Add Image
        </label>
        <input 
          id="underlay-upload" 
          type="file" 
          className="hidden" 
          accept="application/pdf,image/jpeg,image/png"
          onChange={(e) => {
            console.log("🖱️ PDFCanvas - File input change event triggered");
            if (e.target.files?.[0]) {
              const file = e.target.files[0];
              console.log("📄 PDFCanvas - File selected from input:", file.name, file.type, file.size);
              handleFileUploadForUnderlay(file);
              
              // Reset the input so it can be used again for the same file
              e.target.value = '';
            } else {
              console.log("⚠️ PDFCanvas - No file selected from file input");
            }
          }}
        />
      </div>
    </div>
  );
});

// Set display name
PDFCanvas.displayName = 'PDFCanvas';

// Single export statement at the end
export { PDFCanvas };
