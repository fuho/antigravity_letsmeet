import React from "react";
import { Popup } from "react-map-gl";
import { GeocodingFeature } from "@/services/mapbox";

interface POIPopupProps {
    venue: GeocodingFeature;
    onHoverStart: () => void;
    onHoverEnd: () => void;
}

export default function POIPopup({ venue, onHoverStart, onHoverEnd }: POIPopupProps) {
    return (
        <Popup
            longitude={venue.center[0]}
            latitude={venue.center[1]}
            closeButton={false}
            closeOnClick={false}
            anchor="bottom"
            offset={[0, -25]}
            className="poi-popup"
        >
            <div
                className="bg-gray-900/90 backdrop-blur-sm border border-purple-500/50 rounded-md p-3 shadow-lg min-w-[200px] max-w-[240px]"
                onMouseEnter={onHoverStart}
                onMouseLeave={onHoverEnd}
            >
                <div className="font-semibold text-white text-sm mb-1">
                    {venue.text}
                </div>
                <div className="text-xs text-gray-300 leading-relaxed">
                    {venue.place_name}
                </div>
            </div>
        </Popup>
    );
}
