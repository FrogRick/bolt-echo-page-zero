import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Search } from "lucide-react";
import BuildingMarker from "@/components/BuildingMarker";
import { createRoot } from "react-dom/client";

// Mapbox token
const MAPBOX_TOKEN = "pk.eyJ1IjoiZnJldGgwMyIsImEiOiJjajI2a29mYzAwMDJqMnducnZmNnMzejB1In0.oRpO5T3aTpkP1QO8WjsiSw";
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
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [name, setName] = useState("");
  const [addressInput, setAddressInput] = useState("");
  const [addressSelected, setAddressSelected] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{
    place_name: string;
    center: [number, number];
  }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
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
  useEffect(() => {
    if (map.current) return; // Exit if map is already initialized
    
    if (mapContainer.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [location.lng, location.lat],
        zoom: 10,
        scrollZoom: false // Disable scroll zooming
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Create marker element with BuildingMarker component
      const markerElement = document.createElement('div');
      const markerRoot = createRoot(markerElement);
      markerRoot.render(<BuildingMarker />);

      // Add marker
      marker.current = new mapboxgl.Marker({
        element: markerElement,
        draggable: true
      })
        .setLngLat([location.lng, location.lat])
        .addTo(map.current);

      // Update location when marker is dragged
      marker.current.on('dragend', () => {
        const lngLat = marker.current!.getLngLat();
        updateLocation(lngLat.lat, lngLat.lng);
      });

      // Allow clicking on map to place marker
      map.current.on('click', (e) => {
        if (marker.current) {
          marker.current.setLngLat([e.lngLat.lng, e.lngLat.lat]);
          updateLocation(e.lngLat.lat, e.lngLat.lng);
        }
      });
    }

    // Try to get user's current location
    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        if (map.current) {
          map.current.setCenter([longitude, latitude]);
          map.current.setZoom(14);
        }
        if (marker.current) {
          marker.current.setLngLat([longitude, latitude]);
        }
        updateLocation(latitude, longitude);
      },
      error => console.log("Geolocation error:", error)
    );

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
        setAddressInput(address);
        setAddressSelected(true);
      }
    } catch (error) {
      console.error("Error in reverse geocoding:", error);
    }
  };

  // Handle address input changes and fetch suggestions
  const handleAddressInputChange = (value: string) => {
    setAddressInput(value);
    setAddressSelected(false);
    
    if (value.trim().length > 2) {
      // Fetch address suggestions from Mapbox
      fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${MAPBOX_TOKEN}`)
        .then(res => res.json())
        .then(data => {
          if (data.features && Array.isArray(data.features)) {
            setSuggestions(data.features);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
          }
        })
        .catch(error => {
          console.error("Error fetching address suggestions:", error);
          setSuggestions([]);
        });
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle selecting an address from suggestions
  const handleSelectAddress = (suggestion: { place_name: string; center: [number, number] }) => {
    setAddressInput(suggestion.place_name);
    setAddressSelected(true);
    setShowSuggestions(false);
    
    const [lng, lat] = suggestion.center;
    
    // Update location state
    setLocation({
      lat,
      lng,
      address: suggestion.place_name
    });
    
    // Update map view
    if (map.current) {
      map.current.flyTo({
        center: [lng, lat],
        zoom: 14
      });
    }
    
    // Update marker position
    if (marker.current) {
      marker.current.setLngLat([lng, lat]);
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
    
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your building.",
        variant: "destructive",
      });
      return;
    }

    if (!addressSelected || !location.address) {
      toast({
        title: "Address required",
        description: "Please select a valid address from the suggestions.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Create building in Supabase
      const buildingData = {
        name: name.trim(),
        address: location.address,
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
      className="max-w-2xl mx-auto bg-white rounded-lg p-6 shadow-sm border border-border/40"
    >
      <h2 className="text-xl font-bold mb-4 text-primary">Create Building</h2>
      <div className="mb-4">
        <label className="block mb-1.5 font-medium text-sm">Name</label>
        <input 
          className="border border-input/60 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Main Office" 
          autoFocus 
        />
      </div>
      
      {/* Address search with auto-suggestions */}
      <div className="mb-4">
        <label className="block mb-1.5 font-medium text-sm">Address</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <input 
            className={`border rounded-md pl-9 pr-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors ${
              addressSelected ? 'border-primary' : 'border-input/60'
            }`}
            value={addressInput}
            onChange={(e) => handleAddressInputChange(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Type to search for an address" 
          />
          
          {/* Display address suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full bg-white border border-border/40 rounded-md shadow-lg max-h-60 overflow-auto">
              {suggestions.map((suggestion, index) => (
                <li
                  key={`${suggestion.place_name}-${index}`}
                  className="px-3 py-2 hover:bg-primary/10 cursor-pointer text-sm"
                  onClick={() => handleSelectAddress(suggestion)}
                >
                  {suggestion.place_name}
                </li>
              ))}
            </ul>
          )}
        </div>
        {addressInput && !addressSelected && (
          <p className="mt-1.5 text-sm text-amber-500">Please select an address from the suggestions</p>
        )}
        {addressSelected && (
          <p className="mt-1.5 text-sm text-primary">Address selected</p>
        )}
      </div>
      
      {/* Mapbox container */}
      <div className="mb-6">
        <div
          ref={mapContainer}
          className="w-full h-64 rounded-md border border-border/40 shadow-inner"
          style={{ minHeight: "250px" }}
        />
        <p className="text-xs text-muted-foreground mt-1.5">Click on the map to set location or drag the marker</p>
      </div>
      
      <div className="flex justify-center space-x-2">
        <Button 
          type="button" 
          variant="outline"
          onClick={onCancel}
          className="border-input/60"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={loading || !addressSelected}
          className="bg-primary hover:bg-primary/90 transition-colors"
        >
          {loading ? "Creating..." : "Create Building"}
        </Button>
      </div>
    </form>
  );
}
