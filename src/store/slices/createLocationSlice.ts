import { StateCreator } from "zustand";
import { AppState } from "../useStore";
import { reverseGeocode } from "@/services/mapbox";
import { generateRandomColor } from "@/utils/formatting";

export interface Location {
    id: string;
    name?: string;
    address: string;
    coordinates: [number, number];
    color: string;
}

export interface LocationSlice {
    locations: Location[];
    addLocation: (loc: Location) => void;
    addLocationByCoordinates: (lng: number, lat: number) => Promise<void>;
    updateLocationPosition: (id: string, lng: number, lat: number) => Promise<void>;
    updateLocationNameAndAddress: (id: string, name?: string, address?: string) => void;
    removeLocation: (id: string) => void;
    clearAllLocations: () => void;
}

export const createLocationSlice: StateCreator<AppState, [], [], LocationSlice> = (set, get) => ({
    locations: [],

    addLocation: (loc) => {
        const { locations } = get();
        set({ locations: [...locations, loc] });
    },

    addLocationByCoordinates: async (lng, lat) => {
        const feature = await reverseGeocode(lng, lat);
        const address = feature ? feature.place_name : `${lng.toFixed(4)}, ${lat.toFixed(4)}`;

        const newLoc: Location = {
            id: crypto.randomUUID(),
            address,
            coordinates: [lng, lat],
            color: generateRandomColor()
        };

        get().addLocation(newLoc);

        // Auto-calculate meeting zone after adding location
        // We need to access meeting slice action. 
        // Since we are using AppState, we can assume it exists.
        setTimeout(() => {
            get().calculateMeetingZone();
        }, 500);
    },

    updateLocationPosition: async (id, lng, lat) => {
        // 1. Optimistic Update: Update coordinates immediately
        set((state) => {
            return {
                locations: state.locations.map(l =>
                    l.id === id
                        ? { ...l, coordinates: [lng, lat] }
                        : l
                ),
                // Clear old isochrone - accessing MeetingSlice state directly
                // This implies strict coupling which is fine for a unified store.
                isochrones: { ...state.isochrones, [id]: null as any }
            };
        });

        // 2. Auto-recalculate
        if (get().meetingArea) {
            get().calculateMeetingZone();
        }

        // 3. Async Reverse Geocoding
        try {
            const feature = await reverseGeocode(lng, lat);
            if (feature) {
                set((state) => ({
                    locations: state.locations.map(l =>
                        l.id === id
                            ? { ...l, address: feature.place_name }
                            : l
                    )
                }));
            }
        } catch (error) {
            console.error("Failed to reverse geocode after drag", error);
        }
    },

    updateLocationNameAndAddress: (id, name, address) => {
        set((state) => ({
            locations: state.locations.map(l =>
                l.id === id
                    ? { ...l, ...(name !== undefined && { name }), ...(address !== undefined && { address }) }
                    : l
            )
        }));
    },

    removeLocation: (id) =>
        set((state) => {
            const newIsochrones = { ...state.isochrones };
            delete newIsochrones[id];
            return {
                locations: state.locations.filter((l) => l.id !== id),
                isochrones: newIsochrones,
                meetingArea: state.locations.length <= 1 ? null : state.meetingArea, // Clear if < 2
            };
        }),

    clearAllLocations: () =>
        set({
            locations: [],
            isochrones: {},
            meetingArea: null,
            venues: [],
        }),
});
