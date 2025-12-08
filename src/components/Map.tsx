"use client";

import { useStore } from "@/store/useStore";
import Map, { NavigationControl, Marker, Source, Layer, MapRef, Popup } from "react-map-gl";
import { useEffect, useRef, useState } from "react";
import * as turf from "@turf/turf";
// CSS moved to layout.tsx

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const intersectionLayer = {
    id: "intersection-layer",
    type: "fill" as const,
    paint: {
        "fill-color": "#00ff9d", // Neon green for success/intersection
        "fill-opacity": 0.6,
        "fill-outline-color": "#ffffff",
    },
};

export default function AppMap() {
    const { locations, isochrones, meetingArea, addLocationByCoordinates, updateLocationPosition, removeLocation } = useStore();
    const mapRef = useRef<MapRef>(null);

    // Auto-center on Locations
    useEffect(() => {
        if (!mapRef.current || locations.length === 0) return;

        // Calculate bounding box of all points
        const points = turf.featureCollection(
            locations.map(l => turf.point(l.coordinates))
        );
        const [minLng, minLat, maxLng, maxLat] = turf.bbox(points);

        mapRef.current.fitBounds(
            [
                [minLng, minLat],
                [maxLng, maxLat]
            ],
            {
                padding: { top: 100, bottom: 100, left: 100, right: 450 }, // w-96 sidebar is ~384px
                duration: 1000
            }
        );
    }, [locations]);

    // Auto-center on Meeting Area
    useEffect(() => {
        if (!mapRef.current || !meetingArea) return;

        const [minLng, minLat, maxLng, maxLat] = turf.bbox(meetingArea);
        mapRef.current.fitBounds(
            [
                [minLng, minLat],
                [maxLng, maxLat]
            ],
            {
                padding: { top: 100, bottom: 100, left: 100, right: 500 }, // Extra padding for results view
                duration: 1500
            }
        );
    }, [meetingArea]);

    console.log("Mapbox Token present:", !!MAPBOX_TOKEN);

    if (!MAPBOX_TOKEN) {
        return (
            <div className="flex items-center justify-center h-screen w-screen bg-black text-white">
                <div className="text-center">
                    <h2 className="text-xl font-bold mb-2">Mapbox Token Missing</h2>
                    <p className="text-gray-400">
                        Please add NEXT_PUBLIC_MAPBOX_TOKEN to your .env.local file.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-screen">
            <Map
                ref={mapRef}
                initialViewState={{
                    latitude: 40.7128,
                    longitude: -74.006,
                    zoom: 11,
                }}
                style={{ width: "100%", height: "100%" }}
                mapStyle="mapbox://styles/mapbox/dark-v11"
                mapboxAccessToken={MAPBOX_TOKEN}
                onClick={(e) => {
                    // Simple logic: add point.
                    addLocationByCoordinates(e.lngLat.lng, e.lngLat.lat);
                }}
            >
                <NavigationControl position="top-left" />

                {/* Individual Isochrones (Faint Glow) */}
                {Object.entries(isochrones).map(([id, polygon]) => {
                    const loc = locations.find((l) => l.id === id);
                    return (
                        <Source key={`iso-${id}`} type="geojson" data={polygon}>
                            <Layer
                                id={`layer-${id}`}
                                type="fill"
                                paint={{
                                    "fill-color": loc?.color || "#555",
                                    "fill-opacity": 0.15,
                                    "fill-outline-color": loc?.color || "#555",
                                }}
                            />
                        </Source>
                    );
                })}

                {/* Meeting Area Intersection */}
                {meetingArea && (
                    <Source id="meeting-area" type="geojson" data={meetingArea}>
                        <Layer {...intersectionLayer} />
                        {/* Add a glow effect outline */}
                        <Layer
                            id="meeting-area-glow"
                            type="line"
                            paint={{
                                "line-color": "#00ff9d",
                                "line-width": 4,
                                "line-blur": 4,
                                "line-opacity": 0.8
                            }}
                        />
                    </Source>
                )}

                {/* User Markers */}
                {locations.map((loc) => (
                    <Marker
                        key={loc.id}
                        latitude={loc.coordinates[1]}
                        longitude={loc.coordinates[0]}
                        anchor="center"
                        draggable={true}
                        onDragEnd={(e) => {
                            updateLocationPosition(loc.id, e.lngLat.lng, e.lngLat.lat);
                        }}
                        onClick={(e) => {
                            // Prevent map click from triggering
                            e.originalEvent.stopPropagation();
                        }}
                    >
                        <div className="relative flex items-center justify-center group">
                            {/* Pulsing effect */}
                            <div
                                className="absolute w-8 h-8 rounded-full opacity-50 animate-ping"
                                style={{ backgroundColor: loc.color }}
                            />
                            <div
                                className="w-4 h-4 rounded-full border-2 border-white shadow-lg z-10"
                                style={{ backgroundColor: loc.color }}
                            />
                            {/* Tooltip on hover */}
                            <div className="absolute bottom-full mb-2 bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-20 pointer-events-none transition-opacity">
                                {loc.address}
                            </div>
                        </div>
                    </Marker>
                ))}
            </Map>
        </div>
    );
}
