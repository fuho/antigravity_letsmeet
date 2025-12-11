import React from "react";
import { PRESETS, Project } from "@/data/presets";

interface ProjectControlsProps {
    isOpen: boolean;
    savedProjects: Project[];
    activeProjectId: string | null;
    activeProjectName: string | null;
    projectName: string;
    locationsCount: number;
    onLoadProject: (projectId: string) => void;
    onUpdateProject: () => void;
    onSaveProject: () => void;
    onProjectNameChange: (name: string) => void;
}

export default function ProjectControls({
    isOpen,
    savedProjects,
    activeProjectId,
    activeProjectName,
    projectName,
    locationsCount,
    onLoadProject,
    onUpdateProject,
    onSaveProject,
    onProjectNameChange
}: ProjectControlsProps) {
    if (!isOpen) return null;

    const isActiveProjectSaved = activeProjectId && savedProjects.some(p => p.id === activeProjectId);

    return (
        <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700 space-y-3 mb-6">
            {/* Load Project */}
            <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Load Preset / Saved</label>
                <select
                    className="w-full bg-gray-800 border border-gray-700 text-white text-xs rounded p-2"
                    onChange={(e) => onLoadProject(e.target.value)}
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

            {/* Update existing project */}
            {isActiveProjectSaved && (
                <div className="pt-2 border-t border-gray-700">
                    <p className="text-xs text-gray-400 mb-2">Update existing project:</p>
                    <button
                        onClick={onUpdateProject}
                        className="w-full bg-blue-700 hover:bg-blue-600 text-white text-xs px-3 py-2 rounded transition-colors font-medium"
                    >
                        Update "{activeProjectName}"
                    </button>
                </div>
            )}

            {/* Save as new project */}
            <div className="pt-2 border-t border-gray-700">
                <p className="text-xs text-gray-400 mb-2">Save as new project:</p>
                <div className="flex space-x-2">
                    <input
                        type="text"
                        placeholder="New Project Name"
                        className="flex-1 bg-gray-800 border-gray-700 text-white text-xs rounded px-2 py-2 focus:border-purple-500 focus:outline-none transition-colors"
                        value={projectName}
                        onChange={(e) => onProjectNameChange(e.target.value)}
                    />
                    <button
                        onClick={onSaveProject}
                        disabled={locationsCount === 0 || !projectName}
                        className="bg-green-700 hover:bg-green-600 text-white text-xs px-3 py-2 rounded disabled:opacity-50 transition-colors font-medium whitespace-nowrap"
                    >
                        Save New
                    </button>
                </div>
            </div>
        </div>
    );
}
