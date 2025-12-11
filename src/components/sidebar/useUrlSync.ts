"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/store/useStore";
import { PRESETS, Project } from "@/data/presets";

/**
 * Custom hook to manage URL synchronization and initialization
 * Handles:
 * - Loading from share URL on mount
 * - Loading saved projects from localStorage
 * - Loading default preset (Prague) if no data
 * - Syncing state to URL when locations/settings change
 */
export function useUrlSync() {
    const isLoadingFromUrl = useRef(false);
    const [savedProjects, setSavedProjects] = useState<Project[]>([]);

    const {
        locations,
        maxTravelTime,
        transportMode,
        selectedPOITypes,
        getShareString,
        importFromShareString,
        calculateMeetingZone,
        loadProject,
    } = useStore();

    // Load from URL on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const shareString = params.get("share");

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
        if (!shareString && useStore.getState().locations.length === 0) {
            const prague = PRESETS.find((p) => p.id === "prague-lightness");
            if (prague) {
                loadProject(prague.locations, prague.maxTravelTime || 15, (prague.transportMode || "walking") as "walking" | "cycling" | "driving", prague.id);
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
            window.history.replaceState({}, "", newUrl);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [locations, maxTravelTime, transportMode, selectedPOITypes]);

    // Helper to update saved projects
    const updateSavedProjects = (projects: Project[]) => {
        setSavedProjects(projects);
        localStorage.setItem("mpf_projects", JSON.stringify(projects));
    };

    return {
        savedProjects,
        setSavedProjects: updateSavedProjects,
    };
}
