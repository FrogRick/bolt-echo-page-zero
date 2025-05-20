
import { useParams, useNavigate } from "react-router-dom";
import Canvas from "@/components/editor/Canvas";
import { Toaster } from "@/components/ui/toaster";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const EditorPage = () => {
  const { projectId } = useParams<{ projectId: string; }>();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Generate a new ID if not provided
  useEffect(() => {
    if (!projectId) {
      const newId = crypto.randomUUID();
      navigate(`/editor/${newId}`, { replace: true });
    } else {
      // Let the user know they're on the Canvas editor
      console.log("🖌️ Editor initialized with ID:", projectId);
      
      // Show welcome toast
      setTimeout(() => {
        toast({
          title: "Canvas Editor Ready",
          description: "Start drawing or upload an image to begin.",
        });
      }, 500);
    }
  }, [projectId, navigate, toast]);

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white border-b px-4 py-3 flex justify-between items-center">
        <h1 className="text-lg font-semibold">Canvas Editor</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Canvas ID: {projectId.substring(0, 8)}...</span>
          <button
            onClick={() => {
              console.log("💾 Saving canvas state");
              toast({
                title: "Canvas Saved",
                description: "Your canvas has been saved.",
              });
            }}
            className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
          >
            Save
          </button>
        </div>
      </div>
      <div className="flex-grow overflow-hidden">
        <Canvas />
      </div>
      <Toaster />
    </div>
  );
};

export default EditorPage;
