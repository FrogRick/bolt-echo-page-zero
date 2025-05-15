
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface CreateEvacuationPlanFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  buildingId?: string;
}

export function CreateEvacuationPlanForm({ onSuccess, onCancel, buildingId }: CreateEvacuationPlanFormProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to create an evacuation plan.",
        variant: "destructive",
      });
      return;
    }
    
    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const floorNumber = (form.elements.namedItem("floorNumber") as HTMLInputElement).value;
    
    if (!name) {
      toast({
        title: "Name required",
        description: "Please enter a name for your evacuation plan.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // If no buildingId is provided, we need to create a building first
      let finalBuildingId = buildingId;
      
      if (!buildingId) {
        const { data: building, error: buildingError } = await supabase
          .from('buildings')
          .insert([{
            name: `Building for ${name}`,
            owner_id: user.id
          }])
          .select()
          .single();
          
        if (buildingError) {
          console.error("Error creating associated building:", buildingError);
          toast({
            title: "Error",
            description: "Failed to create associated building. Please try again.",
            variant: "destructive",
          });
          return;
        }
        
        finalBuildingId = building.id;
      }
      
      // Now create the floor plan
      const { data: floorPlan, error } = await supabase
        .from('floor_plans')
        .insert([
          {
            name,
            building_id: finalBuildingId,
            floor_number: floorNumber ? parseInt(floorNumber) : null
          }
        ])
        .select()
        .single();
      
      if (error) {
        console.error("Error creating evacuation plan:", error);
        toast({
          title: "Error",
          description: "Failed to create evacuation plan. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Success",
        description: "Evacuation plan created successfully.",
      });
      
      // Redirect to the editor for this evacuation plan
      navigate(`/editor/${floorPlan.id}`);
      
      onSuccess();
    } catch (err) {
      console.error("Unexpected error creating evacuation plan:", err);
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
      <h2 className="text-xl font-bold mb-4">Create Evacuation Plan</h2>
      <div className="mb-4">
        <label className="block mb-1 font-medium">Name</label>
        <input 
          className="border rounded px-3 py-2 w-full" 
          name="name" 
          placeholder="e.g. First Floor Plan" 
          autoFocus 
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-medium">Floor Number (Optional)</label>
        <input 
          className="border rounded px-3 py-2 w-full" 
          name="floorNumber" 
          type="number" 
          placeholder="e.g. 1" 
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
          {loading ? "Creating..." : "Create Evacuation Plan"}
        </Button>
      </div>
    </form>
  );
}
