"use client";

import React, { useRef, useCallback, useState, useEffect } from "react";
import ReactMapGL, { Source, Layer, Marker, Popup, NavigationControl, AttributionControl, MapRef } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useStore } from "@/store/useStore";
import * as turf from "@turf/turf";
import MapLayers from "./map/MapLayers";
import LocationMarker from "./map/LocationMarker";
import POIMarker from "./map/POIMarker";
import LocationPopup from "./map/LocationPopup";
import POIPopup from "./map/POIPopup";
import MapStyleSwitcher from "./map/MapStyleSwitcher";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function Map() {
    const {
        locations,
        meetingArea,
        isochrones,
        addLocationByCoordinates,
        hoveredLocationId,
        hoveredVenueId,
        updateLocationPosition,
        removeLocation,
        venues,
        mapStyle
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
    const hadFocusRef = useRef(true); // Track if document had focus before click

    // Track document focus state
    useEffect(() => {
        const handleFocus = () => {
            hadFocusRef.current = true;
        };
        const handleBlur = () => {
            hadFocusRef.current = false;
        };

        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);

        // Set initial state
        hadFocusRef.current = document.hasFocus();

        return () => {
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);
        };
    }, []);

    const handleMapClick = async (e: any) => {
        // Prevent click if dragging or if clicking on a marker (handled by marker click)
        if (isDraggingRef.current || e.originalEvent.defaultPrevented) return;

        // If document didn't have focus, just focus it and don't add location
        if (!hadFocusRef.current) {
            window.focus();
            hadFocusRef.current = true;
            return;
        }

        const { lng, lat } = e.lngLat;
        await addLocationByCoordinates(lng, lat);
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
                mapStyle={mapStyle}
                mapboxAccessToken={MAPBOX_TOKEN}
                onClick={handleMapClick}
                attributionControl={false}
            >
                <AttributionControl
                    position="bottom-left"
                    customAttribution={
                        mapStyle.includes("openfreemap")
                            ? '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'
                            : undefined
                    }
                />

                <NavigationControl position="top-left" />
                <MapStyleSwitcher />

                {/* Map Layers (Isochrones & Sweet Spot) */}
                <MapLayers
                    isochrones={isochrones}
                    locations={locations}
                    meetingArea={meetingArea}
                    hoveredLocationId={hoveredLocationId}
                />

                {/* Location Markers */}
                {locations.map((loc) => (
                    <LocationMarker
                        key={loc.id}
                        location={loc}
                        dragPosition={dragPositions[loc.id]}
                        onDragStart={() => {
                            isDraggingRef.current = true;
                        }}
                        onDrag={(lng, lat) => {
                            setDragPositions(prev => ({
                                ...prev,
                                [loc.id]: [lng, lat]
                            }));
                        }}
                        onDragEnd={(lng, lat) => {
                            // Update store with final position first
                            updateLocationPosition(loc.id, lng, lat);

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
                        onHoverStart={() => {
                            useStore.getState().setHoveredLocationId(loc.id);
                        }}
                        onHoverEnd={() => {
                            useStore.getState().setHoveredLocationId(null);
                        }}
                    />
                ))}

                {/* POI Markers */}
                {venues.map((venue) => (
                    <POIMarker
                        key={venue.id}
                        venue={venue}
                        isHovered={hoveredVenueId === venue.id}
                        onHoverStart={() => {
                            useStore.getState().setHoveredVenueId(venue.id);
                        }}
                        onHoverEnd={() => {
                            useStore.getState().setHoveredVenueId(null);
                        }}
                        onClick={() => {
                            useStore.getState().setHoveredVenueId(venue.id);
                        }}
                    />
                ))}

                {/* Popup for hovered location */}
                {hoveredLocationId && (() => {
                    const loc = locations.find(l => l.id === hoveredLocationId);
                    if (!loc) return null;

                    const coords = dragPositions[loc.id] || loc.coordinates;

                    return (
                        <LocationPopup
                            location={loc}
                            coordinates={coords}
                            onRemove={() => {
                                removeLocation(loc.id);
                                useStore.getState().setHoveredLocationId(null);
                            }}
                            onHoverStart={() => useStore.getState().setHoveredLocationId(loc.id)}
                            onHoverEnd={() => useStore.getState().setHoveredLocationId(null)}
                        />
                    );
                })()}

                {/* Popup for hovered venue (POI) */}
                {hoveredVenueId && (() => {
                    const venue = venues.find(v => v.id === hoveredVenueId);
                    if (!venue) return null;

                    return (
                        <POIPopup
                            venue={venue}
                            onHoverStart={() => useStore.getState().setHoveredVenueId(venue.id)}
                            onHoverEnd={() => useStore.getState().setHoveredVenueId(null)}
                        />
                    );
                })()}

            </ReactMapGL>
        </div>
    );
}
