
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileText, Upload, Plus } from "lucide-react";

interface PDFUploaderProps {
  onUpload: (file: File) => void;
  multipleUploads?: boolean;
}

const PDFUploader = ({
  onUpload,
  multipleUploads = true
}: PDFUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    toast
  } = useToast();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
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
    if (file.type !== "application/pdf") {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file.",
        variant: "destructive"
      });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      toast({
        title: "File too large",
        description: "PDF file size should be less than 10MB.",
        variant: "destructive"
      });
      return;
    }
    setIsUploading(true);

    // Create a copy of the file to ensure proper handling
    const fileBlob = new Blob([file], {
      type: file.type
    });
    const newFile = new File([fileBlob], file.name, {
      type: file.type
    });
    console.log("Uploading file:", file.name, file.type, file.size);

    // Simulate a slight delay to show uploading state
    setTimeout(() => {
      onUpload(newFile);
      setIsUploading(false);
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
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndUploadFile(files[0]);
      
      // Let users know more PDFs can be added later
      if (files.length > 1) {
        toast({
          title: "Multiple files detected",
          description: "First PDF will be uploaded now. You can add additional PDFs later from the top menu.",
          duration: 5000
        });
      }
    }
  };
  
  return <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`flex flex-col items-center justify-center w-full h-full min-h-[400px] rounded-lg border-2 border-dashed ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'} transition-colors duration-200`}>
      <div className="text-center max-w-md p-8">
        <Upload className={`w-16 h-16 ${isUploading ? 'text-gray-400 animate-pulse' : 'text-primary'} mx-auto mb-4`} />
        <h3 className="text-2xl font-medium mb-4">Upload Floorplan PDF{multipleUploads ? 's' : ''}</h3>
        <p className="text-md text-gray-500 mb-8">
          {multipleUploads ? "Drag and drop your floor plan PDF files here, or click the button below. You can add multiple PDFs to your project." : "Drag and drop your floor plan PDF file here, or click the button below"}
        </p>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,application/pdf" multiple={multipleUploads} />
        <Button onClick={() => fileInputRef.current?.click()} className="mb-4 px-8 py-6 text-lg" size="lg" disabled={isUploading}>
          <FileText className="mr-2 h-5 w-5" /> 
          {isUploading ? 'Uploading...' : multipleUploads ? 'Select PDF Files' : 'Select PDF File'}
        </Button>
        
        {multipleUploads && (
          <div className="mt-4 text-sm text-blue-600 bg-blue-50 p-3 rounded-md">
            <p className="font-medium">Multiple PDFs Support</p>
            <p className="text-xs mt-1">You can upload additional PDFs to this project later from the top menu.</p>
          </div>
        )}
        
        <p className="text-xs text-gray-400 mt-6">
          Maximum file size: 10MB per PDF
        </p>
      </div>
    </div>;
};

export default PDFUploader;
