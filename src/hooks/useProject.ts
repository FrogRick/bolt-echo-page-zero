
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Project } from "@/types/editor";

export const useProject = (projectId: string | undefined) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Clear loading state when component unmounts
    return () => {
      setLoading(false);
    };
  }, []);

  useEffect(() => {
    if (!projectId) {
      navigate("/");
      return;
    }

    // Start with loading state
    setLoading(true);

    const loadProject = () => {
      const savedProjects = localStorage.getItem("evacuation-projects");
      if (savedProjects) {
        try {
          const projects = JSON.parse(savedProjects);
          const foundProject = projects.find((p: any) => p.id === projectId);
          
          if (foundProject) {
            console.info("Project loaded successfully:", foundProject.name);
            setProject({
              ...foundProject,
              pdfs: foundProject.pdfs || [], // Handle existing projects
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
        } catch (error) {
          console.error("Failed to load project:", error);
          toast({
            title: "Error loading project",
            description: "An error occurred while loading the project data.",
            variant: "destructive",
          });
        } finally {
          // Set loading to false only after everything is complete
          setLoading(false);
        }
      } else {
        // No projects exist
        setLoading(false);
        toast({
          title: "No projects found",
          description: "No projects exist in local storage.",
          variant: "destructive",
        });
        navigate("/");
      }
    };

    // Small delay to ensure consistent loading pattern
    const timer = setTimeout(() => {
      loadProject();
    }, 100);

    return () => clearTimeout(timer);
  }, [projectId, navigate, toast]);

  const saveProject = (updatedProject: Project) => {
    const savedProjects = localStorage.getItem("evacuation-projects");
    let projects = savedProjects ? JSON.parse(savedProjects) : [];
    projects = projects.map((p: Project) => 
      p.id === updatedProject.id ? updatedProject : p
    );
    
    localStorage.setItem("evacuation-projects", JSON.stringify(projects));
    setProject(updatedProject);
  };

  return { project, loading, saveProject };
};
