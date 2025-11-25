"use client";

import dynamic from "next/dynamic";

export const EventMap = dynamic(
  () => import("./event-map").then((mod) => mod.EventMap),
  {
    ssr: false,
    loading: () => (
      <div className="bg-muted animate-pulse rounded-lg h-[200px] flex items-center justify-center text-muted-foreground">
        Chargement de la carte...
      </div>
    ),
  }
);

export const LocationPicker = dynamic(
  () => import("./location-picker").then((mod) => mod.LocationPicker),
  {
    ssr: false,
    loading: () => (
      <div className="bg-muted animate-pulse rounded-lg h-[300px] flex items-center justify-center text-muted-foreground">
        Chargement de la carte...
      </div>
    ),
  }
);
