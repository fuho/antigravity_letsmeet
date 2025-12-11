import React from "react";
import { POI_TYPES } from "@/constants/poiTypes";

interface POITypeSelectorProps {
    selectedTypes: string[];
    onToggleType: (typeId: string) => void;
}

export default function POITypeSelector({
    selectedTypes,
    onToggleType
}: POITypeSelectorProps) {
    return (
        <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-3">
                Meeting Venue Types
            </label>
            <div className="grid grid-cols-2 gap-2">
                {POI_TYPES.map((poiType) => {
                    const isSelected = selectedTypes.includes(poiType.id);
                    return (
                        <button
                            key={poiType.id}
                            onClick={() => onToggleType(poiType.id)}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all text-sm ${isSelected
                                    ? 'bg-purple-600/20 border-purple-500 text-white'
                                    : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
                                }`}
                        >
                            <span className="text-lg">{poiType.icon}</span>
                            <span className="font-medium">{poiType.label}</span>
                        </button>
                    );
                })}
            </div>
            {selectedTypes.length === 0 && (
                <p className="text-xs text-gray-500 mt-2 italic">
                    No venue types selected. Sweet Spot will be shown without POI suggestions.
                </p>
            )}
        </div>
    );
}
