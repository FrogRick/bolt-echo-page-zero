import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Define simpler, non-circular types for building data
export interface BuildingLocation {
  lat: number;
  lng: number;
  address: string;
}

export interface BuildingBasicInfo {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  location?: BuildingLocation;
  thumbnail?: string;
}

// Helper function to load projects from localStorage
const loadFromLocalStorage = (): BuildingBasicInfo[] => {
  try {
    const stored = localStorage.getItem("evacuation-projects");
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    return parsed.map((item: any) => ({
      id: item.id,
      name: item.name,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
      location: item.location,
      thumbnail: item.thumbnail
    }));
  } catch (error) {
    console.error("Failed to parse projects from localStorage:", error);
    return [];
  }
};

// Helper function to save projects to localStorage
const saveToLocalStorage = (buildings: BuildingBasicInfo[]): void => {
  try {
    localStorage.setItem("evacuation-projects", JSON.stringify(buildings));
  } catch (error) {
    console.error("Failed to save projects to localStorage:", error);
  }
};

// Database record structure for buildings table
interface BuildingRecord {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  owner_id: string;
}

// Function to fetch user buildings from Supabase
const fetchUserBuildings = async (userId: string): Promise<BuildingBasicInfo[]> => {
  try {
    const { data: buildings, error } = await supabase
      .from("buildings")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase query error:", error);
      toast({
        title: "Error fetching buildings",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }

    // Transform database records to our application format
    return (buildings as BuildingRecord[]).map(building => ({
      id: building.id,
      name: building.name,
      createdAt: new Date(building.created_at),
      updatedAt: new Date(building.updated_at),
      location: building.address ? {
        lat: building.lat || 0,
        lng: building.lng || 0,
        address: building.address
      } : undefined,
      thumbnail: undefined // Not available in DB schema
    }));
  } catch (error) {
    console.error("Error fetching buildings from Supabase:", error);
    throw error;
  }
};

// Function to delete building
const deleteBuilding = async (
  building: BuildingBasicInfo,
  userId?: string
): Promise<boolean> => {
  try {
    // If user is logged in, try to delete from Supabase first
    if (userId) {
      const { error } = await supabase
        .from("buildings")
        .delete()
        .eq("id", building.id)
        .eq("owner_id", userId);

      if (error) {
        console.error("Failed to delete building from Supabase:", error);
        // If deletion from Supabase fails, fall back to localStorage
      } else {
        console.log("Successfully deleted building from Supabase");
        // Also remove from localStorage to keep things consistent
        const localBuildings = loadFromLocalStorage();
        const updatedBuildings = localBuildings.filter(b => b.id !== building.id);
        saveToLocalStorage(updatedBuildings);
        return true;
      }
    }

    // If no user or Supabase deletion failed, delete from localStorage
    const localBuildings = loadFromLocalStorage();
    const updatedBuildings = localBuildings.filter(b => b.id !== building.id);
    saveToLocalStorage(updatedBuildings);
    
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

// Re-export the type
export type { BuildingBasicInfo as ProjectDisplayData };
