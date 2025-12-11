import React from "react";
import { Popup } from "react-map-gl";
import { Location } from "@/store/useStore";
import { formatAddress } from "@/utils/formatting";

interface LocationPopupProps {
    location: Location;
    coordinates: [number, number];
    onRemove: () => void;
    onHoverStart: () => void;
    onHoverEnd: () => void;
}

export default function LocationPopup({
    location,
    coordinates,
    onRemove,
    onHoverStart,
    onHoverEnd
}: LocationPopupProps) {
    return (
        <Popup
            longitude={coordinates[0]}
            latitude={coordinates[1]}
            closeButton={false}
            closeOnClick={false}
            anchor="bottom"
            offset={[0, -35]}
            className="location-popup"
        >
            <div
                className="bg-gray-900/90 backdrop-blur-sm border border-gray-600/50 rounded-md p-3 shadow-lg min-w-[200px] max-w-[240px] relative"
                onMouseEnter={onHoverStart}
                onMouseLeave={onHoverEnd}
            >
                {/* Remove button - top right */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="absolute top-1 right-1 text-gray-500 hover:text-red-400 transition-colors text-xl leading-none p-1 focus:outline-none"
                >
                    ×
                </button>

                {/* Location info */}
                <div className="pr-4">
                    {location.name && (
                        <div className="font-semibold text-white text-sm mb-1">
                            {location.name}
                        </div>
                    )}
                    <div className={`text-xs leading-relaxed ${location.name ? 'text-gray-300' : 'text-white font-medium'}`}>
                        {formatAddress(location.address)}
                    </div>
                </div>
            </div>
        </Popup>
    );
}
