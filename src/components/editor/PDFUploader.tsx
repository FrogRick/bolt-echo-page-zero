import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileImage, Upload } from "lucide-react";

interface PDFUploaderProps {
  onUpload: (file: File) => void;
  multipleUploads?: boolean;
}

const PDFUploader = ({
  onUpload,
  multipleUploads = false
}: PDFUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    console.log("🔍 PDFUploader - handleFileChange triggered", files ? files.length : 0, "files");
    
    if (files && files.length > 0) {
      console.log("🔍 PDFUploader - File selected:", files[0].name, files[0].type, files[0].size);
      setUploadFeedback(`Selected file: ${files[0].name}`);
      
      // For now we only handle the first file, but UI makes it clear multiple can be uploaded
      validateAndUploadFile(files[0]);
      
      // Let users know more PDFs can be added later
      if (files.length > 1) {
        toast({
          title: "Multiple files selected",
          description: "First PDF will be uploaded now. You can add additional PDFs later from the top menu.",
          duration: 5000
        });
      }
    }
  };
  
  const validateAndUploadFile = useCallback((file: File) => {
    console.log("🔍 PDFUploader - Validating file:", file.name, file.type);
    setUploadFeedback(`Validating file: ${file.name}...`);
    
    if (file.type !== "application/pdf" && !file.type.startsWith("image/")) {
      console.error("🚫 PDFUploader - Invalid file type:", file.type);
      setUploadFeedback(`Error: Invalid file type - ${file.type}. Please use PDF or image files.`);
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or image file.",
        variant: "destructive"
      });
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      console.error("🚫 PDFUploader - File too large:", file.size);
      setUploadFeedback(`Error: File too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maximum size is 10MB.`);
      toast({
        title: "File too large",
        description: "File size should be less than 10MB.",
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    setUploadFeedback(`Uploading: ${file.name}...`);

    // Create a copy of the file to ensure proper handling
    const fileBlob = new Blob([file], { type: file.type });
    const newFile = new File([fileBlob], file.name, { type: file.type });
    console.log("🔍 PDFUploader - File validated, creating new file object:", newFile.name, newFile.type);

    // Simulate a slight delay to show uploading state
    setTimeout(() => {
      try {
        console.log("⬆️ PDFUploader - Calling onUpload with file:", newFile.name);
        onUpload(newFile);
        setIsUploading(false);
        setUploadFeedback(`Upload complete: ${newFile.name}`);
        console.log("✅ PDFUploader - Upload complete");
        
        toast({
          title: "File uploaded successfully",
          description: `${file.name} has been uploaded.`,
          variant: "success"
        });
      } catch (error) {
        console.error("🚫 PDFUploader - Upload error:", error);
        setIsUploading(false);
        setUploadFeedback(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        toast({
          title: "Upload failed",
          description: "There was a problem with your upload.",
          variant: "destructive"
        });
      }
    }, 500);
  }, [onUpload, toast]);
  
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
    console.log("🔍 PDFUploader - File dropped");
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      console.log("🔍 PDFUploader - File dropped:", files[0].name, files[0].type);
      setUploadFeedback(`Dropped file: ${files[0].name}`);
      validateAndUploadFile(files[0]);
      
      // Let users know more PDFs can be added later
      if (files.length > 1) {
        toast({
          title: "Multiple files detected",
          description: "First file will be uploaded now. You can add additional files later from the top menu.",
          duration: 5000
        });
      }
    }
  };
  
  return (
    <div 
      onDragOver={handleDragOver} 
      onDragLeave={handleDragLeave} 
      onDrop={handleDrop} 
      className={`flex flex-col items-center justify-center w-full h-full max-w-2xl mx-auto p-8 rounded-lg border-4 border-dashed ${isDragging ? 'border-primary bg-primary/10' : 'border-gray-300'} transition-colors duration-200`}
    >
      <div className="text-center max-w-md p-8">
        <div className={`p-4 rounded-full ${isUploading ? 'bg-blue-100 animate-pulse' : 'bg-primary/10'} mx-auto mb-6 w-20 h-20 flex items-center justify-center`}>
          {isUploading ? (
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          ) : (
            <div className="flex">
              <FileImage className="w-8 h-8 text-primary" />
            </div>
          )}
        </div>
        
        <h2 className="text-3xl font-bold mb-3">Upload Your File</h2>
        <p className="text-gray-600 mb-6 text-base">
          Upload a PDF of your floor plan or an image to start creating your evacuation plan. 
          We'll help you add walls, doors, and safety symbols.
        </p>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept=".pdf,application/pdf,image/jpeg,image/png,image/jpg" 
        />
        
        <Button 
          onClick={() => {
            console.log("🔍 PDFUploader - Add Image button clicked");
            fileInputRef.current?.click();
          }} 
          className="mb-4 px-8 py-6 text-lg w-full relative overflow-hidden" 
          size="lg" 
          disabled={isUploading}
        >
          <Upload className="mr-2 h-5 w-5" /> 
          {isUploading ? 'Uploading...' : 'Add Image'}
          
          {/* Add a pulsing effect to draw attention */}
          <span className="absolute inset-0 bg-white/20 animate-pulse-slow rounded-md"></span>
        </Button>
        
        {/* Feedback area */}
        {uploadFeedback && (
          <div className={`mt-4 p-3 rounded-md text-sm ${uploadFeedback.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
            {uploadFeedback}
          </div>
        )}
        
        <div className="flex flex-col mt-6 space-y-1">
          <p className="text-xs text-gray-500">
            Supported file types: PDF, JPG, PNG
          </p>
          <p className="text-xs text-gray-500">
            Maximum file size: 10MB per file
          </p>
        </div>
      </div>
    </div>
  );
};

export default PDFUploader;
