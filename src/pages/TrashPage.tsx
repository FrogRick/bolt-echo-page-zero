
import React, { useState, useEffect } from "react";
import { GenericCard } from "@/components/ui/GenericCard";
import { Flame, Building, User, BookCopy, Loader2, ArchiveRestore } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Icons for card types
const icons = {
  "evacuation-plans": <Flame className="w-8 h-8 text-primary" />,
  "buildings": <Building className="w-8 h-8 text-primary" />,
  "organizations": <User className="w-8 h-8 text-primary" />,
  "templates": <BookCopy className="w-8 h-8 text-primary" />,
};

// Map types to actual Supabase table names
const typeToTable = {
  "buildings": "buildings",
  "organizations": "organizations", 
  "templates": "templates",
  "evacuation-plans": "floor_plans"
} as const;

export default function TrashPage() {
  const { user } = useAuth();
  const [itemsByType, setItemsByType] = useState<Record<string, any[]>>({
    "buildings": [],
    "organizations": [],
    "templates": [],
    "evacuation-plans": []
  });
  const [loading, setLoading] = useState<Record<string, boolean>>({
    "buildings": false,
    "organizations": false,
    "templates": false,
    "evacuation-plans": false
  });
  const [activeTab, setActiveTab] = useState<string>("buildings");
  const { toast } = useToast();
  
  // Helper: fetch deleted items from Supabase for each type
  async function fetchTrashItems() {
    if (!user) return;
    
    const types = Object.keys(typeToTable) as Array<keyof typeof typeToTable>;
    
    // Update loading state for all tabs
    setLoading(prev => {
      const newState = {...prev};
      types.forEach(type => { newState[type] = true; });
      return newState;
    });
    
    try {
      const results = await Promise.all(types.map(async (type) => {
        const tableName = typeToTable[type as keyof typeof typeToTable];
        
        // Fetch only items that have a deleted_at timestamp (in the trash)
        const { data, error } = await supabase
          .from(tableName)
          .select("*")
          .not('deleted_at', 'is', null)
          .order("deleted_at", { ascending: false });
          
        if (error) {
          console.error(`Error fetching deleted ${type}:`, error);
          return { type, data: [] };
        }
        
        return { type, data: data || [] };
      }));
      
      // Update state with fetched data
      const newItemsByType: Record<string, any[]> = { ...itemsByType };
      results.forEach(result => {
        newItemsByType[result.type] = result.data;
      });
      
      setItemsByType(newItemsByType);
    } catch (err) {
      console.error("Error fetching trash items:", err);
      toast({
        title: "Error",
        description: "Failed to load trash items. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Update loading state when done
      setLoading(prev => {
        const newState = {...prev};
        types.forEach(type => { newState[type] = false; });
        return newState;
      });
    }
  }
  
  // Load trash items when the component mounts
  useEffect(() => {
    fetchTrashItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  
  // Calculate days remaining before auto-deletion
  const calculateDaysRemaining = (deletedDate: string): number => {
    const deleted = new Date(deletedDate);
    const autoDeleteDate = new Date(deleted);
    autoDeleteDate.setDate(autoDeleteDate.getDate() + 30); // 30 days from deletion
    
    const today = new Date();
    const diffTime = autoDeleteDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays); // Don't show negative days
  };
  
  // Handle restoring an item from trash
  async function handleRestore(type: string, id: string) {
    if (!user) return;
    
    // Get the corresponding table name from our type
    const tableName = typeToTable[type as keyof typeof typeToTable];
    
    // Set individual item loading state
    setItemsByType(prev => {
      const updatedItems = [...prev[type]];
      const itemIndex = updatedItems.findIndex(item => item.id === id);
      if (itemIndex >= 0) {
        updatedItems[itemIndex] = { ...updatedItems[itemIndex], loading: true };
      }
      return { ...prev, [type]: updatedItems };
    });
    
    try {
      // Update the item to set deleted_at to null (restore)
      const { error } = await supabase
        .from(tableName)
        .update({ deleted_at: null })
        .eq('id', id);
        
      if (error) {
        console.error(`Error restoring ${type}:`, error);
        toast({
          title: "Error",
          description: `Failed to restore ${type.replace(/-/g, " ")}. Please try again.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `${type.replace(/-/g, " ").replace(/s$/, "")} restored successfully.`,
        });
        
        // Remove the item from the list
        setItemsByType(prev => {
          const updatedItems = prev[type].filter(item => item.id !== id);
          return { ...prev, [type]: updatedItems };
        });
      }
    } catch (err) {
      console.error(`Error restoring ${type}:`, err);
      toast({
        title: "Error",
        description: `Failed to restore ${type.replace(/-/g, " ")}. Please try again.`,
        variant: "destructive",
      });
    }
  }

  // Function to handle permanent deletion (future feature - not implemented yet)
  const handlePermanentDelete = (type: string, id: string) => {
    // This would be implemented later if needed
    toast({
      title: "Info",
      description: "Permanent deletion is not available yet. Items will be automatically removed after 30 days.",
    });
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Trash</h1>
      <p className="text-gray-500 mb-2">
        Items in trash will be permanently deleted after 30 days. You can restore them before then.
      </p>
      <div className="p-4 mb-6 bg-amber-50 border border-amber-200 rounded-md">
        <p className="text-amber-800 flex items-center">
          <span className="mr-2">⚠️</span> 
          Items are automatically deleted after 30 days from the deletion date.
        </p>
      </div>
      
      <Tabs
        defaultValue="buildings"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full mb-8"
      >
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="buildings" className="flex items-center gap-2">
            <Building className="h-4 w-4" /> Buildings
          </TabsTrigger>
          <TabsTrigger value="evacuation-plans" className="flex items-center gap-2">
            <Flame className="h-4 w-4" /> Evacuation Plans
          </TabsTrigger>
          <TabsTrigger value="organizations" className="flex items-center gap-2">
            <User className="h-4 w-4" /> Organizations
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <BookCopy className="h-4 w-4" /> Templates
          </TabsTrigger>
        </TabsList>
        
        {Object.keys(typeToTable).map(type => (
          <TabsContent key={type} value={type} className="mt-0">
            {loading[type] ? (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="animate-spin h-8 w-8 text-gray-400" />
              </div>
            ) : itemsByType[type].length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-lg">
                <p className="text-lg font-medium text-gray-600">No {type.replace(/-/g, " ")} in trash</p>
                <p className="text-sm text-gray-500 mt-1">
                  Items you delete will appear here
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {itemsByType[type].map((item) => {
                  // Calculate days remaining before auto-deletion
                  const daysRemaining = calculateDaysRemaining(item.deleted_at);
                  const deletionLabel = daysRemaining > 1 
                    ? `Auto-delete in ${daysRemaining} days` 
                    : daysRemaining === 1 
                      ? "Auto-delete tomorrow" 
                      : "Auto-delete today";
                  
                  return (
                    <GenericCard
                      key={item.id}
                      title={item.name}
                      subtitle={item.description || item.address}
                      icon={icons[type as keyof typeof icons]}
                      timestamp={{ 
                        label: deletionLabel 
                      }}
                      type={type}
                      id={item.id}
                      loading={item.loading}
                      onRestore={() => handleRestore(type, item.id)}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
