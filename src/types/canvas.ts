
export type Point = {
  x: number;
  y: number;
};

export type CanvasSize = {
  width: number;
  height: number;
};

export type Tool = 'select' | 'line' | 'rectangle' | 'polygon';

export type PreviewLine = {
  start: Point;
  end: Point;
};

export interface BaseShape {
  id: string;
  type: string;
  color: string;
}

export interface LineShape extends BaseShape {
  type: 'line';
  start: Point;
  end: Point;
}

export interface RectangleShape extends BaseShape {
  type: 'rectangle';
  start: Point;
  end: Point;
  fillColor?: string;
}

export interface PolygonShape extends BaseShape {
  type: 'polygon';
  points: Point[];
  fillColor?: string;
}

export type Shape = LineShape | RectangleShape | PolygonShape;
