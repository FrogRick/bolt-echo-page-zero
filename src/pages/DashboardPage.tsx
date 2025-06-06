
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { DashboardSearch } from "@/components/dashboard/DashboardSearch";

// Icons for card types
const icons = {
  "evacuation-plans": <Flame className="w-8 h-8 text-primary" />,
  "buildings": <Building className="w-8 h-8 text-primary" />,
  "organizations": <User className="w-8 h-8 text-primary" />,
  "templates": <BookCopy className="w-8 h-8 text-primary" />,
};

// Titles for each section
const titles = {
  "evacuation-plans": "Evacuation Plans",
  "buildings": "Buildings",
  "organizations": "Organizations",
  "templates": "Templates",
};

// Map dashboard types to actual Supabase table names
const typeToTable = {
  "buildings": "buildings",
  "organizations": "organizations", 
  "templates": "templates",
  "evacuation-plans": "floor_plans"
} as const;

const SKELETON_COUNT = 6;

// Reusable SkeletonCard component
function SkeletonCard() {
  return (
    <div className="animate-pulse bg-gray-100 rounded-lg p-6 h-40 flex flex-col justify-between">
      <div className="h-6 w-1/2 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-1/3 bg-gray-200 rounded mb-4" />
      <div className="h-4 w-1/4 bg-gray-200 rounded" />
    </div>
  );
}

// EmptyState component
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
  const type = typeOverride || params.type;
  const { user } = useAuth();
  const [showNewModal, setShowNewModal] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [delayedLoading, setDelayedLoading] = useState(false);
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Helper: fetch data from Supabase for the current type
  async function fetchData() {
    setLoading(true);
    
    // Validate type is one of our valid types
    if (!type || !Object.keys(typeToTable).includes(type)) {
      setLoading(false);
      return;
    }
    
    // Get the corresponding table name from our type
    const tableName = typeToTable[type as keyof typeof typeToTable];
    
    try {
      // Now that deleted_at column exists, filter out deleted items
      const { data: rows, error } = await supabase
        .from(tableName)
        .select("*")
        .is('deleted_at', null)
        .order("updated_at", { ascending: false });
        
      if (error) {
        console.error(`Error fetching ${tableName}:`, error);
        toast({
          title: "Error",
          description: `Failed to load ${type}. Please try again.`,
          variant: "destructive",
        });
        setData([]);
      } else if (rows) {
        setData(rows);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error(`Error fetching ${tableName}:`, err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [type]);

  // Filter data based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredData(data);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = data.filter((item) => {
        const name = (item.name || "").toLowerCase();
        const description = (item.description || "").toLowerCase();
        const address = (item.address || "").toLowerCase();
        
        return name.includes(query) || 
               description.includes(query) || 
               address.includes(query);
      });
      setFilteredData(filtered);
    }
  }, [searchQuery, data]);

  useEffect(() => {
    let skeletonTimeout: NodeJS.Timeout;
    let spinnerTimeout: NodeJS.Timeout;
    if (loading) {
      spinnerTimeout = setTimeout(() => setDelayedLoading(true), 400);
      skeletonTimeout = setTimeout(() => setShowSkeleton(true), 400);
    } else {
      setShowSkeleton(false);
      setDelayedLoading(false);
    }
    return () => {
      clearTimeout(skeletonTimeout);
      clearTimeout(spinnerTimeout);
    };
  }, [loading]);

  // Handle search change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  // --- CREATE handlers ---
  async function handleCreateBuilding(newBuilding: { name: string; description?: string; address?: string }) {
    if (!user) return;
    setLoading(true);
    
    const { data: row, error } = await supabase.from("buildings").insert([
      {
        name: newBuilding.name,
        address: newBuilding.address || null,
        owner_id: user.id,
      },
    ]).select().single();
    
    setLoading(false);
    if (!error && row) {
      fetchData();
      setShowNewModal(false);
    }
  }

  async function handleCreateEvacuationPlanAndGoToEditor() {
    if (!user) return;
    setLoading(true);
    try {
      const { data: row, error } = await supabase.from("floor_plans").insert([
        {
          name: "New Evacuation Plan",
          building_id: null,
        },
      ]).select().single();
      if (error || !row) {
        alert("Could not create evacuation plan. Please try again.");
        setLoading(false);
        return;
      }
      setShowNewModal(false);
      navigate(`/editor/${row.id}`);
    } catch (err) {
      alert("Unexpected error. Please try again.");
      setLoading(false);
    }
    setLoading(false);
  }

  async function handleCreateTemplate(newTemplate: { name: string; description?: string }) {
    setData(prev => ([
      { id: crypto.randomUUID(), name: newTemplate.name, description: newTemplate.description || null, updatedAt: new Date() },
      ...prev,
    ]));
    setShowNewModal(false);
    alert("Supabase-tabellen 'templates' saknas. Lägg till den i din databas för att spara på riktigt.");
  }

  // Handle click on New button
  function handleNewClick() {
    setShowNewModal(true);
  }

  // Handle soft delete with deleted_at
  async function handleDelete(id: string) {
    if (!user) return;
    
    // Validate type is one of our valid types
    if (!type || !Object.keys(typeToTable).includes(type)) {
      return;
    }
    
    // Get the corresponding table name from our type
    const tableName = typeToTable[type as keyof typeof typeToTable];
    
    // Create a temporary loading state for this specific card
    const tempData = [...data];
    const itemIndex = tempData.findIndex(item => item.id === id);
    if (itemIndex >= 0) {
      tempData[itemIndex].loading = true;
      setData(tempData);
    }
    
    try {
      // Use soft delete by setting deleted_at timestamp
      const { error } = await supabase
        .from(tableName)
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
        
      if (error) {
        console.error(`Error soft deleting ${tableName}:`, error);
        toast({
          title: "Error",
          description: `Failed to delete ${type.replace(/-/g, " ")}. Please try again.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `${type.replace(/-/g, " ").replace(/s$/, "")} moved to trash.`,
        });
        // Refresh data
        fetchData();
      }
    } catch (err) {
      console.error(`Error soft deleting ${tableName}:`, err);
      toast({
        title: "Error",
        description: `Failed to delete ${type.replace(/-/g, " ")}. Please try again.`,
        variant: "destructive",
      });
    }
  }

  // Handle card click - navigate to editor for evacuation plans
  const handleCardClick = (item: any) => {
    if (type === "evacuation-plans") {
      navigate(`/editor/${item.id}`);
    }
    // Add other type-specific navigation if needed in the future
  };

  return (
    <div className="dashboard-content">
      <div className="mb-6">
        {/* Layout with title, search, and new button in a single row */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <h2 className="text-3xl font-bold">{titles[type]}</h2>
          
          <div className="flex-grow max-w-md mx-2">
            <DashboardSearch 
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={`Search ${titles[type].toLowerCase()}...`}
              className="w-full"
            />
          </div>
          
          {data.length > 0 && (type === "buildings" || type === "evacuation-plans" || type === "organizations" || type === "templates") && (
            <Button
              className="whitespace-nowrap" 
              variant="default"
              onClick={handleNewClick}
              disabled={loading}
            >
              + New {titles[type].replace(/s$/, "")}
            </Button>
          )}
        </div>
      </div>
      
      {loading && delayedLoading ? (
        showSkeleton ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="animate-spin h-8 w-8 text-gray-400" />
          </div>
        )
      ) : !loading && data.length === 0 ? (
        <EmptyState
          title={`No ${titles[type].toLowerCase()} found`}
          description={`Get started by adding your first ${titles[type].toLowerCase().replace(/s$/, "")}`}
          buttonLabel={loading && type === "evacuation-plans" ? "Creating..." : `+ New ${titles[type].replace(/s$/, "")}`}
          onButtonClick={handleNewClick}
          loading={loading}
        />
      ) : !loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map((item: any) => (
            <GenericCard
              key={item.id}
              title={item.name}
              subtitle={item.description || item.address}
              icon={icons[type]}
              timestamp={{ label: `Last updated: ${item.updated_at ? new Date(item.updated_at).toLocaleDateString() : ""}` }}
              type={type}
              id={item.id}
              loading={item.loading}
              onClick={() => handleCardClick(item)}
              onDelete={() => handleDelete(item.id)}
            />
          ))}
        </div>
      ) : null}
      
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
              {type === "buildings" ? (
                <CreateBuildingForm
                  onSuccess={() => {
                    setShowNewModal(false);
                    fetchData();
                  }}
                  onCancel={() => setShowNewModal(false)}
                />
              ) : type === "evacuation-plans" ? (
                <CreateEvacuationPlanForm
                  onSuccess={() => {
                    setShowNewModal(false);
                    fetchData();
                  }}
                  onCancel={() => setShowNewModal(false)}
                />
              ) : type === "organizations" ? (
                <CreateOrganizationForm
                  onSuccess={() => {
                    setShowNewModal(false);
                    fetchData();
                  }}
                  onCancel={() => setShowNewModal(false)}
                />
              ) : type === "templates" ? (
                <CreateTemplateForm
                  onSuccess={() => {
                    setShowNewModal(false);
                    fetchData();
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
