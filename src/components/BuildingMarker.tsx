
import { MapPin } from "lucide-react";

const BuildingMarker = () => (
  <div className="text-primary">
    <MapPin size={36} strokeWidth={2} fill="hsl(var(--primary))" className="drop-shadow-md" />
  </div>
);

export default BuildingMarker;
