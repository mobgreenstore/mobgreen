"use client";

import {
  Bike,
  ChevronDown,
  ChevronUp,
  Clock3,
  Crosshair,
  MapPin,
  Navigation,
  Route,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import Map, {
  FullscreenControl,
  GeolocateControl,
  Layer,
  Marker,
  NavigationControl,
  ScaleControl,
  Source,
  type LayerProps,
  type MapRef,
} from "react-map-gl/mapbox";
import { splitLineStringAtProgress } from "@/features/tracking/domain";
import type {
  PublicDeliveryTracking,
  TrackingCoordinate,
} from "@/features/tracking/types";
import { cn } from "@/lib/utils";

const routeCasingLayer: LayerProps = {
  id: "delivery-route-casing",
  type: "line",
  paint: {
    "line-color": "#ffffff",
    "line-width": ["interpolate", ["linear"], ["zoom"], 8, 7, 16, 11],
    "line-opacity": 0.92,
  },
  layout: { "line-cap": "round", "line-join": "round" },
};

const completedRouteLayer: LayerProps = {
  id: "delivery-route-completed",
  type: "line",
  paint: {
    "line-color": "#10b981",
    "line-width": ["interpolate", ["linear"], ["zoom"], 8, 4, 16, 7],
    "line-opacity": 1,
  },
  layout: { "line-cap": "round", "line-join": "round" },
};

const remainingRouteLayer: LayerProps = {
  id: "delivery-route-remaining",
  type: "line",
  paint: {
    "line-color": "#2563eb",
    "line-width": ["interpolate", ["linear"], ["zoom"], 8, 4, 16, 7],
    "line-opacity": 0.95,
  },
  layout: { "line-cap": "round", "line-join": "round" },
};

const completedFallbackLayer: LayerProps = {
  ...completedRouteLayer,
  id: "delivery-fallback-route-completed",
  paint: { ...completedRouteLayer.paint, "line-color": "#16a34a" },
};

const remainingFallbackLayer: LayerProps = {
  ...remainingRouteLayer,
  id: "delivery-fallback-route-remaining",
  paint: {
    ...remainingRouteLayer.paint,
    "line-color": "#3b82f6",
    "line-dasharray": [1.5, 1.2],
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
    "circle-opacity": 0.1,
    "circle-stroke-color": "#60a5fa",
    "circle-stroke-opacity": 0.65,
    "circle-stroke-width": 1.5,
  },
};

function bearingBetween(from: TrackingCoordinate, to: TrackingCoordinate) {
  const longitudeDelta = ((to[0] - from[0]) * Math.PI) / 180;
  const fromLatitude = (from[1] * Math.PI) / 180;
  const toLatitude = (to[1] * Math.PI) / 180;
  const y = Math.sin(longitudeDelta) * Math.cos(toLatitude);
  const x =
    Math.cos(fromLatitude) * Math.sin(toLatitude) -
    Math.sin(fromLatitude) * Math.cos(toLatitude) * Math.cos(longitudeDelta);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function AnimatedCourier({
  target,
  displayName,
}: {
  target: TrackingCoordinate;
  displayName: string;
}) {
  const [coordinate, setCoordinate] = useState(target);
  const [bearing, setBearing] = useState(0);
  const current = useRef(target);

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const start = current.current;
    setBearing(bearingBetween(start, target));
    if (reduce) {
      const reducedFrame = requestAnimationFrame(() => {
        current.current = target;
        setCoordinate(target);
      });
      return () => cancelAnimationFrame(reducedFrame);
    }
    const startedAt = performance.now();
    let frame = 0;
    const animate = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / 950);
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
    <Marker longitude={coordinate[0]} latitude={coordinate[1]} anchor="bottom">
      <div className="flex flex-col items-center">
        <span className="mb-1 max-w-40 truncate rounded-full bg-[#101211]/92 px-3 py-1.5 text-xs font-semibold text-white shadow-lg ring-1 ring-white/20 backdrop-blur-md">
          {displayName}
        </span>
        <span className="grid size-11 place-items-center rounded-full border-[3px] border-white bg-[#101211] text-white shadow-[0_6px_20px_rgb(0_0_0/35%)]">
          <Navigation
            aria-hidden="true"
            className="size-4 transition-transform duration-500 motion-reduce:transition-none"
            fill="currentColor"
            style={{ transform: `rotate(${bearing}deg)` }}
          />
          <span className="sr-only">Courier position</span>
        </span>
      </div>
    </Marker>
  );
}

function routeBounds(tracking: PublicDeliveryTracking) {
  return tracking.geometry.coordinates.reduce(
    (current, coordinate) => ({
      minLongitude: Math.min(current.minLongitude, coordinate[0]),
      maxLongitude: Math.max(current.maxLongitude, coordinate[0]),
      minLatitude: Math.min(current.minLatitude, coordinate[1]),
      maxLatitude: Math.max(current.maxLatitude, coordinate[1]),
    }),
    {
      minLongitude: Math.min(tracking.origin[0], tracking.destination[0]),
      maxLongitude: Math.max(tracking.origin[0], tracking.destination[0]),
      minLatitude: Math.min(tracking.origin[1], tracking.destination[1]),
      maxLatitude: Math.max(tracking.origin[1], tracking.destination[1]),
    },
  );
}

export function TrackingMap({
  tracking,
  compact = false,
  courierName = "Courier",
  statusLabel = "Out for delivery",
  distanceRemainingLabel = "—",
  timeRemainingLabel = "—",
  arrivalLabel = "—",
}: {
  tracking: PublicDeliveryTracking;
  compact?: boolean;
  courierName?: string;
  statusLabel?: string;
  distanceRemainingLabel?: string;
  timeRemainingLabel?: string;
  arrivalLabel?: string;
}) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const mapRef = useRef<MapRef>(null);
  const [dark, setDark] = useState(false);
  const [following, setFollowing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const bounds = routeBounds(tracking);

  const fitRoute = useCallback(
    (duration = 650) => {
      setFollowing(false);
      mapRef.current?.fitBounds(
        [
          [bounds.minLongitude, bounds.minLatitude],
          [bounds.maxLongitude, bounds.maxLatitude],
        ],
        {
          padding: compact
            ? 34
            : {
                top: 82,
                right: 48,
                bottom: detailsOpen ? 220 : 116,
                left: 48,
              },
          maxZoom: 15.5,
          duration,
        },
      );
    },
    [bounds, compact, detailsOpen],
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => {
      const explicit = document.documentElement.dataset.theme;
      setDark(explicit === "dark" || (explicit !== "light" && media.matches));
    };
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    update();
    media.addEventListener("change", update);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!following || !loaded) return;
    mapRef.current?.easeTo({
      center: tracking.courier,
      zoom: Math.max(mapRef.current.getZoom(), 14.25),
      duration: 850,
      essential: true,
    });
  }, [following, loaded, tracking.courier]);

  if (!token) {
    return (
      <section
        aria-label="Delivery map unavailable"
        className="grid min-h-[34rem] place-items-center bg-surface-subtle p-6 text-center text-sm text-foreground-muted sm:rounded-[1.75rem]"
      >
        Map display is unavailable until the public Mapbox token is configured.
        Delivery timing and route updates remain available below.
      </section>
    );
  }

  const routeSegments = splitLineStringAtProgress(
    tracking.geometry,
    tracking.progress,
  );
  const completeRouteData = {
    type: "Feature" as const,
    properties: {},
    geometry: tracking.geometry,
  };
  const completedRouteData = {
    type: "Feature" as const,
    properties: {},
    geometry: routeSegments.completed,
  };
  const remainingRouteData = {
    type: "Feature" as const,
    properties: {},
    geometry: routeSegments.remaining,
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
    <section
      aria-labelledby="delivery-map-title"
      className={cn(
        "relative isolate overflow-hidden bg-surface-subtle shadow-sm",
        compact
          ? "h-[260px] rounded-2xl border border-border"
          : "-mx-3 h-[min(68svh,40rem)] min-h-[28rem] sm:mx-0 sm:h-[min(72svh,46rem)] sm:rounded-[1.75rem] sm:border sm:border-border",
      )}
    >
      <h2 id="delivery-map-title" className="sr-only">
        Delivery map
      </h2>
      <p id="delivery-map-description" className="sr-only">
        Estimated courier movement along the delivery route. The green line is
        completed travel and the blue line is the remaining route. Use touch,
        mouse, keyboard, or the map controls to explore.
      </p>
      <Map
        ref={mapRef}
        aria-describedby="delivery-map-description"
        aria-label="Interactive delivery route map"
        mapboxAccessToken={token}
        initialViewState={{
          latitude: tracking.courier[1],
          longitude: tracking.courier[0],
          zoom: 12,
          pitch: compact ? 0 : 22,
        }}
        onLoad={() => {
          setLoaded(true);
          fitRoute(0);
        }}
        onDragStart={() => setFollowing(false)}
        mapStyle={
          dark
            ? "mapbox://styles/mapbox/navigation-night-v1"
            : "mapbox://styles/mapbox/navigation-day-v1"
        }
        style={{ width: "100%", height: "100%" }}
        attributionControl
        cooperativeGestures={false}
        touchPitch={!compact}
        dragRotate={!compact}
        maxPitch={60}
        reuseMaps
      >
        <NavigationControl
          position="top-right"
          showCompass={!compact}
          visualizePitch={!compact}
        />
        {!compact && (
          <>
            <FullscreenControl position="top-right" />
            <GeolocateControl
              position="top-right"
              positionOptions={{ enableHighAccuracy: true, timeout: 10_000 }}
              fitBoundsOptions={{ maxZoom: 15 }}
              showUserHeading
            />
            <ScaleControl position="bottom-left" unit="metric" />
          </>
        )}
        <Source
          id="delivery-route-casing-source"
          type="geojson"
          data={completeRouteData}
        >
          <Layer {...routeCasingLayer} />
        </Source>
        <Source id="delivery-zone-source" type="geojson" data={destinationData}>
          <Layer {...zoneLayer} />
        </Source>
        <Source
          id="delivery-route-remaining-source"
          type="geojson"
          data={remainingRouteData}
        >
          <Layer
            {...(tracking.routeKind === "DRIVING"
              ? remainingRouteLayer
              : remainingFallbackLayer)}
          />
        </Source>
        <Source
          id="delivery-route-completed-source"
          type="geojson"
          data={completedRouteData}
        >
          <Layer
            {...(tracking.routeKind === "DRIVING"
              ? completedRouteLayer
              : completedFallbackLayer)}
          />
        </Source>
        <Marker
          longitude={tracking.origin[0]}
          latitude={tracking.origin[1]}
          anchor="center"
        >
          <span className="size-3 rounded-full border-2 border-white bg-slate-700 shadow-md">
            <span className="sr-only">Route starting point</span>
          </span>
        </Marker>
        <AnimatedCourier target={tracking.courier} displayName={courierName} />
        <Marker
          longitude={tracking.destination[0]}
          latitude={tracking.destination[1]}
          anchor="bottom"
        >
          <div className="flex flex-col items-center">
            {!compact && (
              <span className="mb-1 rounded-full bg-blue-600 px-2.5 py-1 text-[0.6875rem] font-semibold text-white shadow-lg">
                Delivery address
              </span>
            )}
            <span className="grid size-11 place-items-center rounded-full border-[3px] border-white bg-blue-600 text-white shadow-[0_6px_20px_rgb(0_0_0/30%)]">
              <MapPin
                aria-hidden="true"
                className="size-5"
                fill="currentColor"
              />
              <span className="sr-only">Recipient destination</span>
            </span>
          </div>
        </Marker>

        {!compact && (
          <>
            <div className="pointer-events-none absolute top-3 left-3 z-10 flex max-w-[calc(100%-5.5rem)] flex-wrap items-center gap-2 sm:top-4 sm:left-4">
              <span className="inline-flex min-h-9 items-center gap-2 rounded-full bg-[#101211]/90 px-3 text-xs font-semibold text-white shadow-lg ring-1 ring-white/15 backdrop-blur-md">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
                </span>
                {statusLabel}
              </span>
            </div>

            <div className="pointer-events-none absolute inset-x-3 bottom-5 z-10 sm:inset-x-4 sm:bottom-4">
              <div className="pointer-events-auto mx-auto max-w-2xl overflow-hidden rounded-[1.2rem] bg-[#101211]/92 text-white shadow-[0_14px_42px_rgb(0_0_0/34%)] ring-1 ring-white/15 backdrop-blur-xl">
                <button
                  type="button"
                  aria-expanded={detailsOpen}
                  onClick={() => setDetailsOpen((current) => !current)}
                  className="flex min-h-[4.25rem] w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left focus-visible:outline-2 focus-visible:outline-white sm:px-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/12">
                      <Bike aria-hidden="true" className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {courierName}
                      </p>
                      <p className="truncate text-xs text-white/62">
                        {tracking.progress >= 1
                          ? "Arrived"
                          : `${distanceRemainingLabel} away · ${timeRemainingLabel}`}
                      </p>
                    </div>
                  </div>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="font-mono text-xs font-semibold">
                      {Math.round(tracking.progress * 100)}%
                    </span>
                    {detailsOpen ? (
                      <ChevronDown aria-hidden="true" className="size-4" />
                    ) : (
                      <ChevronUp aria-hidden="true" className="size-4" />
                    )}
                    <span className="sr-only">
                      {detailsOpen
                        ? "Hide delivery details"
                        : "Show delivery details"}
                    </span>
                  </span>
                </button>

                <div className="mx-3.5 h-1 overflow-hidden rounded-full bg-white/15 sm:mx-4">
                  <span
                    aria-hidden="true"
                    className="block h-full rounded-full bg-emerald-400 transition-[width] duration-700 motion-reduce:transition-none"
                    style={{ width: `${Math.round(tracking.progress * 100)}%` }}
                  />
                </div>

                {detailsOpen && (
                  <>
                    <dl className="mt-2.5 grid grid-cols-3 divide-x divide-white/12 border-t border-white/10">
                      <div className="min-w-0 px-3 py-3 sm:px-5">
                        <dt className="flex items-center gap-1.5 text-[0.6875rem] text-white/58">
                          <Route aria-hidden="true" className="size-3.5" />
                          Remaining
                        </dt>
                        <dd className="mt-1 truncate text-sm font-semibold">
                          {distanceRemainingLabel}
                        </dd>
                      </div>
                      <div className="min-w-0 px-3 py-3 sm:px-5">
                        <dt className="flex items-center gap-1.5 text-[0.6875rem] text-white/58">
                          <Clock3 aria-hidden="true" className="size-3.5" />
                          Time left
                        </dt>
                        <dd className="mt-1 truncate text-sm font-semibold">
                          {timeRemainingLabel}
                        </dd>
                      </div>
                      <div className="min-w-0 px-3 py-3 sm:px-5">
                        <dt className="text-[0.6875rem] text-white/58">
                          Arrival
                        </dt>
                        <dd className="mt-1 truncate text-sm font-semibold">
                          {arrivalLabel}
                        </dd>
                      </div>
                    </dl>

                    <div className="flex gap-2 border-t border-white/10 p-2.5">
                      <button
                        type="button"
                        onClick={() => fitRoute()}
                        className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-white/10 px-3 text-xs font-semibold transition-colors hover:bg-white/16 focus-visible:outline-white"
                      >
                        <Route aria-hidden="true" className="size-4" />
                        Entire route
                      </button>
                      <button
                        type="button"
                        aria-pressed={following}
                        onClick={() => setFollowing((current) => !current)}
                        className={cn(
                          "inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold transition-colors focus-visible:outline-white",
                          following
                            ? "bg-blue-500 text-white hover:bg-blue-400"
                            : "bg-white/10 hover:bg-white/16",
                        )}
                      >
                        <Crosshair aria-hidden="true" className="size-4" />
                        {following ? "Following" : "Follow courier"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </Map>
    </section>
  );
}
