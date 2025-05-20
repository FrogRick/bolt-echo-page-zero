
import { useState } from 'react';
import { EditorSymbol } from '@/types/editor';
import { WorkflowStage } from '@/components/editor/WorkflowSteps';

export const useEditorState = () => {
  // PDF state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);

  // Symbol state
  const [symbols, setSymbols] = useState<EditorSymbol[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<EditorSymbol | null>(null);
  const [activeSymbolType, setActiveSymbolType] = useState<string>('');

  // Wall drawing state
  const [drawingWallMode, setDrawingWallMode] = useState<boolean>(false);
  const [wallStartPoint, setWallStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [wallThickness, setWallThickness] = useState<number>(5);
  const [snapToAngle, setSnapToAngle] = useState<boolean>(true);
  const [snapToWalls, setSnapToWalls] = useState<boolean>(true);
  const [useManualWalls, setUseManualWalls] = useState<boolean>(true);

  // Detection state
  const [similarityDetectionMode, setSimilarityDetectionMode] = useState<boolean>(false);

  // Layers state
  const [layers, setLayers] = useState<string[]>(['walls', 'doors', 'windows', 'furniture']);

  // Workflow state
  const [currentStage, setCurrentStage] = useState<WorkflowStage>('draw_walls');

  // Export settings
  const [exportSettings, setExportSettings] = useState<any>(null);

  return {
    pdfFile,
    setPdfFile,
    numPages,
    setNumPages,
    pageNumber,
    setPageNumber,
    scale,
    setScale,
    symbols,
    setSymbols,
    selectedSymbol,
    setSelectedSymbol,
    activeSymbolType,
    setActiveSymbolType,
    drawingWallMode,
    setDrawingWallMode,
    wallStartPoint,
    setWallStartPoint,
    wallThickness,
    setWallThickness,
    snapToAngle,
    setSnapToAngle,
    snapToWalls,
    setSnapToWalls,
    useManualWalls,
    setUseManualWalls,
    similarityDetectionMode,
    setSimilarityDetectionMode,
    layers,
    setLayers,
    currentStage,
    setCurrentStage,
    exportSettings,
    setExportSettings,
  };
};
