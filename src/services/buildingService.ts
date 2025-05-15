
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

// Function to create a new building
const createBuilding = async (
  building: {
    name: string;
    location?: BuildingLocation;
  },
  userId?: string
): Promise<BuildingBasicInfo> => {
  try {
    const newBuildingId = crypto.randomUUID();
    const now = new Date();
    
    // Create the new building object
    const newBuilding: BuildingBasicInfo = {
      id: newBuildingId,
      name: building.name.trim(),
      createdAt: now,
      updatedAt: now,
      location: building.location,
    };

    // If user is logged in, try to save to Supabase first
    if (userId) {
      try {
        const { data, error } = await supabase
          .from("buildings")
          .insert([{
            id: newBuildingId,
            name: building.name.trim(),
            address: building.location?.address || null,
            lat: building.location?.lat || null,
            lng: building.location?.lng || null,
            owner_id: userId,
            created_at: now.toISOString(),
            updated_at: now.toISOString()
          }])
          .select()
          .single();

        if (error) {
          console.error("Failed to create building in Supabase:", error);
          // Even if Supabase fails, continue to save to localStorage as fallback
        } else {
          console.log("Successfully created building in Supabase:", data);
        }
      } catch (dbError) {
        console.error("Error during Supabase building creation:", dbError);
        // Continue to localStorage as fallback
      }
    }

    // Always save to localStorage as well (for offline mode or as a backup)
    const localBuildings = loadFromLocalStorage();
    localBuildings.push(newBuilding);
    saveToLocalStorage(localBuildings);
    
    return newBuilding;
  } catch (error) {
    console.error("Error creating building:", error);
    throw error;
  }
};

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
  createBuilding,
  fetchUserBuildings,
  deleteBuilding,
};

// Re-export the type
export type { BuildingBasicInfo as ProjectDisplayData };
