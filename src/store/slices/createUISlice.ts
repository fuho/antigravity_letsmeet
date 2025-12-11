import { StateCreator } from "zustand";
import { AppState } from "../useStore";
import { Location } from "./createLocationSlice";
import { DEFAULT_POI_TYPES } from "@/constants/poiTypes";
import { generateShareString, parseShareString } from "@/utils/share";

export interface UISlice {
    hoveredLocationId: string | null;
    setHoveredLocationId: (id: string | null) => void;
    hoveredVenueId: string | null;
    setHoveredVenueId: (id: string | null) => void;

    selectedPOITypes: string[];
    setSelectedPOITypes: (types: string[]) => void;

    activeProjectId: string | null;
    setActiveProjectId: (id: string | null) => void;

    loadProject: (locations: Location[], maxTime?: number, projectId?: string) => void;
    getShareString: () => string;
    importFromShareString: (shareString: string) => boolean;
}

export const createUISlice: StateCreator<AppState, [], [], UISlice> = (set, get) => ({
    hoveredLocationId: null,
    setHoveredLocationId: (id) => set({ hoveredLocationId: id }),

    hoveredVenueId: null,
    setHoveredVenueId: (id) => set({ hoveredVenueId: id }),

    selectedPOITypes: DEFAULT_POI_TYPES,
    setSelectedPOITypes: (types) => set({ selectedPOITypes: types }),

    activeProjectId: null,
    setActiveProjectId: (id) => set({ activeProjectId: id }),

    loadProject: (newLocations, maxTime, projectId) => {
        set({
            // Location Slice
            locations: newLocations,

            // Meeting Slice
            maxTravelTime: maxTime || 30,
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
        const { locations, maxTravelTime, selectedPOITypes } = get();
        return generateShareString(locations, maxTravelTime, selectedPOITypes);
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

        get().loadProject(newLocations, data.t || 30, undefined);
        set({ selectedPOITypes: poiTypes });
        return true;
    }
});
