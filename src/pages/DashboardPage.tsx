
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { GenericCard } from "@/components/ui/GenericCard";
import { Flame, Building, User, BookCopy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CreateOrganizationForm } from "@/components/organizations/CreateOrganizationForm";
import { CreateBuildingForm } from "@/components/buildings/CreateBuildingForm";
import { CreateEvacuationPlanForm } from "@/components/evacuation-plans/CreateEvacuationPlanForm";
import { CreateTemplateForm } from "@/components/templates/CreateTemplateForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const icons = {
  "evacuation-plans": <Flame className="w-8 h-8 text-primary" />,
  "buildings": <Building className="w-8 h-8 text-primary" />,
  "organizations": <User className="w-8 h-8 text-primary" />,
  "templates": <BookCopy className="w-8 h-8 text-primary" />,
};

const titles = {
  "evacuation-plans": "Evacuation Plans",
  "buildings": "Buildings",
  "organizations": "Organizations",
  "templates": "Templates",
};

const SKELETON_COUNT = 6;

function SkeletonCard() {
  return (
    <div className="animate-pulse bg-gray-100 rounded-lg p-6 h-[220px] flex flex-col justify-between">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-14 w-14 bg-gray-200 rounded-lg" />
        <div className="h-6 w-1/2 bg-gray-200 rounded mb-2 mx-auto" />
        <div className="h-4 w-1/3 bg-gray-200 rounded mb-4 mx-auto" />
      </div>
      <div className="h-4 w-1/4 bg-gray-200 rounded self-center" />
    </div>
  );
}

function EmptyState({
  title,
  description,
  buttonLabel,
  onButtonClick,
  loading
}: {
  title: string;
  description: string;
  buttonLabel: string;
  onButtonClick: () => void;
  loading: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-2xl font-semibold mb-2">{title}</div>
      <div className="text-gray-500 mb-6">{description}</div>
      <Button
        size="lg"
        className="mt-2"
        onClick={onButtonClick}
        disabled={loading}
      >
        {buttonLabel}
      </Button>
    </div>
  );
}

export default function DashboardPage({ typeOverride }: { typeOverride?: string }) {
  const params = useParams<{ type: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  // Determine active type from props, params, or default
  const activeType = typeOverride || params.type || "buildings";
  
  // Dashboard data state
  const [dataMap, setDataMap] = useState<Record<string, any[]>>({
    "buildings": [],
    "organizations": [],
    "templates": [],
    "evacuation-plans": [],
  });
  
  // UI state
  const [showNewModal, setShowNewModal] = useState(false);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({
    "buildings": false,
    "organizations": false,
    "templates": false,
    "evacuation-plans": false,
  });
  const [showSkeletonMap, setShowSkeletonMap] = useState<Record<string, boolean>>({
    "buildings": false,
    "organizations": false,
    "templates": false,
    "evacuation-plans": false,
  });

  // Update URL without reloading when tab changes
  const handleTabChange = (type: string) => {
    if (type !== activeType) {
      navigate(`/${type}`, { replace: true });
    }
  };

  // Helper to set loading state for a specific type
  const setTypeLoading = (type: string, isLoading: boolean) => {
    setLoadingMap(prev => ({ ...prev, [type]: isLoading }));
    
    if (isLoading) {
      // Show skeletons after a delay
      const timer = setTimeout(() => {
        setShowSkeletonMap(prev => ({ ...prev, [type]: true }));
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setShowSkeletonMap(prev => ({ ...prev, [type]: false }));
    }
  };

  // Fetch data for the specified type
  const fetchDataForType = async (type: string) => {
    if (!type) return;
    
    if (loadingMap[type]) return; // Prevent duplicate fetches
    
    setTypeLoading(type, true);
    
    let table = "";
    switch (type) {
      case "buildings": table = "buildings"; break;
      case "organizations": table = "organizations"; break;
      case "templates": table = "templates"; break;
      case "evacuation-plans": table = "floor_plans"; break;
      default: setTypeLoading(type, false); return;
    }
    
    try {
      const { data: rows, error } = await supabase
        .from(table as any)
        .select("*")
        .order("updated_at", { ascending: false });
        
      if (error) {
        console.error(`Error fetching ${table}:`, error);
        toast({
          title: "Error",
          description: `Failed to load ${type}. Please try again.`,
          variant: "destructive",
        });
      } else if (rows) {
        setDataMap(prev => ({ ...prev, [type]: rows }));
      }
    } catch (err) {
      console.error(`Error fetching ${table}:`, err);
    } finally {
      setTypeLoading(type, false);
    }
  };

  // Initial data loading and when activeType changes
  useEffect(() => {
    if (activeType) {
      fetchDataForType(activeType);
    }
  }, [activeType]);

  // --- CREATE handlers ---
  async function handleCreateBuilding(newBuilding: { name: string; description?: string; address?: string }) {
    if (!user) return;
    
    const prevType = activeType;
    setTypeLoading(prevType, true);
    
    const { data: row, error } = await supabase.from("buildings").insert([
      {
        name: newBuilding.name,
        address: newBuilding.address || null,
        owner_id: user.id,
      },
    ]).select().single();
    
    setTypeLoading(prevType, false);
    
    if (!error && row) {
      fetchDataForType(prevType);
      setShowNewModal(false);
    }
  }

  async function handleCreateEvacuationPlan() {
    if (!user) return;
    
    const prevType = activeType;
    setTypeLoading(prevType, true);
    
    try {
      const { data: row, error } = await supabase.from("floor_plans").insert([
        {
          name: "New Evacuation Plan",
          building_id: null,
        },
      ]).select().single();
      
      if (error || !row) {
        toast({
          title: "Error",
          description: "Could not create evacuation plan. Please try again.",
          variant: "destructive",
        });
        setTypeLoading(prevType, false);
        return;
      }
      
      setShowNewModal(false);
      navigate(`/editor/${row.id}`);
    } catch (err) {
      toast({
        title: "Error",
        description: "Unexpected error. Please try again.",
        variant: "destructive",
      });
      setTypeLoading(prevType, false);
    }
  }

  function handleNewClick() {
    setShowNewModal(true);
  }

  return (
    <div>
      <Tabs 
        defaultValue={activeType}
        className="space-y-4"
        value={activeType}
        onValueChange={handleTabChange}
      >
        <div className="flex items-center justify-between mb-6">
          <TabsList className="bg-transparent p-0">
            <TabsTrigger 
              value="buildings" 
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Buildings
            </TabsTrigger>
            <TabsTrigger 
              value="evacuation-plans" 
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Evacuation Plans
            </TabsTrigger>
            <TabsTrigger 
              value="organizations" 
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Organizations
            </TabsTrigger>
            <TabsTrigger 
              value="templates" 
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Templates
            </TabsTrigger>
          </TabsList>
          
          {dataMap[activeType]?.length > 0 && (
            <Button
              variant="default"
              onClick={handleNewClick}
              disabled={loadingMap[activeType]}
            >
              + New {titles[activeType].replace(/s$/, "")}
            </Button>
          )}
        </div>

        {Object.keys(titles).map((type) => (
          <TabsContent key={type} value={type} className="mt-0 pt-0">
            <div className="flex flex-col min-h-[50vh]">
              {loadingMap[type] && showSkeletonMap[type] ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : loadingMap[type] && !showSkeletonMap[type] ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="animate-spin h-8 w-8 text-gray-400" />
                </div>
              ) : !loadingMap[type] && (!dataMap[type] || dataMap[type].length === 0) ? (
                <EmptyState
                  title={`No ${titles[type].toLowerCase()} found`}
                  description={`Get started by adding your first ${titles[type].toLowerCase().replace(/s$/, "")}`}
                  buttonLabel={`+ New ${titles[type].replace(/s$/, "")}`}
                  onButtonClick={handleNewClick}
                  loading={loadingMap[type]}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dataMap[type]?.map((item: any) => (
                    <GenericCard
                      key={item.id}
                      title={item.name}
                      subtitle={item.description || item.address}
                      icon={icons[type]}
                      timestamp={{ label: `Last updated: ${item.updated_at ? new Date(item.updated_at).toLocaleDateString() : ""}` }}
                      type={type as any}
                      onClick={() => navigate(`/editor/${item.id}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {showNewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-visible"
          onClick={e => {
            if (e.target === e.currentTarget) setShowNewModal(false);
          }}
        >
          <div className="w-full max-w-2xl flex justify-center items-center" onClick={e => e.stopPropagation()}>
            <div className="relative w-full max-w-2xl">
              <button
                className="absolute top-4 right-6 text-gray-400 hover:text-gray-600 text-2xl z-10"
                onClick={() => setShowNewModal(false)}
                aria-label="Close"
              >
                ×
              </button>
              {activeType === "buildings" ? (
                <CreateBuildingForm
                  onSuccess={() => {
                    setShowNewModal(false);
                    fetchDataForType(activeType);
                  }}
                  onCancel={() => setShowNewModal(false)}
                />
              ) : activeType === "evacuation-plans" ? (
                <CreateEvacuationPlanForm
                  onSuccess={() => {
                    setShowNewModal(false);
                    fetchDataForType(activeType);
                  }}
                  onCancel={() => setShowNewModal(false)}
                />
              ) : activeType === "organizations" ? (
                <CreateOrganizationForm
                  onSuccess={() => {
                    setShowNewModal(false);
                    fetchDataForType(activeType);
                  }}
                  onCancel={() => setShowNewModal(false)}
                />
              ) : activeType === "templates" ? (
                <CreateTemplateForm
                  onSuccess={() => {
                    setShowNewModal(false);
                    fetchDataForType(activeType);
                  }}
                  onCancel={() => setShowNewModal(false)}
                />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
