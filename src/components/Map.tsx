"use client";

import React, { useRef, useEffect, useState } from "react";
import ReactMapGL, { Marker, NavigationControl, Source, Layer, Popup } from "react-map-gl";
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
        updateLocationPosition,
        removeLocation
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

    // Track which popup is currently shown
    const [popupLocationId, setPopupLocationId] = useState<string | null>(null);

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
                                onMouseEnter={() => {
                                    useStore.getState().setHoveredLocationId(loc.id);
                                    setPopupLocationId(loc.id);
                                }}
                                onMouseLeave={() => {
                                    useStore.getState().setHoveredLocationId(null);
                                    setPopupLocationId(null);
                                }}
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
                            </div>
                        </Marker>
                    );
                })}

                {/* Popup for hovered location */}
                {popupLocationId && (() => {
                    const loc = locations.find(l => l.id === popupLocationId);
                    if (!loc) return null;

                    const coords = dragPositions[loc.id] || loc.coordinates;

                    return (
                        <Popup
                            longitude={coords[0]}
                            latitude={coords[1]}
                            closeButton={false}
                            closeOnClick={false}
                            anchor="bottom"
                            offset={[0, -10]}
                            className="location-popup"
                        >
                            <div
                                className="bg-gray-900/90 backdrop-blur-sm border border-gray-600/50 rounded-md p-3 shadow-lg min-w-[200px] max-w-[240px] relative"
                                onMouseEnter={() => setPopupLocationId(loc.id)}
                                onMouseLeave={() => setPopupLocationId(null)}
                            >
                                {/* Marker pin embedded at top */}
                                <div className="flex justify-center mb-2">
                                    <div className="relative">
                                        <svg
                                            viewBox="0 0 24 24"
                                            width="28"
                                            height="28"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            fill={loc.color}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="text-white drop-shadow-lg"
                                        >
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                            <circle cx="12" cy="10" r="3" fill="white" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Remove button - top right */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeLocation(loc.id);
                                        setPopupLocationId(null);
                                    }}
                                    className="absolute top-2 right-2 text-gray-500 hover:text-red-400 transition-colors text-lg font-bold w-5 h-5 flex items-center justify-center"
                                >
                                    ×
                                </button>

                                {/* Location info */}
                                <div className="text-center">
                                    {loc.name && (
                                        <div className="font-semibold text-white text-sm mb-1">
                                            {loc.name}
                                        </div>
                                    )}
                                    <div className={`text-xs leading-relaxed ${loc.name ? 'text-gray-300' : 'text-white font-medium'}`}>
                                        {loc.address}
                                    </div>
                                </div>
                            </div>
                        </Popup>
                    );
                })()}

            </ReactMapGL>
        </div>
    );
}
