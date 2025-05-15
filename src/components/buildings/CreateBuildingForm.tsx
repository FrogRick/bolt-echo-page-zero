
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Replace this with your Mapbox access token
const MAPBOX_TOKEN = "pk.eyJ1IjoiYWlldmFjLXBsYW5zIiwiYSI6ImNsbjBnZzdwYzA4Y3Qya3BneGZiN2U3Z2UifQ.S6Y2N-XT0F6TJnHJRd8fvA";
mapboxgl.accessToken = MAPBOX_TOKEN;

interface CreateBuildingFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateBuildingForm({ onSuccess, onCancel }: CreateBuildingFormProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  }>({
    lat: 40.7128,
    lng: -74.0060,
    address: ''
  });

  // Initialize map when component mounts
  React.useEffect(() => {
    if (map.current) return; // Exit if map is already initialized
    
    if (mapContainer.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [location.lng, location.lat],
        zoom: 10
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add marker
      const marker = new mapboxgl.Marker({
        draggable: true
      })
        .setLngLat([location.lng, location.lat])
        .addTo(map.current);

      // Update location when marker is dragged
      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        updateLocation(lngLat.lat, lngLat.lng);
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  // Update location from coordinates
  const updateLocation = async (lat: number, lng: number) => {
    // Update local state
    setLocation(prevLocation => ({ ...prevLocation, lat, lng }));

    // Reverse geocode to get address
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const address = data.features[0].place_name;
        setLocation(prevLocation => ({ ...prevLocation, address }));
      }
    } catch (error) {
      console.error("Error in reverse geocoding:", error);
    }
  };

  // Search for location by address
  const searchLocation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const address = (e.currentTarget.elements.namedItem('address') as HTMLInputElement).value;
    
    if (!address) return;

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const [lng, lat] = feature.center;
        
        // Update location
        setLocation({
          lat,
          lng,
          address: feature.place_name
        });

        // Update map
        if (map.current) {
          map.current.flyTo({
            center: [lng, lat],
            zoom: 14
          });

          // Update marker
          const markers = document.getElementsByClassName('mapboxgl-marker');
          if (markers.length > 0) {
            // Cast to HTMLElement to use remove
            const marker = markers[0] as HTMLElement;
            marker.remove();
          }

          new mapboxgl.Marker({
            draggable: true
          })
            .setLngLat([lng, lat])
            .addTo(map.current);
        }
      }
    } catch (error) {
      console.error("Error searching for location:", error);
    }
  };

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
        address: location.address || null,
        lat: location.lat,
        lng: location.lng,
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
      
      {/* Address search form */}
      <div className="mb-4">
        <label className="block mb-1 font-medium">Address</label>
        <form onSubmit={searchLocation} className="flex gap-2">
          <input 
            className="border rounded px-3 py-2 flex-1" 
            name="address" 
            value={location.address}
            onChange={(e) => setLocation({...location, address: e.target.value})}
            placeholder="Search for an address" 
          />
          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>
        </form>
      </div>
      
      {/* Mapbox container */}
      <div className="mb-6">
        <div
          ref={mapContainer}
          className="w-full h-64 rounded border"
          style={{ minHeight: "250px" }}
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
