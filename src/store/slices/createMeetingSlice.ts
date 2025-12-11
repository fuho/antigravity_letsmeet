import { StateCreator } from "zustand";
import { AppState } from "../useStore";
import { GeocodingFeature } from "@/services/mapbox";
import { getIsochrone } from "@/services/isochrone";
import { calculateIntersection, getBoundingBox, getCentroid } from "@/utils/geometry";
import { searchPOIsInArea } from "@/utils/poi";
import { searchMultiplePOITypes } from "@/services/poi";
import { MAP_CONSTANTS, TRAVEL_TIME_OPTIONS } from "@/constants/map";

export interface MeetingSlice {
    maxTravelTime: number;
    isochrones: Record<string, GeoJSON.Polygon>;
    meetingArea: GeoJSON.Geometry | null;
    venues: GeocodingFeature[];
    isCalculating: boolean;
    errorMsg: string | null;

    setMaxTravelTime: (time: number) => void;
    setIsochrone: (id: string, poly: GeoJSON.Polygon) => void;
    setMeetingArea: (area: GeoJSON.Geometry | null) => void;
    calculateMeetingZone: () => Promise<void>;
    findOptimalMeetingPoint: () => Promise<void>;
    refreshPOIs: () => Promise<void>;
}

export const createMeetingSlice: StateCreator<AppState, [], [], MeetingSlice> = (set, get) => ({
    maxTravelTime: 30,
    isochrones: {},
    meetingArea: null,
    venues: [],
    isCalculating: false,
    errorMsg: null,

    setMaxTravelTime: (time) => set({ maxTravelTime: time }),
    setIsochrone: (id, poly) =>
        set((state) => ({ isochrones: { ...state.isochrones, [id]: poly } })),
    setMeetingArea: (area) => set({ meetingArea: area }),

    calculateMeetingZone: async () => {
        const { locations, maxTravelTime, setIsochrone, setMeetingArea } = get();

        if (locations.length < 1) {
            set({ errorMsg: "add at least 1 location", isCalculating: false });
            return;
        }

        set({ isCalculating: true, errorMsg: null, meetingArea: null, venues: [] });

        try {
            // 1. Fetch Isochrones
            const polygons: GeoJSON.Polygon[] = [];

            for (const loc of locations) {
                const result = await getIsochrone(loc.coordinates, maxTravelTime, "driving");
                if (result) {
                    const poly = result as GeoJSON.Polygon;
                    setIsochrone(loc.id, poly);
                    polygons.push(poly);
                }
            }

            // 2. Calculate Intersection
            if (polygons.length > 0) {
                const intersectionGeometry = calculateIntersection(polygons);

                if (intersectionGeometry) {
                    setMeetingArea(intersectionGeometry);

                    // 3. Find POIs
                    await get().refreshPOIs();
                } else {
                    set({ errorMsg: "No overlapping area found. Try increasing travel time." });
                }
            }
        } catch (err) {
            console.error(err);
            set({ errorMsg: "Calculation failed." });
        } finally {
            set({ isCalculating: false });
        }
    },

    findOptimalMeetingPoint: async () => {
        const { locations, setMaxTravelTime, setMeetingArea } = get();

        if (locations.length < 2) {
            set({ errorMsg: "Need at least 2 locations to optimize." });
            return;
        }

        set({ isCalculating: true, errorMsg: null, meetingArea: null, venues: [] });

        const times = TRAVEL_TIME_OPTIONS;

        try {
            for (const t of times) {
                const polys: GeoJSON.Polygon[] = [];
                let possible = true;

                const results = await Promise.all(locations.map(l => getIsochrone(l.coordinates, t, "driving")));

                if (results.some(r => !r)) {
                    possible = false;
                } else {
                    polys.push(...results.map(r => r as GeoJSON.Polygon));
                }

                if (possible) {
                    const intersectionGeometry = calculateIntersection(polys);

                    if (intersectionGeometry) {
                        setMaxTravelTime(t);
                        setMeetingArea(intersectionGeometry);
                        set({ venues: [] }); // clear old

                        const newIsochrones: Record<string, GeoJSON.Polygon> = {};
                        locations.forEach((loc, index) => {
                            newIsochrones[loc.id] = polys[index];
                        });
                        set({ isochrones: newIsochrones });

                        await get().refreshPOIs();
                        set({ isCalculating: false });
                        return; // Done
                    }
                }
            }

            set({ errorMsg: "Could not find a meeting point within 60 mins." });

        } catch (err) {
            console.error(err);
            set({ errorMsg: "Optimization failed." });
        } finally {
            set({ isCalculating: false });
        }
    },

    refreshPOIs: async () => {
        const { meetingArea, selectedPOITypes } = get();

        if (!meetingArea) {
            set({ venues: [] });
            return;
        }

        const center = getCentroid(meetingArea);
        const bbox = getBoundingBox(meetingArea);
        const polygon = meetingArea as GeoJSON.Polygon;

        // Use extracted service logic
        const searchFn = (lng: number, lat: number, bbox: [number, number, number, number]) =>
            searchMultiplePOITypes(selectedPOITypes, lng, lat, bbox);

        const pois = await searchPOIsInArea(
            searchFn,
            center,
            bbox,
            polygon,
            MAP_CONSTANTS.MAX_POIS_DISPLAYED
        );

        set({ venues: pois });
    },
});
