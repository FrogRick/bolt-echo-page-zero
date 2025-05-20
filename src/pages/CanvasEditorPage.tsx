
import { useParams, useNavigate } from "react-router-dom";
import Canvas from "@/components/editor/Canvas";
import { Toaster } from "@/components/ui/toaster";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const CanvasEditorPage = () => {
  const { canvasId } = useParams<{ canvasId: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Generate a new ID if not provided
  useEffect(() => {
    if (!canvasId) {
      const newId = crypto.randomUUID();
      navigate(`/editor/${newId}`, { replace: true });
    }
  }, [canvasId, navigate]);

  if (!canvasId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-grow overflow-hidden">
        <Canvas />
      </div>
      <Toaster />
    </div>
  );
};

export default CanvasEditorPage;
