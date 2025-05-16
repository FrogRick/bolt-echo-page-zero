
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GenericCard } from "@/components/ui/GenericCard";
import { Flame, Building, User, BookCopy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewBuildingForm } from "@/pages/NewProjectPage";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CreateOrganizationForm } from "@/components/organizations/CreateOrganizationForm";
import { CreateBuildingForm } from "@/components/buildings/CreateBuildingForm";
import { CreateEvacuationPlanForm } from "@/components/evacuation-plans/CreateEvacuationPlanForm";
import { CreateTemplateForm } from "@/components/templates/CreateTemplateForm";
import { DashboardSearch } from "@/components/dashboard/DashboardSearch";

function NewEvacuationPlanForm({ onSuccess }: { onSuccess: (id: string) => void }) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        if (!name.trim()) return;
        setIsSubmitting(true);
        const newProject = {
          id: crypto.randomUUID(),
          name: name.trim(),
          createdAt: new Date(),
          updatedAt: new Date(),
          pdfs: [],
          symbols: [],
        };
        // Spara till localStorage
        const existing = localStorage.getItem("evacuation-plans");
        const projects = existing ? JSON.parse(existing) : [];
        projects.unshift(newProject);
        localStorage.setItem("evacuation-plans", JSON.stringify(projects));
        setIsSubmitting(false);
        onSuccess(newProject.id);
      }}
      className="max-w-2xl mx-auto bg-white rounded-lg p-6"
    >
      <h2 className="text-xl font-bold mb-4">Create Evacuation Plan</h2>
      <div className="mb-4">
        <label className="block mb-1 font-medium">Plan Name</label>
        <input
          className="border rounded px-3 py-2 w-full"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Main Building Plan"
          autoFocus
        />
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Evacuation Plan"}
      </Button>
    </form>
  );
}

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
    <div className="animate-pulse bg-gray-100 rounded-lg p-6 h-40 flex flex-col justify-between">
      <div className="h-6 w-1/2 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-1/3 bg-gray-200 rounded mb-4" />
      <div className="h-4 w-1/4 bg-gray-200 rounded" />
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
  
  // Add handleSearchChange function to update searchQuery state
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  // Helper: fetch data from Supabase for the current type
  async function fetchData() {
    setLoading(true);
    let table = "";
    switch (type) {
      case "buildings": table = "buildings"; break;
      case "organizations": table = "organizations"; break;
      case "templates": table = "templates"; break;
      case "evacuation-plans": table = "floor_plans"; break;
      default: setLoading(false); return;
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
        setData([]);
      } else if (rows) {
        setData(rows);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error(`Error fetching ${table}:`, err);
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

  // --- CREATE handlers ---
  async function handleCreateBuilding(newBuilding: { name: string; description?: string; address?: string }) {
    if (!user) return;
    setLoading(true);
    
    // Fix: Change to match the Supabase schema - use owner_id instead of user_id
    // and remove description which isn't in the schema
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

  // Hantera klick på New-knappen
  function handleNewClick() {
    setShowNewModal(true);
  }

  return (
    <div>
      {/* Updated layout with flex for responsive alignment */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h2 className="text-3xl font-bold">{titles[type]}</h2>
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
            <DashboardSearch 
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={`Search ${titles[type].toLowerCase()}...`}
              className="w-full md:w-64 lg:w-80"
            />
            
            {data.length > 0 && (type === "buildings" || type === "evacuation-plans" || type === "organizations" || type === "templates") && (
              <Button
                className="whitespace-nowrap w-full md:w-auto" 
                variant="default"
                onClick={handleNewClick}
                disabled={loading}
              >
                + New {titles[type].replace(/s$/, "")}
              </Button>
            )}
          </div>
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
              type={type as any}
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
