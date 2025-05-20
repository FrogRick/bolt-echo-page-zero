
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileText, Upload } from "lucide-react";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    console.log("PDFUploader - handleFileChange triggered", files ? files.length : 0, "files");
    
    if (files && files.length > 0) {
      console.log("PDFUploader - File selected:", files[0].name, files[0].type, files[0].size);
      
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
  
  const validateAndUploadFile = (file: File) => {
    console.log("PDFUploader - Validating file:", file.name, file.type);
    
    if (file.type !== "application/pdf" && !file.type.startsWith("image/")) {
      console.error("PDFUploader - Invalid file type:", file.type);
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or image file.",
        variant: "destructive"
      });
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      console.error("PDFUploader - File too large:", file.size);
      toast({
        title: "File too large",
        description: "File size should be less than 10MB.",
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);

    // Create a copy of the file to ensure proper handling
    const fileBlob = new Blob([file], { type: file.type });
    const newFile = new File([fileBlob], file.name, { type: file.type });
    console.log("PDFUploader - File validated, creating new file object:", newFile.name, newFile.type);

    // Simulate a slight delay to show uploading state
    setTimeout(() => {
      console.log("PDFUploader - Calling onUpload with file:", newFile.name);
      onUpload(newFile);
      setIsUploading(false);
      console.log("PDFUploader - Upload complete");
    }, 500);
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
    console.log("PDFUploader - File dropped");
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      console.log("PDFUploader - File dropped:", files[0].name, files[0].type);
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
      className={`flex flex-col items-center justify-center w-full h-full max-w-2xl mx-auto p-8 rounded-lg border-2 border-dashed ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'} transition-colors duration-200`}
    >
      <div className="text-center max-w-md p-8">
        <div className={`p-4 rounded-full ${isUploading ? 'bg-gray-100 animate-pulse' : 'bg-primary/10'} mx-auto mb-6 w-20 h-20 flex items-center justify-center`}>
          <Upload className={`w-10 h-10 ${isUploading ? 'text-gray-400' : 'text-primary'}`} />
        </div>
        
        <h2 className="text-3xl font-bold mb-3">Start with a floor plan</h2>
        <p className="text-gray-600 mb-8 text-base">
          Upload a PDF of your floor plan to start creating your evacuation plan. 
          We'll help you add walls, doors, and safety symbols.
        </p>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept=".pdf,application/pdf,image/jpeg,image/png" 
        />
        
        <Button 
          onClick={() => {
            console.log("PDFUploader - Select file button clicked");
            fileInputRef.current?.click();
          }} 
          className="mb-4 px-8 py-6 text-lg w-full" 
          size="lg" 
          disabled={isUploading}
        >
          <FileText className="mr-2 h-5 w-5" /> 
          {isUploading ? 'Uploading...' : 'Select PDF or Image'}
        </Button>
        
        <p className="text-xs text-gray-400 mt-6">
          Maximum file size: 10MB per file
        </p>
      </div>
    </div>
  );
};

export default PDFUploader;
