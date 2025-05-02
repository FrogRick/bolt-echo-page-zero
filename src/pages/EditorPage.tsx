import { pdfjs } from "react-pdf";
import { EditorContainer } from "@/components/editor/EditorContainer";
import { useEditorState } from "@/hooks/useEditorState";
import { Toaster } from "@/components/ui/toaster";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useProject } from "@/hooks/useProject";
import PDFUploader from "@/components/editor/PDFUploader";
import { useToast } from "@/hooks/use-toast";

// Set PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const EditorPage = () => {
  const { projectId } = useParams<{ projectId: string; }>();
  const editorState = useEditorState();
  const { project, loading, saveProject } = useProject(projectId);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  // Function to handle PDF upload directly from this page
  const handlePDFUpload = (file: File) => {
    if (!project) return;
    
    console.log("PDF upload initiated for file:", file.name);
    
    const reader = new FileReader();
    reader.onload = e => {
      if (e.target?.result) {
        // Create a new PDF entry
        const newPDF = {
          id: crypto.randomUUID(),
          name: file.name,
          data: e.target.result as string,
          createdAt: new Date()
        };
        
        const updatedProject = {
          ...project,
          pdfs: [...(project.pdfs || []), newPDF],
          pdfData: e.target.result as string,
          // Keep compatibility with older code
          updatedAt: new Date()
        };
        
        saveProject(updatedProject);
        editorState.setPdfFile(file);
        
        toast({
          title: "PDF uploaded successfully",
          description: `"${file.name}" has been added to your project.`
        });

        // Make sure the current stage is set correctly
        editorState.setCurrentStage('choose_mode');

        // Make sure we're initialized after uploading
        setIsInitialized(true);
        
        console.log("PDF upload completed and initialized:", isInitialized);
      }
    };
    
    reader.readAsDataURL(file);
  };

  // Ensure we only render the editor after the project has loaded
  useEffect(() => {
    if (!loading && project) {
      console.log("Project loaded, checking for PDFs...");
      
      // Check if there are PDFs in the project
      if (project.pdfs && project.pdfs.length > 0 && !editorState.pdfFile) {
        console.log("Found PDFs in project, loading the first one");
        // Load the first PDF
        const firstPdf = project.pdfs[0];
        const byteString = atob(firstPdf.data.split(',')[1]);
        const mimeString = firstPdf.data.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        
        const blob = new Blob([ab], { type: mimeString });
        const file = new File([blob], firstPdf.name, { type: mimeString });
        
        editorState.setPdfFile(file);
      }

      // If we have PDFs or a pdfFile, initialize the state
      if ((project.pdfs && project.pdfs.length > 0) || editorState.pdfFile) {
        console.log("Setting initialized to true");
        setIsInitialized(true);

        // Make sure we start at the first workflow stage when loading a project
        if (editorState.currentStage === undefined || editorState.currentStage === null) {
          editorState.setCurrentStage('choose_mode');
        }
      } else {
        console.log("No PDFs found in project");
      }
    }
  }, [loading, project, editorState]);

  useEffect(() => {
    console.log("Current initialization state:", isInitialized);
    console.log("Current editor state:", editorState);
  }, [isInitialized, editorState]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading project...</p>
        </div>
      </div>;
  }

  // Show PDF uploader if no PDFs are uploaded yet
  if (project && (!project.pdfs || project.pdfs.length === 0) && !editorState.pdfFile) {
    return <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6 text-center">Upload Floor Plan</h1>
          <p className="text-gray-600 mb-6 text-center">
            To start creating your evacuation plan, please upload a PDF of your floor plan.
          </p>
          <PDFUploader onUpload={handlePDFUpload} multipleUploads={true} />
        </div>
        <Toaster />
      </div>;
  }

  return <>
      <EditorContainer {...editorState} />
      <Toaster />
    </>;
};

export default EditorPage;
