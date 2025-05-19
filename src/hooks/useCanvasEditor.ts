
  // Handle mouse move event
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const point: Point = { x, y };
    
    setMouseMoved(true);
    
    // Always update the current point 
    setCurrentPoint(point);
    
    if (isDragging && selectedShape) {
      handleDragMove(point);
    } else if (activeTool === 'wall' && startPoint) {
      // Update the current point for line preview
      redrawCanvas();
    } else if (activeTool === 'wall-polygon' && wallPolygonPoints.length > 0) {
      // For wall-polygon, apply the same snapping as for walls
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
      // Apply angle snapping
      else if (snapToAngle && wallPolygonPoints.length > 0) {
        const lastPoint = wallPolygonPoints[wallPolygonPoints.length - 1];
        snappedPoint = snapAngleToGrid(lastPoint, snappedPoint);
      }
      
      // Update the current point with the snapped position
      setCurrentPoint(snappedPoint);
      redrawCanvas();
    } else if (isDrawing && (activeTool === 'yellow-rectangle' || activeTool === 'green-rectangle') && rectangleDrawMode === 'drag') {
      redrawCanvas();
    } else if ((activeTool === 'yellow-rectangle' || activeTool === 'green-rectangle') && rectangleDrawMode === 'click' && startPoint) {
      // Update preview for click mode rectangle
      redrawCanvas();
    } else if ((activeTool === 'yellow-polygon' || activeTool === 'green-polygon') && polygonPoints.length > 0) {
      // Update the current point for polygon preview
      redrawCanvas();
    }
  };
