import React, { useState } from "react";
import { Layers, ChevronUp, ChevronDown, Check } from "lucide-react";
import { useStore } from "@/store/useStore";

const STYLES = [
    {
        id: "mapbox://styles/mapbox/dark-v11",
        label: "Mapbox Dark",
        isMapbox: true
    },
    {
        id: "https://tiles.openfreemap.org/styles/positron",
        label: "OFM Positron",
        isMapbox: false
    },
    {
        id: "https://tiles.openfreemap.org/styles/bright",
        label: "OFM Bright",
        isMapbox: false
    }
];

export default function MapStyleSwitcher() {
    const { mapStyle, setMapStyle } = useStore();
    const [isOpen, setIsOpen] = useState(false);

    // Availability Logic
    const isMapboxAvailable = !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    // Filter styles: 
    // - Always show MapLibre/OFM styles (they are free/open)
    // - Only show Mapbox styles if token is present
    const filteredStyles = STYLES.filter(s => {
        if (s.isMapbox) return isMapboxAvailable;
        return true;
    });

    const currentStyle = STYLES.find(s => s.id === mapStyle) || filteredStyles[0];

    return (
        <div className="absolute bottom-10 left-4 z-20 flex flex-col items-start">
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center space-x-2 bg-black/80 backdrop-blur-md border border-gray-800 text-white px-3 py-2 rounded-lg shadow-xl hover:bg-gray-900/90 transition-all text-sm font-medium"
                >
                    <Layers size={16} className="text-purple-400" />
                    <span>{currentStyle.label}</span>
                    {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </button>

                {isOpen && (
                    <div className="absolute bottom-full left-0 mb-2 w-48 bg-black/90 backdrop-blur-md border border-gray-800 rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {filteredStyles.map((style) => (
                            <button
                                key={style.id}
                                onClick={() => {
                                    setMapStyle(style.id);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-gray-800 transition-colors ${mapStyle === style.id ? "text-purple-300 bg-gray-800/50" : "text-gray-300"
                                    }`}
                            >
                                <span>{style.label}</span>
                                {mapStyle === style.id && <Check size={14} className="text-purple-500" />}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
