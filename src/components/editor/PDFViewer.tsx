
import { Document, Page } from "react-pdf";
import { PDFSymbols } from "./PDFSymbols";
import { VectorElements } from "./VectorElements";
import { EditorSymbol, UnderlaySymbol } from "@/types/editor";
import { useEffect, useState } from "react";
import { Layer } from "@/hooks/useEditorState";

interface PDFViewerProps {
  pdfFile: File;
  pageNumber: number;
  scale: number;
  symbols: EditorSymbol[];
  isDragging: boolean;
  draggedSymbolId: string | null;
  containerRef: React.RefObject<HTMLDivElement>;
  onDocumentLoadSuccess: ({ numPages }: { numPages: number }) => void;
  onDocumentLoadError: (error: Error) => void;
  onSymbolMouseDown: (e: React.MouseEvent, symbol: EditorSymbol) => void;
  onSymbolSelect: (symbol: EditorSymbol) => void;
  onSymbolDelete: (symbolId: string) => void;
  panPosition: { x: number; y: number };
  isPanning: boolean;
  layers?: Layer[];
  hideBackgroundPDF?: boolean;
}

export const PDFViewer = ({
  pdfFile,
  pageNumber,
  scale,
  symbols,
  isDragging,
  draggedSymbolId,
  containerRef,
  onDocumentLoadSuccess,
  onDocumentLoadError,
  onSymbolMouseDown,
  onSymbolSelect,
  onSymbolDelete,
  panPosition,
  isPanning,
  layers = [],
  hideBackgroundPDF = false
}: PDFViewerProps) => {
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 });
  const [pageLoaded, setPageLoaded] = useState(false);

  // Function to calculate appropriate dimensions to fit PDF
  const calculateDimensions = () => {
    if (!containerRef.current || !pageLoaded) return;
    
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Calculate scale factor to fit PDF within container
    // Using 0.9 as a factor to leave some margin
    const widthRatio = (containerWidth * 0.9) / pdfDimensions.width;
    const heightRatio = (containerHeight * 0.9) / pdfDimensions.height;
    
    // Use the smaller ratio to ensure PDF fits both horizontally and vertically
    const fitScale = Math.min(widthRatio, heightRatio);
    
    return {
      width: pdfDimensions.width * fitScale * scale,
      height: pdfDimensions.height * fitScale * scale
    };
  };
  
  const dimensions = calculateDimensions();

  // Handle when a page is rendered successfully
  const handlePageLoadSuccess = (page: any) => {
    const { width, height } = page.getViewport({ scale: 1 });
    setPdfDimensions({ width, height });
    setPageLoaded(true);
  };

  // Find visibility of layers
  const isLayerVisible = (type: string): boolean => {
    if (layers.length === 0) return true; // If no layers defined, show everything
    
    const layerId = type === 'wall' || type === 'door' || type === 'stairs' ? 'building' : 'evacuation';
    const layer = layers.find(l => l.id === layerId);
    return layer ? layer.visible : true;
  };

  // Filter symbols based on layer visibility
  const visibleSymbols = symbols.filter(symbol => {
    // Always show underlays regardless of layer
    if (symbol.type === 'underlay') return true;
    
    if (symbol.type === 'wall' || symbol.type === 'door' || symbol.type === 'stairs' || symbol.type === 'window') {
      return isLayerVisible('building');
    } else {
      return isLayerVisible('evacuation');
    }
  });

  // Separate the symbols into regular symbols, vector symbols, and underlays
  const regularSymbols = visibleSymbols.filter(s => 
    !['wall', 'door', 'stairs', 'window', 'underlay'].includes(s.type) || 
    (!('start' in s) && !('width' in s))
  );
  
  const vectorSymbols = visibleSymbols.filter(s => 
    ['wall', 'door', 'stairs', 'window'].includes(s.type) && 
    (('start' in s) || ('width' in s))
  );

  const underlaySymbols = visibleSymbols.filter(s => 
    s.type === 'underlay'
  ) as UnderlaySymbol[];

  // Debug underlays
  useEffect(() => {
    console.log("PDFViewer - All symbols length:", symbols.length);
    console.log("PDFViewer - visibleSymbols length:", visibleSymbols.length);
    console.log("PDFViewer - underlaySymbols length:", underlaySymbols.length);
    if (underlaySymbols.length > 0) {
      console.log("PDFViewer - Rendering underlays:", underlaySymbols);
    } else {
      console.log("PDFViewer - No underlays to render");
    }
  }, [underlaySymbols, symbols, visibleSymbols]);

  // Update dimensions on window resize
  useEffect(() => {
    const handleResize = () => {
      if (pageLoaded && containerRef.current) {
        // Force re-calculation of dimensions
        setPdfDimensions(prev => ({...prev}));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pageLoaded, containerRef]);

  return (
    <div 
      style={{ 
        transform: `translate(${panPosition.x}px, ${panPosition.y}px)`,
        transition: isPanning ? 'none' : 'transform 0.1s ease-out',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        height: '100%',
        width: '100%'
      }}
      className="pdf-viewer"
    >
      {/* Render underlays/background images first with lowest z-index */}
      <div className="absolute top-0 left-0 right-0 bottom-0 z-[1]" style={{ pointerEvents: "all" }}>
        {underlaySymbols.map(underlay => {
          console.log("PDFViewer - Rendering underlay:", underlay.id, underlay.contentType, underlay.src);
          return (
            <div
              key={underlay.id}
              className="absolute border-2 border-blue-400 border-dashed"
              style={{
                left: `${underlay.x}px`,
                top: `${underlay.y}px`,
                width: `${underlay.width}px`,
                height: `${underlay.height}px`,
                transform: `rotate(${underlay.rotation}deg)`,
                cursor: underlay.draggable ? 'move' : 'default',
                zIndex: 1,
                overflow: 'hidden',
                backgroundColor: 'rgba(200, 200, 255, 0.1)',
              }}
              onMouseDown={(e) => {
                console.log("PDFViewer - Underlay mouse down:", underlay.id);
                onSymbolMouseDown(e, underlay);
              }}
              onClick={(e) => {
                console.log("PDFViewer - Underlay clicked:", underlay.id);
                e.stopPropagation();
                onSymbolSelect(underlay);
              }}
              onDoubleClick={(e) => e.stopPropagation()}
            >
              {underlay.contentType === 'application/pdf' ? (
                <iframe
                  src={underlay.src}
                  className="w-full h-full"
                  title={`PDF underlay ${underlay.id}`}
                  style={{ border: 'none', pointerEvents: 'none' }}
                  onLoad={() => console.log("PDFViewer - PDF iframe loaded for:", underlay.id)}
                  onError={(e) => console.error("PDFViewer - PDF iframe error:", e)}
                />
              ) : (
                <img
                  src={underlay.src}
                  alt={`Underlay ${underlay.id}`}
                  className="w-full h-full object-contain"
                  style={{ pointerEvents: 'none' }}
                  onLoad={() => console.log("PDFViewer - Image loaded for:", underlay.id)}
                  onError={(e) => console.error("PDFViewer - Image load error:", e)}
                />
              )}

              {/* Resize handles - only shown when selected */}
              {isDragging && draggedSymbolId === underlay.id && underlay.resizable && (
                <>
                  <div className="absolute w-6 h-6 bg-blue-500 rounded-full bottom-0 right-0 
                    transform translate-x-1/2 translate-y-1/2 z-10 cursor-se-resize" />
                  <div className="absolute inset-0 border-2 border-blue-500 rounded pointer-events-none" />
                </>
              )}
            </div>
          );
        })}
      </div>

      {!hideBackgroundPDF && (
        <Document
          file={pdfFile}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          className="pdf-document"
          style={{ zIndex: 2 }}
        >
          <Page 
            pageNumber={pageNumber} 
            scale={1} // We're controlling the scale manually with width/height
            renderTextLayer={false}
            renderAnnotationLayer={false}
            onLoadSuccess={handlePageLoadSuccess}
            width={dimensions?.width}
            height={dimensions?.height}
            className="shadow-xl"
          />
        </Document>
      )}
      
      {/* Position the vector elements wrapper above the PDF with higher z-index */}
      <div className="absolute top-0 left-0 right-0 bottom-0" style={{ zIndex: 5 }}>
        {/* Render vector elements for detected architectural elements */}
        <VectorElements
          symbols={vectorSymbols}
          scale={scale}
          isDragging={isDragging}
          draggedSymbolId={draggedSymbolId}
          onSymbolMouseDown={onSymbolMouseDown}
          onSymbolSelect={onSymbolSelect}
          onSymbolDelete={onSymbolDelete}
        />
      </div>
      
      {/* Render regular symbols for other elements with even higher z-index */}
      <div className="absolute top-0 left-0 right-0 bottom-0" style={{ zIndex: 10 }}>
        <PDFSymbols
          symbols={regularSymbols}
          isDragging={isDragging}
          draggedSymbolId={draggedSymbolId}
          onSymbolMouseDown={onSymbolMouseDown}
          onSymbolSelect={onSymbolSelect}
          onSymbolDelete={onSymbolDelete}
        />
      </div>
    </div>
  );
};
