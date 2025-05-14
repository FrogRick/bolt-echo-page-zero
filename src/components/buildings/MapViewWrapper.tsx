
import React from "react";
import MapView from "@/components/MapView";
import { ProjectDisplayData } from "@/services/buildingService";
import { NoBuildings } from "./NoBuildings";

interface MapViewWrapperProps {
  buildings: ProjectDisplayData[];
  searchQuery: string;
}

export const MapViewWrapper: React.FC<MapViewWrapperProps> = ({
  buildings,
  searchQuery
}) => {
  if (buildings.length === 0) {
    return <NoBuildings isSearching={searchQuery.length > 0} />;
  }
  
  return <MapView projects={buildings} />;
};
