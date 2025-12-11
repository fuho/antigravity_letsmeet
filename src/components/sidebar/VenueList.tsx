"use client";

import React from "react";
import { GeocodingFeature } from "@/services/mapbox";

interface VenueListProps {
    venues: GeocodingFeature[];
    hoveredVenueId: string | null;
    onHoverStart: (id: string) => void;
    onHoverEnd: () => void;
}

export default function VenueList({
    venues,
    hoveredVenueId,
    onHoverStart,
    onHoverEnd,
}: VenueListProps) {
    if (venues.length === 0) {
        return null;
    }

    return (
        <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
                Suggested Venues ({venues.length})
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
                {venues.map((venue) => {
                    const isHovered = hoveredVenueId === venue.id;
                    return (
                        <div
                            key={venue.id}
                            className={`p-3 rounded-lg border transition-all cursor-pointer ${isHovered
                                    ? "bg-gray-800 border-purple-500/50 shadow-lg shadow-purple-900/20"
                                    : "bg-gray-900/50 border-gray-700 hover:bg-gray-800"
                                }`}
                            onMouseEnter={() => onHoverStart(venue.id)}
                            onMouseLeave={() => onHoverEnd()}
                        >
                            <div className="font-medium text-white text-sm mb-1">
                                {venue.text}
                            </div>
                            <div className="text-xs text-gray-400">{venue.place_name}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
