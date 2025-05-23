import { useRef, useState, useEffect } from 'react';
import { drawShapes, drawInProgressPolygon, drawPreviewLine, drawExtensionLine, lineSnappingHelpers } from '@/utils/canvasDrawing';
import { useShapeDetection } from '@/hooks/useShapeDetection';
import { Tool, Point, Shape, PreviewLine } from '@/types/canvas';
import { generateId } from '@/utils/idGenerator';

export const useCanvasEditor = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [currentColor, setCurrentColor] = useState<string>('#000000');
  const [fillColor, setFillColor] = useState<string>('#FFFBCC'); // Light yellow
  const [greenFillColor, setGreenFillColor] = useState<string>('#C9E5D1'); // Green fill color
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [polygonPoints, setPolygonPoints] = useState<Point[]>([]);
  const [wallPolygonPoints, setWallPolygonPoints] = useState<Point[]>([]);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedShape, setSelectedShape] = useState<Shape | null>(null);
  // Update canvasSize state to include aspectRatio
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
  const [previewLine, setPreviewLine] = useState<PreviewLine | null>(null);
  const [mouseMoved, setMouseMoved] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point | null>(null);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [mouseDownTimer, setMouseDownTimer] = useState<number | null>(null);
  
  // Rectangle drawing mode: 'click' for click-release-click or 'drag' for click-drag-release
  const [rectangleDrawMode, setRectangleDrawMode] = useState<'click' | 'drag'>('click');
  
  // New state for snapping controls
  const [snapToAngle, setSnapToAngle] = useState<boolean>(true);
  const [snapToEndpoints, setSnapToEndpoints] = useState<boolean>(true);
  const [snapDistance, setSnapDistance] = useState<number>(10); // Pixels
  
  // Add a state for line-to-line snapping
  const [snapToLines, setSnapToLines] = useState<boolean>(true);

  // New state for extension snapping
  const [snapToExtensions, setSnapToExtensions] = useState<boolean>(true);
  const [extensionLine, setExtensionLine] = useState<{start: Point, end: Point} | null>(null);

  // New state for underlay image
  const [underlayImage, setUnderlayImage] = useState<HTMLImageElement | null>(null);
  const [underlayPosition, setUnderlayPosition] = useState({ x: 0, y: 0 });
  const [underlayScale, setUnderlayScale] = useState(1);
  const [underlayOpacity, setUnderlayOpacity] = useState(0.5);
  const [isDraggingUnderlay, setIsDraggingUnderlay] = useState(false);
  const [underlayDragOffset, setUnderlayDragOffset] = useState<Point>({ x: 0, y: 0 });

  // Import shape detection functions
  const { findShapeAtPoint } = useShapeDetection();

  // Function to add an underlay image but not render it directly on the canvas
  const addUnderlayImage = (file: File) => {
    const img = new Image();
    img.onload = () => {
      // Don't modify canvas size when loading an image
      // Don't render the image directly on the canvas - it will be rendered in the CanvasContainer component
      setUnderlayImage(img);
      redrawCanvas();
    };
    img.src = URL.createObjectURL(file);
  };

  // Function to remove the underlay image
  const removeUnderlayImage = () => {
    if (underlayImage) {
      URL.revokeObjectURL(underlayImage.src);
      setUnderlayImage(null);
      redrawCanvas();
    }
  };

  // Function to adjust underlay scale
  const adjustUnderlayScale = (scale: number) => {
    setUnderlayScale(scale);
    redrawCanvas();
  };

  // Function to adjust underlay opacity
  const adjustUnderlayOpacity = (opacity: number) => {
    setUnderlayOpacity(opacity);
    redrawCanvas();
  };

  // Function to adjust canvas size
  const adjustCanvasSize = (width: number, height: number) => {
    setCanvasSize({ width, height });
  };

  // Function to cancel the current drawing operation
  const cancelDrawing = () => {
    if (activeTool === 'wall' && startPoint) {
      // Cancel wall drawing - clear the start point
      setStartPoint(null);
      setPreviewLine(null);
      setIsDrawing(false);
    } else if (activeTool === 'wall-polygon' && wallPolygonPoints.length > 0) {
      // Cancel wall polygon drawing - clear all wall polygon points
      setWallPolygonPoints([]);
      setIsDrawing(false);
    } else if ((activeTool === 'yellow-rectangle' || activeTool === 'green-rectangle')) {
      // Cancel rectangle drawing - clear the start point
      if (rectangleDrawMode === 'click' && startPoint) {
        setStartPoint(null);
        setCurrentPoint(null);
      }
      setIsDrawing(false);
    } else if ((activeTool === 'yellow-polygon' || activeTool === 'green-polygon') && polygonPoints.length > 0) {
      // Cancel polygon drawing - clear all polygon points
      setPolygonPoints([]);
    }
    // Force redraw of the canvas to remove any in-progress elements
    redrawCanvas();
  };

  // Clear the canvas and redraw all shapes
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply canvas transform for panning
    ctx.save();
    ctx.translate(canvasOffset.x, canvasOffset.y);

    // No longer render the underlay image directly on canvas - this is now handled by CanvasContainer

    // Draw all saved shapes
    drawShapes(ctx, shapes, selectedShape?.id || null, fillColor);

    // Draw wall polygon in progress (using same drawing function as regular polygon)
    // This is drawn FIRST (before regular polygons) so it appears below other elements
    if (activeTool === 'wall-polygon' && wallPolygonPoints.length > 0) {
      // For wall polygon, we draw lines without fill - use black border and gray fill like walls
      // Pass true for isWallPolygon and false for showStartPoint to hide the red circle
      drawInProgressPolygon(ctx, wallPolygonPoints, currentPoint, '#000000', 'transparent', true, false);
      
      // Draw dotted extension line if there is one - same as for wall tool
      if (extensionLine && snapToExtensions) {
        drawExtensionLine(ctx, extensionLine.start, extensionLine.end);
      }
    }

    // Draw polygon in progress
    if ((activeTool === 'yellow-polygon' || activeTool === 'green-polygon') && polygonPoints.length > 0) {
      const polygonFillColor = activeTool === 'green-polygon' ? greenFillColor : fillColor;
      // Make sure to show the start point with the red dot on non-wall polygons
      drawInProgressPolygon(ctx, polygonPoints, currentPoint, currentColor, polygonFillColor, false, true);
    }

    // Draw preview line when using the wall tool - only if we have a start and current point
    if (activeTool === 'wall' && startPoint && currentPoint) {
      // Start with the current point as our end point
      let endPoint = currentPoint;
      let extensionFound = false;
      
      // Check for extension snapping first - it now works alongside angle snapping
      if (snapToExtensions && !isDragging) {
        const extensionSnap = lineSnappingHelpers.findLineExtensionPoint(startPoint, currentPoint, shapes);
        if (extensionSnap) {
          endPoint = extensionSnap.point;
          
          // Set extension line for drawing dotted reference line
          setExtensionLine({
            start: extensionSnap.extendedLine.start,
            end: extensionSnap.point
          });
          extensionFound = true;
        } else {
          setExtensionLine(null);
        }
      } else {
        setExtensionLine(null);
      }
      
      // Then check if we should snap to an existing line (if no extension found)
      if (!extensionFound && snapToLines) {
        const lineSnap = lineSnappingHelpers.findNearestPointOnAnyLine(currentPoint, shapes);
        if (lineSnap) {
          endPoint = lineSnap.point;
        }
      }
      
      // Then check endpoint snapping (takes priority over line snapping)
      const snappedToEndpoint = findNearestEndpoint(endPoint);
      if (snappedToEndpoint) {
        endPoint = snappedToEndpoint;
      }
      
      // Apply angle snapping AFTER all other snapping
      // This ensures both extension snap AND angle snap can work together
      if (snapToAngle && !isDragging) {
        const snappedAnglePoint = snapAngleToGrid(startPoint, endPoint);
        
        // Only use the angle-snapped point if it's close enough to our current point
        const distToSnapped = Math.sqrt(
          Math.pow(snappedAnglePoint.x - endPoint.x, 2) + 
          Math.pow(snappedAnglePoint.y - endPoint.y, 2)
        );
        
        if (distToSnapped < 20) { // Only apply angle snapping if close to current angle
          endPoint = snappedAnglePoint;
        }
      }
      
      // Draw only one line - the snapped one
      drawPreviewLine(ctx, startPoint, endPoint, currentColor);
      
      // Draw dotted extension line if there is one
      if (extensionLine && snapToExtensions) {
        drawExtensionLine(ctx, extensionLine.start, extensionLine.end); // Never blocked in this case
      }
    }
    
    // Draw preview line for single click line tool if previewLine exists
    else if (previewLine) {
      drawPreviewLine(ctx, previewLine.start, previewLine.end, currentColor);
    }
    
    // Draw preview rectangle if we're in click mode and have a start point
    if ((activeTool === 'yellow-rectangle' || activeTool === 'green-rectangle') && rectangleDrawMode === 'click' && startPoint && currentPoint) {
      const rectFillColor = activeTool === 'green-rectangle' ? greenFillColor : fillColor;
      
      // Create semi-transparent fill color for in-progress rectangles (50% opacity)
      let semiTransparentColor = rectFillColor;
      
      // Handle both hex and rgb formats
      if (rectFillColor.startsWith('#')) {
        // Convert hex to rgba
        const r = parseInt(rectFillColor.slice(1, 3), 16);
        const g = parseInt(rectFillColor.slice(3, 5), 16);
        const b = parseInt(rectFillColor.slice(5, 7), 16);
        semiTransparentColor = `rgba(${r}, ${g}, ${b}, 0.5)`;
      } else if (rectFillColor.startsWith('rgb(')) {
        // Convert rgb to rgba
        semiTransparentColor = rectFillColor.replace(/rgb\((.+)\)/, 'rgba($1, 0.5)');
      }
      
      ctx.fillStyle = semiTransparentColor;
      ctx.beginPath();
      ctx.rect(
        startPoint.x,
        startPoint.y,
        currentPoint.x - startPoint.x,
        currentPoint.y - startPoint.y
      );
      ctx.fill();
      
      // Add a subtle border
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
  };

  // Function to snap angle to nearest 45 degrees if within threshold
  const snapAngleToGrid = (startPoint: Point, endPoint: Point, snapTo90 = false): Point => {
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    
    // Calculate angle in radians and convert to degrees
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    // Determine nearest angle increment (45 or 90 degrees)
    const snapIncrement = snapTo90 ? 90 : 45;
    const snapAngle = Math.round(angle / snapIncrement) * snapIncrement;
    
    // Check if we're within the threshold
    const angleDiff = Math.abs((angle % snapIncrement) - snapIncrement) % snapIncrement;
    const threshold = snapTo90 ? 5 : 15; // Stricter threshold for 90-degree snapping
    const shouldSnap = angleDiff < threshold || angleDiff > (snapIncrement - threshold);
    
    if (!shouldSnap) return endPoint;
    
    // Convert back to radians
    const snapRadians = snapAngle * (Math.PI / 180);
    
    // Calculate distance
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate new endpoint
    return {
      x: startPoint.x + distance * Math.cos(snapRadians),
      y: startPoint.y + distance * Math.sin(snapRadians)
    };
  };

  // Function to snap angle to nearest 90 degrees if within threshold
  const snapAngleTo90Degrees = (startPoint: Point, endPoint: Point): Point => {
    return snapAngleToGrid(startPoint, endPoint, true);
  };

  // Function to find nearest endpoint to snap to
  const findNearestEndpoint = (point: Point): Point | null => {
    if (!snapToEndpoints) return null;
    
    let closestPoint: Point | null = null;
    let minDistance = snapDistance;
    
    shapes.forEach(shape => {
      if (shape.type === 'line') {
        // Check distance to start point
        const distToStart = Math.sqrt(
          Math.pow(shape.start.x - point.x, 2) + 
          Math.pow(shape.start.y - point.y, 2)
        );
        if (distToStart < minDistance) {
          minDistance = distToStart;
          closestPoint = { ...shape.start };
        }
        
        // Check distance to end point
        const distToEnd = Math.sqrt(
          Math.pow(shape.end.x - point.x, 2) + 
          Math.pow(shape.end.y - point.y, 2)
        );
        if (distToEnd < minDistance) {
          minDistance = distToEnd;
          closestPoint = { ...shape.end };
        }
      }
      // Add support for rectangle and polygon endpoints if needed
    });
    
    return closestPoint;
  };

  // Complete the polygon drawing and save it
  const completePolygon = () => {
    if (polygonPoints.length < 3) {
      // Need at least 3 points to form a polygon
      setPolygonPoints([]);
      return;
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
    setPolygonPoints([]);
  };
  
  // Complete the wall polygon drawing and save it as series of lines
  const completeWallPolygon = () => {
    if (wallPolygonPoints.length < 2) {
      // Need at least 2 points to form lines
      setWallPolygonPoints([]);
      return;
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
    setWallPolygonPoints([]);
  };

  // Handle mouse down event
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - canvasOffset.x;
    const y = e.clientY - rect.top - canvasOffset.y;
    
    const point: Point = { x, y };
    setMouseMoved(false);
    
    // Check if we're clicking on the underlay image first
    if (underlayImage && 
        x >= underlayPosition.x && 
        x <= underlayPosition.x + underlayImage.width * underlayScale &&
        y >= underlayPosition.y && 
        y <= underlayPosition.y + underlayImage.height * underlayScale &&
        activeTool === 'select') {
      setIsDraggingUnderlay(true);
      setUnderlayDragOffset({ 
        x: x - underlayPosition.x, 
        y: y - underlayPosition.y 
      });
      return;
    }
    
    // Set up potential panning on any tool with click-hold
    setPanStart({ x: e.clientX, y: e.clientY });
    
    // Start a timer to detect if this is a click-hold (for panning)
    const timerId = window.setTimeout(() => {
      // Only activate panning if mouse hasn't moved significantly and button is still down
      if (!mouseMoved && e.buttons === 1) {
        setIsPanning(true);
      }
    }, 150); // Short delay to detect hold vs click
    
    setMouseDownTimer(timerId);
    
    if (activeTool === 'select') {
      handleSelectToolMouseDown(point);
    } else if (activeTool === 'wall') {
      // Apply both endpoint and line snapping before starting to draw
      let snappedPoint = point;
      
      // First check if we can snap to a line
      if (snapToLines) {
        const lineSnap = lineSnappingHelpers.findNearestPointOnAnyLine(point, shapes);
        if (lineSnap) {
          snappedPoint = lineSnap.point;
        }
      }
      
      // Then check endpoint snapping (this takes priority)
      const endpointSnap = findNearestEndpoint(snappedPoint);
      if (endpointSnap) {
        snappedPoint = endpointSnap;
      }
      
      // Use click-point-click mode exclusively for lines
      handleLineToolClick(snappedPoint);
    } else if (activeTool === 'wall-polygon') {
      handleWallPolygonToolMouseDown(point);
    } else if (activeTool === 'yellow-rectangle' || activeTool === 'green-rectangle') {
      handleRectangleToolClick(point);
    } else if (activeTool === 'yellow-polygon' || activeTool === 'green-polygon') {
      handlePolygonToolMouseDown(point);
    }
  };

  // Handle mouse move event
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Check if we're panning the canvas
    if (isPanning && panStart) {
      // Calculate pan amount
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      
      // Update canvas offset
      setCanvasOffset({
        x: canvasOffset.x + dx,
        y: canvasOffset.y + dy
      });
      
      // Update pan start point
      setPanStart({ x: e.clientX, y: e.clientY });
      
      // Redraw the canvas with updated offset
      redrawCanvas();
      return;
    }
    
    // Check if we're dragging the underlay image
    if (isDraggingUnderlay) {
      const x = e.clientX - rect.left - canvasOffset.x - underlayDragOffset.x;
      const y = e.clientY - rect.top - canvasOffset.y - underlayDragOffset.y;
      setUnderlayPosition({ x, y });
      redrawCanvas();
      return;
    }
    
    // Set mouseMoved to true if we've moved more than a tiny amount
    if (panStart) {
      const moveDistance = Math.sqrt(
        Math.pow(e.clientX - panStart.x, 2) + 
        Math.pow(e.clientY - panStart.y, 2)
      );
      
      if (moveDistance > 3) {
        setMouseMoved(true);
        
        // Clear the mouse down timer if it exists to prevent panning
        if (mouseDownTimer !== null) {
          window.clearTimeout(mouseDownTimer);
          setMouseDownTimer(null);
        }
      }
    }
    
    const x = e.clientX - rect.left - canvasOffset.x;
    const y = e.clientY - rect.top - canvasOffset.y;
    
    const point: Point = { x, y };
    
    setCurrentPoint(point);
    
    if (isDragging && selectedShape) {
      handleDragMove(point);
    } else if (activeTool === 'wall' && startPoint) {
      // For wall tool, check for perpendicular extension snapping during mouse move
      let modifiedPoint = point; // Store the potentially modified point
      let extensionFound = false;
      
      // Only check for extension if the feature is enabled
      if (snapToExtensions) {
        const extensionSnap = lineSnappingHelpers.findLineExtensionPoint(startPoint, point, shapes);
        if (extensionSnap) {
          // Set current point to the extension point
          modifiedPoint = extensionSnap.point;
          setCurrentPoint(extensionSnap.point);
          
          // Set the extension line with the correct start point (endpoint of the reference line)
          setExtensionLine({
            start: extensionSnap.extendedLine.start,
            end: extensionSnap.point
          });
          extensionFound = true;
        } else {
          setExtensionLine(null);
        }
      } else {
        // Ensure extension line is removed when the feature is disabled
        setExtensionLine(null);
      }
      
      // Apply angle snapping regardless of extension snapping
      if (snapToAngle && !isDragging) {
        const snappedAnglePoint = snapAngleToGrid(startPoint, modifiedPoint);
        
        // Only use the angle-snapped point if it's close enough to our modified point
        const distToSnapped = Math.sqrt(
          Math.pow(snappedAnglePoint.x - modifiedPoint.x, 2) + 
          Math.pow(snappedAnglePoint.y - modifiedPoint.y, 2)
        );
        
        // Only apply the angle snap if it's reasonably close to where we are
        // or very close to the extension point (meaning they're compatible)
        if (!extensionFound || distToSnapped < 5) {
          setCurrentPoint(snappedAnglePoint);
        }
      }
      
      // Update for line preview
      redrawCanvas();
    } 
    else if (activeTool === 'wall-polygon' && wallPolygonPoints.length > 0) {
      // For wall-polygon, apply the same snapping as wall tool during mouse movement
      let snappedPoint = point;
      let extensionFound = false;
      
      // Create a temporary array that includes both shapes and the current in-progress wall polygon
      const temporaryLines: Shape[] = [...shapes];
      
      // Add the current wall polygon segments as temporary lines for snapping
      if (wallPolygonPoints.length > 1) {
        for (let i = 0; i < wallPolygonPoints.length - 1; i++) {
          temporaryLines.push({
            id: `temp-wall-polygon-${i}`,
            type: 'line',
            start: { ...wallPolygonPoints[i] },
            end: { ...wallPolygonPoints[i + 1] },
            color: currentColor,
            lineWidth: 8
          });
        }
      }
      
      // Get the last point from the wall polygon points array
      const lastPoint = wallPolygonPoints[wallPolygonPoints.length - 1];
      
      // Only check for extensions if the feature is enabled
      if (snapToExtensions) {
        // Use the extended shapes array that includes our in-progress wall polygon
        const extensionSnap = lineSnappingHelpers.findLineExtensionPoint(lastPoint, point, temporaryLines);
        if (extensionSnap) {
          snappedPoint = extensionSnap.point;
          setCurrentPoint(extensionSnap.point);
          extensionFound = true;
          
          // Set extension line to show the visual indicator
          setExtensionLine({
            start: extensionSnap.extendedLine.start,
            end: extensionSnap.point
          });
        } else {
          setExtensionLine(null);
        }
      } else {
        // Ensure extension line is removed when feature is disabled
        setExtensionLine(null);
      }
      
      // Then check if we can snap to a line if no extension was found
      if (!extensionFound && snapToLines) {
        const lineSnap = lineSnappingHelpers.findNearestPointOnAnyLine(point, shapes);
        if (lineSnap) {
          snappedPoint = lineSnap.point;
          setCurrentPoint(lineSnap.point);
        }
      }
      
      // Then check endpoint snapping (this takes priority)
      const endpointSnap = findNearestEndpoint(snappedPoint);
      if (endpointSnap) {
        snappedPoint = endpointSnap;
        setCurrentPoint(endpointSnap);
      }
      
      // Apply angle snapping after all other snaps
      if (snapToAngle) {
        const angleSnappedPoint = snapAngleToGrid(lastPoint, snappedPoint);
        
        // Only use the angle-snapped point if it's close enough to our current point
        // or if we're snapping to the first point - in that case we want to enforce the angle
        const distToSnapped = Math.sqrt(
          Math.pow(angleSnappedPoint.x - snappedPoint.x, 2) + 
          Math.pow(angleSnappedPoint.y - snappedPoint.y, 2)
        );
        
        // Only apply the angle snap if it's reasonably close to where we clicked
        // OR if we're snapping to the first point (to close the polygon)
        if (distToSnapped < 20 || (extensionFound && distToSnapped < 5)) {
          setCurrentPoint(angleSnappedPoint);
        }
      }
      
      redrawCanvas();
    } else if (isDrawing && (activeTool === 'yellow-rectangle' || activeTool === 'green-rectangle') && rectangleDrawMode === 'drag') {
      redrawCanvas();
    } else if ((activeTool === 'yellow-rectangle' || activeTool === 'green-rectangle') && rectangleDrawMode === 'click' && startPoint) {
      // Update preview for click mode rectangle
      redrawCanvas();
    } else if ((activeTool === 'yellow-polygon' || activeTool === 'green-polygon') && polygonPoints.length > 0) {
      // Apply both endpoint and line snapping for yellow and green polygons
      let snappedPoint = point;
      let isSnappingToFirstPoint = false;
      
      // Check if we need to snap to the first point (red dot) to close the polygon
      if (polygonPoints.length > 2) {
        const firstPoint = polygonPoints[0];
        const distToFirst = Math.sqrt(
          Math.pow(snappedPoint.x - firstPoint.x, 2) + 
          Math.pow(snappedPoint.y - firstPoint.y, 2)
        );
        
        // If close to the starting point, snap to it
        // But first remember that we're snapping to first point
        if (distToFirst < snapDistance) {
          isSnappingToFirstPoint = true;
          snappedPoint = { ...firstPoint };
        }
      }
      
      // First check endpoint snapping (this takes priority over line snapping)
      if (!isSnappingToFirstPoint) {
        const endpointSnap = findNearestEndpoint(snappedPoint);
        if (endpointSnap) {
          snappedPoint = endpointSnap;
        }
      }
      
      // Finally apply angle snapping if enabled - ALWAYS apply this even when snapping to first point
      if (snapToAngle) {
        const lastPoint = polygonPoints[polygonPoints.length - 1];
        
        // Use 90-degree snapping for all polygon segments
        const snappedAnglePoint = snapAngleTo90Degrees(lastPoint, snappedPoint);
        
        // Only use the angle-snapped point if it's close enough to our current point
        // or if we're snapping to the first point - in that case we want to enforce the angle
        const distToSnapped = Math.sqrt(
          Math.pow(snappedAnglePoint.x - snappedPoint.x, 2) + 
          Math.pow(snappedAnglePoint.y - snappedPoint.y, 2)
        );
        
        // Apply the angle snap if it's reasonably close to where we clicked
        // OR if we're snapping to the first point (to close the polygon)
        if (distToSnapped < 20 || isSnappingToFirstPoint) {
          // When snapping to the first point, we keep X,Y coordinates of the first point
          // but project the point onto the 90-degree angle line from the last point
          if (isSnappingToFirstPoint) {
            // Get direction vector from last point to first point
            const firstPoint = polygonPoints[0];
            const lastPoint = polygonPoints[polygonPoints.length - 1];
            const dx = firstPoint.x - lastPoint.x;
            const dy = firstPoint.y - lastPoint.y;
            
            // Calculate angle in radians and convert to degrees
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            
            // Determine nearest 90 degree increment
            const snapAngle = Math.round(angle / 90) * 90;
            
            // Convert back to radians
            const snapRadians = snapAngle * (Math.PI / 180);
            
            // Calculate distance
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // We don't use this directly, we only use it for preview
            setCurrentPoint({
              x: lastPoint.x + distance * Math.cos(snapRadians),
              y: lastPoint.y + distance * Math.sin(snapRadians)
            });
          } else {
            setCurrentPoint(snappedAnglePoint);
          }
        } else {
          setCurrentPoint(snappedPoint);
        }
      } else {
        // If angle snapping is disabled, use the endpoint snapped point
        setCurrentPoint(snappedPoint);
      }
      
      // Update the current point for polygon preview
      redrawCanvas();
    }
  };

  // Handle select tool mouse down
  const handleSelectToolMouseDown = (point: Point) => {
    // Check if we clicked on a shape
    const clickedShape = findShapeAtPoint(point, shapes);
    
    if (clickedShape) {
      setSelectedShape(clickedShape);
      setIsDragging(true);
      
      if (clickedShape.type === 'rectangle') {
        setDragOffset({
          x: point.x - clickedShape.start.x,
          y: point.y - clickedShape.start.y
        });
      } else {
        setDragOffset(point);
      }
    } else {
      setSelectedShape(null);
    }
  };

  // Handle line tool mouse down - exclusively click-point-click mode
  const handleLineToolClick = (point: Point) => {
    // If there's no start point, set it
    if (!startPoint) {
      setStartPoint(point);
      setCurrentPoint(point);
    } else {
      // Complete the line on second click
      completeLine(point);
    }
  };
  
  // Handle wall polygon tool mouse down - multiple connected lines
  const handleWallPolygonToolMouseDown = (point: Point) => {
    // Apply snapping to the point
    let snappedPoint = point;
    let extensionFound = false;
    
    // Create a temporary array that includes both shapes and the current in-progress wall polygon
    const temporaryLines: Shape[] = [...shapes];
    
    // Add the current wall polygon segments as temporary lines for snapping
    if (wallPolygonPoints.length > 1) {
      for (let i = 0; i < wallPolygonPoints.length - 1; i++) {
        temporaryLines.push({
          id: `temp-wall-polygon-${i}`,
          type: 'line',
          start: { ...wallPolygonPoints[i] },
          end: { ...wallPolygonPoints[i + 1] },
          color: currentColor,
          lineWidth: 8
        });
      }
    }
    
    // Check for extension snapping - only if the feature is enabled
    if (snapToExtensions && wallPolygonPoints.length > 0) {
      const lastPoint = wallPolygonPoints[wallPolygonPoints.length - 1];
      const extensionSnap = lineSnappingHelpers.findLineExtensionPoint(lastPoint, point, temporaryLines);
      if (extensionSnap) {
        snappedPoint = extensionSnap.point;
        extensionFound = true;
      }
    }
    
    // First check if we can snap to a line and extension wasn't found
    if (!extensionFound && snapToLines) {
      const lineSnap = lineSnappingHelpers.findNearestPointOnAnyLine(point, shapes);
      if (lineSnap) {
        snappedPoint = lineSnap.point;
      }
    }
    
    // Then check endpoint snapping (this takes priority)
    const endpointSnap = findNearestEndpoint(snappedPoint);
    if (endpointSnap) {
      snappedPoint = endpointSnap;
    } 
    
    // Apply angle snapping - removed condition to allow both to work together
    if (snapToAngle && wallPolygonPoints.length > 0) {
      // Apply angle snapping from the last polygon point
      const lastPoint = wallPolygonPoints[wallPolygonPoints.length - 1];
      const angleSnappedPoint = snapAngleToGrid(lastPoint, snappedPoint);
      
      // Only use the angle-snapped point if it's close enough to our snapped point
      const distToSnapped = Math.sqrt(
        Math.pow(angleSnappedPoint.x - snappedPoint.x, 2) + 
        Math.pow(angleSnappedPoint.y - snappedPoint.y, 2)
      );
      
      // Only apply if reasonably close to current point or very close to extension point
      if (distToSnapped < 20 || (extensionFound && distToSnapped < 5)) {
        snappedPoint = angleSnappedPoint;
      }
    }
    
    // If we don't have any points yet, add this as the first point
    if (wallPolygonPoints.length === 0) {
      setWallPolygonPoints([snappedPoint]);
      setIsDrawing(true);
    } else {
      // If we already have points, check if this is a double-click (close to last point)
      const lastPoint = wallPolygonPoints[wallPolygonPoints.length - 1];
      const distance = Math.sqrt(
        Math.pow(snappedPoint.x - lastPoint.x, 2) + 
        Math.pow(snappedPoint.y - lastPoint.y, 2)
      );
      
      if (distance < 10) {
        // Double-click detected, complete the wall polygon
        completeWallPolygon();
      } else {
        // Add this as a new point
        setWallPolygonPoints([...wallPolygonPoints, snappedPoint]);
        // Clear extension line after adding a point
        setExtensionLine(null);
      }
    }
  };

  // Extract line completion logic for reuse
  const completeLine = (endPoint: Point) => {
    if (!startPoint) return;

    // First check for extension snapping - only if the feature is enabled
    let finalEndpoint = endPoint;
    let extensionFound = false;
    
    if (snapToExtensions) {
      const extensionSnap = lineSnappingHelpers.findLineExtensionPoint(startPoint, endPoint, shapes);
      if (extensionSnap) {
        finalEndpoint = extensionSnap.point;
        // Clear the extension line after using it
        setExtensionLine(null);
        extensionFound = true;
      }
    }
    
    // If not extension snapped, check line snapping
    if (!extensionFound && snapToLines) {
      const lineSnap = lineSnappingHelpers.findNearestPointOnAnyLine(endPoint, shapes);
      if (lineSnap) {
        finalEndpoint = lineSnap.point;
      }
    }
    
    // Apply endpoint snapping for the final point if needed (takes priority)
    const snappedEndpoint = findNearestEndpoint(finalEndpoint);
    if (snappedEndpoint) {
      finalEndpoint = snappedEndpoint;
    } 
    
    // Apply angle snapping - removed condition to allow both to work together
    if (snapToAngle) {
      const snappedAnglePoint = snapAngleToGrid(startPoint, finalEndpoint);
      
      // Only use the angle-snapped point if it's close enough to our current endpoint
      const distToSnapped = Math.sqrt(
        Math.pow(snappedAnglePoint.x - finalEndpoint.x, 2) + 
        Math.pow(snappedAnglePoint.y - finalEndpoint.y, 2)
      );
      
      // Only apply if reasonably close to current point or very close to extension point
      if (distToSnapped < 20 || (extensionFound && distToSnapped < 5)) {
        finalEndpoint = snappedAnglePoint;
      }
    }

    const newLine = {
      id: generateId(),
      type: 'line' as const,
      start: { ...startPoint },
      end: finalEndpoint,
      color: currentColor,
      lineWidth: 8, // Make the line thicker
      strokeColor: '#000000' // Black border color
    };
    
    setShapes([...shapes, newLine]);
    setStartPoint(null);
    setPreviewLine(null);
    setIsDrawing(false);
  };
  
  // Handle rectangle tool with click mode
  const handleRectangleToolClick = (point: Point) => {
    if (!startPoint) {
      // First click - set start point
      setStartPoint(point);
      setCurrentPoint(point); // Initialize current point to same as start
      setIsDrawing(true);
    } else {
      // Second click - complete the rectangle
      const newRectangle = {
        id: generateId(),
        type: 'rectangle' as const,
        start: { ...startPoint },
        end: point,
        color: 'transparent', // Make the border transparent
        fillColor: activeTool === 'green-rectangle' ? greenFillColor : fillColor
      };
      
      setShapes([...shapes, newRectangle]);
      setStartPoint(null);  // Reset start point
      setCurrentPoint(null); // Reset current point
      setIsDrawing(false);  // End drawing mode
    }
  };
  
  // Handle polygon tool mouse down
  const handlePolygonToolMouseDown = (point: Point) => {
    // Apply endpoint snapping for yellow/green polygons
    let snappedPoint = point;
    let isSnappingToFirstPoint = false;
    
    // Check if we need to snap to the first point (red dot) to close the polygon
    if (polygonPoints.length > 2) {
      const firstPoint = polygonPoints[0];
      const distToFirst = Math.sqrt(
        Math.pow(snappedPoint.x - firstPoint.x, 2) + 
        Math.pow(snappedPoint.y - firstPoint.y, 2)
      );
      
      // If close to the starting point, snap to it and remember we're snapping
      if (distToFirst < snapDistance) {
        isSnappingToFirstPoint = true;
        snappedPoint = { ...firstPoint };
      }
    }
    
    // First check endpoint snapping if not snapping to first point
    if (!isSnappingToFirstPoint) {
      const endpointSnap = findNearestEndpoint(snappedPoint);
      if (endpointSnap) {
        snappedPoint = endpointSnap;
      }
    }
    
    if (polygonPoints.length === 0) {
      // First point of a new polygon
      setPolygonPoints([snappedPoint]);
    } else {
      // For subsequent points, apply angle snapping if enabled
      let finalPoint = snappedPoint;
      
      if (snapToAngle) {
        const lastPoint = polygonPoints[polygonPoints.length - 1];
        
        // If we're snapping to the first point to close the polygon, and angle snapping is enabled,
        // we need to handle the special case to maintain the 90-degree constraint
        if (isSnappingToFirstPoint) {
          // Get first point
          const firstPoint = polygonPoints[0];
          
          // Now create a point that is at the first point's coordinates
          // This ensures the polygon closes perfectly
          finalPoint = { ...firstPoint };
          
          // We'll let the completePolygon function handle the actual closing
        } else {
          // Normal angle snapping for non-closing points - use 90-degree snapping
          const angleSnappedPoint = snapAngleTo90Degrees(lastPoint, snappedPoint);
          
          // Only use the angle-snapped point if it's close enough to our snapped point
          const distToSnapped = Math.sqrt(
            Math.pow(angleSnappedPoint.x - snappedPoint.x, 2) + 
            Math.pow(angleSnappedPoint.y - snappedPoint.y, 2)
          );
          
          // Apply the angle snap if it's reasonably close to where we clicked
          if (distToSnapped < 20) {
            finalPoint = angleSnappedPoint;
          }
        }
      }
      
      // Check if we're closing the polygon (clicking near the first point)
      const firstPoint = polygonPoints[0];
      const distance = Math.sqrt(Math.pow(finalPoint.x - firstPoint.x, 2) + Math.pow(finalPoint.y - firstPoint.y, 2));
      
      if (polygonPoints.length > 2 && (distance < 10 || isSnappingToFirstPoint)) {
        // Close the polygon and save it - use the exact first point coordinates for perfect closure
        const closedPolygonPoints = [...polygonPoints.slice(0, -1), firstPoint];
        setPolygonPoints(closedPolygonPoints);
        completePolygon();
      } else {
        // Add a new point to the polygon
        setPolygonPoints([...polygonPoints, finalPoint]);
      }
    }
  };

  // Handle dragging shapes
  const handleDragMove = (point: Point) => {
    if (!selectedShape) return;

    const updatedShapes = shapes.map(shape => {
      if (shape.id === selectedShape.id) {
        if (shape.type === 'line') {
          const dx = point.x - dragOffset.x;
          const dy = point.y - dragOffset.y;
          const originalDx = shape.end.x - shape.start.x;
          const originalDy = shape.end.y - shape.start.y;
          
          return {
            ...shape,
            start: { x: dx, y: dy },
            end: { x: dx + originalDx, y: dy + originalDy }
          };
        } else if (shape.type === 'rectangle') {
          return {
            ...shape,
            start: { 
              x: point.x - dragOffset.x, 
              y: point.y - dragOffset.y 
            },
            end: {
              x: point.x - dragOffset.x + (shape.end.x - shape.start.x),
              y: point.y - dragOffset.y + (shape.end.y - shape.start.y)
            }
          };
        } else if (shape.type === 'polygon') {
          // Move all points of the polygon
          const dx = point.x - dragOffset.x;
          const dy = point.y - dragOffset.y;
          dragOffset.x = point.x;
          dragOffset.y = point.y;
          
          return {
            ...shape,
            points: shape.points.map(point => ({
              x: point.x + dx,
              y: point.y + dy
            }))
          };
        }
      }
      return shape;
    });
    
    setShapes(updatedShapes);
    setSelectedShape(updatedShapes.find(shape => shape.id === selectedShape.id) || null);
  };

  // Handle mouse up event
  const endDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    // Clear the mouse down timer if it exists
    if (mouseDownTimer !== null) {
      window.clearTimeout(mouseDownTimer);
      setMouseDownTimer(null);
    }
    
    // End underlay dragging if active
    if (isDraggingUnderlay) {
      setIsDraggingUnderlay(false);
      return;
    }
    
    // End panning if we were panning
    if (isPanning) {
      setIsPanning(false);
      setPanStart(null);
      return;
    }
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - canvasOffset.x;
    const y = e.clientY - rect.top - canvasOffset.y;
    
    const point: Point = { x, y };
    
    if ((activeTool === 'yellow-rectangle' || activeTool === 'green-rectangle') && rectangleDrawMode === 'drag' && startPoint) {
      // Complete rectangle on mouse up with no border
      const newRectangle = {
        id: generateId(),
        type: 'rectangle' as const,
        start: { ...startPoint },
        end: point,
        color: 'transparent', // Make the border transparent
        fillColor: activeTool === 'green-rectangle' ? greenFillColor : fillColor
      };
      
      setShapes([...shapes, newRectangle]);
      setIsDrawing(false);
      setStartPoint(null);
    }
    
    setIsDragging(false);
    setMouseMoved(false);
    setPanStart(null);
  };

  // Delete selected shape
  const deleteSelected = () => {
    if (selectedShape) {
      setShapes(shapes.filter(shape => shape.id !== selectedShape.id));
      setSelectedShape(null);
    }
  };

  // Clear the canvas
  const clearCanvas = () => {
    setShapes([]);
    setSelectedShape(null);
    setPolygonPoints([]);
    setWallPolygonPoints([]);
    setStartPoint(null);
    setCurrentPoint(null);
    setIsDrawing(false);
    setPreviewLine(null);
    setCanvasOffset({ x: 0, y: 0 }); // Reset canvas panning
  };

  // Toggle snap to angle
  const toggleSnapToAngle = () => {
    setSnapToAngle(!snapToAngle);
  };

  // Toggle snap to endpoints
  const toggleSnapToEndpoints = () => {
    setSnapToEndpoints(!snapToEndpoints);
  };
  
  // Toggle snap to lines
  const toggleSnapToLines = () => {
    setSnapToLines(!snapToLines);
  };

  // Toggle snap to extensions
  const toggleSnapToExtensions = () => {
    setSnapToExtensions(!snapToExtensions);
  };

  // Toggle rectangle drawing mode
  const toggleRectangleDrawMode = () => {
    setRectangleDrawMode(rectangleDrawMode === 'click' ? 'drag' : 'click');
  };

  // Handle keyboard events for polygon escape and enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If escape key is pressed, cancel the current drawing operation
      if (e.key === 'Escape') {
        cancelDrawing();
        return;
      }
      
      // If we're in polygon drawing mode with at least 3 points
      if ((activeTool === 'yellow-polygon' || activeTool === 'green-polygon') && polygonPoints.length >= 3) {
        if (e.key === 'Enter') {
          // Close the polygon on Enter
          completePolygon();
        }
      }
      
      // If we're in wall polygon drawing mode with at least 2 points
      if (activeTool === 'wall-polygon' && wallPolygonPoints.length >= 2) {
        if (e.key === 'Enter') {
          // Complete the wall polygon on Enter
          completeWallPolygon();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTool, polygonPoints, wallPolygonPoints, startPoint, rectangleDrawMode]);

  // Redraw the canvas whenever shapes or selected shapes change
  useEffect(() => {
    redrawCanvas();
  }, [
    shapes,
    selectedShape,
    polygonPoints,
    wallPolygonPoints,
    activeTool,
    startPoint,
    currentPoint,
    previewLine,
    extensionLine,
    canvasOffset,
    underlayImage,
    underlayPosition,
    underlayScale,
    underlayOpacity
  ]);
  
  // Update the underlayImage effect to not automatically resize the canvas
  useEffect(() => {
    const handleResize = () => {
      // We no longer resize the canvas based on the image
      // The image will be contained within the underlayRect
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [underlayImage, canvasSize.width]);

  return {
    canvasRef,
    activeTool,
    setActiveTool,
    currentColor,
    setCurrentColor,
    fillColor,
    setFillColor,
    startDrawing,
    draw,
    endDrawing,
    deleteSelected,
    clearCanvas,
    canvasSize,
    adjustCanvasSize,
    cancelDrawing,
    snapToAngle,
    toggleSnapToAngle,
    snapToEndpoints,
    toggleSnapToEndpoints,
    snapToLines,
    toggleSnapToLines,
    snapToExtensions,
    toggleSnapToExtensions,
    rectangleDrawMode,
    // Underlay image controls
    underlayImage,
    addUnderlayImage,
    removeUnderlayImage,
    underlayScale,
    adjustUnderlayScale,
    underlayOpacity,
    adjustUnderlayOpacity
  };
};
