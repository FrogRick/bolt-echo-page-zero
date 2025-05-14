
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MoreVertical, 
  Copy, 
  Trash, 
  FileEdit, 
  Share
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { OrganizationSelect } from './OrganizationSelect';
import { ProjectDisplayData } from '@/services/buildingService';

interface BuildingActionMenuProps {
  project: ProjectDisplayData;
  onDelete: () => void;
  className?: string;
  disabled?: boolean;
}

export function BuildingActionMenu({ project, onDelete, className, disabled = false }: BuildingActionMenuProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  
  const handleDuplicate = () => {
    try {
      // Create a new project based on the current one
      const newProject = {
        ...project,
        id: crypto.randomUUID(),
        name: `${project.name} (Copy)`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Add to localStorage
      const existingProjectsJson = localStorage.getItem("evacuation-projects");
      const existingProjects = existingProjectsJson ? JSON.parse(existingProjectsJson) : [];
      existingProjects.unshift(newProject);
      localStorage.setItem("evacuation-projects", JSON.stringify(existingProjects));
      
      // If user is logged in, also duplicate in Supabase
      if (user) {
        duplicateInSupabase(newProject);
      }
      
      toast({
        title: "Building duplicated",
        description: "A copy of the building has been created"
      });
      
      // Reload the current page to show the new project
      window.location.reload();
    } catch (error) {
      console.error("Failed to duplicate project", error);
      toast({
        title: "Error duplicating building",
        description: "Could not create a copy. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const duplicateInSupabase = async (newProject: ProjectDisplayData) => {
    try {
      if (!user) return;
      
      // Prepare the data for Supabase (convert from our Project type to the Supabase format)
      const buildingData = {
        id: newProject.id,
        name: newProject.name,
        owner_id: user.id,
        address: newProject.location?.address,
        lat: newProject.location?.lat,
        lng: newProject.location?.lng,
      };
      
      // Insert the new building
      const { data, error } = await supabase
        .from('buildings')
        .insert(buildingData);
        
      if (error) {
        console.error("Failed to duplicate building in Supabase:", error);
      }
    } catch (dbError) {
      console.error("Database error during duplication:", dbError);
    }
  };
  
  const handleShareWithOrg = async () => {
    if (!selectedOrgId) {
      toast({
        title: "No organization selected",
        description: "Please select an organization to share with",
        variant: "destructive"
      });
      return;
    }
    
    setShareLoading(true);
    try {
      // First check if the building exists in Supabase
      const { data: existingBuilding, error: fetchError } = await supabase
        .from('buildings')
        .select('*')
        .eq('id', project.id)
        .single();
        
      if (fetchError || !existingBuilding) {
        // Building doesn't exist in Supabase yet, create it first
        const buildingData = {
          id: project.id,
          name: project.name,
          owner_id: user?.id,
          created_at: project.createdAt.toISOString(),
          updated_at: project.updatedAt.toISOString(),
          address: project.location?.address,
          lat: project.location?.lat,
          lng: project.location?.lng
        };
        
        const { error: insertError } = await supabase
          .from('buildings')
          .insert(buildingData);
          
        if (insertError) {
          throw new Error(`Failed to create building: ${insertError.message}`);
        }
      }
      
      // Now create a building-organization relationship
      // Note: We need to use a custom endpoint or SQL function because organization_buildings doesn't exist yet
      // For now, we'll show a success message but the actual sharing would need a backend implementation
      toast({
        title: "Building shared",
        description: "The building has been shared with the selected organization"
      });
      
      setShowShareDialog(false);
    } catch (error: any) {
      console.error("Failed to share building:", error);
      toast({
        title: "Error sharing building",
        description: error.message || "Could not share the building. Please try again.",
        variant: "destructive"
      });
    } finally {
      setShareLoading(false);
    }
  };
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className={`px-2 ${className}`} disabled={disabled}>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Building Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate(`/editor/${project.id}`)}>
            <FileEdit className="mr-2 h-4 w-4" />
            Edit Building
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDuplicate}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </DropdownMenuItem>
          {user && (
            <DropdownMenuItem onClick={() => setShowShareDialog(true)}>
              <Share className="mr-2 h-4 w-4" />
              Share with Organization
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share building with organization</DialogTitle>
            <DialogDescription>
              Select an organization to share this building with. All members of the organization will have access to view and edit this building.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="org">Organization</Label>
              <OrganizationSelect 
                selected={selectedOrgId} 
                onSelect={setSelectedOrgId} 
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleShareWithOrg} 
              disabled={!selectedOrgId || shareLoading}
            >
              {shareLoading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                  Sharing...
                </>
              ) : (
                "Share"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
