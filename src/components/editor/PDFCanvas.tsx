
import { useRef, useState, forwardRef, useImperativeHandle, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePDFState } from "@/hooks/usePDFState";
import { PDFCanvasContent } from "./PDFCanvasContent";
import { usePDFCanvasEventHandlers } from "./PDFCanvasEventHandlers";
import { PDFCanvasProps } from "./PDFCanvasProps";
import { useWallDrawing } from "@/hooks/useWallDrawing";
import { usePDFInteractions } from "@/hooks/usePDFInteractions";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EditorSymbol } from "@/types/editor";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const validImageTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    
    if (!validImageTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, or PDF file.",
        variant: "destructive"
      });
      return;
    }
    
    if (file.type === 'application/pdf') {
      // Handle PDF file
      onPDFUpload(file);
    } else {
      // Handle image file (JPG, PNG)
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (!event.target?.result) return;
        
        // Create a new image symbol
        const newSymbol = {
          id: `image-${Date.now()}`,
          type: 'image',
          x: 100,
          y: 100,
          width: 200,
          height: 200,
          src: event.target.result as string,
          rotation: 0,
          draggable: true,
          resizable: true
        };
        
        // Add the new image to symbols
        if (setSymbols) {
          setSymbols([...symbols, newSymbol]);
        }
        
        toast({
          title: "Image added",
          description: "The image has been added to the canvas."
        });
      };
      
      reader.readAsDataURL(file);
    }
    
    // Reset the input so the same file can be uploaded again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept=".jpg,.jpeg,.png,.pdf"
        className="hidden"
      />
      
      <div className="absolute top-4 right-4 z-10">
        <Button 
          variant="secondary"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 bg-white shadow-md"
        >
          <Upload size={16} />
          <span>Upload Image/PDF</span>
        </Button>
      </div>
      
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
        setSymbols={setSymbols}
      />
    </div>
  );
});

PDFCanvas.displayName = 'PDFCanvas';
