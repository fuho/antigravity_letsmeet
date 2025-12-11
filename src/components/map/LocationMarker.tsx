import React from "react";
import { Marker } from "react-map-gl";
import { Location } from "@/store/useStore";

interface LocationMarkerProps {
    location: Location;
    dragPosition?: [number, number];
    onDragStart: () => void;
    onDrag: (lng: number, lat: number) => void;
    onDragEnd: (lng: number, lat: number) => void;
    onHoverStart: () => void;
    onHoverEnd: () => void;
}

export default function LocationMarker({
    location,
    dragPosition,
    onDragStart,
    onDrag,
    onDragEnd,
    onHoverStart,
    onHoverEnd
}: LocationMarkerProps) {
    // Use drag position if actively dragging, otherwise use location coordinates
    const position = dragPosition || location.coordinates;

    return (
        <Marker
            longitude={position[0]}
            latitude={position[1]}
            anchor="bottom"
            draggable={true}
            onDragStart={onDragStart}
            onDrag={(e) => onDrag(e.lngLat.lng, e.lngLat.lat)}
            onDragEnd={(e) => onDragEnd(e.lngLat.lng, e.lngLat.lat)}
            onClick={(e) => {
                e.originalEvent.stopPropagation();
            }}
        >
            <div
                className="relative flex items-center justify-center group cursor-pointer"
                onMouseEnter={onHoverStart}
                onMouseLeave={onHoverEnd}
            >
                {/* Marker Pin */}
                <svg
                    viewBox="0 0 24 24"
                    width="32"
                    height="32"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill={location.color}
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
}
