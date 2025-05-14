import { Project, ProjectDisplayData } from "@/types/editor";
import { supabase } from "@/integrations/supabase/client";
import { BuildingsTable } from "@/types/supabase";

// Helper function to load projects from localStorage
const loadFromLocalStorage = (): ProjectDisplayData[] => {
  try {
    const stored = localStorage.getItem("evacuation-projects");
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to parse projects from localStorage:", error);
    return [];
  }
};

// Helper function to save projects to localStorage
const saveToLocalStorage = (projects: ProjectDisplayData[]): void => {
  try {
    localStorage.setItem("evacuation-projects", JSON.stringify(projects));
  } catch (error) {
    console.error("Failed to save projects to localStorage:", error);
  }
};

// Function to fetch user buildings from Supabase
const fetchUserBuildings = async (userId: string): Promise<ProjectDisplayData[]> => {
  try {
    const { data: buildings, error } = await supabase
      .from("buildings")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    // Transform database format to local format
    return buildings.map((building: BuildingsTable) => ({
      id: building.id,
      name: building.name,
      createdAt: new Date(building.created_at),
      updatedAt: new Date(building.updated_at),
      location: building.address ? {
        lat: building.lat || 0,
        lng: building.lng || 0,
        address: building.address
      } : undefined,
      thumbnail: undefined, // Not available in DB schema
      pdfs: [], // Will need to be filled separately if needed
      symbols: [], // Will need to be filled separately if needed
    }));
  } catch (error) {
    console.error("Error fetching buildings from Supabase:", error);
    throw error;
  }
};

// Function to delete building
const deleteBuilding = async (
  project: ProjectDisplayData, 
  userId?: string
): Promise<boolean> => {
  try {
    // If user is logged in, try to delete from Supabase first
    if (userId) {
      const { error } = await supabase
        .from("buildings")
        .delete()
        .eq("id", project.id)
        .eq("user_id", userId);

      if (error) {
        console.error("Failed to delete building from Supabase:", error);
        // If deletion from Supabase fails, fall back to localStorage
      } else {
        console.log("Successfully deleted building from Supabase");
        // Also remove from localStorage to keep things consistent
        const localProjects = loadFromLocalStorage();
        const updatedProjects = localProjects.filter(p => p.id !== project.id);
        saveToLocalStorage(updatedProjects);
        return true;
      }
    }

    // If no user or Supabase deletion failed, delete from localStorage
    const localProjects = loadFromLocalStorage();
    const updatedProjects = localProjects.filter(p => p.id !== project.id);
    saveToLocalStorage(updatedProjects);
    
    // Return false to indicate it was only removed locally, not from database
    return userId ? false : true;
  } catch (error) {
    console.error("Error during building deletion:", error);
    throw error;
  }
};

// Export all functions as a service object
export const buildingService = {
  loadFromLocalStorage,
  saveToLocalStorage,
  fetchUserBuildings,
  deleteBuilding,
};

// Also export the type for use in components
export type { ProjectDisplayData };
