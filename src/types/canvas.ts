
// Basic point type for coordinates
export type Point = {
  x: number;
  y: number;
};

// Tool types for canvas editing
export type Tool = 
  | 'select'
  | 'wall'
  | 'yellow-rectangle'
  | 'yellow-polygon'
  | 'wall-polygon'
  | 'green-rectangle'
  | 'green-polygon';

// Shape types for drawing
export type Shape = {
  id: string;
  type: 'line' | 'rectangle' | 'polygon';
  start: Point;
  end: Point;
  points?: Point[];
  fillColor?: string;
  strokeColor?: string;
};

// Preview line for drawing guidance
export type PreviewLine = {
  start: Point;
  end: Point;
};

// Extension line type for snapping
export type ExtensionLine = {
  start: Point;
  end: Point;
  referenceLineId: string;
};
