
import React, { useRef, useEffect, useState } from "react";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from "@/components/ui/button";
import { Building } from "lucide-react";
import { Link } from "react-router-dom";

// Set your Mapbox access token
const MAPBOX_TOKEN = "pk.eyJ1IjoiZnJldGgwMyIsImEiOiJjajI2a29mYzAwMDJqMnducnZmNnMzejB1In0.oRpO5T3aTpkP1QO8WjsiSw";

type Project = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
};

interface MapViewProps {
  projects: Project[];
}

const MapView: React.FC<MapViewProps> = ({ projects }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize map when component mounts
  useEffect(() => {
    // Early return if ref is not available or map is already initialized
    if (!mapContainerRef.current || mapInitialized) return;

    try {
      mapboxgl.accessToken = MAPBOX_TOKEN;

      // Create the map instance
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12', // Updated to streets-v12
        center: [10, 35], // Default center (can be adjusted)
        zoom: 2,
      });

      // Add navigation controls
      mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Wait for map to load
      mapRef.current.on('load', () => {
        setMapInitialized(true);
        
        // Add markers for projects with locations
        projects.forEach(project => {
          if (project.location && project.location.lat && project.location.lng) {
            // Create a DOM element for the marker
            const el = document.createElement('div');
            el.className = 'marker';
            el.style.backgroundColor = '#19e16c';
            el.style.width = '24px';
            el.style.height = '24px';
            el.style.borderRadius = '50%';
            el.style.cursor = 'pointer';
            el.style.boxShadow = '0 0 0 4px white';

            // Create popup content
            const popupContent = document.createElement('div');
            popupContent.innerHTML = `
              <h3 class="text-lg font-bold">${project.name}</h3>
              <p class="text-sm whitespace-pre-line">${project.location.address.split(',').join('\n')}</p>
              <a href="/editor/${project.id}" class="text-blue-600 hover:underline">Open</a>
            `;

            // Add popup
            const popup = new mapboxgl.Popup({ offset: 25 })
              .setDOMContent(popupContent);

            // Create and add marker
            new mapboxgl.Marker(el)
              .setLngLat([project.location.lng, project.location.lat])
              .setPopup(popup)
              .addTo(mapRef.current!);
          }
        });
      });
    } catch (error) {
      console.error("Error initializing map:", error);
      setErrorMsg("Failed to initialize map. Please check your connection and try again.");
    }

    // Clean up on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, [projects, mapInitialized]);

  // Show empty state if there are no projects with locations
  const projectsWithLocations = projects.filter(p => p.location && p.location.lat && p.location.lng);
  const hasLocations = projectsWithLocations.length > 0;

  if (errorMsg) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold mb-4">Map Error</h2>
        <p className="text-gray-500 mb-6">{errorMsg}</p>
      </div>
    );
  }
  
  return (
    <div className="relative h-[70vh] bg-gray-50 rounded-lg shadow-md overflow-hidden">
      {!hasLocations && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-4">No buildings with locations</h2>
          <p className="text-gray-500 mb-6">Add addresses to your buildings to see them on the map</p>
          <Link to="/new">
            <Button variant="default" className="bg-primary hover:bg-primary/90">
              Create a building
            </Button>
          </Link>
        </div>
      )}
      <div 
        ref={mapContainerRef} 
        className="absolute inset-0"
        style={{ visibility: hasLocations ? 'visible' : 'hidden' }}
      />
    </div>
  );
};

export default MapView;
