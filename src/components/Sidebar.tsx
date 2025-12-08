"use client";

import React, { useState, useEffect } from "react";
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

    const {
        locations,
        addLocation,
        removeLocation,
        maxTravelTime,
        setMaxTravelTime,
        venues,
        isCalculating,
        errorMsg,
        calculateMeetingZone,
        loadProject
    } = useStore();

    // Load saved projects on mount
    useEffect(() => {
        const saved = localStorage.getItem("mpf_projects");
        if (saved) {
            try {
                setSavedProjects(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse saved projects", e);
            }
        }
    }, []);

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
            locations: locations.map(l => ({
                id: l.id,
                address: l.address,
                coordinates: l.coordinates,
                color: l.color
            }))
        };

        const updated = [...savedProjects, newProject];
        setSavedProjects(updated);
        localStorage.setItem("mpf_projects", JSON.stringify(updated));
        setProjectName("");
        alert("Project saved!");
    };

    const loadSelectedProject = (projectId: string) => {
        if (!projectId) return;

        // Check presets first
        const preset = PRESETS.find(p => p.id === projectId);
        if (preset) {
            loadProject(preset.locations);
            // Auto-calc for convenience
            setTimeout(() => calculateMeetingZone(), 500);
            return;
        }

        // Check saved
        const saved = savedProjects.find(p => p.id === projectId);
        if (saved) {
            loadProject(saved.locations);
            setTimeout(() => calculateMeetingZone(), 500);
        }
    };

    return (
        <div className="absolute top-0 right-0 h-full w-96 bg-black/80 backdrop-blur-md border-l border-gray-800 text-white p-6 shadow-2xl z-10 flex flex-col pointer-events-auto">
            {/* Header / Project Bar */}
            <div className="mb-6 border-b border-gray-800 pb-4">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                        Meeting Point Finder
                    </h2>
                    <button
                        onClick={() => setShowProjectControls(!showProjectControls)}
                        className="text-xs text-gray-500 hover:text-white transition-colors"
                    >
                        {showProjectControls ? "Hide" : "Projects"}
                    </button>
                </div>

                {/* Project Controls */}
                {showProjectControls && (
                    <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700 space-y-3">
                        {/* Load Project */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-1">Load Preset / Saved</label>
                            <select
                                className="w-full bg-gray-800 border border-gray-700 text-white text-xs rounded p-2"
                                onChange={(e) => loadSelectedProject(e.target.value)}
                                defaultValue=""
                            >
                                <option value="" disabled>Select a project...</option>
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

                        {/* Save Current */}
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                placeholder="Project Name"
                                className="flex-1 bg-gray-800 border-gray-700 text-white text-xs rounded px-2"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                            />
                            <button
                                onClick={saveCurrentProject}
                                disabled={locations.length === 0 || !projectName}
                                className="bg-green-700 hover:bg-green-600 text-white text-xs px-3 py-1 rounded disabled:opacity-50"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                )}
            </div>

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
                </div>

                {/* Locations Section */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-md font-semibold text-gray-200">Starting Points</h3>
                        <button
                            onClick={() => locations.forEach(l => removeLocation(l.id))}
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
                        {locations.map((loc) => (
                            <div
                                key={loc.id}
                                className="bg-gray-900/50 p-3 rounded-lg border border-gray-700 flex items-center justify-between group"
                            >
                                <div className="flex items-center space-x-3">
                                    <div
                                        className="w-3 h-3 rounded-full shadow-[0_0_8px]"
                                        style={{ backgroundColor: loc.color, boxShadow: `0 0 8px ${loc.color}` }}
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-white">{loc.address}</p>
                                        <p className="text-xs text-gray-500">
                                            {loc.coordinates[0].toFixed(4)}, {loc.coordinates[1].toFixed(4)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeLocation(loc.id)}
                                    className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Calculate Buttons */}
                    <div className="flex space-x-2">
                        <button
                            onClick={handleCalculate}
                            disabled={isCalculating || locations.length === 0}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                        >
                            {isCalculating ? "..." : "Find Zone"}
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
                                    <h4 className="font-semibold text-white mb-2">Meeting Zone Found!</h4>
                                    <p className="text-sm text-gray-400">
                                        The highlighted green area represents the optimal meeting zone reachable by all participants within {maxTravelTime} minutes (driving).
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
        </div>
    );
}
