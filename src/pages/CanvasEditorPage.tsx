
import React, { useEffect } from "react";
import Canvas from "@/components/editor/Canvas";
import { useParams, useNavigate } from "react-router-dom";

const CanvasEditorPage: React.FC = () => {
  const { canvasId } = useParams<{ canvasId: string }>();
  const navigate = useNavigate();

  // If there's no canvas ID, generate one and redirect
  useEffect(() => {
    if (!canvasId) {
      const newCanvasId = crypto.randomUUID();
      navigate(`/editor/${newCanvasId}`, { replace: true });
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
      <header className="bg-white border-b px-4 py-3 flex justify-between items-center">
        <h1 className="text-lg font-semibold">Canvas Editor</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Canvas ID: {canvasId.substring(0, 8)}...</span>
        </div>
      </header>
      <div className="flex-grow overflow-hidden">
        <Canvas />
      </div>
    </div>
  );
};

export default CanvasEditorPage;
