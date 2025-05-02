
import { useState } from "react";
import { EditorSymbol } from "@/types/editor";
import { WorkflowStage } from "@/components/editor/WorkflowSteps";
import { ExportSettings } from "@/components/editor/ExportOptions";

export type Layer = {
  id: string;
  name: string;
  type: string; // 'evacuation', 'building', etc.
  visible: boolean;
};

export const useEditorState = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [symbols, setSymbols] = useState<EditorSymbol[]>([]);
  const [scale, setScale] = useState<number>(1.0);
  const [selectedSymbol, setSelectedSymbol] = useState<EditorSymbol | null>(null);
  const [activeSymbolType, setActiveSymbolType] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(true);
  const [detectionMode, setDetectionMode] = useState<'walls' | 'full'>('walls');
  const [drawingWallMode, setDrawingWallMode] = useState<boolean>(false);
  const [wallStartPoint, setWallStartPoint] = useState<{x: number, y: number} | null>(null);
  const [similarityDetectionMode, setSimilarityDetectionMode] = useState<boolean>(false);
  
  // Add workflow related state
  const [currentStage, setCurrentStage] = useState<WorkflowStage>('choose_mode');
  const [useManualWalls, setUseManualWalls] = useState<boolean>(false);
  const [exportSettings, setExportSettings] = useState<ExportSettings | null>(null);
  
  // Add wall settings state
  const [wallThickness, setWallThickness] = useState<number>(5);
  const [snapToAngle, setSnapToAngle] = useState<boolean>(true);
  const [snapToWalls, setSnapToWalls] = useState<boolean>(true);
  
  // Add layers state
  const [layers, setLayers] = useState<Layer[]>([
    { id: 'evacuation', name: 'Evacuation Symbols', type: 'evacuation', visible: true },
    { id: 'building', name: 'Building Elements', type: 'building', visible: true }
  ]);

  return {
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
    isSaved,
    setIsSaved,
    detectionMode,
    setDetectionMode,
    drawingWallMode,
    setDrawingWallMode,
    wallStartPoint,
    setWallStartPoint,
    layers,
    setLayers,
    similarityDetectionMode,
    setSimilarityDetectionMode,
    // Wall settings
    wallThickness,
    setWallThickness,
    snapToAngle,
    setSnapToAngle, 
    snapToWalls,
    setSnapToWalls,
    // Workflow related state
    currentStage,
    setCurrentStage,
    useManualWalls,
    setUseManualWalls,
    exportSettings,
    setExportSettings
  };
};
