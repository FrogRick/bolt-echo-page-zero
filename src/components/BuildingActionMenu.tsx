
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MoreHorizontal, Edit, Trash2, Move, Loader2, MessageSquare } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OrganizationSelect } from "./OrganizationSelect";
import { BuildingNotes } from "./BuildingNotes";

interface Project {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
}

interface BuildingActionMenuProps {
  project: Project;
  onDelete: () => void;
  className?: string;
  disabled?: boolean;
}

export function BuildingActionMenu({ project, onDelete, className, disabled }: BuildingActionMenuProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [newName, setNewName] = useState(project.name);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRename = async () => {
    if (!user || !newName.trim()) return;
    
    setIsLoading(true);
    try {
      // Use a direct update with service role instead of RLS (would need API endpoint)
      // For now, doing a simple update might still work if RLS allows updates
      const { error } = await supabase
        .from('buildings')
        .update({ name: newName.trim() })
        .eq('id', project.id);
        
      if (error) throw error;
      
      toast({
        title: "Building renamed",
        description: `Building has been renamed to "${newName.trim()}"`
      });
      
      // Force reload to refresh the list
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error renaming building",
        description: error.message || "Failed to rename building",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsRenameDialogOpen(false);
    }
  };

  const handleMove = async () => {
    if (!user || !selectedOrgId) return;
    
    setIsLoading(true);
    try {
      // Previously tried using 'organization_id' which doesn't exist in schema
      // Update to use owner_id which is in the schema
      const { error } = await supabase
        .from('buildings')
        .update({ owner_id: selectedOrgId })
        .eq('id', project.id);
        
      if (error) throw error;
      
      toast({
        title: "Building moved",
        description: "Building has been moved to the selected organization"
      });
      
      // Force reload to refresh the list
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error moving building",
        description: error.message || "Failed to move building",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsMoveDialogOpen(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className={`text-gray-500 hover:text-gray-900 hover:bg-gray-100 ${className}`}
            disabled={disabled}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Building Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsNotesDialogOpen(true)}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Notes
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsRenameDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsMoveDialogOpen(true)}>
            <Move className="mr-2 h-4 w-4" />
            Move to Organization
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Notes Dialog */}
      <BuildingNotes 
        buildingId={project.id}
        open={isNotesDialogOpen}
        onOpenChange={setIsNotesDialogOpen}
      />

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Building</DialogTitle>
            <DialogDescription>
              Change the name of your building.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!newName.trim() || isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Dialog */}
      <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Move to Organization</DialogTitle>
            <DialogDescription>
              Select the organization you want to move this building to.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <OrganizationSelect 
              onSelect={setSelectedOrgId}
              selected={selectedOrgId}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMoveDialogOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleMove} disabled={!selectedOrgId || isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Move Building
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
