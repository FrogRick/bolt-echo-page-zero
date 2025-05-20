import React, { useEffect, useState, useRef } from "react";
import { useCanvasEditor } from "@/hooks/useCanvasEditor";
import { Tool } from "@/types/canvas";
import { Toolbar } from "./Toolbar";
import { Toggle } from "@/components/ui/toggle";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { FileImage, Upload, X, ImageIcon, FileIcon } from "lucide-react";

// Define the Image object type for our canvas
interface CanvasImage {
  id: string;
  file: File;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  aspectRatio: number;
  selected: boolean;
  originalWidth: number;
  originalHeight: number;
}

const Canvas: React.FC = () => {
  const {
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
    snapToAngle,
    toggleSnapToAngle,
    snapToEndpoints,
    toggleSnapToEndpoints,
    snapToLines,
    toggleSnapToLines,
    snapToExtensions,
    toggleSnapToExtensions,
    rectangleDrawMode
  } = useCanvasEditor();
  
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const [canvasImages, setCanvasImages] = useState<CanvasImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);

  // Calculate canvas container dimensions
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  
  // Update container dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      if (canvasContainerRef.current) {
        const { width, height } = canvasContainerRef.current.getBoundingClientRect();
        setContainerDimensions({ width, height });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Adjust canvas size when images are added or removed
  useEffect(() => {
    if (canvasImages.length > 0 && containerDimensions.width > 0) {
      // Find the tallest image after it's been scaled to fit container width
      let maxHeight = 0;
      
      canvasImages.forEach(img => {
        // Calculate height when width is scaled to fit container
        const scaleFactor = (containerDimensions.width * 0.9) / img.originalWidth;
        const scaledHeight = img.originalHeight * scaleFactor;
        
        if (scaledHeight > maxHeight) {
          maxHeight = scaledHeight;
        }
      });
      
      // Ensure we have at least a minimum height
      const newHeight = Math.max(maxHeight + 100, 600);
      
      if (canvasRef.current) {
        // Adjust canvas height based on content
        canvasRef.current.height = newHeight;
      }
    }
  }, [canvasImages, containerDimensions]);

  // Render PDF using canvas rather than iframe
  const renderPdfToCanvas = async (file: File, image: CanvasImage) => {
    try {
      // We'll use pdf.js to render PDFs onto a canvas
      const pdfjsLib = await import('pdfjs-dist');
      
      // Set worker source
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      
      // Load the PDF
      const loadingTask = pdfjsLib.getDocument(image.url);
      const pdf = await loadingTask.promise;
      
      // Get the first page
      const page = await pdf.getPage(1);
      
      // Calculate scale to fit container width
      const viewport = page.getViewport({ scale: 1 });
      const scaleFactor = (containerDimensions.width * 0.9) / viewport.width;
      const scaledViewport = page.getViewport({ scale: scaleFactor });
      
      // Update image dimensions
      const updatedImage = {
        ...image,
        width: scaledViewport.width,
        height: scaledViewport.height,
        originalWidth: viewport.width,
        originalHeight: viewport.height,
        aspectRatio: viewport.width / viewport.height
      };
      
      // Update the image in state
      setCanvasImages(prev => 
        prev.map(img => img.id === image.id ? updatedImage : img)
      );
      
      // Render PDF to canvas for preview
      if (pdfCanvasRef.current) {
        const context = pdfCanvasRef.current.getContext('2d');
        if (context) {
          // Adjust canvas size
          pdfCanvasRef.current.width = scaledViewport.width;
          pdfCanvasRef.current.height = scaledViewport.height;
          
          // Render the PDF page
          const renderContext = {
            canvasContext: context,
            viewport: scaledViewport
          };
          
          await page.render(renderContext).promise;
          console.log("PDF rendered to canvas successfully");
        }
      }
      
    } catch (error) {
      console.error("Error rendering PDF:", error);
      toast({
        title: "PDF rendering failed",
        description: "There was a problem displaying the PDF. Try a different file.",
        variant: "destructive"
      });
    }
  };

  // Handle file upload for underlays
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("🔄 Canvas - handleFileUpload triggered with file:", file.name, file.type, file.size);
    setUploadFeedback(`Selected file: ${file.name}`);
    setIsUploading(true);

    // Show immediate visual feedback
    toast({
      title: "Processing file",
      description: `Preparing ${file.name} for upload...`,
    });

    if (file.type === "application/pdf" || file.type.startsWith("image/")) {
      // Process the file
      try {
        // Create a URL for the file
        const fileUrl = URL.createObjectURL(file);
        console.log("📄 Canvas - Created file URL:", fileUrl);
        
        // For images, we need to get the natural dimensions
        const processFile = (width: number, height: number) => {
          // Calculate aspect ratio
          const aspectRatio = width / height;
          
          // Calculate dimensions to fit the container width
          const containerWidth = containerDimensions.width * 0.9; // 90% of container width
          const fitWidth = containerWidth;
          const fitHeight = fitWidth / aspectRatio;
          
          // Create a new image with calculated dimensions
          const newImage: CanvasImage = {
            id: crypto.randomUUID(),
            file: file,
            url: fileUrl,
            x: 20, // Small margin from left
            y: 20, // Small margin from top
            width: fitWidth,
            height: fitHeight,
            aspectRatio: aspectRatio,
            selected: true,
            originalWidth: width,
            originalHeight: height
          };

          // Add the image to our state
          setCanvasImages(prev => {
            // Deselect any previously selected images
            const updatedPrev = prev.map(img => ({...img, selected: false}));
            return [...updatedPrev, newImage];
          });
          setSelectedImageId(newImage.id);
          
          // Show success feedback
          toast({
            title: "File uploaded",
            description: `${file.name} has been added to canvas`,
            variant: "success",
          });
          
          setUploadFeedback(`Upload complete: ${file.name}`);
          setTimeout(() => setUploadFeedback(null), 3000);

          // If this is a PDF, render it properly
          if (file.type === "application/pdf") {
            renderPdfToCanvas(file, newImage);
          }
        };
        
        if (file.type.startsWith("image/")) {
          // For images, load to get natural dimensions
          const img = new Image();
          img.onload = () => {
            processFile(img.naturalWidth, img.naturalHeight);
            setIsUploading(false);
          };
          img.onerror = (error) => {
            console.error("❌ Canvas - Error loading image:", error);
            setIsUploading(false);
            throw new Error("Failed to load image");
          };
          img.src = fileUrl;
        } else {
          // For PDFs, use default dimensions as a starting point
          // We'll update these later when we render the PDF
          processFile(800, 1100); // Standard PDF size ratio
          setIsUploading(false);
        }
      } catch (error) {
        console.error("❌ Canvas - Error in handleFileUpload:", error);
        toast({
          title: "Upload error",
          description: "There was a problem processing your file",
          variant: "destructive"
        });
        setUploadFeedback(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        setIsUploading(false);
      }
    } else {
      setIsUploading(false);
      setUploadFeedback(`Error: Invalid file type - ${file.type}. Please use PDF or image files.`);
      toast({
        title: "Unsupported file type",
        description: "Only PDF, JPEG, and PNG files are supported",
        variant: "destructive"
      });
    }
    
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      console.log("🔄 Canvas - File dropped:", file.name, file.type);
      
      // Create a fake event to reuse the existing handler
      const fakeEvent = {
        target: {
          files: [file]
        }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      
      handleFileUpload(fakeEvent);
    }
  };

  // Select an image when clicked
  const handleImageClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCanvasImages(prev => 
      prev.map(img => ({
        ...img,
        selected: img.id === id
      }))
    );
    setSelectedImageId(id);
  };

  // Start dragging an image
  const handleImageMouseDown = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Ensure the image is selected
    if (selectedImageId !== id) {
      handleImageClick(id, e);
    }
    
    // Get the selected image
    const image = canvasImages.find(img => img.id === id);
    if (!image) return;
    
    // Set up the drag operation
    const startX = e.clientX;
    const startY = e.clientY;
    const startImgX = image.x;
    const startImgY = image.y;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      
      setCanvasImages(prev => 
        prev.map(img => 
          img.id === id 
            ? { ...img, x: startImgX + dx, y: startImgY + dy }
            : img
        )
      );
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Remove an image from the canvas
  const handleImageRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCanvasImages(prev => prev.filter(img => img.id !== id));
    if (selectedImageId === id) {
      setSelectedImageId(null);
    }
    toast({
      title: "Image removed",
      description: "The image has been removed from the canvas",
    });
  };

  // Handle canvas click - deselect all images
  const handleCanvasClick = () => {
    setCanvasImages(prev => prev.map(img => ({...img, selected: false})));
    setSelectedImageId(null);
  };

  // Force canvas redraw when tool or styling changes to ensure correct rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Force a clean redraw by clearing and triggering the redraw in useCanvasEditor
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // This will trigger the redraw effect in useCanvasEditor
        setActiveTool(activeTool);
      }
    }
  }, [activeTool, currentColor, fillColor, snapToAngle, snapToEndpoints, snapToLines, snapToExtensions, canvasRef, setActiveTool, canvasImages]);

  // Add dynamic import of pdf.js
  useEffect(() => {
    const loadPdfJs = async () => {
      try {
        // Dynamic import of pdf.js
        const pdfjsLib = await import('pdfjs-dist');
        // Set worker source
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        console.log("PDF.js library loaded successfully");
      } catch (error) {
        console.error("Error loading PDF.js:", error);
      }
    };
    
    // Only load if we need it (if we have PDFs)
    if (canvasImages.some(img => img.file.type === "application/pdf")) {
      loadPdfJs();
    }
  }, [canvasImages]);

  // Handle mouse down event
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Fix: Calculate the mouse position correctly, accounting for canvas offset
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Adjust for canvas panning offset
    const adjustedX = x - canvasOffset.x;
    const adjustedY = y - canvasOffset.y;
    
    const point: Point = { x: adjustedX, y: adjustedY };
    setMouseMoved(false);
    
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
        
        if (distToSnapped < 20) { // Apply angle snapping if close to current angle
          // Only set if we didn't find an extension, or if the angle-snapped point
          // is very close to the extension point (meaning they're compatible)
          if (!extensionFound || distToSnapped < 5) {
            setCurrentPoint(snappedAnglePoint);
          }
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
        const distToSnapped = Math.sqrt(
          Math.pow(angleSnappedPoint.x - snappedPoint.x, 2) + 
          Math.pow(angleSnappedPoint.y - snappedPoint.y, 2)
        );
        
        // Only apply the angle snap if it's reasonably close to where we are
        // or very close to the extension point (meaning they're compatible)
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
    if (polygonPoints.length === 0) {
      // First point of a new polygon
      setPolygonPoints([point]);
    } else {
      // Check if we're closing the polygon (clicking near the first point)
      const firstPoint = polygonPoints[0];
      const distance = Math.sqrt(Math.pow(point.x - firstPoint.x, 2) + Math.pow(point.y - firstPoint.y, 2));
      
      if (polygonPoints.length > 2 && distance < 10) {
        // Close the polygon and save it
        completePolygon();
      } else {
        // Add a new point to the polygon
        setPolygonPoints([...polygonPoints, point]);
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
    
    // End panning if we were panning
    if (isPanning) {
      setIsPanning(false);
      setPanStart(null);
      return;
    }
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Fix: Calculate the mouse position correctly
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Adjust for canvas panning offset
    const adjustedX = x - canvasOffset.x;
    const adjustedY = y - canvasOffset.y;
    
    const point: Point = { x: adjustedX, y: adjustedY };
    
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
    canvasOffset
  ]);
  
  return (
    <div className="flex flex-col h-full">
      <Toolbar 
        activeTool={activeTool}
        onToolChange={setActiveTool}
        onDelete={deleteSelected}
        onClear={clearCanvas}
      />
      
      <div className="p-2 bg-white border-b flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label htmlFor="colorPicker" className="text-sm font-medium">Stroke:</label>
          <input
            id="colorPicker"
            type="color"
            value={currentColor}
            onChange={(e) => setCurrentColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="fillColorPicker" className="text-sm font-medium">Fill:</label>
          <input
            id="fillColorPicker"
            type="color"
            value={fillColor}
            onChange={(e) => setFillColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer"
          />
        </div>
        
        <div className="border-l pl-4 flex items-center gap-3">
          <Toggle 
            pressed={snapToEndpoints} 
            onPressedChange={toggleSnapToEndpoints}
            aria-label="Toggle snap to endpoints"
            className="data-[state=on]:bg-blue-500 data-[state=on]:text-white"
          >
            <span className="text-sm">Snap</span>
          </Toggle>
          
          <Toggle 
            pressed={snapToExtensions} 
            onPressedChange={toggleSnapToExtensions}
            aria-label="Toggle snap to extensions"
            className="data-[state=on]:bg-blue-500 data-[state=on]:text-white"
          >
            <span className="text-sm">Extension</span>
          </Toggle>
          
          <Toggle 
            pressed={snapToAngle} 
            onPressedChange={toggleSnapToAngle}
            aria-label="Toggle snap to 45 degree angles"
            className="data-[state=on]:bg-blue-500 data-[state=on]:text-white"
          >
            <span className="text-sm">45°</span>
          </Toggle>
        </div>
        
        {/* Add file upload button for PDFs and images */}
        <div className="ml-auto">
          <Button
            onClick={() => {
              console.log("🖱️ Canvas - Add Image button clicked");
              if (fileInputRef.current) {
                fileInputRef.current.click();
              }
            }}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1 hover:bg-blue-700"
            disabled={isUploading}
          >
            {isUploading ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-1"></div>
            ) : (
              <FileImage className="h-4 w-4" />
            )}
            {isUploading ? "Uploading..." : "Add Image"}
          </Button>
          <input 
            ref={fileInputRef}
            type="file" 
            accept="application/pdf,image/jpeg,image/png,image/gif" 
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </div>
      
      <div 
        ref={canvasWrapperRef}
        className="flex-grow flex items-start justify-center bg-gray-50 overflow-auto p-4 relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleCanvasClick}
      >
        <div 
          ref={canvasContainerRef} 
          className={`relative shadow-xl ${isDragging ? 'outline-dashed outline-2 outline-blue-400' : ''}`}
          style={{ width: '100%', maxWidth: '1200px' }}
        >
          {/* Background images/PDFs */}
          {canvasImages.map(image => (
            <div
              key={image.id}
              className={`absolute ${image.selected ? 'border-2 border-blue-500' : ''}`}
              style={{
                left: `${image.x}px`,
                top: `${image.y}px`,
                width: `${image.width}px`,
                height: `${image.height}px`,
                zIndex: 1,
                cursor: 'move',
              }}
              onClick={(e) => handleImageClick(image.id, e)}
              onMouseDown={(e) => handleImageMouseDown(image.id, e)}
            >
              {image.file.type.startsWith('image/') ? (
                <img 
                  src={image.url} 
                  alt={`Uploaded ${image.file.name}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <canvas
                  ref={image.id === selectedImageId ? pdfCanvasRef : null}
                  width={image.width}
                  height={image.height}
                  className="w-full h-full"
                />
              )}
              
              {/* Show file type indicator and remove button when selected */}
              {image.selected && (
                <>
                  <div className="absolute top-0 left-0 bg-blue-500 text-white px-2 py-1 text-xs flex items-center">
                    {image.file.type.startsWith('image/') ? (
                      <ImageIcon className="w-3 h-3 mr-1" />
                    ) : (
                      <FileIcon className="w-3 h-3 mr-1" />
                    )}
                    {image.file.name}
                  </div>
                  <button
                    className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl"
                    onClick={(e) => handleImageRemove(image.id, e)}
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          ))}
          
          {/* Drawing canvas on top of everything */}
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={endDrawing}
            onMouseLeave={endDrawing}
            className={`bg-transparent w-full absolute top-0 left-0 ${
              activeTool === "select" 
                ? "cursor-default" 
                : (activeTool === "wall" || activeTool === "wall-polygon" || activeTool === "yellow-polygon" || activeTool === "green-polygon")
                  ? "cursor-crosshair" 
                  : "cursor-crosshair"
            }`}
            style={{ zIndex: 10 }}
          />
          
          {/* Drag overlay with instructions */}
          {isDragging && (
            <div className="absolute inset-0 bg-blue-100/20 flex items-center justify-center z-40">
              <div className="bg-white p-4 rounded-lg shadow-lg">
                <Upload className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-blue-800 font-medium">Drop file to upload</p>
              </div>
            </div>
          )}
        </div>
        
        {/* File upload feedback message */}
        {uploadFeedback && (
          <div className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full text-sm ${
            uploadFeedback.includes('Error') 
              ? 'bg-red-100 text-red-700 border border-red-200' 
              : 'bg-blue-100 text-blue-700 border border-blue-200'
          }`}>
            {uploadFeedback}
          </div>
        )}
      </div>
    </div>
  );
};

export default Canvas;
