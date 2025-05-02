
import React from "react";

interface PDFCursorProps {
  similarityDetectionMode: boolean;
  drawingWallMode: boolean;
  isPanning: boolean;
  scale: number;
  isDrawingWalls?: boolean;
  isPlacingSymbols?: boolean;
}

export const PDFCursor = ({
  similarityDetectionMode,
  drawingWallMode,
  isPanning,
  scale,
  isDrawingWalls = false,
  isPlacingSymbols = false
}: PDFCursorProps): string => {
  // Determine cursor style based on mode
  if (similarityDetectionMode) return 'crosshair';
  if (drawingWallMode || isDrawingWalls) return 'crosshair';
  if (isPlacingSymbols) return 'cell';
  if (isPanning) return 'grabbing';
  return scale > 1 ? 'grab' : 'default';
};
