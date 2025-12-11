"use client";

import React, { useState, useEffect } from "react";
import { Share2, Copy, X, Check } from "lucide-react";
import { useStore } from "@/store/useStore";
import { searchAddress, GeocodingFeature } from "@/services/mapbox";
import { PRESETS, Project } from "@/data/presets";

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
        loadProject,
        hoveredLocationId,
        setHoveredLocationId,
        activeProjectId,
        setActiveProjectId,
        getShareString,
        importFromShareString
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
    }, [locations, maxTravelTime]);

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
        // Reset active project since we modified state
        // Actually, if we want to "Update", we should keep it active but mark dirty?
        // For simplicity: modifying locations keeps ID but is "unsaved".
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

        const updatedLocations = locations.map(l => ({
            id: l.id,
            name: l.name,
            address: l.address,
            coordinates: l.coordinates,
            color: l.color
        }));

        const updatedProjects = savedProjects.map(p => {
            if (p.id === activeProjectId) {
                return { ...p, locations: updatedLocations, maxTravelTime };
            }
            return p;
        });

        setSavedProjects(updatedProjects);
        localStorage.setItem("mpf_projects", JSON.stringify(updatedProjects));
        alert("Project updated!");
    };

    const loadSelectedProject = (projectId: string) => {
        if (!projectId) return;

        // Check presets first
        const preset = PRESETS.find(p => p.id === projectId);
        if (preset) {
            // Presets don't need update logic really, they are read-only.
            // But we pass the ID so the dropdown reflects the selection.
            loadProject(preset.locations, preset.maxTravelTime || 30, preset.id);
            setTimeout(() => calculateMeetingZone(), 500);
            return;
        }

        // Check saved
        const saved = savedProjects.find(p => p.id === projectId);
        if (saved) {
            loadProject(saved.locations, saved.maxTravelTime || 30, saved.id);
            setTimeout(() => calculateMeetingZone(), 500);
        }
    };

    // Share Modal State
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareUrl, setShareUrl] = useState("");
    const [copied, setCopied] = useState(false);

    const handleShare = () => {
        // URL is always up-to-date, just use current location
        const url = window.location.href;
        setShareUrl(url);
        setShowShareModal(true);
        setCopied(false);
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    const renderShareModal = () => {
        if (!showShareModal) return null;
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-gray-900 border border-purple-500/30 rounded-xl p-6 shadow-2xl max-w-md w-full relative animate-in fade-in zoom-in-95 duration-200">
                    <button
                        onClick={() => setShowShareModal(false)}
                        className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex items-center space-x-3 mb-4">
                        <div className="p-3 bg-purple-500/10 rounded-full text-purple-400">
                            <Share2 size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Share Project</h3>
                            <p className="text-gray-400 text-sm">Anyone with this link can view this project.</p>
                        </div>
                    </div>

                    <div className="relative mb-6">
                        <input
                            type="text"
                            readOnly
                            value={shareUrl}
                            onClick={(e) => e.currentTarget.select()}
                            className="w-full bg-black/50 border border-gray-700 rounded-lg py-3 px-4 pr-12 text-gray-300 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                        />
                        <button
                            onClick={copyToClipboard}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-all ${copied ? 'bg-green-500/20 text-green-400' : 'hover:bg-gray-700 text-gray-400 hover:text-white'
                                }`}
                            title="Copy to clipboard"
                        >
                            {copied ? <Check size={18} /> : <Copy size={18} />}
                        </button>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={() => setShowShareModal(false)}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const activeProjectName = savedProjects.find(p => p.id === activeProjectId)?.name;

    // Inline Updating State
    const [editingItem, setEditingItem] = useState<{ id: string; field: 'name' | 'address' } | null>(null);
    const [editValue, setEditValue] = useState("");

    // Delete Confirmation State
    const [locationToDelete, setLocationToDelete] = useState<string | null>(null);

    const startEditing = (id: string, field: 'name' | 'address', currentValue: string) => {
        setEditingItem({ id, field });
        setEditValue(currentValue || "");
    };

    const saveEdit = () => {
        if (editingItem) {
            updateLocationNameAndAddress(
                editingItem.id,
                editingItem.field === 'name' ? editValue : undefined,
                editingItem.field === 'address' ? editValue : undefined
            );
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

    // Render Delete Confirmation Modal
    const renderDeleteModal = () => {
        if (!locationToDelete) return null;
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 shadow-2xl max-w-sm w-full">
                    <h3 className="text-lg font-bold text-white mb-2">Remove Location?</h3>
                    <p className="text-gray-400 text-sm mb-6">
                        Are you sure you want to remove this location from your project?
                    </p>
                    <div className="flex space-x-3">
                        <button
                            onClick={() => setLocationToDelete(null)}
                            className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-white font-medium hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                removeLocation(locationToDelete);
                                setLocationToDelete(null);
                                setHoveredLocationId(null);
                            }}
                            className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-500 transition-colors"
                        >
                            Remove
                        </button>
                    </div>
                </div>
            </div>
        );
    };



    return (
        <div className="absolute top-0 right-0 h-full w-96 bg-black/80 backdrop-blur-md border-l border-gray-800 text-white p-6 shadow-2xl z-10 flex flex-col pointer-events-auto">
            {/* Header / Project Bar */}
            <div className="mb-6 border-b border-gray-800 pb-4">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
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
            {showProjectControls && (
                <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700 space-y-3 mb-6">
                    {/* Load Project */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1">Load Preset / Saved</label>
                        <select
                            className="w-full bg-gray-800 border border-gray-700 text-white text-xs rounded p-2"
                            onChange={(e) => loadSelectedProject(e.target.value)}
                            value={activeProjectId || ""}
                        >
                            <option value="">Select a project...</option>
                            <optgroup label="Presets">
                                {PRESETS.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </optgroup>
                            {savedProjects.length > 0 && (
                                <optgroup label="My Projects">
                                    {savedProjects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </optgroup>
                            )}
                        </select>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2 pt-2 border-t border-gray-700">
                        {/* Update Existing (Only for saved custom projects, not presets) */}
                        {activeProjectId && savedProjects.some(p => p.id === activeProjectId) && (
                            <button
                                onClick={updateActiveProject}
                                className="flex-1 bg-blue-700 hover:bg-blue-600 text-white text-xs px-2 py-2 rounded transition-colors"
                            >
                                Update "{activeProjectName}"
                            </button>
                        )}
                    </div>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            placeholder="New Project Name"
                            className="flex-1 bg-gray-800 border-gray-700 text-white text-xs rounded px-2 focus:border-purple-500 focus:outline-none transition-colors"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                        />
                        <button
                            onClick={saveCurrentProject}
                            disabled={locations.length === 0 || !projectName}
                            className="bg-green-700 hover:bg-green-600 text-white text-xs px-3 py-1 rounded disabled:opacity-50 transition-colors"
                        >
                            Save New
                        </button>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-6">
                {/* Controls Section */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        Max Travel Time: <span className="text-white">{maxTravelTime} min</span>
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
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-md font-semibold text-gray-200">Locations</h3>
                        <button
                            onClick={() => {
                                locations.forEach(l => removeLocation(l.id));
                                setActiveProjectId(null); // Clear active project on clear
                            }}
                            className="text-xs text-red-400 hover:text-red-300 underline"
                        >
                            Clear All
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className="relative mb-4">
                        <input
                            type="text"
                            value={query}
                            onChange={handleSearch}
                            placeholder="Enter an address..."
                            className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg py-2 px-3 focus:outline-none focus:border-purple-500 transition-colors placeholder-gray-500"
                        />
                        {suggestions.length > 0 && (
                            <ul className="absolute top-full left-0 right-0 bg-gray-900 border border-gray-700 rounded-lg mt-1 z-20 max-h-48 overflow-y-auto shadow-xl">
                                {suggestions.map((item) => (
                                    <li
                                        key={item.id}
                                        onClick={() => selectLocation(item)}
                                        className="px-3 py-2 hover:bg-purple-900/30 cursor-pointer text-sm text-gray-300 hover:text-white transition-colors border-b border-gray-800 last:border-0"
                                    >
                                        {item.place_name}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Location List */}
                    <div className="space-y-3 mb-6">
                        {locations.length === 0 && (
                            <p className="text-sm text-gray-500 italic">No locations added yet.</p>
                        )}
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
                                            setHoveredLocationId(loc.id);
                                            useStore.getState().setHoveredLocationId(loc.id);
                                        }
                                    }}
                                    onMouseLeave={() => {
                                        if (!editingItem) {
                                            setHoveredLocationId(null);
                                            useStore.getState().setHoveredLocationId(null);
                                        }
                                    }}
                                >
                                    {/* Remove button - top right corner */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setLocationToDelete(loc.id);
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
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onBlur={saveEdit}
                                                    onKeyDown={handleKeyDown}
                                                    className="w-full bg-gray-950 text-white text-sm font-bold border border-purple-500 rounded px-1 py-0.5 focus:outline-none mb-1"
                                                />
                                            ) : (
                                                <div
                                                    onClick={() => startEditing(loc.id, 'name', loc.name || "")}
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
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onBlur={saveEdit}
                                                    onKeyDown={handleKeyDown}
                                                    className="w-full bg-gray-950 text-gray-300 text-sm border border-purple-500 rounded px-1 py-0.5 focus:outline-none"
                                                />
                                            ) : (
                                                <p
                                                    onClick={() => startEditing(loc.id, 'address', loc.address)}
                                                    className={`text-sm cursor-text hover:text-purple-300 transition-colors truncate ${loc.name ? 'text-gray-400' : 'font-medium text-white'}`}
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
                    {renderDeleteModal()}

                    {/* Calculate Buttons */}
                    <div className="flex space-x-2">
                        <button
                            onClick={() => calculateMeetingZone()}
                            disabled={isCalculating || locations.length === 0}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                        >
                            {isCalculating ? "..." : "Find Sweet Spot"}
                        </button>
                        <button
                            onClick={() => useStore.getState().findOptimalMeetingPoint()}
                            disabled={isCalculating || locations.length < 2}
                            className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                        >
                            {isCalculating ? "..." : "Auto-Optimize"}
                        </button>
                    </div>

                    {errorMsg && (
                        <p className="text-red-400 text-sm mt-2 text-center">{errorMsg}</p>
                    )}

                </div>

                {/* Results Section (Stacked) */}
                {(venues.length > 0 || errorMsg) && (
                    <div className="pt-6 border-t border-gray-800">
                        <h3 className="text-xl font-bold mb-4 text-purple-400">Results</h3>
                        {errorMsg ? (
                            <p className="text-red-400">{errorMsg}</p>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-gray-900 border border-gray-700 p-4 rounded-lg">
                                    <h4 className="font-semibold text-white mb-2">Sweet Spot Found!</h4>
                                    <p className="text-sm text-gray-400">
                                        The highlighted golden area represents the optimal sweet spot reachable by all participants within {maxTravelTime} minutes (driving).
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-white mb-2">Suggested Meeting Sites</h4>
                                    {venues.length === 0 ? (
                                        <p className="text-sm text-gray-500">Searching for cafes...</p>
                                    ) : (
                                        <ul className="space-y-2">
                                            {venues.map(venue => (
                                                <li key={venue.id} className="bg-gray-800 p-2 rounded text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                                                    <div className="font-medium">{venue.text}</div>
                                                    <div className="text-xs text-gray-500">{venue.place_name}</div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            {renderShareModal()}
            {renderDeleteModal()}
        </div >
    );
}
