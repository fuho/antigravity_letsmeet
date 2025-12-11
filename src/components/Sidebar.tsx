"use client";

import React, { useState, useEffect } from "react";
import { Share2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { searchAddress, GeocodingFeature } from "@/services/mapbox";
import { PRESETS, Project } from "@/data/presets";
import ShareModal from "./sidebar/ShareModal";
import DeleteModal from "./sidebar/DeleteModal";
import UpdateModal from "./sidebar/UpdateModal";
import POITypeSelector from "./sidebar/POITypeSelector";
import ProjectControls from "./sidebar/ProjectControls";
import LocationList from "./sidebar/LocationList";

export default function Sidebar() {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<GeocodingFeature[]>([]);

    // Project Management State
    const [savedProjects, setSavedProjects] = useState<Project[]>([]);
    const [projectName, setProjectName] = useState("");
    const [showProjectControls, setShowProjectControls] = useState(false);

    // Debounce timer for slider
    const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

    const {
        locations,
        addLocation,
        removeLocation,
        updateLocationNameAndAddress,
        maxTravelTime,
        setMaxTravelTime,
        venues,
        isCalculating,
        errorMsg,
        calculateMeetingZone,
        findOptimalMeetingPoint,
        loadProject,
        hoveredLocationId,
        setHoveredLocationId,
        hoveredVenueId,
        setHoveredVenueId,
        activeProjectId,
        setActiveProjectId,
        getShareString,
        importFromShareString,
        selectedPOITypes,
        setSelectedPOITypes,
        refreshPOIs
    } = useStore();

    // Track if we're currently loading from URL to prevent sync loop
    const isLoadingFromUrl = React.useRef(false);

    // Load from URL on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const shareString = params.get('share');

        if (shareString) {
            // Load from share link - don't clear URL!
            isLoadingFromUrl.current = true;
            const success = importFromShareString(shareString);
            if (success) {
                setTimeout(() => {
                    calculateMeetingZone();
                    isLoadingFromUrl.current = false;
                }, 1000);
                return; // Don't load Prague
            }
            isLoadingFromUrl.current = false;
        }

        // Load saved projects list
        const saved = localStorage.getItem("mpf_projects");
        if (saved) {
            try {
                setSavedProjects(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse saved projects", e);
            }
        }

        // Default to Prague only if no share param
        if (!shareString && locations.length === 0) {
            const prague = PRESETS.find(p => p.id === "prague-lightness");
            if (prague) {
                loadProject(prague.locations, prague.maxTravelTime || 15, prague.id);
                setTimeout(() => calculateMeetingZone(), 800);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount

    // Sync state to URL whenever locations or maxTravelTime change
    // BUT skip if we're currently loading from URL
    useEffect(() => {
        if (isLoadingFromUrl.current) return;

        if (locations.length > 0) {
            const shareString = getShareString();
            const newUrl = `${window.location.pathname}?share=${encodeURIComponent(shareString)}`;
            window.history.replaceState({}, '', newUrl);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [locations, maxTravelTime, selectedPOITypes]);

    // Auto-Calculate on Slider Change (Debounced)
    useEffect(() => {
        if (locations.length > 0) {
            if (debounceTimer) clearTimeout(debounceTimer);
            const timer = setTimeout(() => {
                calculateMeetingZone();
            }, 800); // 800ms delay after sliding stops
            setDebounceTimer(timer);
        }
        return () => {
            if (debounceTimer) clearTimeout(debounceTimer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [maxTravelTime]); // Only trigger on time change, not locations (locations trigger their own logic maybe, or manual)

    const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
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

    const handleCalculate = async () => {
        await calculateMeetingZone();
    };

    const saveCurrentProject = () => {
        if (!projectName.trim() || locations.length === 0) return;

        const newProject: Project = {
            id: crypto.randomUUID(),
            name: projectName,
            maxTravelTime: maxTravelTime,
            locations: locations.map(l => ({
                id: l.id,
                name: l.name,
                address: l.address,
                coordinates: l.coordinates,
                color: l.color
            }))
        };

        const updated = [...savedProjects, newProject];
        setSavedProjects(updated);
        localStorage.setItem("mpf_projects", JSON.stringify(updated));

        setProjectName("");
        setActiveProjectId(newProject.id); // Set as active
        alert("Project saved!");
    };

    const updateActiveProject = () => {
        if (!activeProjectId) return;
        setShowUpdateConfirmation(true);
    };

    const confirmUpdateProject = () => {
        if (!activeProjectId) return;

        const updatedLocations = locations.map(l => ({
            id: l.id,
            name: l.name,
            address: l.address,
            coordinates: l.coordinates,
            color: l.color
        }));

        const updatedProjects = savedProjects.map(p =>
            p.id === activeProjectId
                ? { ...p, locations: updatedLocations, maxTravelTime }
                : p
        );

        setSavedProjects(updatedProjects);
        localStorage.setItem("mpf_projects", JSON.stringify(updatedProjects));
        setShowUpdateConfirmation(false);
        alert("Project updated!");
    };

    const loadSelectedProject = (projectId: string) => {
        if (!projectId) return;

        // Check presets first
        const preset = PRESETS.find(p => p.id === projectId);
        if (preset) {
            loadProject(preset.locations, preset.maxTravelTime || 30, preset.id);
            setTimeout(() => calculateMeetingZone(), 800);
            return;
        }

        // Then check saved projects
        const saved = savedProjects.find(p => p.id === projectId);
        if (saved) {
            loadProject(saved.locations, saved.maxTravelTime || 30, saved.id);
            setTimeout(() => calculateMeetingZone(), 800);
        }
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
    const [editingItem, setEditingItem] = useState<{ id: string; field: 'name' | 'address' } | null>(null);
    const [editValue, setEditValue] = useState("");

    // Delete Confirmation State
    const [locationToDelete, setLocationToDelete] = useState<string | null>(null);

    // Update Confirmation State
    const [showUpdateConfirmation, setShowUpdateConfirmation] = useState(false);

    const startEditing = (id: string, field: 'name' | 'address', currentValue: string) => {
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
        if (e.key === 'Enter') {
            saveEdit();
        } else if (e.key === 'Escape') {
            setEditingItem(null);
        }
    };

    const activeProjectName = savedProjects.find(p => p.id === activeProjectId)?.name || null;

    return (
        <div className="absolute top-0 right-0 h-full w-96 bg-black/80 backdrop-blur-md border-l border-gray-800 text-white p-6 shadow-2xl z-10 flex flex-col pointer-events-auto">
            {/* Header / Project Bar */}
            <div className="mb-6 border-b border-gray-800 pb-4">
                <div className="flex items-center justify-between mb-2">
                    <h1
                        onClick={() => window.location.href = '/'}
                        className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 cursor-pointer hover:opacity-80 transition-opacity"
                    >
                        Let's Meet
                    </h1>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleShare}
                            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-md transition-all text-xs font-bold shadow-lg shadow-purple-900/20"
                        >
                            <Share2 size={14} />
                            <span>SHARE</span>
                        </button>
                        <button
                            onClick={() => setShowProjectControls(!showProjectControls)}
                            className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-md transition-all text-xs font-bold"
                        >
                            {showProjectControls ? "CLOSE" : (activeProjectId ? "OPTIONS" : "PROJECTS")}
                        </button>
                    </div>
                </div>

                {activeProjectName ? (
                    <div className="text-xs text-gray-400 flex items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2"></span>
                        Editing: <span className="text-purple-300 ml-1 font-medium">{activeProjectName}</span>
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
            />

            <div className="flex-1 overflow-y-auto space-y-6">
                {/* Controls Section */}
                <div>
                    {/* POI Type Selector */}
                    <POITypeSelector
                        selectedTypes={selectedPOITypes}
                        onToggleType={async (typeId) => {
                            if (selectedPOITypes.includes(typeId)) {
                                setSelectedPOITypes(selectedPOITypes.filter(id => id !== typeId));
                            } else {
                                setSelectedPOITypes([...selectedPOITypes, typeId]);
                            }
                            await refreshPOIs();
                        }}
                    />

                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        Max Travel Time: <span className="text-white font-bold">{maxTravelTime} min</span>
                    </label>
                    <input
                        type="range"
                        min="5"
                        max="60"
                        step="5"
                        value={maxTravelTime}
                        onChange={(e) => setMaxTravelTime(parseInt(e.target.value))}
                        className="w-full accent-purple-500 bg-gray-700 rounded-lg appearance-none h-2 cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 mt-1">Auto-updates map...</p>
                </div>

                {/* Locations Section */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        Locations ({locations.length})
                    </label>

                    {/* Search Bar */}
                    <div className="relative mb-3">
                        <input
                            type="text"
                            placeholder="Search for a location..."
                            className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500 transition-colors"
                            value={query}
                            onChange={handleSearch}
                        />
                        {suggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto z-20">
                                {suggestions.map((item) => (
                                    <div
                                        key={item.id}
                                        className="px-4 py-2 hover:bg-gray-800 cursor-pointer text-sm text-gray-300 border-b border-gray-800 last:border-b-0"
                                        onClick={() => selectLocation(item)}
                                    >
                                        {item.place_name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Location List */}
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
                {venues.length > 0 && (
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
                                            ? 'bg-gray-800 border-purple-500/50 shadow-lg shadow-purple-900/20'
                                            : 'bg-gray-900/50 border-gray-700 hover:bg-gray-800'
                                            }`}
                                        onMouseEnter={() => {
                                            setHoveredVenueId(venue.id);
                                            useStore.getState().setHoveredVenueId(venue.id);
                                        }}
                                        onMouseLeave={() => {
                                            setHoveredVenueId(null);
                                            useStore.getState().setHoveredVenueId(null);
                                        }}
                                    >
                                        <div className="font-medium text-white text-sm mb-1">{venue.text}</div>
                                        <div className="text-xs text-gray-400">{venue.place_name}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
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
