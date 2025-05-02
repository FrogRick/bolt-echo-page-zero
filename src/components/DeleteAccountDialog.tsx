
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function DeleteAccountDialog() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Delete user account
      const { error } = await supabase.auth.admin.deleteUser(
        user.id
      );
      
      if (error) throw error;
      
      toast({
        title: "Account deleted",
        description: "Your account has been deleted successfully."
      });
      
      // Sign out user and redirect
      await signOut();
      window.location.href = "/";
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete account",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  const isDeleteEnabled = confirmation === "DELETE";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="w-full">Delete Account</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Account</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your account and remove your data from our servers.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="confirmation" className="text-right col-span-4">
              To confirm, type "DELETE" in the field below
            </Label>
            <Input
              id="confirmation"
              className="col-span-4"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button 
            variant="destructive" 
            onClick={handleDeleteAccount} 
            disabled={!isDeleteEnabled || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
