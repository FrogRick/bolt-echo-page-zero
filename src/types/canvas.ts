
export type Point = {
  x: number;
  y: number;
};

export type Tool = 'select' | 'line' | 'rectangle' | 'polygon';

export type LineShape = {
  id: string;
  type: 'line';
  start: Point;
  end: Point;
  color: string;
  lineWidth?: number;
  strokeColor?: string;
};

export type RectangleShape = {
  id: string;
  type: 'rectangle';
  start: Point;
  end: Point;
  color: string;
  fillColor: string;
};

export type PolygonShape = {
  id: string;
  type: 'polygon';
  points: Point[];
  color: string;
  fillColor: string;
};

export type Shape = LineShape | RectangleShape | PolygonShape;

export type PreviewLine = {
  start: Point;
  end: Point;
};
