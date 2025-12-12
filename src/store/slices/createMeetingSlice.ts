import { StateCreator } from "zustand";
import { AppState } from "../useStore";
import { GeocodingFeature } from "@/services/mapbox";
import { getIsochrone, IsochroneProfile, IsochroneProvider } from "@/services/isochrone";
import { calculateIntersection, getBoundingBox, getCentroid } from "@/utils/geometry";
import { searchPOIsInArea } from "@/utils/poi";
import { searchMultiplePOITypes } from "@/services/poi";
import { MAP_CONSTANTS, TRAVEL_TIME_OPTIONS } from "@/constants/map";

export type TransportMode = IsochroneProfile;

export const TRANSPORT_MODES: { id: TransportMode; label: string; icon: string }[] = [
    { id: "walking", label: "Walking", icon: "🚶" },
    { id: "cycling", label: "Cycling", icon: "🚴" },
    { id: "driving", label: "Driving", icon: "🚗" },
];

export interface MeetingSlice {
    maxTravelTime: number;
    transportMode: TransportMode;
    isochroneProvider: IsochroneProvider;
    isochrones: Record<string, GeoJSON.Polygon>;
    meetingArea: GeoJSON.Geometry | null;
    venues: GeocodingFeature[];
    isCalculating: boolean;
    errorMsg: string | null;

    setMaxTravelTime: (time: number) => void;
    setTransportMode: (mode: TransportMode) => void;
    setIsochroneProvider: (provider: IsochroneProvider) => void;
    setIsochrone: (id: string, poly: GeoJSON.Polygon) => void;
    setMeetingArea: (area: GeoJSON.Geometry | null) => void;
    calculateMeetingZone: () => Promise<void>;
    findOptimalMeetingPoint: () => Promise<void>;
    refreshPOIs: () => Promise<void>;
}

export const createMeetingSlice: StateCreator<AppState, [], [], MeetingSlice> = (set, get) => ({
    maxTravelTime: 30,
    transportMode: "walking" as TransportMode,
    isochroneProvider: (process.env.NEXT_PUBLIC_DEFAULT_MAP_PROVIDER === "maplibre" ? "ors" : "mapbox") as IsochroneProvider,
    isochrones: {},
    meetingArea: null,
    venues: [],
    isCalculating: false,
    errorMsg: null,

    setMaxTravelTime: (time) => set({ maxTravelTime: time }),
    setTransportMode: (mode) => set({ transportMode: mode }),
    setIsochroneProvider: (provider) => set({ isochroneProvider: provider }),
    setIsochrone: (id, poly) =>
        set((state) => ({ isochrones: { ...state.isochrones, [id]: poly } })),
    setMeetingArea: (area) => set({ meetingArea: area }),

    calculateMeetingZone: async () => {
        const { locations, maxTravelTime, transportMode, isochroneProvider, setIsochrone, setMeetingArea } = get();

        if (locations.length < 1) {
            set({ errorMsg: "add at least 1 location", isCalculating: false });
            return;
        }

        set({ isCalculating: true, errorMsg: null, meetingArea: null, venues: [] });

        console.log("Calculating meeting zone with:", { maxTravelTime, transportMode, isochroneProvider });

        try {
            // 1. Fetch Isochrones
            const polygons: GeoJSON.Polygon[] = [];

            for (const loc of locations) {
                const result = await getIsochrone(loc.coordinates, maxTravelTime, transportMode, isochroneProvider);
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
        let low = 0;
        let high = times.length - 1;
        let bestResult: {
            time: number;
            area: GeoJSON.Geometry;
            polys: GeoJSON.Polygon[];
        } | null = null;

        try {
            while (low <= high) {
                const mid = Math.floor((low + high) / 2);
                const t = times[mid];

                // Fetch for this time
                const polys: GeoJSON.Polygon[] = [];
                let possible = true;

                const results = await Promise.all(locations.map(l => getIsochrone(l.coordinates, t, get().transportMode, get().isochroneProvider)));

                if (results.some(r => !r)) {
                    possible = false;
                } else {
                    polys.push(...results.map(r => r as GeoJSON.Polygon));
                }

                if (possible) {
                    const intersectionGeometry = calculateIntersection(polys);
                    if (intersectionGeometry) {
                        // Found a valid time, store it and try to find a smaller one
                        bestResult = {
                            time: t,
                            area: intersectionGeometry,
                            polys: polys
                        };
                        high = mid - 1;
                    } else {
                        // No intersection, need more time
                        low = mid + 1;
                    }
                } else {
                    // Check failed (likely API error or no isochrone), assume we need more time or retry logic (simplifying to need more time)
                    low = mid + 1;
                }
            }

            if (bestResult) {
                setMaxTravelTime(bestResult.time);
                setMeetingArea(bestResult.area);
                set({ venues: [] });

                const newIsochrones: Record<string, GeoJSON.Polygon> = {};
                locations.forEach((loc, index) => {
                    newIsochrones[loc.id] = bestResult!.polys[index];
                });
                set({ isochrones: newIsochrones });

                await get().refreshPOIs();
            } else {
                set({ errorMsg: "Could not find a meeting point within 60 mins." });
            }

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
