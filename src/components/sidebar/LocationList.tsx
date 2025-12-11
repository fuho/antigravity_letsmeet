import React from "react";
import { Location } from "@/store/useStore";

interface LocationListProps {
    locations: Location[];
    hoveredLocationId: string | null;
    editingItem: { id: string; field: 'name' | 'address' } | null;
    editValue: string;
    onHoverStart: (id: string) => void;
    onHoverEnd: () => void;
    onStartEdit: (id: string, field: 'name' | 'address', value: string) => void;
    onEditValueChange: (value: string) => void;
    onSaveEdit: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    onDeleteClick: (id: string) => void;
}

export default function LocationList({
    locations,
    hoveredLocationId,
    editingItem,
    editValue,
    onHoverStart,
    onHoverEnd,
    onStartEdit,
    onEditValueChange,
    onSaveEdit,
    onKeyDown,
    onDeleteClick
}: LocationListProps) {
    if (locations.length === 0) {
        return (
            <div className="text-center text-gray-500 py-8">
                <p className="text-sm">Click on the map to add locations</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {locations.map((loc) => {
                const isHovered = hoveredLocationId === loc.id;
                const isEditingName = editingItem?.id === loc.id && editingItem?.field === 'name';
                const isEditingAddress = editingItem?.id === loc.id && editingItem?.field === 'address';

                return (
                    <div
                        key={loc.id}
                        className={`p-3 rounded-lg border transition-all relative ${isHovered
                                ? 'bg-gray-800 border-purple-500/50 shadow-lg shadow-purple-900/20'
                                : 'bg-gray-900/50 border-gray-700 hover:bg-gray-800'
                            }`}
                        onMouseEnter={() => {
                            if (!editingItem) {
                                onHoverStart(loc.id);
                            }
                        }}
                        onMouseLeave={() => {
                            if (!editingItem) {
                                onHoverEnd();
                            }
                        }}
                    >
                        {/* Remove button - top right corner */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteClick(loc.id);
                            }}
                            className="absolute top-2 right-2 text-gray-600 hover:text-red-400 transition-colors text-lg font-bold w-5 h-5 flex items-center justify-center focus:outline-none z-10"
                        >
                            ×
                        </button>

                        <div className="flex items-center space-x-3 pr-6">
                            <div className="flex-shrink-0">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{
                                        backgroundColor: loc.color,
                                        boxShadow: `0 0 8px ${loc.color}`
                                    }}
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                {/* Name Field */}
                                {isEditingName ? (
                                    <input
                                        autoFocus
                                        type="text"
                                        value={editValue}
                                        onChange={(e) => onEditValueChange(e.target.value)}
                                        onBlur={onSaveEdit}
                                        onKeyDown={onKeyDown}
                                        className="w-full bg-gray-950 text-white text-sm font-bold border border-purple-500 rounded px-1 py-0.5 focus:outline-none mb-1"
                                    />
                                ) : (
                                    <div
                                        onClick={() => onStartEdit(loc.id, 'name', loc.name || "")}
                                        className="text-sm font-bold text-white mb-0.5 cursor-text hover:text-purple-300 transition-colors min-h-[20px]"
                                    >
                                        {loc.name || <span className="text-gray-600 italic font-normal">Add name...</span>}
                                    </div>
                                )}

                                {/* Address Field */}
                                {isEditingAddress ? (
                                    <input
                                        autoFocus
                                        type="text"
                                        value={editValue}
                                        onChange={(e) => onEditValueChange(e.target.value)}
                                        onBlur={onSaveEdit}
                                        onKeyDown={onKeyDown}
                                        className="w-full bg-gray-950 text-gray-300 text-sm border border-purple-500 rounded px-1 py-0.5 focus:outline-none"
                                    />
                                ) : (
                                    <p
                                        onClick={() => onStartEdit(loc.id, 'address', loc.address)}
                                        className={`text-sm cursor-text hover:text-purple-300 transition-colors truncate ${loc.name ? 'text-gray-400' : 'font-medium text-white'
                                            }`}
                                        title={loc.address} // Show full address on hover
                                    >
                                        {loc.address}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
