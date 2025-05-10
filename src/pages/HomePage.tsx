import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Map, 
  Grid2X2, 
  Building, 
  Search,
  Loader2
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import MapView from "@/components/MapView";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { BuildingsTable } from "@/types/supabase";
import { BuildingActionMenu } from "@/components/BuildingActionMenu";
import { GenericCard } from "@/components/ui/GenericCard";

type Project = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
};

const MAPBOX_TOKEN = "pk.eyJ1IjoiZnJldGgwMyIsImEiOiJjajI2a29mYzAwMDJqMnducnZmNnMzejB1In0.oRpO5T3aTpkP1QO8WjsiSw";

const HomePage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [view, setView] = useState<"grid" | "map">("grid");
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [deletingProjectIds, setDeletingProjectIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasLoadError, setHasLoadError] = useState(false);
  
  const {
    user,
    buildingUsage,
    refreshSubscription,
    session
  } = useAuth();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  
  const reachedBuildingLimit = user && buildingUsage.total >= buildingUsage.limits.total;
  const reachedMonthlyLimit = user && buildingUsage.monthly >= buildingUsage.limits.monthly;

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setHasLoadError(false);
      try {
        if (user) {
          // Fetch from Supabase if user is logged in
          try {
            const { data: buildings, error } = await supabase
              .from('buildings')
              .select('*')
              .eq('user_id', user.id)
              .order('updated_at', { ascending: false });
              
            if (error) {
              console.error("Failed to fetch buildings from Supabase:", error);
              // If this is due to a recursive policy error, we'll try loading from localStorage
              throw error;
            }
            
            if (buildings && buildings.length > 0) {
              // Convert Supabase data to Project format
              const supabaseProjects: Project[] = buildings.map((building: BuildingsTable) => ({
                id: building.id,
                name: building.name,
                createdAt: new Date(building.created_at),
                updatedAt: new Date(building.updated_at),
                location: building.address ? {
                  address: building.address,
                  // Default values for map
                  lat: 0,
                  lng: 0
                } : undefined
              }));
              
              // Sort by updated_at descending to show latest first
              supabaseProjects.sort((a: Project, b: Project) => b.updatedAt.getTime() - a.updatedAt.getTime());
              
              setProjects(supabaseProjects);
              setFilteredProjects(supabaseProjects);
              return;
            }
          } catch (supabaseError) {
            console.error("Supabase fetch error:", supabaseError);
            // Fall through to localStorage as a backup
          }
        }
        
        // Always try to load from localStorage as a fallback
        loadFromLocalStorage();
      } catch (error) {
        console.error("Failed to fetch projects:", error);
        setHasLoadError(true);
        // Always try localStorage as a last resort
        loadFromLocalStorage();
      } finally {
        setLoading(false);
      }
    };
    
    const loadFromLocalStorage = () => {
      try {
        const savedProjects = localStorage.getItem("evacuation-projects");
        if (savedProjects) {
          const parsedProjects = JSON.parse(savedProjects);
          const projectList = parsedProjects.map((project: any) => ({
            ...project,
            createdAt: new Date(project.createdAt),
            updatedAt: new Date(project.updatedAt)
          }));
          // Sort by updated_at descending to show latest first
          projectList.sort((a: Project, b: Project) => b.updatedAt.getTime() - a.updatedAt.getTime());
          setProjects(projectList);
          setFilteredProjects(projectList);
        }
      } catch (localStorageError) {
        console.error("Failed to parse projects from localStorage:", localStorageError);
        setHasLoadError(true);
        setProjects([]);
        setFilteredProjects([]);
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

  const handleDeleteProject = async (project: Project) => {
    try {
      setDeleteInProgress(true);
      setDeletingProjectIds(prev => [...prev, project.id]);
      
      // Always update local state first for immediate UI feedback (optimistic update)
      const updatedProjects = projects.filter(p => p.id !== project.id);
      localStorage.setItem("evacuation-projects", JSON.stringify(updatedProjects));
      
      let deleteSuccess = false;
      
      if (user) {
        // Try multiple deletion strategies
        
        // First strategy: Use the edge function
        try {
          const session = await supabase.auth.getSession();
          const token = session?.data?.session?.access_token;
          
          if (token) {
            const supabaseUrl = "https://ohxecbcihwinyskhaysl.supabase.co";
            console.log(`Attempting to delete building ${project.id} using admin delete function`);
            
            const response = await fetch(`${supabaseUrl}/functions/v1/delete-building`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ buildingId: project.id })
            });
            
            if (response.ok) {
              const result = await response.json();
              console.log('Building deleted successfully via edge function', result);
              deleteSuccess = true;
            } else {
              const errorData = await response.json();
              console.error('Failed to delete building:', errorData);
              throw new Error(`Failed to delete building: ${errorData.error || errorData.message || 'Unknown error'}`);
            }
          }
        } catch (edgeFunctionError) {
          console.error("Failed to delete building from edge function:", edgeFunctionError);
          console.log("Falling back to direct deletion...");
          
          // Second strategy: Try direct Supabase deletion with RLS
          try {
            // Try method 1: Standard RLS-compliant delete
            const { error: deleteError1 } = await supabase
              .from('buildings')
              .delete()
              .eq('id', project.id);
              
            if (!deleteError1) {
              deleteSuccess = true;
            } else {
              console.warn("First delete method failed:", deleteError1);
              
              // Try method 2: Delete with user_id filter (if this is an older record)
              const { error: deleteError2 } = await supabase
                .from('buildings')
                .delete()
                .eq('id', project.id)
                .eq('user_id', user.id);
                
              if (!deleteError2) {
                deleteSuccess = true;
              } else {
                console.warn("Second delete method failed:", deleteError2);
                // For legacy data, just rely on localStorage deletion we already did
                console.log("Using localStorage deletion as fallback");
              }
            }
          } catch (dbError) {
            console.error("All database deletion attempts failed:", dbError);
          }
        }
        
        // After deletion attempts, refresh subscription data if user is logged in
        try {
          await refreshSubscription();
        } catch (refreshError) {
          console.warn("Failed to refresh subscription data:", refreshError);
        }
      }
      
      // Update the UI state
      setProjects(prevProjects => prevProjects.filter(p => p.id !== project.id));
      setFilteredProjects(prevFiltered => prevFiltered.filter(p => p.id !== project.id));
      setProjectToDelete(null);
      
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
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>;
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
    <div>
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
          <Button variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all duration-300 ease-in-out" onClick={handleNewBuildingClick}>
            <Plus className="mr-2 h-4 w-4" />
            New building
          </Button>
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search buildings by name or address..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Only render content if user is logged in or there are buildings in localStorage */}
        {view === "grid" ? 
          (filteredProjects.length === 0 ? 
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              {searchQuery ? (
                <>
                  <h2 className="text-2xl font-semibold mb-4">No buildings match your search</h2>
                  <p className="text-gray-500 mb-6">Try different search terms</p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-semibold mb-4">No buildings yet</h2>
                  <p className="text-gray-500 mb-6">Create your first building to get started</p>
                </>
              )}
            </div> 
            : 
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map(project => (
                <div key={project.id} className="relative">
                  <GenericCard
                    title={project.name}
                    subtitle={project.location?.address || "No address"}
                    icon={<Building className="w-8 h-8 text-primary" />}
                    timestamp={{ label: `Last updated: ${project.updatedAt.toLocaleDateString()}` }}
                    onClick={() => navigate(`/editor/${project.id}`)}
                    loading={deletingProjectIds.includes(project.id)}
                    type="building"
                              />
                  <BuildingActionMenu 
                    project={project}
                    onDelete={() => setProjectToDelete(project)}
                    className="absolute top-2 right-8"
                    disabled={deleteInProgress || deletingProjectIds.includes(project.id)}
                  />
                </div>
              ))}
            </div>
          ) 
          : 
          <MapView projects={filteredProjects} />
        }
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog 
        open={projectToDelete !== null} 
        onOpenChange={(open) => {
          if (!open && !deleteInProgress) setProjectToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the building
              {projectToDelete && ` "${projectToDelete.name}"`} and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteInProgress}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => projectToDelete && handleDeleteProject(projectToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteInProgress}
            >
              {deleteInProgress ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HomePage;
