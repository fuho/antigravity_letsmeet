import { create } from "zustand";
import { GeocodingFeature, searchNearby, reverseGeocode } from "@/services/mapbox";
import { DEFAULT_POI_TYPES } from "@/constants/poiTypes";
import { getIsochrone } from "@/services/isochrone";
import { generateRandomColor } from "@/utils/formatting";
import { calculateIntersection, getBoundingBox, getCentroid } from "@/utils/geometry";
import { searchPOIsInArea } from "@/utils/poi";
import { MAP_CONSTANTS, TRAVEL_TIME_OPTIONS } from "@/constants/map";
import { TIMING_CONSTANTS } from "@/constants/timing";

export interface Location {
    id: string;
    name?: string;
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

    // POI Type Selection
    selectedPOITypes: string[];
    setSelectedPOITypes: (types: string[]) => void;

    addLocation: (loc: Location) => void;
    addLocationByCoordinates: (lng: number, lat: number) => Promise<void>;
    updateLocationPosition: (id: string, lng: number, lat: number) => Promise<void>;
    updateLocationNameAndAddress: (id: string, name?: string, address?: string) => void;
    removeLocation: (id: string) => void;

    setMaxTravelTime: (time: number) => void;
    setIsochrone: (id: string, poly: GeoJSON.Polygon) => void;
    setMeetingArea: (area: GeoJSON.Geometry | null) => void;

    calculateMeetingZone: () => Promise<void>;
    findOptimalMeetingPoint: () => Promise<void>;
    searchMultiplePOITypes: (types: string[], lng: number, lat: number, bbox?: [number, number, number, number]) => Promise<GeocodingFeature[]>;
    refreshPOIs: () => Promise<void>;

    loadProject: (locations: Location[], maxTime?: number, projectId?: string) => void;

    // Hover State
    hoveredLocationId: string | null;
    setHoveredLocationId: (id: string | null) => void;
    hoveredVenueId: string | null;
    setHoveredVenueId: (id: string | null) => void;

    // Active Project State
    activeProjectId: string | null;
    setActiveProjectId: (id: string | null) => void;
    // Shareable Links
    getShareString: () => string;
    importFromShareString: (shareString: string) => boolean;
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
    hoveredVenueId: null,
    activeProjectId: null,
    selectedPOITypes: DEFAULT_POI_TYPES,

    setHoveredLocationId: (id) => set({ hoveredLocationId: id }),
    setHoveredVenueId: (id) => set({ hoveredVenueId: id }),
    setActiveProjectId: (id) => set({ activeProjectId: id }),
    setSelectedPOITypes: (types) => set({ selectedPOITypes: types }),

    getShareString: () => {
        const { locations, maxTravelTime, selectedPOITypes } = get();

        // Compact schema
        const data = {
            v: 1, // version
            t: maxTravelTime,
            p: selectedPOITypes, // POI types
            l: locations.map(loc => ({
                c: loc.coordinates,
                a: loc.address,
                n: loc.name,
                col: loc.color
            }))
        };

        try {
            // Robust Unicode Handling for Base64
            // 1. Stringify JSON
            // 2. Percent-encode (UTF-8 safe)
            // 3. Unescape to get Latin1 characters representing the bytes
            // 4. btoa
            const json = JSON.stringify(data);
            const utf8Bytes = encodeURIComponent(json).replace(/%([0-9A-F]{2})/g,
                (match, p1) => String.fromCharCode(parseInt(p1, 16))
            );
            return btoa(utf8Bytes);
        } catch (e) {
            console.error("Failed to generate share string", e);
            return "";
        }
    },

    importFromShareString: (shareString: string) => {
        try {
            // Reverse of getShareString
            const utf8Bytes = atob(shareString);
            const json = decodeURIComponent(
                utf8Bytes.split('').map(c =>
                    '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
                ).join('')
            );

            const data = JSON.parse(json);

            if (data.v !== 1 || !Array.isArray(data.l)) {
                return false;
            }

            const newLocations: Location[] = data.l.map((item: any) => ({
                id: crypto.randomUUID(),
                coordinates: item.c,
                address: item.a,
                name: item.n,
                color: item.col || '#ffffff'
            }));

            // Load POI types if present, otherwise use defaults
            const poiTypes = data.p || get().selectedPOITypes;

            get().loadProject(newLocations, data.t || 30, undefined);
            set({ selectedPOITypes: poiTypes });
            return true;
        } catch (e) {
            console.error("Failed to parse share string", e);
            return false;
        }
    },

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

    setMaxTravelTime: (time) => set({ maxTravelTime: time }),

    setIsochrone: (id, poly) =>
        set((state) => ({ isochrones: { ...state.isochrones, [id]: poly } })),

    setMeetingArea: (area) => set({ meetingArea: area }),

    // Helper function to search for multiple POI types
    searchMultiplePOITypes: async (types: string[], lng: number, lat: number, bbox?: [number, number, number, number]): Promise<GeocodingFeature[]> => {
        if (types.length === 0) return [];

        const { POI_TYPES } = await import('@/constants/poiTypes');
        const allPOIs: GeocodingFeature[] = [];
        const seenIds = new Set<string>();

        for (const typeId of types) {
            const poiType = POI_TYPES.find(t => t.id === typeId);
            if (!poiType) continue;

            const results = await searchNearby(poiType.query, lng, lat, bbox);

            // Filter duplicates by ID and tag with POI type
            for (const poi of results) {
                if (!seenIds.has(poi.id)) {
                    seenIds.add(poi.id);
                    // Tag the POI with its type ID
                    allPOIs.push({ ...poi, poiType: typeId });
                }
            }
        }

        return allPOIs;
    },

    // Refresh POIs based on current meeting area and selected types
    refreshPOIs: async () => {
        const { meetingArea, selectedPOITypes } = get();

        if (!meetingArea) {
            set({ venues: [] });
            return;
        }

        const center = getCentroid(meetingArea);
        const bbox = getBoundingBox(meetingArea);
        const polygon = meetingArea as GeoJSON.Polygon;

        // Use utility function to search POIs across the area
        const searchFn = (lng: number, lat: number, bbox: [number, number, number, number]) =>
            get().searchMultiplePOITypes(selectedPOITypes, lng, lat, bbox);

        const pois = await searchPOIsInArea(
            searchFn,
            center,
            bbox,
            polygon,
            MAP_CONSTANTS.MAX_POIS_DISPLAYED
        );

        set({ venues: pois });
    },

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

            // 2. Calculate Intersection using utility function
            if (polygons.length > 0) {
                const intersectionGeometry = calculateIntersection(polygons);

                if (intersectionGeometry) {
                    setMeetingArea(intersectionGeometry);

                    // 3. Find POIs across the entire sweet spot area
                    const center = getCentroid(intersectionGeometry);
                    const bbox = getBoundingBox(intersectionGeometry);

                    // Use utility function to search POIs
                    const searchFn = (lng: number, lat: number, bbox: [number, number, number, number]) =>
                        get().searchMultiplePOITypes(get().selectedPOITypes, lng, lat, bbox);

                    const pois = await searchPOIsInArea(
                        searchFn,
                        center,
                        bbox,
                        intersectionGeometry,
                        MAP_CONSTANTS.MAX_POIS_DISPLAYED
                    );

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

        // Use TRAVEL_TIME_OPTIONS constant
        const times = TRAVEL_TIME_OPTIONS;

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
                    // Use utility function to calculate intersection
                    const intersectionGeometry = calculateIntersection(polys);

                    if (intersectionGeometry) {
                        // FOUND MINIMUM TIME!
                        setMaxTravelTime(t);
                        setMeetingArea(intersectionGeometry);
                        set({ venues: [] }); // clear old

                        // Update isochrones on map to reflect this win
                        const newIsochrones: Record<string, GeoJSON.Polygon> = {};
                        locations.forEach((loc, index) => {
                            newIsochrones[loc.id] = polys[index];
                        });
                        set({ isochrones: newIsochrones });

                        // Find POIs using utility function
                        const center = getCentroid(intersectionGeometry);
                        const bbox = getBoundingBox(intersectionGeometry);

                        const searchFn = (lng: number, lat: number, bbox: [number, number, number, number]) =>
                            get().searchMultiplePOITypes(get().selectedPOITypes, lng, lat, bbox);

                        const pois = await searchPOIsInArea(
                            searchFn,
                            center,
                            bbox,
                            intersectionGeometry,
                            MAP_CONSTANTS.MAX_POIS_DISPLAYED
                        );

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
