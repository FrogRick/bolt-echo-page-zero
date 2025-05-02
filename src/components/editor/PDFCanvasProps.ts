
import { EditorSymbol, WallSymbol } from "@/types/editor";
import { Layer } from "@/hooks/useEditorState";

export interface PDFCanvasProps {
  pdfFile: File | null;
  symbols: EditorSymbol[];
  activeSymbolType: string | null;
  onPDFUpload: (file: File) => void;
  onDocumentLoadSuccess: ({ numPages }: { numPages: number }) => void;
  onSymbolPlace: (type: string, x: number, y: number) => void;
  onSymbolDragEnd: (symbolId: string, x: number, y: number) => void;
  onSymbolSelect: (symbol: EditorSymbol) => void;
  onSymbolDelete: (symbolId: string) => void;
  pageNumber: number;
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  setScale: (scale: number) => void;
  drawingWallMode: boolean;
  wallStartPoint: {x: number, y: number} | null;
  onWallPointSet: (x: number, y: number) => void;
  similarityDetectionMode?: boolean;
  onSimilarWallsDetected?: (walls: WallSymbol[]) => void;
  onSimilarityModeToggle?: (enabled: boolean) => void;
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
  setSymbols: (symbols: EditorSymbol[]) => void;
}
