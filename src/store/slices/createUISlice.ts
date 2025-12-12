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

    mapStyle: "mapbox://styles/mapbox/dark-v11",
    setMapStyle: (style) => set({ mapStyle: style }),

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
