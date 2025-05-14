
import React from "react";
import { Building } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NoBuildingsProps {
  isSearching: boolean;
  searchQuery?: string;
  onRefresh?: () => void;
}

export const NoBuildings: React.FC<NoBuildingsProps> = ({ 
  isSearching, 
  searchQuery = "", 
  onRefresh 
}) => {
  return (
    <div className="text-center py-12 bg-white rounded-lg shadow">
      <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      {isSearching ? (
        <>
          <h2 className="text-2xl font-semibold mb-4">No buildings match your search</h2>
          <p className="text-gray-500 mb-6">Try different search terms</p>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-semibold mb-4">No buildings yet</h2>
          <p className="text-gray-500 mb-6">Create your first building to get started</p>
        </>
      )}
      {onRefresh && (
        <Button 
          onClick={onRefresh} 
          variant="default"
          className="mx-auto"
        >
          Refresh Page
        </Button>
      )}
    </div>
  );
};
