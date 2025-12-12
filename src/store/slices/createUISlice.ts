import { StateCreator } from "zustand";
import { AppState } from "../useStore";
import { Location } from "./createLocationSlice";
import { TransportMode, MeetingSlice } from "./createMeetingSlice";
import { DEFAULT_POI_TYPES } from "@/constants/poiTypes";
import { generateShareString, parseShareString } from "@/utils/share";

export interface UISlice {
    hoveredLocationId: string | null;
    setHoveredLocationId: (id: string | null) => void;
    hoveredVenueId: string | null;
    setHoveredVenueId: (id: string | null) => void;

    mapStyle: string;
    setMapStyle: (style: string) => void;

    mapProvider: "mapbox" | "maplibre";
    setMapProvider: (provider: "mapbox" | "maplibre") => void;

    selectedPOITypes: string[];
    setSelectedPOITypes: (types: string[]) => void;

    activeProjectId: string | null;
    setActiveProjectId: (id: string | null) => void;

    loadProject: (locations: Location[], maxTime?: number, transportMode?: TransportMode, isochroneProvider?: string, projectId?: string) => void;
    getShareString: () => string;
    importFromShareString: (shareString: string) => boolean;
}

export const createUISlice: StateCreator<AppState, [], [], UISlice> = (set, get) => ({
    hoveredLocationId: null,
    setHoveredLocationId: (id) => set({ hoveredLocationId: id }),

    hoveredVenueId: null,
    setHoveredVenueId: (id) => set({ hoveredVenueId: id }),

    mapStyle: process.env.NEXT_PUBLIC_DEFAULT_MAP_PROVIDER === "maplibre"
        ? "https://tiles.openfreemap.org/styles/positron"
        : "mapbox://styles/mapbox/dark-v11",
    setMapStyle: (style) => set((state) => {
        // Auto-switch provider based on style
        const isMapboxStyle = style.startsWith("mapbox://");
        const newProvider = isMapboxStyle ? "mapbox" : "maplibre";
        return {
            mapStyle: style,
            mapProvider: newProvider,
            isochroneProvider: newProvider === "maplibre" ? "ors" : "mapbox"
        };
    }),

    mapProvider: (process.env.NEXT_PUBLIC_DEFAULT_MAP_PROVIDER === "maplibre" ? "maplibre" : "mapbox") as "mapbox" | "maplibre",
    setMapProvider: (provider) => set((state) => ({
        mapProvider: provider,
        // Also update isochrone provider to match
        isochroneProvider: provider === "maplibre" ? "ors" : "mapbox"
    })),

    selectedPOITypes: DEFAULT_POI_TYPES,
    setSelectedPOITypes: (types) => set({ selectedPOITypes: types }),

    activeProjectId: null,
    setActiveProjectId: (id) => set({ activeProjectId: id }),

    loadProject: (newLocations, maxTime, transportMode, isochroneProvider, projectId) => {
        set({
            // Location Slice
            locations: newLocations,

            // Meeting Slice
            maxTravelTime: maxTime || 30,
            transportMode: transportMode || "walking",
            isochroneProvider: (isochroneProvider as any) || "mapbox",
            isochrones: {},
            meetingArea: null,
            venues: [],
            isCalculating: false,
            errorMsg: null,

            // UI Slice
            activeProjectId: projectId || null,
            // Note: We don't overwrite mapProvider here yet, preserving user choice or default
            // unless we want to save it in the project (not requested yet).
        });
    },

    getShareString: () => {
        const { locations, maxTravelTime, transportMode, selectedPOITypes, isochroneProvider } = get();
        // Append provider to share string logic or update generateShareString. 
        // NOTE: generateShareString might need update. For now passing params if supported or assuming util handles it?
        // Wait, generateShareString is imported. I need to check if it supports arbitrary params or if I need to update it.
        // Assuming I need to update it. But wait, I don't have the file open.
        // I'll update the call here assuming I'll update the util.
        return generateShareString(locations, maxTravelTime, transportMode, selectedPOITypes, isochroneProvider);
    },

    importFromShareString: (shareString) => {
        const data = parseShareString(shareString);
        if (!data) return false;

        const newLocations: Location[] = data.l.map((item) => ({
            id: crypto.randomUUID(),
            coordinates: item.c,
            address: item.a,
            name: item.n,
            color: item.col || '#ffffff'
        }));

        const poiTypes = data.p || get().selectedPOITypes;
        const transportMode = data.m || "walking";
        const provider = data.pr || "mapbox";

        get().loadProject(newLocations, data.t || 30, transportMode, provider, undefined);
        set({ selectedPOITypes: poiTypes });
        return true;
    }
});
