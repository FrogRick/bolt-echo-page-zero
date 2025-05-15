
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreateBuildingFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateBuildingForm({ onSuccess, onCancel }: CreateBuildingFormProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to create a building.",
        variant: "destructive",
      });
      return;
    }
    
    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const address = (form.elements.namedItem("address") as HTMLInputElement).value.trim();
    
    if (!name) {
      toast({
        title: "Name required",
        description: "Please enter a name for your building.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Create building in Supabase
      const buildingData = {
        name,
        address: address || null,
        owner_id: user.id
      };
      
      const { data: building, error } = await supabase
        .from('buildings')
        .insert([buildingData])
        .select()
        .single();
      
      if (error) {
        console.error("Error creating building:", error);
        toast({
          title: "Error",
          description: "Failed to create building. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Success",
        description: "Building created successfully.",
      });
      
      onSuccess();
    } catch (err) {
      console.error("Unexpected error creating building:", err);
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
      <h2 className="text-xl font-bold mb-4">Create Building</h2>
      <div className="mb-4">
        <label className="block mb-1 font-medium">Name</label>
        <input 
          className="border rounded px-3 py-2 w-full" 
          name="name" 
          placeholder="e.g. Main Office" 
          autoFocus 
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-medium">Address</label>
        <input 
          className="border rounded px-3 py-2 w-full" 
          name="address" 
          placeholder="Address (optional)" 
        />
      </div>
      <div className="flex justify-end space-x-2">
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
          {loading ? "Creating..." : "Create Building"}
        </Button>
      </div>
    </form>
  );
}
