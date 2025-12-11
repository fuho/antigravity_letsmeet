"use client";

import React, { useState, useEffect } from "react";
import { Share2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { TRANSPORT_MODES, TransportMode } from "@/store/slices/createMeetingSlice";
import { searchAddress, GeocodingFeature } from "@/services/mapbox";
import ShareModal from "./sidebar/ShareModal";
import DeleteModal from "./sidebar/DeleteModal";
import UpdateModal from "./sidebar/UpdateModal";
import POITypeSelector from "./sidebar/POITypeSelector";
import ProjectControls from "./sidebar/ProjectControls";
import LocationList from "./sidebar/LocationList";
import VenueList from "./sidebar/VenueList";
import AddressSearchInput from "./sidebar/AddressSearchInput";
import { useUrlSync } from "./sidebar/useUrlSync";
import { useProjectManager } from "./sidebar/useProjectManager";

export default function Sidebar() {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<GeocodingFeature[]>([]);

    // Debounce timer for slider
    const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

    const {
        locations,
        addLocation,
        removeLocation,
        updateLocationNameAndAddress,
        maxTravelTime,
        setMaxTravelTime,
        transportMode,
        setTransportMode,
        venues,
        isCalculating,
        errorMsg,
        calculateMeetingZone,
        findOptimalMeetingPoint,
        hoveredLocationId,
        setHoveredLocationId,
        hoveredVenueId,
        setHoveredVenueId,
        activeProjectId,
        getShareString,
        selectedPOITypes,
        setSelectedPOITypes,
        refreshPOIs,
        clearAllLocations,
    } = useStore();

    // URL sync and localStorage management
    const { savedProjects, setSavedProjects } = useUrlSync();

    // Project management operations
    const {
        projectName,
        setProjectName,
        showProjectControls,
        setShowProjectControls,
        showUpdateConfirmation,
        setShowUpdateConfirmation,
        activeProjectName,
        saveCurrentProject,
        updateActiveProject,
        confirmUpdateProject,
        loadSelectedProject,
    } = useProjectManager({ savedProjects, setSavedProjects });

    // Auto-Calculate on Slider Change (Debounced)
    useEffect(() => {
        if (locations.length > 0) {
            if (debounceTimer) clearTimeout(debounceTimer);
            const timer = setTimeout(() => {
                calculateMeetingZone();
            }, 800);
            setDebounceTimer(timer);
        }
        return () => {
            if (debounceTimer) clearTimeout(debounceTimer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [maxTravelTime, transportMode]);

    const handleQueryChange = async (val: string) => {
        setQuery(val);
        if (val.length > 2) {
            const results = await searchAddress(val);
            setSuggestions(results);
        } else {
            setSuggestions([]);
        }
    };

    const selectLocation = (feature: GeocodingFeature) => {
        addLocation({
            id: feature.id,
            address: feature.place_name,
            coordinates: feature.center,
            color: "#" + Math.floor(Math.random() * 16777215).toString(16),
        });
        setQuery("");
        setSuggestions([]);
    };

    // Share Modal State
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareUrl, setShareUrl] = useState("");
    const [copied, setCopied] = useState(false);

    const handleShare = () => {
        const shareString = getShareString();
        const url = `${window.location.origin}${window.location.pathname}?share=${encodeURIComponent(shareString)}`;
        setShareUrl(url);
        setShowShareModal(true);
        setCopied(false);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Inline Editing State
    const [editingItem, setEditingItem] = useState<{
        id: string;
        field: "name" | "address";
    } | null>(null);
    const [editValue, setEditValue] = useState("");

    // Delete Confirmation State
    const [locationToDelete, setLocationToDelete] = useState<string | null>(null);

    const startEditing = (
        id: string,
        field: "name" | "address",
        currentValue: string
    ) => {
        setEditingItem({ id, field });
        setEditValue(currentValue || "");
    };

    const saveEdit = () => {
        if (editingItem) {
            updateLocationNameAndAddress(editingItem.id, editingItem.field, editValue);
            setEditingItem(null);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            saveEdit();
        } else if (e.key === "Escape") {
            setEditingItem(null);
        }
    };

    return (
        <div className="absolute top-0 right-0 h-full w-96 bg-black/80 backdrop-blur-md border-l border-gray-800 text-white p-6 shadow-2xl z-10 flex flex-col pointer-events-auto">
            {/* Header / Project Bar */}
            <div className="mb-6 border-b border-gray-800 pb-4">
                <div className="flex items-center justify-between mb-2">
                    <h1
                        onClick={() => (window.location.href = "/")}
                        className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 cursor-pointer hover:opacity-80 transition-opacity"
                    >
                        Let&apos;s Meet
                    </h1>

                    <button
                        onClick={handleShare}
                        className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-md transition-all text-xs font-bold shadow-lg shadow-purple-900/20"
                    >
                        <Share2 size={14} />
                        <span>SHARE</span>
                    </button>
                </div>

                {activeProjectName ? (
                    <div className="text-xs text-gray-400 flex items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2"></span>
                        Editing:{" "}
                        <span className="text-purple-300 ml-1 font-medium">
                            {activeProjectName}
                        </span>
                    </div>
                ) : (
                    <div className="text-xs text-gray-500 italic">Unsaved Draft</div>
                )}
            </div>

            {/* Project Controls */}
            <ProjectControls
                isOpen={showProjectControls}
                savedProjects={savedProjects}
                activeProjectId={activeProjectId}
                activeProjectName={activeProjectName}
                projectName={projectName}
                locationsCount={locations.length}
                onLoadProject={loadSelectedProject}
                onUpdateProject={updateActiveProject}
                onSaveProject={saveCurrentProject}
                onProjectNameChange={setProjectName}
                onToggle={() => setShowProjectControls(!showProjectControls)}
                onNewMeet={clearAllLocations}
            />

            <div className="flex-1 overflow-y-auto space-y-6">
                {/* Controls Section */}
                <div>
                    {/* POI Type Selector */}
                    <POITypeSelector
                        selectedTypes={selectedPOITypes}
                        onToggleType={async (typeId) => {
                            if (selectedPOITypes.includes(typeId)) {
                                setSelectedPOITypes(
                                    selectedPOITypes.filter((id) => id !== typeId)
                                );
                            } else {
                                setSelectedPOITypes([...selectedPOITypes, typeId]);
                            }
                            await refreshPOIs();
                        }}
                    />

                    {/* Travel Time Controls */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Max travel time:{" "}
                            <span className="text-white font-bold">{maxTravelTime} min</span>
                            {" "}by{" "}
                            <span className="text-purple-300 font-bold">
                                {TRANSPORT_MODES.find(m => m.id === transportMode)?.label.toLowerCase()}
                            </span>
                        </label>
                        <div className="flex items-center space-x-3">
                            <input
                                type="range"
                                min="5"
                                max="60"
                                step="5"
                                value={maxTravelTime}
                                onChange={(e) => setMaxTravelTime(parseInt(e.target.value))}
                                className="flex-1 accent-purple-500 bg-gray-700 rounded-lg appearance-none h-2 cursor-pointer"
                            />
                            <div className="flex space-x-1">
                                {TRANSPORT_MODES.map((mode) => (
                                    <button
                                        key={mode.id}
                                        onClick={() => setTransportMode(mode.id)}
                                        title={mode.label}
                                        className={`w-8 h-8 rounded-md flex items-center justify-center text-lg transition-all ${transportMode === mode.id
                                            ? 'bg-purple-600/30 border border-purple-500'
                                            : 'bg-gray-800/50 border border-gray-700 hover:border-gray-600'
                                            }`}
                                    >
                                        {mode.icon}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Auto-updates map...</p>
                    </div>
                </div>

                {/* Locations Section */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-400">
                            from locations ({locations.length})
                        </label>
                        {locations.length > 0 && (
                            <button
                                onClick={clearAllLocations}
                                className="text-xs text-red-400 hover:text-red-300 transition-colors"
                            >
                                Clear All
                            </button>
                        )}
                    </div>

                    <LocationList
                        locations={locations}
                        hoveredLocationId={hoveredLocationId}
                        editingItem={editingItem}
                        editValue={editValue}
                        onHoverStart={(id) => {
                            setHoveredLocationId(id);
                            useStore.getState().setHoveredLocationId(id);
                        }}
                        onHoverEnd={() => {
                            setHoveredLocationId(null);
                            useStore.getState().setHoveredLocationId(null);
                        }}
                        onStartEdit={startEditing}
                        onEditValueChange={setEditValue}
                        onSaveEdit={saveEdit}
                        onKeyDown={handleKeyDown}
                        onDeleteClick={setLocationToDelete}
                    />

                    <AddressSearchInput
                        query={query}
                        suggestions={suggestions}
                        onQueryChange={handleQueryChange}
                        onSelectLocation={selectLocation}
                    />
                </div>

                {/* Calculate Buttons */}
                <div className="flex space-x-2">
                    <button
                        onClick={() => calculateMeetingZone()}
                        disabled={isCalculating || locations.length === 0}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                    >
                        {isCalculating ? "Calculating..." : "Find Sweet Spot"}
                    </button>
                    <button
                        onClick={() => findOptimalMeetingPoint()}
                        disabled={isCalculating || locations.length < 2}
                        className="flex-1 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-pink-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                    >
                        Optimize
                    </button>
                </div>

                {errorMsg && (
                    <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
                        {errorMsg}
                    </div>
                )}

                {/* Venues Section */}
                <VenueList
                    venues={venues}
                    hoveredVenueId={hoveredVenueId}
                    onHoverStart={(id) => {
                        setHoveredVenueId(id);
                        useStore.getState().setHoveredVenueId(id);
                    }}
                    onHoverEnd={() => {
                        setHoveredVenueId(null);
                        useStore.getState().setHoveredVenueId(null);
                    }}
                />
            </div>

            {/* Modals */}
            <ShareModal
                isOpen={showShareModal}
                shareUrl={shareUrl}
                copied={copied}
                onClose={() => setShowShareModal(false)}
                onCopy={copyToClipboard}
            />
            <DeleteModal
                isOpen={!!locationToDelete}
                onCancel={() => setLocationToDelete(null)}
                onConfirm={() => {
                    if (locationToDelete) {
                        removeLocation(locationToDelete);
                        setLocationToDelete(null);
                        setHoveredLocationId(null);
                    }
                }}
            />
            <UpdateModal
                isOpen={showUpdateConfirmation}
                projectName={activeProjectName || ""}
                onCancel={() => setShowUpdateConfirmation(false)}
                onConfirm={confirmUpdateProject}
            />
        </div>
    );
}
