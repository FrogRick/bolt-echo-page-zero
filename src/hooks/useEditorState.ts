
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
  // PDF related state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  
  // Symbol and interaction related state
  const [symbols, setSymbols] = useState<EditorSymbol[]>([]);
  const [scale, setScale] = useState<number>(1.0);
  const [selectedSymbol, setSelectedSymbol] = useState<EditorSymbol | null>(null);
  const [activeSymbolType, setActiveSymbolType] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(true);
  
  // Detection modes
  const [detectionMode, setDetectionMode] = useState<'walls' | 'full'>('walls');
  const [drawingWallMode, setDrawingWallMode] = useState<boolean>(false);
  const [wallStartPoint, setWallStartPoint] = useState<{x: number, y: number} | null>(null);
  const [similarityDetectionMode, setSimilarityDetectionMode] = useState<boolean>(false);
  
  // Workflow related state
  const [currentStage, setCurrentStage] = useState<WorkflowStage>('draw_walls');
  const [useManualWalls, setUseManualWalls] = useState<boolean>(true);
  const [exportSettings, setExportSettings] = useState<ExportSettings | null>(null);
  
  // Wall settings state
  const [wallThickness, setWallThickness] = useState<number>(5);
  const [snapToAngle, setSnapToAngle] = useState<boolean>(true);
  const [snapToWalls, setSnapToWalls] = useState<boolean>(true);
  
  // Trash/deleted items state
  const [deletedItems, setDeletedItems] = useState<{id: string, type: string, deletedAt: Date}[]>([]);
  
  // Layers state
  const [layers, setLayers] = useState<Layer[]>([
    { id: 'evacuation', name: 'Evacuation Symbols', type: 'evacuation', visible: true },
    { id: 'building', name: 'Building Elements', type: 'building', visible: true }
  ]);

  return {
    // PDF related state
    pdfFile,
    setPdfFile,
    numPages,
    setNumPages,
    pageNumber,
    setPageNumber,
    
    // Symbol and interaction related state
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
    
    // Detection modes
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
    setExportSettings,
    
    // Trash/deleted items state
    deletedItems,
    setDeletedItems
  };
};
