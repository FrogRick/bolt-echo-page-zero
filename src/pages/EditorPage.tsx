
import { useParams, useNavigate } from "react-router-dom";
import Canvas from "@/components/editor/Canvas";
import { Toaster } from "@/components/ui/toaster";
import { useEffect } from "react";

const EditorPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  // Generate a new ID if not provided
  useEffect(() => {
    if (!projectId) {
      const newId = crypto.randomUUID();
      navigate(`/editor/${newId}`, {
        replace: true
      });
    }
  }, [projectId, navigate]);

  if (!projectId) {
    return <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>;
  }

  return (
    <div className="editor-page-container flex flex-col h-[calc(100vh-64px)]">
      <div className="flex-1 overflow-hidden">
        <Canvas />
      </div>
      <Toaster />
    </div>
  );
};

export default EditorPage;
