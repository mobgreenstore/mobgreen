"use client";

import { MapPin, Navigation, Store } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Map, {
  Layer,
  Marker,
  NavigationControl,
  Source,
  type LayerProps,
  type MapRef,
} from "react-map-gl/mapbox";
import type {
  PublicDeliveryTracking,
  TrackingCoordinate,
} from "@/features/tracking/types";

const routeLayer: LayerProps = {
  id: "delivery-route",
  type: "line",
  paint: {
    "line-color": "#2563eb",
    "line-width": 5,
    "line-opacity": 0.9,
  },
  layout: { "line-cap": "round", "line-join": "round" },
};

const fallbackLayer: LayerProps = {
  ...routeLayer,
  id: "delivery-fallback-route",
  paint: {
    "line-color": "#64748b",
    "line-width": 4,
    "line-opacity": 0.85,
    "line-dasharray": [2, 2],
  },
};

const zoneLayer: LayerProps = {
  id: "delivery-zone",
  type: "circle",
  paint: {
    "circle-radius": [
      "interpolate",
      ["linear"],
      ["zoom"],
      5,
      6,
      12,
      18,
      17,
      34,
    ],
    "circle-color": "#2563eb",
    "circle-opacity": 0.12,
    "circle-stroke-color": "#2563eb",
    "circle-stroke-opacity": 0.45,
    "circle-stroke-width": 1,
  },
};

function AnimatedCourier({ target }: { target: TrackingCoordinate }) {
  const [coordinate, setCoordinate] = useState(target);
  const current = useRef(target);

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) {
      const reducedFrame = requestAnimationFrame(() => {
        current.current = target;
        setCoordinate(target);
      });
      return () => cancelAnimationFrame(reducedFrame);
    }
    const start = current.current;
    const startedAt = performance.now();
    let frame = 0;
    const animate = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / 1200);
      const eased = 1 - (1 - progress) ** 3;
      const next: TrackingCoordinate = [
        start[0] + (target[0] - start[0]) * eased,
        start[1] + (target[1] - start[1]) * eased,
      ];
      current.current = next;
      setCoordinate(next);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return (
    <Marker longitude={coordinate[0]} latitude={coordinate[1]} anchor="center">
      <span className="grid size-10 place-items-center rounded-full border-2 border-white bg-foreground text-background shadow-lg">
        <Navigation aria-hidden="true" className="size-4" fill="currentColor" />
        <span className="sr-only">Simulated courier position</span>
      </span>
    </Marker>
  );
}

export function TrackingMap({
  tracking,
  compact = false,
}: {
  tracking: PublicDeliveryTracking;
  compact?: boolean;
}) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const mapRef = useRef<MapRef>(null);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setDark(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  if (!token) {
    return (
      <div className="grid min-h-72 place-items-center rounded-2xl bg-surface-subtle p-6 text-center text-sm text-foreground-muted">
        Map display is unavailable until the public Mapbox token is configured.
      </div>
    );
  }

  const bounds = tracking.geometry.coordinates.reduce(
    (current, coordinate) => ({
      minLongitude: Math.min(current.minLongitude, coordinate[0]),
      maxLongitude: Math.max(current.maxLongitude, coordinate[0]),
      minLatitude: Math.min(current.minLatitude, coordinate[1]),
      maxLatitude: Math.max(current.maxLatitude, coordinate[1]),
    }),
    {
      minLongitude: tracking.origin[0],
      maxLongitude: tracking.origin[0],
      minLatitude: tracking.origin[1],
      maxLatitude: tracking.origin[1],
    },
  );
  const routeData = {
    type: "Feature" as const,
    properties: {},
    geometry: tracking.geometry,
  };
  const destinationData = {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "Point" as const,
      coordinates: tracking.destination,
    },
  };

  return (
    <div
      role="img"
      aria-label="Delivery route with dispatch, simulated courier, and recipient markers"
      className="overflow-hidden rounded-2xl border border-border bg-surface-subtle shadow-sm"
    >
      <Map
        ref={mapRef}
        mapboxAccessToken={token}
        initialViewState={{
          latitude: tracking.courier[1],
          longitude: tracking.courier[0],
          zoom: 11,
        }}
        onLoad={() =>
          mapRef.current?.fitBounds(
            [
              [bounds.minLongitude, bounds.minLatitude],
              [bounds.maxLongitude, bounds.maxLatitude],
            ],
            { padding: compact ? 36 : 64, maxZoom: 15, duration: 0 },
          )
        }
        mapStyle={
          dark
            ? "mapbox://styles/mapbox/dark-v11"
            : "mapbox://styles/mapbox/streets-v12"
        }
        style={{ width: "100%", height: compact ? 260 : 430 }}
        attributionControl
        cooperativeGestures
        touchPitch={false}
        dragRotate={false}
      >
        <NavigationControl position="top-right" showCompass={false} />
        <Source id="delivery-zone-source" type="geojson" data={destinationData}>
          <Layer {...zoneLayer} />
        </Source>
        <Source id="delivery-route-source" type="geojson" data={routeData}>
          <Layer
            {...(tracking.routeKind === "DRIVING" ? routeLayer : fallbackLayer)}
          />
        </Source>
        <Marker
          longitude={tracking.origin[0]}
          latitude={tracking.origin[1]}
          anchor="center"
        >
          <span className="grid size-9 place-items-center rounded-full border-2 border-white bg-black text-white shadow-md">
            <Store aria-hidden="true" className="size-4" />
            <span className="sr-only">Private dispatch origin</span>
          </span>
        </Marker>
        <AnimatedCourier target={tracking.courier} />
        <Marker
          longitude={tracking.destination[0]}
          latitude={tracking.destination[1]}
          anchor="bottom"
        >
          <span className="grid size-10 place-items-center rounded-full border-2 border-white bg-blue-600 text-white shadow-md">
            <MapPin aria-hidden="true" className="size-5" />
            <span className="sr-only">Recipient destination</span>
          </span>
        </Marker>
      </Map>
    </div>
  );
}
