import { create } from "zustand";
import { GeocodingFeature, searchNearby, reverseGeocode } from "@/services/mapbox";
import { DEFAULT_POI_TYPES } from "@/constants/poiTypes";
import { getIsochrone } from "@/services/isochrone";
import * as turf from "@turf/turf";

interface Location {
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

        // Extract centroid and bbox from meeting area
        // @ts-ignore
        const center = turf.centroid(turf.feature(meetingArea)).geometry.coordinates;
        const bbox = turf.bbox(turf.feature(meetingArea)) as [number, number, number, number];

        // Multi-point search strategy: search from center + 4 quadrant centers
        // This distributes POIs across the entire sweet spot area
        const [minLng, minLat, maxLng, maxLat] = bbox;

        const searchPoints = [
            center,                          // Center
            [minLng + (maxLng - minLng) * 0.25, minLat + (maxLat - minLat) * 0.25],  // SW quadrant
            [maxLng - (maxLng - minLng) * 0.25, minLat + (maxLat - minLat) * 0.25],  // SE quadrant
            [minLng + (maxLng - minLng) * 0.25, maxLat - (maxLat - minLat) * 0.25],  // NW quadrant
            [maxLng - (maxLng - minLng) * 0.25, maxLat - (maxLat - minLat) * 0.25],  // NE quadrant
        ];

        // Search from all points and combine results
        const allResults: GeocodingFeature[] = [];
        for (const point of searchPoints) {
            const pois = await get().searchMultiplePOITypes(selectedPOITypes, point[0], point[1], bbox);
            allResults.push(...pois);
        }

        // Deduplicate by place_name and coordinates (same venue might appear in multiple searches)
        const seen = new Set<string>();
        const uniquePois = allResults.filter(poi => {
            const key = `${poi.place_name}-${poi.center[0]}-${poi.center[1]}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        // Filter to only include POIs within the actual sweet spot polygon
        const filteredPois = uniquePois.filter(poi => {
            const point = turf.point(poi.center);
            // @ts-ignore
            return turf.booleanPointInPolygon(point, turf.feature(meetingArea));
        });

        // Limit to reasonable number of POIs to avoid overcrowding
        set({ venues: filteredPois.slice(0, 50) });
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

                    // 3. Find POIs across the entire sweet spot area using multi-point search
                    // Type assertion: we've verified geometry exists above
                    const validIntersection = intersection as GeoJSON.Feature<GeoJSON.Polygon>;

                    const center = turf.centroid(validIntersection).geometry.coordinates; // [lng, lat]
                    // Extract bounding box from the intersection polygon
                    const bbox = turf.bbox(validIntersection) as [number, number, number, number];

                    // Multi-point search strategy
                    const [minLng, minLat, maxLng, maxLat] = bbox;
                    const searchPoints = [
                        center,
                        [minLng + (maxLng - minLng) * 0.25, minLat + (maxLat - minLat) * 0.25],
                        [maxLng - (maxLng - minLng) * 0.25, minLat + (maxLat - minLat) * 0.25],
                        [minLng + (maxLng - minLng) * 0.25, maxLat - (maxLat - minLat) * 0.25],
                        [maxLng - (maxLng - minLng) * 0.25, maxLat - (maxLat - minLat) * 0.25],
                    ];

                    const allResults: GeocodingFeature[] = [];
                    for (const point of searchPoints) {
                        const pois = await get().searchMultiplePOITypes(get().selectedPOITypes, point[0], point[1], bbox);
                        allResults.push(...pois);
                    }

                    const seen = new Set<string>();
                    const uniquePois = allResults.filter(poi => {
                        const key = `${poi.place_name}-${poi.center[0]}-${poi.center[1]}`;
                        if (seen.has(key)) return false;
                        seen.add(key);
                        return true;
                    });

                    const filteredPois = uniquePois.filter(poi => {
                        const point = turf.point(poi.center);
                        return turf.booleanPointInPolygon(point, validIntersection);
                    });

                    set({ venues: filteredPois.slice(0, 50) });
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

                        // Find POIs across the entire sweet spot area using multi-point search
                        // Type assertion: currentIntersection is guaranteed to be non-null here
                        const validIntersection = currentIntersection as GeoJSON.Feature<GeoJSON.Polygon>;

                        const center = turf.centroid(validIntersection).geometry.coordinates;
                        const bbox = turf.bbox(validIntersection) as [number, number, number, number];

                        // Multi-point search strategy
                        const [minLng, minLat, maxLng, maxLat] = bbox;
                        const searchPoints = [
                            center,
                            [minLng + (maxLng - minLng) * 0.25, minLat + (maxLat - minLat) * 0.25],
                            [maxLng - (maxLng - minLng) * 0.25, minLat + (maxLat - minLat) * 0.25],
                            [minLng + (maxLng - minLng) * 0.25, maxLat - (maxLat - minLat) * 0.25],
                            [maxLng - (maxLng - minLng) * 0.25, maxLat - (maxLat - minLat) * 0.25],
                        ];

                        const allResults: GeocodingFeature[] = [];
                        for (const point of searchPoints) {
                            const pois = await get().searchMultiplePOITypes(get().selectedPOITypes, point[0], point[1], bbox);
                            allResults.push(...pois);
                        }

                        const seen = new Set<string>();
                        const uniquePois = allResults.filter(poi => {
                            const key = `${poi.place_name}-${poi.center[0]}-${poi.center[1]}`;
                            if (seen.has(key)) return false;
                            seen.add(key);
                            return true;
                        });

                        const filteredPois = uniquePois.filter(poi => {
                            const point = turf.point(poi.center);
                            return turf.booleanPointInPolygon(point, validIntersection);
                        });

                        set({ venues: filteredPois.slice(0, 50) });

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
