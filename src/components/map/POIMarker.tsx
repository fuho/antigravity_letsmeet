import React from "react";
import { Marker } from "react-map-gl";
import { GeocodingFeature } from "@/services/mapbox";
import { POI_TYPES } from "@/constants/poiTypes";

interface POIMarkerProps {
    venue: GeocodingFeature;
    isHovered: boolean;
    onHoverStart: () => void;
    onHoverEnd: () => void;
    onClick: () => void;
}

export default function POIMarker({
    venue,
    isHovered,
    onHoverStart,
    onHoverEnd,
    onClick
}: POIMarkerProps) {
    // Look up POI type info from the imported POI_TYPES
    const typeInfo = POI_TYPES.find(t => t.id === venue.poiType);
    const poiIcon = typeInfo?.icon || '📍';
    const poiColor = typeInfo?.color || '#9333ea';

    return (
        <Marker
            longitude={venue.center[0]}
            latitude={venue.center[1]}
            anchor="bottom"
            onClick={(e) => {
                // Prevent location creation when clicking POI
                e.originalEvent.stopPropagation();
                e.originalEvent.preventDefault();
                onClick();
            }}
        >
            <div
                className="relative flex items-center justify-center cursor-pointer"
                onMouseEnter={onHoverStart}
                onMouseLeave={onHoverEnd}
            >
                {/* POI Pin with type-specific color */}
                <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill={poiColor}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`text-white drop-shadow-lg transition-all ${isHovered ? 'scale-125 brightness-125' : 'hover:scale-110'
                        }`}
                    style={isHovered ? {
                        filter: `drop-shadow(0 0 8px ${poiColor})`,
                    } : {}}
                >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" fill="white" />
                </svg>
                {/* Small icon in center */}
                <div className="absolute top-[3px] text-[8px] pointer-events-none filter grayscale">
                    {poiIcon}
                </div>
            </div>
        </Marker>
    );
}
