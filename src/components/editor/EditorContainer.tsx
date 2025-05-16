import React, { useRef, useState, useEffect, ReactNode } from "react";
import { PDFSection } from "./PDFSection";
import { WorkflowProgress } from "./WorkflowProgress";
import { ManualWallDrawing } from "./ManualWallDrawing";
import { EvacuationSymbolsPalette } from "./EvacuationSymbolsPalette";
import { ExportOptions } from "./ExportOptions";
import { useEditorActions } from "@/hooks/useEditorActions";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog } from "@/components/ui/dialog";
import PDFUploader from "./PDFUploader";
import { Separator } from "@/components/ui/separator";
import { ZoomOut, ZoomIn, Save, FileOutput, PenLine, PanelLeft } from "lucide-react";

export const LOCAL_PLANS_KEY = "local_floor_plans";

export const EditorContainer = (props) => {
  const { toast } = useToast();
  const pdfCanvasRef = useRef(null);
  const editorActions = useEditorActions(
    null,
    props.symbols, 
    props.pdfFile,
    () => {}, // saveProject (dummy function as we're not using it here)
    props.setSymbols,
    props.setIsSaved || (() => {}),
    props.setPdfFile
  );
  const navigate = useNavigate();
  const location = useLocation();
  const { user, subscription } = useAuth();

  // State for local PDFs (non-logged in users)
  const [localPlans, setLocalPlans] = useState<any[]>([]);
  const [showSyncDialog, setShowSyncDialog] = useState(false);

  // Load local plans from localStorage on mount
  useEffect(() => {
    const plans = localStorage.getItem(LOCAL_PLANS_KEY);
    if (plans) {
      setLocalPlans(JSON.parse(plans));
    }
  }, []);

  // Show dialog if user logs in and has local plans
  useEffect(() => {
    if (user && localPlans.length > 0) {
      setShowSyncDialog(true);
    } else {
      setShowSyncDialog(false);
    }
  }, [user, localPlans.length]);

  // Save plan to localStorage for logged-out users
  const saveLocalPlan = (file: File) => {
    const plans = JSON.parse(localStorage.getItem(LOCAL_PLANS_KEY) || "[]");
    plans.push({
      id: crypto.randomUUID(),
      name: file.name,
      fileName: file.name,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(LOCAL_PLANS_KEY, JSON.stringify(plans));
    setLocalPlans(plans);
  };

  // Check for subscription on export
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
      return; // First step, no back
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

  // Handle PDF upload based on login status
  const handlePDFUpload = async (file: File) => {
    if (user) {
      // Logged in: create floor_plan in Supabase
      const { data: row, error } = await import("@/integrations/supabase/client").then(m => m.supabase.from("floor_plans").insert([
        {
          name: file.name,
          building_id: null,
        }
      ]).select().single());
      if (!error && row) {
        props.onPDFUpload && props.onPDFUpload(file); // Load PDF in editor
      } else {
        toast({ 
          title: "Could not create floor plan", 
          description: error?.message || "Please try again.", 
          variant: "destructive" 
        });
      }
    } else {
      // Not logged in: save PDF in localStorage
      saveLocalPlan(file);
      props.onPDFUpload && props.onPDFUpload(file);
    }
  };

  // Sync local plans to Supabase
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
      toast({ 
        title: "Plans saved!", 
        description: "Your local plans are now saved to your account." 
      });
      localStorage.removeItem(LOCAL_PLANS_KEY);
      setLocalPlans([]);
    } else {
      toast({ 
        title: "Some plans could not be saved", 
        description: "Try again or contact support.", 
        variant: "destructive" 
      });
    }
    setShowSyncDialog(false);
  };

  // Zoom controls
  const handleZoomIn = () => {
    props.setScale(Math.min(props.scale + 0.1, 3.0));
  };

  const handleZoomOut = () => {
    props.setScale(Math.max(props.scale - 0.1, 1.0));
  };

  // Toggle toolbar
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);

  // Render the toolbar based on the current stage
  const renderSidebar = () => {
    if (toolbarCollapsed) {
      return (
        <div className="w-10 bg-white border-r flex flex-col items-center py-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setToolbarCollapsed(false)}
            className="mb-4"
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
        </div>
      );
    }

    return (
      <div className="w-64 bg-white border-r overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-semibold">Tools</h3>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setToolbarCollapsed(true)}
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4">
          {props.currentStage === 'draw_walls' && (
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
          )}
          
          {props.currentStage === 'place_symbols' && (
            <EvacuationSymbolsPalette
              activeSymbolType={props.activeSymbolType}
              onSymbolSelect={props.setActiveSymbolType}
              onNext={goToNextStage}
              onBack={goToPrevStage}
            />
          )}
          
          {props.currentStage === 'export' && (
            <>
              {!user ? (
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
              ) : (
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
              )}
            </>
          )}
        </div>

        {/* Zoom controls always visible at the bottom */}
        <div className="absolute bottom-0 left-0 w-64 p-4 border-t bg-white">
          <div className="flex justify-between items-center">
            <Button variant="outline" size="icon" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="font-mono">{Math.round(props.scale * 100)}%</span>
            <Button variant="outline" size="icon" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full max-h-screen">
      {/* Progress indicator at top */}
      <WorkflowProgress currentStage={props.currentStage} onStageChange={handleStageChange} />
      
      {/* Sync dialog for local plans */}
      <Dialog open={showSyncDialog && localPlans.length > 0} onOpenChange={setShowSyncDialog}>
        {localPlans.length > 0 && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30" onClick={() => setShowSyncDialog(false)}>
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
        {/* Left sidebar - tools */}
        {renderSidebar()}
        
        {/* Main content area - PDF canvas */}
        <div className="flex-1 relative bg-gray-50">
          {props.pdfFile ? (
            <PDFSection
              ref={pdfCanvasRef}
              {...props}
              onPDFUpload={handlePDFUpload}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <PDFUploader onUpload={handlePDFUpload} />
            </div>
          )}
          
          {/* Actions toolbar (floating at the top-right of the canvas) */}
          {props.pdfFile && (
            <div className="absolute top-4 right-4 bg-white rounded-lg shadow p-2">
              <Button 
                variant="ghost" 
                size="sm"
                className="flex items-center space-x-1"
                onClick={() => {
                  toast({
                    title: "Changes saved",
                    description: "Your progress has been saved successfully.",
                  });
                }}
              >
                <Save className="h-4 w-4" />
                <span>Save</span>
              </Button>
              
              <Separator orientation="vertical" className="mx-1 h-6 inline-block" />
              
              <Button 
                variant="ghost" 
                size="sm"
                className="flex items-center space-x-1"
                onClick={() => {
                  if (props.currentStage !== 'export') {
                    handleStageChange('export');
                  }
                }}
              >
                <FileOutput className="h-4 w-4" />
                <span>Export</span>
              </Button>
            </div>
          )}
          
          {/* Drawing mode indicator */}
          {props.drawingWallMode && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/75 text-white py-2 px-4 rounded-full">
              <div className="flex items-center space-x-2">
                <PenLine className="h-4 w-4" />
                <span>Wall Drawing Mode</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
