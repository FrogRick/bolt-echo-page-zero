import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { createRoot } from "react-dom/client";
import BuildingMarker from "@/components/BuildingMarker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Plus, Minus } from "lucide-react";
const MAPBOX_TOKEN = "pk.eyJ1IjoiZnJldGgwMyIsImEiOiJjajI2a29mYzAwMDJqMnducnZmNnMzejB1In0.oRpO5T3aTpkP1QO8WjsiSw";
const NewProjectPage = () => {
  const [projectName, setProjectName] = useState("");
  const [address, setAddress] = useState("");
  const [addressInput, setAddressInput] = useState("");
  const [suggestions, setSuggestions] = useState<Array<{
    place_name: string;
    center: [number, number];
  }>>([]);
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  useEffect(() => {
    if (!mapContainer.current) return;
    navigator.geolocation.getCurrentPosition(position => {
      const {
        latitude,
        longitude
      } = position.coords;
      mapboxgl.accessToken = MAPBOX_TOKEN;
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [longitude, latitude],
        zoom: 13,
        scrollZoom: false
      });
      const markerElement = document.createElement('div');
      const markerRoot = createRoot(markerElement);
      markerRoot.render(<BuildingMarker />);
      marker.current = new mapboxgl.Marker(markerElement).setLngLat([longitude, latitude]).addTo(map.current);
      setLocation({
        lng: longitude,
        lat: latitude
      });
      fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}`).then(res => res.json()).then(data => {
        if (data.features?.[0]?.place_name) {
          setAddress(data.features[0].place_name);
          setAddressInput(data.features[0].place_name);
        }
      });
    }, () => {
      mapboxgl.accessToken = MAPBOX_TOKEN;
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-74.5, 40],
        zoom: 9,
        scrollZoom: false
      });
      const markerElement = document.createElement('div');
      const markerRoot = createRoot(markerElement);
      markerRoot.render(<BuildingMarker />);
      marker.current = new mapboxgl.Marker(markerElement).setLngLat([-74.5, 40]).addTo(map.current);
    });
    map.current?.addControl(new mapboxgl.NavigationControl(), 'top-right');
    return () => {
      marker.current?.remove();
      map.current?.remove();
    };
  }, []);
  useEffect(() => {
    if (!map.current) return;
    map.current.on('click', e => {
      const {
        lng,
        lat
      } = e.lngLat;
      marker.current?.setLngLat([lng, lat]);
      setLocation({
        lng,
        lat
      });
      fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`).then(res => res.json()).then(data => {
        if (data.features?.[0]?.place_name) {
          setAddress(data.features[0].place_name);
          setAddressInput(data.features[0].place_name);
        }
      });
    });
  }, []);
  useEffect(() => {
    if (!addressInput) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(addressInput)}.json?access_token=${MAPBOX_TOKEN}`).then(res => res.json()).then(data => {
        if (data.features && Array.isArray(data.features)) {
          setSuggestions(data.features || []);
        } else {
          setSuggestions([]);
        }
      }).catch(error => {
        console.error("Error fetching address suggestions:", error);
        setSuggestions([]);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [addressInput]);
  const handleSelectAddress = (suggestion: {
    place_name: string;
    center: [number, number];
  }) => {
    setAddress(suggestion.place_name);
    setAddressInput(suggestion.place_name);
    setOpen(false);
    const [lng, lat] = suggestion.center;
    marker.current?.setLngLat([lng, lat]);
    setLocation({
      lng,
      lat
    });
    map.current?.setCenter([lng, lat]);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      toast({
        title: "Building name required",
        description: "Please enter a name for your building.",
        variant: "destructive"
      });
      return;
    }
    if (!address.trim() || !location) {
      toast({
        title: "Location required",
        description: "Please select a location for your building.",
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);
    const newProject = {
      id: crypto.randomUUID(),
      name: projectName.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
      location: {
        lat: location.lat,
        lng: location.lng,
        address: address.trim()
      },
      pdfData: null,
      symbols: []
    };
    const existingProjects = localStorage.getItem("evacuation-projects");
    const projects = existingProjects ? JSON.parse(existingProjects) : [];
    projects.push(newProject);
    localStorage.setItem("evacuation-projects", JSON.stringify(projects));
    toast({
      title: "Building created",
      description: `"${projectName}" has been created successfully.`
    });
    navigate(`/editor/${newProject.id}`);
  };
  const handleZoomIn = () => {
    map.current?.zoomIn();
  };
  const handleZoomOut = () => {
    map.current?.zoomOut();
  };
  return <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Building</CardTitle>
          <CardDescription>
            Enter details and select location for your new building
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="projectName">Building Name</Label>
              <Input id="projectName" value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="e.g., Office Building" className="mt-1" autoFocus />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <div className="relative mt-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input id="address" value={addressInput} onChange={e => setAddressInput(e.target.value)} placeholder="Search for an address" className="pl-9 pr-4 w-full" onClick={() => setOpen(true)} onFocus={() => setOpen(true)} />
                </div>
                {addressInput && suggestions.length > 0 && open && <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg">
                    <ul className="max-h-60 overflow-auto py-1">
                      {suggestions.map((suggestion, index) => <li key={`${suggestion.place_name}-${index}`} className={cn("px-3 py-2 text-sm cursor-pointer hover:bg-gray-100", address === suggestion.place_name && "bg-gray-100")} onClick={() => handleSelectAddress(suggestion)}>
                          {suggestion.place_name}
                        </li>)}
                    </ul>
                  </div>}
              </div>
              {addressInput && suggestions.length === 0 && open && <div className="mt-1 text-sm text-gray-500">
                  No addresses found
                </div>}
            </div>
            <div>
              <Label>Location</Label>
              <div className="relative">
                <div ref={mapContainer} className="h-[300px] mt-1 rounded-lg overflow-hidden border" />
                <div className="absolute top-2 right-2 flex flex-col gap-2">
                  <Button variant="secondary" size="icon" onClick={handleZoomIn} type="button" className="bg-white hover:bg-gray-100">
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button variant="secondary" size="icon" onClick={handleZoomOut} type="button" className="bg-white hover:bg-gray-100">
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Building"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>;
};
export default NewProjectPage;