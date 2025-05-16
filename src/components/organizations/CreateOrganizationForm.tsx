
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreateOrganizationFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateOrganizationForm({ onSuccess, onCancel }: CreateOrganizationFormProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to create an organization.",
        variant: "destructive",
      });
      return;
    }
    
    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const description = (form.elements.namedItem("description") as HTMLInputElement).value.trim();
    
    if (!name) {
      toast({
        title: "Name required",
        description: "Please enter a name for your organization.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Use our security definer function to create an organization and add the user as admin
      const { data, error } = await supabase.rpc(
        'create_organization_with_admin', 
        { 
          org_name: name,
          admin_user_id: user.id
        }
      );
      
      if (error) {
        console.error("Error creating organization:", error);
        toast({
          title: "Error",
          description: "Failed to create organization. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Success",
        description: "Organization created successfully.",
      });
      
      onSuccess();
    } catch (err) {
      console.error("Unexpected error creating organization:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto bg-white rounded-lg p-6"
    >
      <h2 className="text-xl font-bold mb-4">Create Organization</h2>
      <div className="mb-4">
        <label className="block mb-1 font-medium">Name</label>
        <input 
          className="border rounded px-3 py-2 w-full" 
          name="name" 
          placeholder="e.g. My Company" 
          autoFocus 
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-medium">Description</label>
        <input 
          className="border rounded px-3 py-2 w-full" 
          name="description" 
          placeholder="Description (optional)" 
        />
      </div>
      <div className="flex justify-center space-x-2">
        <Button 
          type="button" 
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Organization"}
        </Button>
      </div>
    </form>
  );
}
