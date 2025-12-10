"use client";

import React, { useRef, useEffect } from "react";
import ReactMapGL, { Marker, NavigationControl, Source, Layer, FillLayer } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useStore } from "@/store/useStore";
import * as turf from "@turf/turf";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function Map() {
    const {
        locations,
        meetingArea,
        addLocation,
        isochrones,
        addLocationByCoordinates,
        hoveredLocationId,
        updateLocationPosition
    } = useStore();

    // Auto-center map when locations/meeting area change
    const mapRef = useRef<any>(null);

    useEffect(() => {
        if (!mapRef.current) return;

        // Collect all features to bound
        const features: any[] = [];
        locations.forEach(l => {
            features.push(turf.point(l.coordinates));
        });

        if (meetingArea) {
            features.push(turf.feature(meetingArea));
        }

        if (features.length > 0) {
            const collection = turf.featureCollection(features);
            const bbox = turf.bbox(collection);

            // Validate bbox isn't a single point (minX=maxX, etc) to avoid errors
            // If single point, flyTo center. If area, fitBounds.
            const [minX, minY, maxX, maxY] = bbox;
            if (minX === maxX && minY === maxY) {
                mapRef.current.flyTo({ center: [minX, minY], zoom: 12 });
            } else {
                mapRef.current.fitBounds(
                    [[minX, minY], [maxX, maxY]],
                    { padding: 100, duration: 1000 }
                );
            }
        }
    }, [locations, meetingArea]);

    // Track dragging state to prevent click conflict and manage drag positions
    const isDraggingRef = useRef(false);
    const [dragPositions, setDragPositions] = React.useState<Record<string, [number, number]>>({});

    const handleMapClick = async (e: any) => {
        // Prevent click if dragging or if clicking on a marker (handled by marker click)
        if (isDraggingRef.current || e.originalEvent.defaultPrevented) return;

        const { lng, lat } = e.lngLat;
        await addLocationByCoordinates(lng, lat);
    };

    // Prepare Isochrone Data Source
    // We combine all individual isochrones into one FeatureCollection
    const isochroneFeatures = Object.entries(isochrones)
        .filter(([_, poly]) => poly !== null) // Filter out nulls
        .map(([id, poly]) => ({
            type: "Feature",
            geometry: poly,
            properties: {
                id,
                color: locations.find((l) => l.id === id)?.color || "#888"
            },
        }));

    const isochroneData = {
        type: "FeatureCollection",
        features: isochroneFeatures
    };

    // Style for isochrones with hover effect
    const isochroneLayerStyle: any = {
        id: "isochrone-layer",
        type: "fill",
        paint: {
            "fill-color": ["get", "color"],
            "fill-opacity": [
                "case",
                ["==", ["get", "id"], hoveredLocationId || ""],
                0.5, // Highlight opacity
                0.15 // Default opacity
            ],
            "fill-outline-color": [
                "case",
                ["==", ["get", "id"], hoveredLocationId || ""],
                "#ffffff", // Highlight outline
                ["get", "color"] // Default outline
            ]
        },
    };

    return (
        <div className="w-full h-full relative">
            <ReactMapGL
                ref={mapRef}
                initialViewState={{
                    longitude: 14.4378,
                    latitude: 50.0755, // Default to Prague
                    zoom: 12,
                }}
                style={{ width: "100%", height: "100%" }}
                mapStyle="mapbox://styles/mapbox/dark-v11"
                mapboxAccessToken={MAPBOX_TOKEN}
                onClick={handleMapClick}
            >
                <NavigationControl position="top-left" />

                {/* Combined Isochrone Layer */}
                <Source id="isochrones" type="geojson" data={isochroneData as any}>
                    <Layer {...isochroneLayerStyle} />
                </Source>

                {/* Sweet Spot (Overlap Area) */}
                {meetingArea && (
                    <Source id="meeting-area" type="geojson" data={meetingArea}>
                        <Layer
                            id="meeting-area-fill"
                            type="fill"
                            paint={{
                                "fill-color": "#FFD700",
                                "fill-opacity": 0.08
                            }}
                        />
                        <Layer
                            id="meeting-area-outline"
                            type="line"
                            paint={{
                                "line-color": "#FFD700",
                                "line-width": 2,
                                "line-dasharray": [3, 2]
                            }}
                        />
                    </Source>
                )}

                {/* Markers */}
                {locations.map((loc) => {
                    // Use drag position if actively dragging, otherwise use store coordinates
                    const position = dragPositions[loc.id] || loc.coordinates;

                    return (
                        <Marker
                            key={loc.id}
                            longitude={position[0]}
                            latitude={position[1]}
                            anchor="bottom"
                            draggable={true}
                            onDragStart={() => {
                                isDraggingRef.current = true;
                            }}
                            onDrag={(e) => {
                                // Update local drag position during drag
                                setDragPositions(prev => ({
                                    ...prev,
                                    [loc.id]: [e.lngLat.lng, e.lngLat.lat]
                                }));
                            }}
                            onDragEnd={(e) => {
                                // Update store with final position first
                                updateLocationPosition(loc.id, e.lngLat.lng, e.lngLat.lat);

                                // Clear local drag position after a tick so store update propagates
                                setTimeout(() => {
                                    setDragPositions(prev => {
                                        const updated = { ...prev };
                                        delete updated[loc.id];
                                        return updated;
                                    });
                                    isDraggingRef.current = false;
                                }, 100);
                            }}
                            onClick={(e) => {
                                e.originalEvent.stopPropagation();
                            }}
                        >
                            <div
                                className="relative flex items-center justify-center group cursor-pointer"
                                onMouseEnter={() => useStore.getState().setHoveredLocationId(loc.id)}
                                onMouseLeave={() => useStore.getState().setHoveredLocationId(null)}
                            >
                                {/* Marker Pin */}
                                <svg
                                    viewBox="0 0 24 24"
                                    width="32"
                                    height="32"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    fill={loc.color}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-white drop-shadow-lg transition-transform hover:scale-110"
                                >
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                    <circle cx="12" cy="10" r="3" fill="white" />
                                </svg>

                                {/* Tooltip on Hover */}
                                <div className="absolute bottom-full mb-2 hidden group-hover:block whitespace-nowrap bg-black text-white text-xs px-2 py-1 rounded shadow-lg z-50">
                                    {loc.address}
                                </div>
                            </div>
                        </Marker>
                    );
                })}

            </ReactMapGL>
        </div>
    );
}
