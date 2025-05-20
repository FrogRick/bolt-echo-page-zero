
import { useState } from 'react';
import { Point, Shape } from '../types/canvas';
import { 
  findNearestEndpoint,
  snapAngleToGrid,
  findLineExtensionPoint, 
  findNearestPointOnAnyLine
} from '../utils';

interface SnappingOptions {
  snapToAngle: boolean;
  snapToEndpoints: boolean;
  snapToLines: boolean;
  snapToExtensions: boolean;
  snapDistance: number;
}

export const useSnapping = () => {
  // Snapping states
  const [snapToAngle, setSnapToAngle] = useState<boolean>(true);
  const [snapToEndpoints, setSnapToEndpoints] = useState<boolean>(true);
  const [snapToLines, setSnapToLines] = useState<boolean>(true);
  const [snapToExtensions, setSnapToExtensions] = useState<boolean>(true);
  const [snapDistance, setSnapDistance] = useState<number>(10);
  
  // Toggle functions
  const toggleSnapToAngle = () => setSnapToAngle(!snapToAngle);
  const toggleSnapToEndpoints = () => setSnapToEndpoints(!snapToEndpoints);
  const toggleSnapToLines = () => setSnapToLines(!snapToLines);
  const toggleSnapToExtensions = () => setSnapToExtensions(!snapToExtensions);
  
  // Snap a point using all available snapping rules
  const snapPoint = (
    point: Point, 
    startPoint: Point | null, 
    shapes: Shape[],
    extensionLineCallback?: (line: {start: Point, end: Point} | null) => void,
    options?: Partial<SnappingOptions>,
    isDragging: boolean = false
  ): Point => {
    const snappingOptions: SnappingOptions = {
      snapToAngle: options?.snapToAngle ?? snapToAngle,
      snapToEndpoints: options?.snapToEndpoints ?? snapToEndpoints,
      snapToLines: options?.snapToLines ?? snapToLines,
      snapToExtensions: options?.snapToExtensions ?? snapToExtensions,
      snapDistance: options?.snapDistance ?? snapDistance
    };
    
    if (!startPoint) return point;
    
    // Initialize with the current point
    let snappedPoint = { ...point };
    let extensionFound = false;
    
    // First check for extension snapping
    if (snappingOptions.snapToExtensions && !isDragging) {
      const extensionSnap = findLineExtensionPoint(startPoint, point, shapes, 30);
      if (extensionSnap) {
        snappedPoint = extensionSnap.point;
        
        // Set extension line for visual reference
        if (extensionLineCallback) {
          extensionLineCallback({
            start: extensionSnap.extendedLine.start,
            end: extensionSnap.point
          });
        }
        extensionFound = true;
      } else if (extensionLineCallback) {
        extensionLineCallback(null);
      }
    } else if (extensionLineCallback) {
      extensionLineCallback(null);
    }
    
    // If not extension-snapped, check line snapping
    if (!extensionFound && snappingOptions.snapToLines) {
      const lineSnap = findNearestPointOnAnyLine(point, shapes, undefined, snappingOptions.snapDistance);
      if (lineSnap) {
        snappedPoint = lineSnap.point;
      }
    }
    
    // Then check endpoint snapping (takes priority over line snapping)
    const endpointSnap = findNearestEndpoint(
      snappedPoint, 
      shapes, 
      snappingOptions.snapDistance, 
      snappingOptions.snapToEndpoints
    );
    if (endpointSnap) {
      snappedPoint = endpointSnap;
    }
    
    // Finally apply angle snapping - can work together with extension snapping
    if (snappingOptions.snapToAngle && !isDragging) {
      const angleSnappedPoint = snapAngleToGrid(startPoint, snappedPoint, true);
      
      // Only use the angle-snapped point if it's close enough to our current point
      const distToSnapped = Math.sqrt(
        Math.pow(angleSnappedPoint.x - snappedPoint.x, 2) + 
        Math.pow(angleSnappedPoint.y - snappedPoint.y, 2)
      );
      
      // Only apply if reasonably close to current point or very close to extension point
      if (distToSnapped < 20 || (extensionFound && distToSnapped < 5)) {
        snappedPoint = angleSnappedPoint;
      }
    }
    
    return snappedPoint;
  };
  
  return {
    snapToAngle,
    toggleSnapToAngle,
    snapToEndpoints,
    toggleSnapToEndpoints,
    snapToLines,
    toggleSnapToLines,
    snapToExtensions,
    toggleSnapToExtensions,
    snapDistance,
    setSnapDistance,
    snapPoint
  };
};
