
import { useState } from 'react';
import { Shape, Point, Tool } from '../types/canvas';
import { generateId } from '@/utils/idGenerator';

interface ShapeOperationsProps {
  shapes: Shape[];
  setShapes: (shapes: Shape[]) => void;
  currentColor: string;
  fillColor: string;
  greenFillColor: string;
  activeTool: Tool;
}

export const useShapeOperations = ({
  shapes,
  setShapes,
  currentColor,
  fillColor,
  greenFillColor,
  activeTool
}: ShapeOperationsProps) => {
  // Complete the polygon drawing and save it
  const completePolygon = (polygonPoints: Point[]) => {
    if (polygonPoints.length < 3) {
      // Need at least 3 points to form a polygon
      return [];
    }
    
    // Determine fill color based on active tool
    const polygonFillColor = activeTool === 'green-polygon' ? greenFillColor : fillColor;
    
    const newPolygon = {
      id: generateId(),
      type: 'polygon' as const,
      points: [...polygonPoints],
      color: 'transparent', // Make the border transparent
      fillColor: polygonFillColor
    };
    
    setShapes([...shapes, newPolygon]);
    return [];
  };
  
  // Complete the wall polygon drawing and save it as series of lines
  const completeWallPolygon = (wallPolygonPoints: Point[]) => {
    if (wallPolygonPoints.length < 2) {
      // Need at least 2 points to form lines
      return [];
    }
    
    // Create a new array to hold all the new lines
    const newLines: Shape[] = [];
    
    // Create lines between consecutive points
    for (let i = 0; i < wallPolygonPoints.length - 1; i++) {
      const newLine = {
        id: generateId(),
        type: 'line' as const,
        start: { ...wallPolygonPoints[i] },
        end: { ...wallPolygonPoints[i + 1] },
        color: currentColor,
        lineWidth: 8, // Make the line thicker
        strokeColor: '#000000' // Black border color
      };
      newLines.push(newLine);
    }
    
    // Add all new lines to shapes
    setShapes([...shapes, ...newLines]);
    return [];
  };

  // Complete a line
  const completeLine = (startPoint: Point, endPoint: Point) => {
    const newLine = {
      id: generateId(),
      type: 'line' as const,
      start: { ...startPoint },
      end: { ...endPoint },
      color: currentColor,
      lineWidth: 8, // Make the line thicker
      strokeColor: '#000000' // Black border color
    };
    
    setShapes([...shapes, newLine]);
  };

  // Complete a rectangle
  const completeRectangle = (startPoint: Point, endPoint: Point) => {
    const newRectangle = {
      id: generateId(),
      type: 'rectangle' as const,
      start: { ...startPoint },
      end: endPoint,
      color: 'transparent', // Make the border transparent
      fillColor: activeTool === 'green-rectangle' ? greenFillColor : fillColor
    };
    
    setShapes([...shapes, newRectangle]);
  };

  // Delete a shape
  const deleteShape = (shapeId: string) => {
    setShapes(shapes.filter(shape => shape.id !== shapeId));
  };

  // Delete all shapes
  const clearAllShapes = () => {
    setShapes([]);
  };

  return {
    completePolygon,
    completeWallPolygon,
    completeLine,
    completeRectangle,
    deleteShape,
    clearAllShapes
  };
};
