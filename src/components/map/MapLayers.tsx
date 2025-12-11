import React from "react";
import { Source, Layer } from "react-map-gl";
import { Location } from "@/store/useStore";

interface MapLayersProps {
    isochrones: Record<string, GeoJSON.Polygon | GeoJSON.MultiPolygon | null>;
    locations: Location[];
    meetingArea: GeoJSON.Geometry | null;
    hoveredLocationId: string | null;
}

export default function MapLayers({
    isochrones,
    locations,
    meetingArea,
    hoveredLocationId
}: MapLayersProps) {
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
        <>
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
        </>
    );
}
