export type WallSymbol = {
  id: string;
  type: 'wall';
  x: number;
  y: number;
  rotation: number;
  size: number;
  start: { x: number, y: number };
  end: { x: number, y: number };
  thickness: number;
  previewImage?: string;
  similarToWall?: string; // Add this property to track which wall this is similar to
  detectionData?: {
    roiLeft: number;
    roiTop: number;
    roiWidth: number;
    roiHeight: number;
    selectionRect?: {
      startX: number;
      startY: number;
      width: number;
      height: number;
    };
    lines?: Array<{
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      length: number;
      angle: number;
      midX: number;
      midY: number;
    }>;
  };
};

export type DoorSymbol = {
  id: string;
  type: 'door';
  x: number;
  y: number;
  rotation: number;
  size: number;
  width: number;
  height: number;
};

export type StairsSymbol = {
  id: string;
  type: 'stairs';
  x: number;
  y: number;
  rotation: number;
  size: number;
  width: number;
  height: number;
  steps: number;
};

export type WindowSymbol = {
  id: string;
  type: 'window';
  x: number;
  y: number;
  rotation: number;
  size: number;
  width: number;
  length: number;
};

export type GenericSymbol = {
  id: string;
  type: string;
  x: number;
  y: number;
  rotation: number;
  size: number;
};

export type EditorSymbol = WallSymbol | DoorSymbol | StairsSymbol | WindowSymbol | GenericSymbol;

// Keep the old type name for backward compatibility, but make it explicit it's our editor symbol
export type Symbol = EditorSymbol;

export type ProjectPDF = {
  id: string;
  name: string;
  data: string;
  createdAt: Date;
};

export type Project = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  pdfs: ProjectPDF[];
  symbols: EditorSymbol[];
  pdfData?: string;  // Add this property as optional since we're now using pdfs array
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
};

// Add ProjectDisplayData type for use in the BuildingService
export type ProjectDisplayData = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
  thumbnail?: string;
  pdfs: ProjectPDF[];
  symbols: EditorSymbol[];
};
