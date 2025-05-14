
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types/supabase";

// Define local types for service
export interface ProjectLocation {
  lat: number;
  lng: number;
  address: string;
}

export interface ProjectDisplayData {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  location?: ProjectLocation;
}

export const buildingService = {
  fetchUserBuildings: async (userId: string): Promise<ProjectDisplayData[]> => {
    try {
      // Fetch from Supabase if user is logged in
      const { data: buildings, error } = await supabase
        .from('buildings')
        .select('*')
        .eq('owner_id', userId)
        .order('updated_at', { ascending: false });
        
      if (error) {
        console.error("Failed to fetch buildings from Supabase:", error);
        throw error;
      }
      
      if (buildings && buildings.length > 0) {
        // Convert Supabase data to ProjectDisplayData format
        const supabaseProjects: ProjectDisplayData[] = buildings.map((building: any) => ({
          id: building.id,
          name: building.name,
          createdAt: new Date(building.created_at),
          updatedAt: new Date(building.updated_at),
          location: building.address ? {
            address: building.address,
            // If lat/lng are available in the database, use them
            lat: building.lat || 0,
            lng: building.lng || 0
          } : undefined
        }));
        
        // Sort by updated_at descending to show latest first
        supabaseProjects.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        
        return supabaseProjects;
      }
      
      return [];
    } catch (error) {
      console.error("Failed to fetch user buildings:", error);
      throw error;
    }
  },
  
  loadFromLocalStorage: (): ProjectDisplayData[] => {
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
        projectList.sort((a: ProjectDisplayData, b: ProjectDisplayData) => b.updatedAt.getTime() - a.updatedAt.getTime());
        return projectList;
      }
      return [];
    } catch (localStorageError) {
      console.error("Failed to parse projects from localStorage:", localStorageError);
      return [];
    }
  },
  
  deleteBuilding: async (building: ProjectDisplayData, userId?: string): Promise<boolean> => {
    try {
      // Always update local state first for immediate UI feedback
      const savedProjects = localStorage.getItem("evacuation-projects");
      if (savedProjects) {
        const projects = JSON.parse(savedProjects);
        const updatedProjects = projects.filter((p: any) => p.id !== building.id);
        localStorage.setItem("evacuation-projects", JSON.stringify(updatedProjects));
      }
      
      let deleteSuccess = false;
      
      if (userId) {
        // Try multiple deletion strategies
        
        // First strategy: Use the edge function
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData?.session?.access_token;
          
          if (token) {
            const supabaseUrl = "https://ohxecbcihwinyskhaysl.supabase.co";
            console.log(`Attempting to delete building ${building.id} using admin delete function`);
            
            const response = await fetch(`${supabaseUrl}/functions/v1/delete-building`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ buildingId: building.id })
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
              .eq('id', building.id);
              
            if (!deleteError1) {
              deleteSuccess = true;
            } else {
              console.warn("First delete method failed:", deleteError1);
              
              // Try method 2: Delete with user_id filter (if this is an older record)
              const { error: deleteError2 } = await supabase
                .from('buildings')
                .delete()
                .eq('id', building.id)
                .eq('user_id', userId);
                
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
      }
      
      return deleteSuccess;
    } catch (error) {
      console.error("Error in deleteBuilding:", error);
      throw error;
    }
  }
};
