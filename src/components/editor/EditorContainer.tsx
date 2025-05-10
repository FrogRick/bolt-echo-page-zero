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
import { Dialog } from "@/components/ui/dialog";

export const LOCAL_PLANS_KEY = "local_floor_plans";

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

  // Nytt state för icke-inloggade användare
  const [localPdfFile, setLocalPdfFile] = useState<File | null>(null);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [localPlans, setLocalPlans] = useState<any[]>([]);

  // Ladda lokala planer från localStorage vid mount
  useEffect(() => {
    const plans = localStorage.getItem(LOCAL_PLANS_KEY);
    if (plans) {
      setLocalPlans(JSON.parse(plans));
    }
  }, []);

  // När användaren loggar in, visa dialog om det finns lokala planer
  useEffect(() => {
    if (user && localPlans.length > 0) {
      setShowSyncDialog(true);
    } else {
      setShowSyncDialog(false);
    }
  }, [user, localPlans.length]);

  // Spara plan till localStorage för utloggade
  const saveLocalPlan = (file: File) => {
    const plans = JSON.parse(localStorage.getItem(LOCAL_PLANS_KEY) || "[]");
    plans.push({
      id: crypto.randomUUID(),
      name: file.name,
      fileName: file.name,
      createdAt: new Date().toISOString(),
      // Du kan lägga till mer data här om du vill
    });
    localStorage.setItem(LOCAL_PLANS_KEY, JSON.stringify(plans));
    setLocalPlans(plans);
  };

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

  // Navigation helpers
  const goToPrevStage = () => {
    if (props.currentStage === 'draw_walls') {
      // Första steget, ingen back
      return;
    } else if (props.currentStage === 'place_symbols') {
      handleStageChange('draw_walls');
    } else if (props.currentStage === 'review') {
      handleStageChange('place_symbols');
    } else if (props.currentStage === 'export') {
      handleStageChange('review');
    }
  };
  const goToNextStage = () => {
    if (props.currentStage === 'draw_walls') {
      handleStageChange('place_symbols');
    } else if (props.currentStage === 'place_symbols') {
      handleStageChange('review');
    } else if (props.currentStage === 'review') {
      handleStageChange('export');
    }
  };

  // Hantera PDF-upload beroende på inloggning
  const handlePDFUpload = async (file: File) => {
    if (user) {
      // Inloggad: skapa floor_plan i Supabase
      const { data: row, error } = await import("@/integrations/supabase/client").then(m => m.supabase.from("floor_plans").insert([
        {
          name: file.name,
          building_id: null,
        }
      ]).select().single());
      if (!error && row) {
        props.onPDFUpload && props.onPDFUpload(file); // Ladda in PDF i editorn
      } else {
        toast({ title: "Could not create floor plan", description: error?.message || "Please try again.", variant: "destructive" });
      }
    } else {
      // Ej inloggad: spara PDF i localStorage och låt användaren fortsätta
      saveLocalPlan(file);
      setLocalPdfFile(file);
      props.onPDFUpload && props.onPDFUpload(file);
    }
  };

  // Synka lokala planer till Supabase
  const syncLocalPlansToSupabase = async () => {
    const supabase = (await import("@/integrations/supabase/client")).supabase;
    let allSuccess = true;
    for (const plan of localPlans) {
      const { error } = await supabase.from("floor_plans").insert([
        {
          name: plan.name,
          building_id: null,
        }
      ]);
      if (error) allSuccess = false;
    }
    if (allSuccess) {
      toast({ title: "Plans saved!", description: "Your local plans are now saved to your account." });
      localStorage.removeItem(LOCAL_PLANS_KEY);
      setLocalPlans([]);
    } else {
      toast({ title: "Some plans could not be saved", description: "Try again or contact support.", variant: "destructive" });
    }
    setShowSyncDialog(false);
  };

  // Render appropriate stage content
  const renderStageContent = () => {
    switch (props.currentStage) {
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
            onNext={goToNextStage}
            onBack={undefined}
          />
        );
      
      case 'place_symbols':
        return (
          <EvacuationSymbolsPalette
            activeSymbolType={props.activeSymbolType}
            onSymbolSelect={props.setActiveSymbolType}
            onNext={goToNextStage}
            onBack={goToPrevStage}
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
      <WorkflowProgress currentStage={props.currentStage} onStageChange={handleStageChange} />
      <Dialog open={showSyncDialog && localPlans.length > 0} onOpenChange={setShowSyncDialog}>
        {localPlans.length > 0 && (
          <div className="fixed inset-0 flex items-center justify-center z-50" onClick={() => setShowSyncDialog(false)}>
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full relative" onClick={e => e.stopPropagation()}>
              <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl" onClick={() => setShowSyncDialog(false)} aria-label="Close">×</button>
              <h2 className="text-xl font-bold mb-4">Save your local plans?</h2>
              <p className="mb-4">We found {localPlans.length} plan(s) you created before logging in. Do you want to save them to your account?</p>
              <div className="flex gap-4 justify-end">
                <Button variant="outline" onClick={() => { setShowSyncDialog(false); localStorage.removeItem(LOCAL_PLANS_KEY); setLocalPlans([]); }}>No, discard</Button>
                <Button onClick={syncLocalPlansToSupabase}>Yes, save</Button>
              </div>
            </div>
          </div>
        )}
      </Dialog>
      <div className="flex flex-1 overflow-hidden">
        {/* Main content area - PDF canvas */}
        <div className="flex-1 overflow-auto p-4">
          <PDFSection
            ref={pdfCanvasRef}
            {...props}
            onPDFUpload={handlePDFUpload}
          />
        </div>

        {/* Right sidebar - workflow and tools */}
        <div className="w-80 flex-shrink-0 border-l bg-gray-50 overflow-auto">
          <div className="p-4">
            {renderStageContent()}
          </div>
        </div>
      </div>
    </div>
  );
};
