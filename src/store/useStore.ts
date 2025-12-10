import { create } from "zustand";
import { GeocodingFeature, searchNearby, reverseGeocode } from "@/services/mapbox";
import { getIsochrone } from "@/services/isochrone";
import * as turf from "@turf/turf";

interface Location {
    id: string;
    address: string;
    coordinates: [number, number];
    color: string;
}

interface AppState {
    locations: Location[];
    maxTravelTime: number;
    // Map of location ID to Polygon
    isochrones: Record<string, GeoJSON.Polygon>;
    meetingArea: GeoJSON.Geometry | null;

    // New State for Calculation & Results
    venues: GeocodingFeature[];
    isCalculating: boolean;
    errorMsg: string | null;

    addLocation: (loc: Location) => void;
    addLocationByCoordinates: (lng: number, lat: number) => Promise<void>;
    updateLocationPosition: (id: string, lng: number, lat: number) => Promise<void>;
    removeLocation: (id: string) => void;

    setMaxTravelTime: (time: number) => void;
    setIsochrone: (id: string, poly: GeoJSON.Polygon) => void;
    setMeetingArea: (area: GeoJSON.Geometry | null) => void;

    calculateMeetingZone: () => Promise<void>;
    findOptimalMeetingPoint: () => Promise<void>;

    loadProject: (locations: Location[], maxTime?: number, projectId?: string) => void;

    // Hover State
    hoveredLocationId: string | null;
    setHoveredLocationId: (id: string | null) => void;

    // Active Project State
    activeProjectId: string | null;
    setActiveProjectId: (id: string | null) => void;
}

export const useStore = create<AppState>((set, get) => ({
    locations: [],
    maxTravelTime: 30,
    isochrones: {},
    meetingArea: null,
    venues: [],
    isCalculating: false,
    errorMsg: null,
    hoveredLocationId: null,
    activeProjectId: null,

    setHoveredLocationId: (id) => set({ hoveredLocationId: id }),
    setActiveProjectId: (id) => set({ activeProjectId: id }),

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
            color: "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
        };

        get().addLocation(newLoc);
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
                // Clear old isochrone
                isochrones: { ...state.isochrones, [id]: null as any }
            };
        });

        // If a meeting area exists, auto-recalculate immediately
        if (get().meetingArea) {
            get().calculateMeetingZone();
        }

        // 2. Async Reverse Geocoding
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
                // Fetch fresh isochrones based on current coords
                const result = await getIsochrone(loc.coordinates, maxTravelTime, "driving");
                if (result) {
                    // result could be MultiPolygon if intervals were used, but here strict single
                    // However, we cast to Polygon because simple request returns Polygon usually
                    // Or we just handle feature geometry.
                    // Safe assumption for 1 minute value => Polygon.
                    const poly = result as GeoJSON.Polygon;
                    setIsochrone(loc.id, poly);
                    polygons.push(poly);
                }
            }

            // 2. Calculate Intersection
            if (polygons.length > 0) {
                let intersection: GeoJSON.Feature<GeoJSON.Polygon | null> | null = turf.feature(polygons[0]);

                for (let i = 1; i < polygons.length; i++) {
                    // @ts-ignore
                    intersection = turf.intersect(turf.featureCollection([intersection, turf.feature(polygons[i])]));
                    if (!intersection) break;
                }

                if (intersection && intersection.geometry) {
                    // @ts-ignore
                    setMeetingArea(intersection.geometry);

                    // 3. Find POIs near centroid
                    // @ts-ignore - Turf centroid returns Feature<Point>
                    const center = turf.centroid(intersection).geometry.coordinates; // [lng, lat]
                    const pois = await searchNearby("cafe", center[0], center[1]);

                    set({ venues: pois });
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

        // Intervals to check: 5, 10, 15... 60
        const times = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];

        try {
            for (const t of times) {
                // Check if this time works for ALL
                const polys: GeoJSON.Polygon[] = [];
                let possible = true;

                // Parallel fetch for this time
                const results = await Promise.all(locations.map(l => getIsochrone(l.coordinates, t, "driving")));

                // If any failed or null, skip this time
                if (results.some(r => !r)) {
                    possible = false;
                } else {
                    polys.push(...results.map(r => r as GeoJSON.Polygon));
                }

                if (possible) {
                    // Check intersection
                    let intersection: GeoJSON.Feature<GeoJSON.Polygon | null> | null = turf.feature(polys[0]);
                    let currentIntersection = turf.feature(polys[0]);

                    for (let i = 1; i < polys.length; i++) {
                        // @ts-ignore
                        currentIntersection = turf.intersect(turf.featureCollection([currentIntersection, turf.feature(polys[i])]));
                        if (!currentIntersection) break;
                    }

                    if (currentIntersection && currentIntersection.geometry) {
                        // FOUND MINIMUM TIME!
                        setMaxTravelTime(t);
                        setMeetingArea(currentIntersection.geometry);
                        set({ venues: [] }); // clear old

                        // Update isochrones on map to reflect this win
                        // We need to set state isochrones for the map visualization
                        const newIsochrones: Record<string, GeoJSON.Polygon> = {};
                        locations.forEach((loc, index) => {
                            newIsochrones[loc.id] = polys[index];
                        });
                        set({ isochrones: newIsochrones });

                        // Find POIs
                        // @ts-ignore
                        const center = turf.centroid(currentIntersection).geometry.coordinates;
                        const pois = await searchNearby("cafe", center[0], center[1]);
                        set({ venues: pois });

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

    loadProject: (newLocations, maxTime, projectId) => {
        set({
            locations: newLocations,
            maxTravelTime: maxTime || 30, // Default to 30 if undefined
            activeProjectId: projectId || null,
            isochrones: {},
            meetingArea: null,
            venues: [],
            errorMsg: null,
            isCalculating: false
        });
    }
}));
