
import React, { useState, useEffect, useRef } from "react";
import { PDFSection } from "./PDFSection";
import SymbolsPalette from "./SymbolsPalette"; // Updated to use default import
import { WorkflowSteps } from "./WorkflowSteps";
import { WorkflowProgress } from "./WorkflowProgress";
import { ModeSelection } from "./ModeSelection";
import { ManualWallDrawing } from "./ManualWallDrawing";
import { ExportOptions } from "./ExportOptions";
import { useEditorActions } from "@/hooks/useEditorActions";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { EvacuationSymbolsPalette } from "./EvacuationSymbolsPalette";

export const EditorContainer = (props) => {
  const { toast } = useToast();
  const pdfCanvasRef = useRef(null);
  const editorActions = useEditorActions(
    null, // project
    props.symbols, 
    props.pdfFile,
    () => {}, // saveProject (we'll use dummy function as we're not using it here)
    props.setSymbols,
    props.setIsSaved || (() => {}), // provide fallback if not available
    props.setPdfFile
  );
  const navigate = useNavigate();
  const location = useLocation();
  const { user, subscription } = useAuth();

  // Check if we're in the export stage and user is not logged in
  useEffect(() => {
    if (props.currentStage === 'export' && !user) {
      // Store the current path to redirect back after subscription
      sessionStorage.setItem("subscriptionRedirect", location.pathname);
      
      toast({
        title: "Subscription Required",
        description: "Please subscribe to export your evacuation plan",
      });
    }
  }, [props.currentStage, user, location.pathname, toast]);

  // Function to handle stage changes with authentication checks
  const handleStageChange = (stage) => {
    // If trying to access export stage but not logged in
    if (stage === 'export' && !user) {
      // Store the current path to redirect back after subscription
      sessionStorage.setItem("subscriptionRedirect", location.pathname);
      
      toast({
        title: "Subscription Required",
        description: "Please subscribe to export your evacuation plan",
      });
      
      // Redirect to pricing page
      navigate("/pricing");
      return;
    }
    
    // Otherwise proceed with normal stage change
    props.setCurrentStage(stage);
  };

  // Render appropriate stage content
  const renderStageContent = () => {
    switch (props.currentStage) {
      case 'choose_mode':
        return (
          <ModeSelection
            onModeSelect={(useManualWalls) => {
              props.setUseManualWalls(useManualWalls);
              props.setCurrentStage(useManualWalls ? 'draw_walls' : 'place_symbols');
            }}
          />
        );
      
      case 'draw_walls':
        return (
          <ManualWallDrawing
            isActive={props.drawingWallMode}
            onDrawingModeToggle={props.setDrawingWallMode}
            wallThickness={props.wallThickness}
            onWallThicknessChange={props.setWallThickness}
            snapToAngle={props.snapToAngle}
            onSnapToAngleToggle={props.setSnapToAngle}
            snapToWalls={props.snapToWalls}
            onSnapToWallsToggle={props.setSnapToWalls}
          />
        );
      
      case 'place_symbols':
        return (
          <EvacuationSymbolsPalette
            activeSymbolType={props.activeSymbolType}
            onSymbolSelect={props.setActiveSymbolType}
          />
        );
      
      case 'export':
        // If not logged in, show subscription required message
        if (!user) {
          return (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Subscription Required</h2>
              <p className="mb-4">To export your evacuation plan, you need to subscribe to one of our plans.</p>
              <Button 
                onClick={() => navigate('/pricing')}
                className="w-full"
              >
                View Plans
              </Button>
            </div>
          );
        }
        
        // Otherwise show export options
        return (
          <ExportOptions
            pdfFile={props.pdfFile}
            symbols={props.symbols}
            project={{}}
            exportSettings={props.exportSettings}
            setExportSettings={props.setExportSettings}
            onExport={() => {
              toast({
                title: "Export Complete",
                description: "Your evacuation plan has been exported successfully.",
              });
            }}
            customLogoAllowed={subscription?.tier === 'premium' || subscription?.tier === 'enterprise'}
            qrCodeAllowed={subscription?.tier === 'premium' || subscription?.tier === 'enterprise'}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full max-h-screen">
      {/* Progress indicator */}
      <WorkflowProgress currentStage={props.currentStage} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Main content area - PDF canvas */}
        <div className="flex-1 overflow-auto p-4">
          <PDFSection
            ref={pdfCanvasRef}
            {...props}
          />
        </div>

        {/* Right sidebar - workflow and tools */}
        <div className="w-80 flex-shrink-0 border-l bg-gray-50 overflow-auto">
          <div className="p-4">
            <WorkflowSteps
              currentStage={props.currentStage}
              onStageChange={handleStageChange}
              hasManualWalls={props.useManualWalls}
              canProceed={true}
            />
          </div>
          
          <div className="p-4 border-t">
            {renderStageContent()}
          </div>
        </div>
      </div>
    </div>
  );
};
