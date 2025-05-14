import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Project } from "@/types/editor";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { BuildingBasicInfo } from "@/services/buildingService";

export const useSupabaseProject = (projectId: string | undefined) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!projectId) {
      navigate("/");
      return;
    }

    const fetchProject = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        // Attempt to fetch from Supabase if we have user authentication
        const { data: buildingData, error: buildingError } = await supabase
          .from("buildings")
          .select("*")
          .eq("id", projectId)
          .single();

        if (buildingError) {
          console.error("Supabase error fetching building:", buildingError);
          throw buildingError;
        }

        if (buildingData) {
          // We found the building in Supabase
          // For now, we'll still fall back to localStorage for other project data
          const savedProjects = localStorage.getItem("evacuation-projects");
          let localProject: Project | null = null;
          
          if (savedProjects) {
            const projects = JSON.parse(savedProjects);
            localProject = projects.find((p: any) => p.id === projectId);
          }
          
          setProject({
            ...localProject || {
              id: buildingData.id,
              name: buildingData.name,
              pdfs: [],
              symbols: [],
              createdAt: new Date(buildingData.created_at),
              updatedAt: new Date(buildingData.updated_at),
              location: buildingData.address ? {
                address: buildingData.address,
                lat: buildingData.lat || 0,
                lng: buildingData.lng || 0
              } : undefined
            }
          });
        } else {
          // Fall back to localStorage
          const savedProjects = localStorage.getItem("evacuation-projects");
          if (savedProjects) {
            const projects = JSON.parse(savedProjects);
            const foundProject = projects.find((p: any) => p.id === projectId);
            
            if (foundProject) {
              setProject({
                ...foundProject,
                pdfs: foundProject.pdfs || [],
                symbols: foundProject.symbols || [], // Ensure symbols is always present
                createdAt: new Date(foundProject.createdAt),
                updatedAt: new Date(foundProject.updatedAt),
              });
            } else {
              toast({
                title: "Project not found",
                description: "The requested evacuation plan could not be found.",
                variant: "destructive",
              });
              navigate("/");
            }
          } else {
            // No project found anywhere
            toast({
              title: "Project not found",
              description: "The requested evacuation plan could not be found.",
              variant: "destructive",
            });
            navigate("/");
          }
        }
      } catch (error) {
        console.error("Failed to load project:", error);
        toast({
          title: "Error loading project",
          description: "An error occurred while loading the project data.",
          variant: "destructive",
        });
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId, navigate, toast, user]);

  const saveProject = async (updatedProject: Project) => {
    try {
      if (user) {
        // Try to save to Supabase first
        const buildingData = {
          name: updatedProject.name,
          updated_at: new Date().toISOString(),
          address: updatedProject.location?.address,
          lat: updatedProject.location?.lat || null,
          lng: updatedProject.location?.lng || null
        };

        const { error } = await supabase
          .from("buildings")
          .update(buildingData)
          .eq("id", updatedProject.id);

        if (error) {
          console.error("Error saving to Supabase:", error);
          // Fall back to localStorage
        }
      }

      // Always update localStorage for now as we transition to Supabase
      const savedProjects = localStorage.getItem("evacuation-projects");
      let projects = savedProjects ? JSON.parse(savedProjects) : [];
      projects = projects.map((p: Project) => 
        p.id === updatedProject.id ? updatedProject : p
      );
      
      localStorage.setItem("evacuation-projects", JSON.stringify(projects));
      setProject(updatedProject);
    } catch (error) {
      console.error("Failed to save project:", error);
      toast({
        title: "Error saving project",
        description: "An error occurred while saving your changes.",
        variant: "destructive",
      });
    }
  };

  return { project, loading, saveProject };
};
