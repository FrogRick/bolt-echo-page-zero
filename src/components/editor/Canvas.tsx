import React, { useEffect, useState, useRef } from "react";
import { useCanvasEditor } from "@/hooks/useCanvasEditor";
import { Tool } from "@/types/canvas";
import { Toolbar } from "./Toolbar";
import { Toggle } from "@/components/ui/toggle";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { FileImage, Upload, X, ImageIcon, FileIcon, Square } from "lucide-react";

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
    rectangleDrawMode,
    isDrawing
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

  // FIXED: Improved mouse event handling to accurately track coordinates
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    // Calculate the correct coordinates relative to the canvas
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    console.log("Canvas MouseDown", { x, y, activeTool });
    
    // Pass the correct coordinates to the startDrawing function
    startDrawing(e, x, y);
    
    // Prevent default actions if we're drawing
    if (activeTool !== 'select') {
      e.preventDefault();
    }
  };
  
  // FIXED: Improved mouse move event handling
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    // Calculate the correct coordinates relative to the canvas
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    // Pass the correct coordinates to the draw function
    draw(e, x, y);
    
    // Prevent default actions if we're drawing
    if (isDrawing) {
      e.preventDefault();
    }
  };
  
  // FIXED: Improved mouse up/leave event handling
  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    endDrawing();
  };
  
  const handleCanvasMouseLeave = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // End drawing when mouse leaves canvas
    endDrawing();
  };

  // Add keyboard event handler for escape key to cancel drawing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawing) {
        console.log("Escape pressed, canceling drawing");
        endDrawing();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawing, endDrawing]);

  // Render PDF using canvas rather than iframe
  const renderPdfToCanvas = async (file: File, image: CanvasImage) => {
    try {
      // We'll use pdf.js to render PDFs onto a canvas
      // This is a placeholder for the actual implementation
      // In a real implementation, you would use the pdf.js library
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
        
        {/* Add status indicator for drawing state */}
        {isDrawing && (
          <div className="ml-2 px-3 py-1 bg-yellow-100 border border-yellow-300 rounded text-sm flex items-center">
            <Square className="w-3 h-3 mr-1" />
            Drawing in progress... (ESC to cancel)
          </div>
        )}
        
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
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseLeave}
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
