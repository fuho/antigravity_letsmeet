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
        hoveredLocationId
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

    const handleMapClick = async (e: any) => {
        // Prevent click if clicking on a marker (handled by marker click)
        if (e.originalEvent.defaultPrevented) return;

        const { lng, lat } = e.lngLat;
        // console.log("Map clicked", lng, lat);
        await addLocationByCoordinates(lng, lat);
    };

    // Prepare Isochrone Data Source
    // We combine all individual isochrones into one FeatureCollection
    const isochroneFeatures = Object.entries(isochrones).map(([id, poly]) => ({
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
                onLoad={(e) => {
                    const map = e.target;
                    if (!map.hasImage('stripes')) {
                        // Create a simple diagonal stripe pattern data URI (10x10 px)
                        // This is a 10x10 white square with a black diagonal line, but used as mask or colored?
                        // Actually, let's just make a colored one. Gold and transparent.
                        const width = 10;
                        const height = 10;
                        const canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.fillStyle = 'rgba(255, 215, 0, 0.2)'; // Gold background (transparent)
                            ctx.fillRect(0, 0, width, height);
                            ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)'; // Strong Gold Line
                            ctx.lineWidth = 2;
                            ctx.beginPath();
                            ctx.moveTo(0, height);
                            ctx.lineTo(width, 0);
                            ctx.stroke();
                        }
                        const imageData = ctx?.getImageData(0, 0, width, height);
                        if (imageData) {
                            map.addImage('stripes', imageData);
                        }
                    }
                }}
            >
                <NavigationControl position="top-left" />

                {/* Combined Isochrone Layer */}
                <Source id="isochrones" type="geojson" data={isochroneData as any}>
                    <Layer {...isochroneLayerStyle} />
                </Source>

                {/* Meeting Area (Intersection) */}
                {meetingArea && (
                    <Source id="meeting-area" type="geojson" data={meetingArea}>
                        {/* Pattern Fill Layer */}
                        <Layer
                            id="meeting-area-layer"
                            type="fill"
                            paint={{
                                "fill-pattern": "stripes",
                                "fill-opacity": 1
                            }}
                        />
                        {/* Solid Overlay for Tint */}
                        <Layer
                            id="meeting-area-tint"
                            type="fill"
                            paint={{
                                "fill-color": "#FFD700",
                                "fill-opacity": 0.2
                            }}
                        />
                        <Layer
                            id="meeting-area-outline"
                            type="line"
                            paint={{
                                "line-color": "#FFD700", // Gold Outline
                                "line-width": 3,
                            }}
                        />
                    </Source>
                )}

                {/* Markers */}
                {locations.map((loc) => (
                    <Marker
                        key={loc.id}
                        longitude={loc.coordinates[0]}
                        latitude={loc.coordinates[1]}
                        anchor="bottom"
                        draggable={true}
                        onDragEnd={(e) => {
                            useStore.getState().updateLocationPosition(loc.id, e.lngLat.lng, e.lngLat.lat);
                        }}
                        onClick={(e) => {
                            e.originalEvent.preventDefault(); // Stop map click
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
                ))}

            </ReactMapGL>
        </div>
    );
}
