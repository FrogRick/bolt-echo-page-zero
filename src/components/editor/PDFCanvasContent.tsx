
import React, { useEffect } from "react";
import { PDFCanvasProps } from "./PDFCanvasProps";
import PDFUploader from "@/components/editor/PDFUploader";
import { PDFViewer } from "./PDFViewer";
import { PDFOverlays } from "./PDFOverlays";
import { PDFTouchHandlers } from "./PDFTouchHandlers";
import { PDFZoomHandler } from "./PDFZoomHandler";
import { EditorSymbol } from "@/types/editor";
import { useToast } from "@/hooks/use-toast";

interface PDFCanvasContentProps extends PDFCanvasProps {
  pdfContainerRef: React.RefObject<HTMLDivElement>;
  handleCanvasClickCustom: (e: React.MouseEvent) => void;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: (e: React.MouseEvent) => void;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: (e: React.TouchEvent) => void;
  cursorStyle: string;
  isDragging: boolean;
  draggedSymbol: { id: string; initialX: number; initialY: number } | null;
  panPosition: { x: number, y: number };
  isPanning: boolean;
  showDetectionHint: boolean;
  pdfError: string | null;
  setPdfError: (error: string | null) => void;
  similarityDetectionMode: boolean;
  onFileUploaded?: (file: File) => void;
}

export const PDFCanvasContent: React.FC<PDFCanvasContentProps> = ({
  pdfFile,
  symbols,
  activeSymbolType,
  onPDFUpload,
  onDocumentLoadSuccess,
  onSymbolSelect,
  onSymbolDelete,
  pageNumber,
  scale,
  layers = [],
  hideBackgroundPDF,
  pdfContainerRef,
  handleCanvasClickCustom,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleTouchStart, 
  handleTouchMove,
  handleTouchEnd,
  cursorStyle,
  isDragging,
  draggedSymbol,
  panPosition,
  isPanning,
  showDetectionHint,
  pdfError,
  setPdfError,
  similarityDetectionMode,
  onFileUploaded,
  setSymbols
}) => {
  const { toast } = useToast();
  
  const handleDocumentLoadError = (error: Error) => {
    console.error("❌ PDF load error:", error);
    setPdfError("Failed to load PDF. Please try a different file.");
  };

  // Debug symbol count
  useEffect(() => {
    console.log(`📊 PDFCanvasContent - Total symbols: ${symbols.length}, Underlays: ${symbols.filter(s => s.type === 'underlay').length}`);
  }, [symbols]);

  const handleFileUpload = (file: File) => {
    console.log("🚀 PDFCanvasContent - handleFileUpload called with:", file.name, file.type, file.size);
    
    // Track if this is triggered through the console
    console.trace("🔍 PDFCanvasContent - Upload file trace:");
    
    try {
      // Handle as main PDF
      console.log("📄 PDFCanvasContent - Calling onPDFUpload with file:", file.name);
      onPDFUpload(file);
      
      // Also handle as underlay if needed
      if (onFileUploaded && (file.type === "application/pdf" || file.type.startsWith("image/"))) {
        console.log("🖼️ PDFCanvasContent - Forwarding to onFileUploaded for underlay creation");
        onFileUploaded(file);
        
        toast({
          title: "File uploaded",
          description: `${file.name} has been added to the canvas`,
        });
        
        // Add more verbose logging to track the process
        console.log("📈 PDFCanvasContent - After initiating onFileUploaded - Current symbols count:", 
          symbols.length, "File details:", file.name, file.type, file.size);
        
        // Check if the symbols array gets updated after a delay
        setTimeout(() => {
          console.log("⏱️ PDFCanvasContent - After onFileUploaded delay - Symbols count:", symbols.length, 
            "Underlays:", symbols.filter(s => s.type === 'underlay').length);
          
          if (symbols.filter(s => s.type === 'underlay').length === 0) {
            console.warn("⚠️ PDFCanvasContent - No underlays found after upload");
          }
        }, 1000);
      }
    } catch (error) {
      console.error("❌ PDFCanvasContent - Error in handleFileUpload:", error);
      setPdfError(`Failed to upload file: ${error instanceof Error ? error.message : "Unknown error"}`);
      
      toast({
        title: "Upload error",
        description: "There was a problem processing your file",
        variant: "destructive"
      });
    }
  };

  // Add a useEffect to monitor pdfFile changes
  useEffect(() => {
    if (pdfFile) {
      console.log("📄 PDFCanvasContent - PDF file changed:", pdfFile.name, pdfFile.type, pdfFile.size);
    }
  }, [pdfFile]);

  if (!pdfFile) {
    console.log("📁 PDFCanvasContent - No PDF file, showing uploader");
    return (
      <div className="flex items-center justify-center h-full border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
        <PDFUploader onUpload={handleFileUpload} />
      </div>
    );
  }
  
  console.log("🔍 PDFCanvasContent - Rendering with PDF file:", pdfFile.name, pdfFile.type);

  return (
    <>
      {/* Overlays for notifications and errors */}
      <PDFOverlays 
        similarityDetectionMode={similarityDetectionMode}
        showDetectionHint={showDetectionHint}
        pdfError={pdfError}
        setPdfError={setPdfError}
        onPDFUpload={onPDFUpload}
      />
      
      {/* Wall Selection Instructions - only show during active detection */}
      {similarityDetectionMode && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[100] bg-white px-4 py-2 rounded-md shadow-md pointer-events-auto">
          <p className="text-sm font-medium text-blue-700">
            Select an area containing a wall to detect it
          </p>
        </div>
      )}
      
      {/* Touch event handlers */}
      <PDFTouchHandlers
        handleTouchStart={handleTouchStart}
        handleTouchMove={handleTouchMove}
        handleTouchEnd={handleTouchEnd}
        scale={scale}
        pdfFile={pdfFile}
      />
      
      {/* Zoom handler */}
      <PDFZoomHandler
        containerRef={pdfContainerRef}
        scale={scale}
        setScale={() => {}} // This is handled at a higher level
        minScale={1.0}
        maxScale={3.0}
      />
      
      {/* PDF renderer with symbols */}
      <PDFViewer
        pdfFile={pdfFile}
        pageNumber={pageNumber}
        scale={scale}
        symbols={symbols}
        isDragging={isDragging}
        draggedSymbolId={draggedSymbol?.id || null}
        containerRef={pdfContainerRef}
        onDocumentLoadSuccess={(data) => {
          console.log("✅ PDFCanvasContent - Document load success:", data);
          onDocumentLoadSuccess(data);
        }}
        onDocumentLoadError={handleDocumentLoadError}
        onSymbolMouseDown={handleMouseDown}
        onSymbolSelect={onSymbolSelect}
        onSymbolDelete={onSymbolDelete}
        panPosition={panPosition}
        isPanning={isPanning}
        layers={layers}
        hideBackgroundPDF={hideBackgroundPDF}
      />
    </>
  );
};
