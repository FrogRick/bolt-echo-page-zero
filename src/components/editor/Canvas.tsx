
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
  selected: boolean;
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

        // Create a new image with default positioning
        const newImage: CanvasImage = {
          id: crypto.randomUUID(),
          file: file,
          url: fileUrl,
          x: 50,
          y: 50,
          width: file.type === "application/pdf" ? 400 : 300,
          height: file.type === "application/pdf" ? 500 : 300,
          selected: true
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
      } catch (error) {
        console.error("❌ Canvas - Error in handleFileUpload:", error);
        toast({
          title: "Upload error",
          description: "There was a problem processing your file",
          variant: "destructive"
        });
        setUploadFeedback(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      } finally {
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
  }, [activeTool, currentColor, fillColor, snapToAngle, snapToEndpoints, snapToLines, snapToExtensions, canvasRef, setActiveTool]);

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
            accept="application/pdf,image/jpeg,image/png" 
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </div>
      
      <div 
        ref={canvasWrapperRef}
        className="flex-grow flex items-center justify-center bg-gray-50 overflow-auto p-4 relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleCanvasClick}
      >
        <div className={`relative shadow-xl ${isDragging ? 'outline-dashed outline-2 outline-blue-400' : ''}`}>
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={endDrawing}
            onMouseLeave={endDrawing}
            className={`bg-white border border-gray-200 ${
              activeTool === "select" 
                ? "cursor-default" 
                : (activeTool === "wall" || activeTool === "wall-polygon" || activeTool === "yellow-polygon" || activeTool === "green-polygon")
                  ? "cursor-crosshair" 
                  : "cursor-crosshair"
            }`}
          />
          
          {/* Render uploaded images/PDFs on top of the canvas */}
          {canvasImages.map(image => (
            <div
              key={image.id}
              className={`absolute border-2 ${image.selected ? 'border-blue-500' : 'border-transparent'}`}
              style={{
                left: `${image.x}px`,
                top: `${image.y}px`,
                width: `${image.width}px`,
                height: `${image.height}px`,
                zIndex: 50,
                cursor: 'move',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <iframe 
                    src={image.url} 
                    title={`PDF ${image.file.name}`}
                    className="w-full h-full border-0"
                  />
                </div>
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
