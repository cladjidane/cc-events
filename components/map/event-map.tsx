"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix pour l'icône du marqueur qui ne s'affiche pas par défaut avec webpack
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface EventMapProps {
  latitude: number;
  longitude: number;
  location?: string;
  className?: string;
}

export function EventMap({ latitude, longitude, location, className }: EventMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className={`bg-muted animate-pulse rounded-lg ${className}`} style={{ minHeight: "200px" }}>
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Chargement de la carte...
        </div>
      </div>
    );
  }

  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={15}
      scrollWheelZoom={false}
      className={`rounded-lg ${className}`}
      style={{ minHeight: "200px", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[latitude, longitude]} icon={icon}>
        {location && <Popup>{location}</Popup>}
      </Marker>
    </MapContainer>
  );
}
