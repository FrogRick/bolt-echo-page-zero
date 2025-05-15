
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreateTemplateFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateTemplateForm({ onSuccess, onCancel }: CreateTemplateFormProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to create a template.",
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
        description: "Please enter a name for your template.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Create template in Supabase
      // Note: You'll need to create a templates table in your database
      const { data, error } = await supabase
        .from('templates')
        .insert([
          {
            name,
            description: description || null,
            user_id: user.id
          }
        ])
        .select()
        .single();
      
      if (error) {
        console.error("Error creating template:", error);
        
        // Special handling for case where templates table doesn't exist
        if (error.code === "42P01") { // relation does not exist
          toast({
            title: "Templates Not Configured",
            description: "The templates feature is not yet fully configured in the database.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to create template. Please try again.",
            variant: "destructive",
          });
        }
        return;
      }
      
      toast({
        title: "Success",
        description: "Template created successfully.",
      });
      
      onSuccess();
    } catch (err) {
      console.error("Unexpected error creating template:", err);
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
      <h2 className="text-xl font-bold mb-4">Create Template</h2>
      <div className="mb-4">
        <label className="block mb-1 font-medium">Name</label>
        <input 
          className="border rounded px-3 py-2 w-full" 
          name="name" 
          placeholder="e.g. Standard Office Layout" 
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
          {loading ? "Creating..." : "Create Template"}
        </Button>
      </div>
    </form>
  );
}
