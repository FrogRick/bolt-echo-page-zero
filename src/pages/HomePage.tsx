
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Map, Grid2X2, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { BuildingsList } from "@/components/buildings/BuildingsList";
import { MapViewWrapper } from "@/components/buildings/MapViewWrapper";
import { SearchBar } from "@/components/buildings/SearchBar";
import { DeleteBuildingDialog } from "@/components/buildings/DeleteBuildingDialog";
import { NoBuildings } from "@/components/buildings/NoBuildings";
import { buildingService, ProjectDisplayData } from "@/services/buildingService";

const HomePage = () => {
  const [projects, setProjects] = useState<ProjectDisplayData[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ProjectDisplayData[]>([]);
  const [view, setView] = useState<"grid" | "map">("grid");
  const [projectToDelete, setProjectToDelete] = useState<ProjectDisplayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [deletingProjectIds, setDeletingProjectIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasLoadError, setHasLoadError] = useState(false);
  
  const { user, buildingUsage, refreshSubscription } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const reachedBuildingLimit = user && buildingUsage.total >= buildingUsage.limits.total;
  const reachedMonthlyLimit = user && buildingUsage.monthly >= buildingUsage.limits.monthly;

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setHasLoadError(false);
      try {
        if (user) {
          try {
            // Use the service to fetch buildings
            const buildings = await buildingService.fetchUserBuildings(user.id);
            setProjects(buildings);
            setFilteredProjects(buildings);
            setLoading(false);
            return;
          } catch (supabaseError) {
            console.error("Supabase fetch error:", supabaseError);
            // Fall through to localStorage as a backup
          }
        }
        
        // Load from localStorage if no user or Supabase fails
        const localProjects = buildingService.loadFromLocalStorage();
        setProjects(localProjects);
        setFilteredProjects(localProjects);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
        setHasLoadError(true);
        // Try localStorage as last resort
        const localProjects = buildingService.loadFromLocalStorage();
        setProjects(localProjects);
        setFilteredProjects(localProjects);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjects();
  }, [user]);

  // Filter projects when search query changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProjects(projects);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = projects.filter(project => 
        project.name.toLowerCase().includes(lowercaseQuery) || 
        (project.location?.address && project.location.address.toLowerCase().includes(lowercaseQuery))
      );
      setFilteredProjects(filtered);
    }
  }, [searchQuery, projects]);

  // Check for success parameter in URL when component mounts or changes
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    
    // If success parameter exists, refresh subscription data
    if (success === 'true' && user) {
      console.log("Detected successful action, refreshing subscription data");
      refreshSubscription();
      
      // Remove success parameter from URL to prevent refreshing on every render
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [user, refreshSubscription]);

  const handleDeleteProject = async (project: ProjectDisplayData) => {
    try {
      setDeleteInProgress(true);
      setDeletingProjectIds(prev => [...prev, project.id]);
      
      const deleteSuccess = await buildingService.deleteBuilding(project, user?.id);
      
      // Update the UI state
      setProjects(prevProjects => prevProjects.filter(p => p.id !== project.id));
      setFilteredProjects(prevFiltered => prevFiltered.filter(p => p.id !== project.id));
      setProjectToDelete(null);
      
      // After deletion attempts, refresh subscription data if user is logged in
      if (user) {
        try {
          await refreshSubscription();
        } catch (refreshError) {
          console.warn("Failed to refresh subscription data:", refreshError);
        }
      }
      
      toast({
        title: deleteSuccess ? "Building deleted" : "Building removed",
        description: `"${project.name}" has been ${deleteSuccess ? 'deleted from the database' : 'removed from your list'}.`
      });

      // The event is completed - give the UI time to update before removing from deleting state
      setTimeout(() => {
        setDeletingProjectIds(prev => prev.filter(id => id !== project.id));
      }, 500);
    } catch (error: any) {
      console.error("Failed to delete project:", error);
      toast({
        title: "Error deleting building",
        description: "An error occurred while trying to delete the building. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setDeleteInProgress(false);
    }
  };

  // Check for building limits before navigating to new project page
  const handleNewBuildingClick = async () => {
    // First, refresh subscription data to ensure we have the latest limits
    if (user) {
      await refreshSubscription();
    }
    
    // If user is logged in but has reached limits
    if (user) {
      if (buildingUsage.limits.total <= 0) {
        toast({
          title: "Building limit not available",
          description: "Your subscription plan doesn't support creating buildings. Please subscribe to a valid plan.",
          variant: "destructive"
        });
        setTimeout(() => navigate("/pricing"), 2000);
        return;
      }
      
      if (reachedBuildingLimit) {
        toast({
          title: "Building limit reached",
          description: `You've reached your limit of ${buildingUsage.limits.total} buildings. Please upgrade your plan to create more.`,
          variant: "destructive"
        });
        setTimeout(() => navigate("/pricing"), 2000);
        return;
      }
      
      if (reachedMonthlyLimit) {
        toast({
          title: "Monthly limit reached",
          description: `You've reached your monthly limit of ${buildingUsage.limits.monthly} new buildings. Please upgrade your plan or try again next month.`,
          variant: "destructive"
        });
        setTimeout(() => navigate("/pricing"), 2000);
        return;
      }
    }

    // Navigate directly to new project page
    navigate("/new");
  };

  // Show loading state while fetching projects
  if (loading) {
    return <LoadingSpinner />;
  }

  // Show error state if we failed to load data
  if (hasLoadError && projects.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <Building className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold mb-4">Error Loading Buildings</h2>
        <p className="text-gray-500 mb-6">We encountered a problem loading your buildings. Please try again.</p>
        <Button 
          onClick={() => window.location.reload()} 
          variant="default"
          className="mx-auto"
        >
          Refresh Page
        </Button>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <div className="relative">
        {/* Project management section */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-bold">Your Buildings</h2>
            <ToggleGroup type="single" value={view} onValueChange={value => value && setView(value as "grid" | "map")}>
              <ToggleGroupItem value="grid" aria-label="Grid view">
                <Grid2X2 className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="map" aria-label="Map view">
                <Map className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <Button 
            variant="default" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all duration-300 ease-in-out" 
            onClick={handleNewBuildingClick}
          >
            <Plus className="mr-2 h-4 w-4" />
            New building
          </Button>
        </div>

        {/* Search bar */}
        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        {/* Building list or map view */}
        {view === "grid" ? (
          <BuildingsList
            buildings={filteredProjects}
            searchQuery={searchQuery}
            onDeleteBuilding={setProjectToDelete}
            deletingBuildingIds={deletingProjectIds}
            deleteInProgress={deleteInProgress}
          />
        ) : (
          <MapViewWrapper buildings={filteredProjects} searchQuery={searchQuery} />
        )}
      </div>

      {/* Delete confirmation dialog */}
      <DeleteBuildingDialog
        building={projectToDelete}
        isOpen={projectToDelete !== null}
        isDeleting={deleteInProgress}
        onOpenChange={(open) => {
          if (!open) setProjectToDelete(null);
        }}
        onConfirmDelete={() => projectToDelete && handleDeleteProject(projectToDelete)}
      />
    </div>
  );
};

export default HomePage;
