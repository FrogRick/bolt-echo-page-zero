
import { PDFError } from "./PDFError";

interface PDFOverlaysProps {
  similarityDetectionMode: boolean;
  showDetectionHint: boolean;
  pdfError: string | null;
  setPdfError: (error: string | null) => void;
  onPDFUpload: (file: File | null) => void;
}

export const PDFOverlays = ({
  similarityDetectionMode,
  showDetectionHint,
  pdfError,
  setPdfError,
  onPDFUpload
}: PDFOverlaysProps) => {
  return (
    <>
      {showDetectionHint && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-blue-100 border-blue-500 border px-4 py-2 rounded-md shadow-md">
          <p className="text-sm text-blue-800">
            📋 Check the <strong>AI Element Detection</strong> panel on the left to detect walls, doors, windows and stairs
          </p>
        </div>
      )}
      
      {similarityDetectionMode && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-100 border-green-500 border px-4 py-2 rounded-md shadow-md">
          <p className="text-sm text-green-800">
            🔍 <strong>Click on any element</strong> in your floorplan to detect similar elements
          </p>
        </div>
      )}
      
      {pdfError && (
        <PDFError 
          error={pdfError} 
          onReset={() => { setPdfError(null); onPDFUpload(null); }} 
        />
      )}
    </>
  );
};
