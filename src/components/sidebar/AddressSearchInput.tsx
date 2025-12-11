"use client";

import React from "react";
import { GeocodingFeature } from "@/services/mapbox";

interface AddressSearchInputProps {
    query: string;
    suggestions: GeocodingFeature[];
    onQueryChange: (value: string) => void;
    onSelectLocation: (feature: GeocodingFeature) => void;
}

export default function AddressSearchInput({
    query,
    suggestions,
    onQueryChange,
    onSelectLocation,
}: AddressSearchInputProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onQueryChange(e.target.value);
    };

    return (
        <div className="relative mb-3">
            <input
                type="text"
                placeholder="Search for a location..."
                className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500 transition-colors"
                value={query}
                onChange={handleChange}
            />
            {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto z-20">
                    {suggestions.map((item) => (
                        <div
                            key={item.id}
                            className="px-4 py-2 hover:bg-gray-800 cursor-pointer text-sm text-gray-300 border-b border-gray-800 last:border-b-0"
                            onClick={() => onSelectLocation(item)}
                        >
                            {item.place_name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
