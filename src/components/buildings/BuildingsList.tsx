
import React from "react";
import { useNavigate } from "react-router-dom";
import { Building } from "lucide-react";
import { GenericCard } from "@/components/ui/GenericCard";
import { BuildingActionMenu } from "@/components/BuildingActionMenu";
import { ProjectDisplayData } from "@/services/buildingService";
import { NoBuildings } from "./NoBuildings";

interface BuildingsListProps {
  buildings: ProjectDisplayData[];
  searchQuery: string;
  onDeleteBuilding: (building: ProjectDisplayData) => void;
  deletingBuildingIds: string[];
  deleteInProgress: boolean;
}

export const BuildingsList: React.FC<BuildingsListProps> = ({
  buildings,
  searchQuery,
  onDeleteBuilding,
  deletingBuildingIds,
  deleteInProgress
}) => {
  const navigate = useNavigate();

  if (buildings.length === 0) {
    return <NoBuildings isSearching={searchQuery.length > 0} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {buildings.map(building => (
        <div key={building.id} className="relative">
          <GenericCard
            title={building.name}
            subtitle={building.location?.address || "No address"}
            icon={<Building className="w-8 h-8 text-primary" />}
            timestamp={{ label: `Last updated: ${building.updatedAt.toLocaleDateString()}` }}
            onClick={() => navigate(`/editor/${building.id}`)}
            loading={deletingBuildingIds.includes(building.id)}
            type="building"
          />
          <BuildingActionMenu 
            project={building}
            onDelete={() => onDeleteBuilding(building)}
            className="absolute top-2 right-8"
            disabled={deleteInProgress || deletingBuildingIds.includes(building.id)}
          />
        </div>
      ))}
    </div>
  );
};
