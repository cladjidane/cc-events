"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Loader2 } from "lucide-react";

// Fix pour l'icône du marqueur
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LocationPickerProps {
  value?: {
    location?: string;
    latitude?: number;
    longitude?: number;
  };
  onChange: (value: {
    location: string;
    latitude: number;
    longitude: number;
  }) => void;
  className?: string;
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

// Composant pour gérer le clic sur la carte
function MapClickHandler({
  onLocationSelect,
}: {
  onLocationSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Composant pour recentrer la carte
function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 15);
  }, [map, lat, lng]);
  return null;
}

export function LocationPicker({ value, onChange, className }: LocationPickerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Position par défaut (Paris)
  const defaultLat = value?.latitude || 48.8566;
  const defaultLng = value?.longitude || 2.3522;

  const [position, setPosition] = useState<{ lat: number; lng: number }>({
    lat: defaultLat,
    lng: defaultLng,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fermer les résultats quand on clique ailleurs
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Recherche d'adresse via Nominatim (OpenStreetMap)
  const searchAddress = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=5&countrycodes=fr`
      );
      const data: SearchResult[] = await response.json();
      setSearchResults(data);
      setShowResults(true);
    } catch (error) {
      console.error("Erreur de recherche:", error);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  // Sélection d'un résultat de recherche
  const selectResult = useCallback(
    (result: SearchResult) => {
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);
      setPosition({ lat, lng });
      setSearchQuery(result.display_name);
      setShowResults(false);
      onChange({
        location: result.display_name,
        latitude: lat,
        longitude: lng,
      });
    },
    [onChange]
  );

  // Géocoding inverse (coordonnées -> adresse)
  const reverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        const data = await response.json();
        if (data.display_name) {
          setSearchQuery(data.display_name);
          onChange({
            location: data.display_name,
            latitude: lat,
            longitude: lng,
          });
        }
      } catch (error) {
        console.error("Erreur de géocoding inverse:", error);
        onChange({
          location: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          latitude: lat,
          longitude: lng,
        });
      }
    },
    [onChange]
  );

  // Clic sur la carte
  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      setPosition({ lat, lng });
      reverseGeocode(lat, lng);
    },
    [reverseGeocode]
  );

  // Géolocalisation
  const handleGeolocation = useCallback(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setPosition({ lat, lng });
          reverseGeocode(lat, lng);
        },
        (error) => {
          console.error("Erreur de géolocalisation:", error);
        }
      );
    }
  }, [reverseGeocode]);

  if (!isMounted) {
    return (
      <div
        className={`bg-muted animate-pulse rounded-lg ${className}`}
        style={{ minHeight: "350px" }}
      >
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Chargement de la carte...
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Barre de recherche */}
      <div className="relative mb-3" ref={searchRef}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Rechercher une adresse..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  searchAddress();
                }
              }}
              className="pr-10"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <Button type="button" variant="outline" size="icon" onClick={searchAddress}>
            <Search className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleGeolocation}
            title="Ma position"
          >
            <MapPin className="h-4 w-4" />
          </Button>
        </div>

        {/* Résultats de recherche */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-50 mt-1 w-full bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
            {searchResults.map((result, index) => (
              <button
                key={index}
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors border-b last:border-b-0"
                onClick={() => selectResult(result)}
              >
                {result.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Carte */}
      <MapContainer
        center={[position.lat, position.lng]}
        zoom={15}
        className="rounded-lg border"
        style={{ height: "300px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[position.lat, position.lng]} icon={icon} />
        <MapClickHandler onLocationSelect={handleMapClick} />
        <MapRecenter lat={position.lat} lng={position.lng} />
      </MapContainer>

      <p className="mt-2 text-xs text-muted-foreground">
        Cliquez sur la carte ou recherchez une adresse pour définir la localisation.
      </p>
    </div>
  );
}
