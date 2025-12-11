"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import { PRESETS, Project } from "@/data/presets";

interface UseProjectManagerOptions {
    savedProjects: Project[];
    setSavedProjects: (projects: Project[]) => void;
}

/**
 * Custom hook to manage project save/load/update operations
 */
export function useProjectManager({ savedProjects, setSavedProjects }: UseProjectManagerOptions) {
    const [projectName, setProjectName] = useState("");
    const [showProjectControls, setShowProjectControls] = useState(true);
    const [showUpdateConfirmation, setShowUpdateConfirmation] = useState(false);

    const {
        locations,
        maxTravelTime,
        transportMode,
        activeProjectId,
        setActiveProjectId,
        loadProject,
        calculateMeetingZone,
    } = useStore();

    const activeProjectName =
        savedProjects.find((p) => p.id === activeProjectId)?.name || null;

    const saveCurrentProject = () => {
        if (!projectName.trim() || locations.length === 0) return;

        const newProject: Project = {
            id: crypto.randomUUID(),
            name: projectName,
            maxTravelTime: maxTravelTime,
            transportMode: transportMode,
            locations: locations.map((l) => ({
                id: l.id,
                name: l.name,
                address: l.address,
                coordinates: l.coordinates,
                color: l.color,
            })),
        };

        const updated = [...savedProjects, newProject];
        setSavedProjects(updated);
        setProjectName("");
        setActiveProjectId(newProject.id);
        alert("Project saved!");
    };

    const updateActiveProject = () => {
        if (!activeProjectId) return;
        setShowUpdateConfirmation(true);
    };

    const confirmUpdateProject = () => {
        if (!activeProjectId) return;

        const updatedLocations = locations.map((l) => ({
            id: l.id,
            name: l.name,
            address: l.address,
            coordinates: l.coordinates,
            color: l.color,
        }));

        const updatedProjects = savedProjects.map((p) =>
            p.id === activeProjectId
                ? { ...p, locations: updatedLocations, maxTravelTime, transportMode }
                : p
        );

        setSavedProjects(updatedProjects);
        setShowUpdateConfirmation(false);
        alert("Project updated!");
    };

    const loadSelectedProject = (projectId: string) => {
        if (!projectId) return;

        // Check presets first
        const preset = PRESETS.find((p) => p.id === projectId);
        if (preset) {
            loadProject(preset.locations, preset.maxTravelTime || 30, preset.transportMode || "walking", preset.id);
            setTimeout(() => calculateMeetingZone(), 800);
            return;
        }

        // Then check saved projects
        const saved = savedProjects.find((p) => p.id === projectId);
        if (saved) {
            loadProject(saved.locations, saved.maxTravelTime || 30, saved.transportMode || "walking", saved.id);
            setTimeout(() => calculateMeetingZone(), 800);
        }
    };

    return {
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
    };
}
