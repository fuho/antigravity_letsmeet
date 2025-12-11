export const MAP_CONSTANTS = {
    // Default map settings
    DEFAULT_ZOOM: 12,
    DEFAULT_LATITUDE: 50.0755, // Prague
    DEFAULT_LONGITUDE: 14.4378,

    // Map interaction
    FIT_BOUNDS_PADDING: 100,
    FIT_BOUNDS_DURATION: 1000,

    // Popup offsets
    LOCATION_POPUP_OFFSET: [0, -35] as [number, number],
    POI_POPUP_OFFSET: [0, -25] as [number, number],

    // Marker sizes
    LOCATION_MARKER_SIZE: 32,
    POI_MARKER_SIZE: 20,

    // Display limits
    MAX_POIS_DISPLAYED: 50,

    // Map style
    MAP_STYLE: "mapbox://styles/mapbox/dark-v11",
} as const;

// Travel time options for optimization (in minutes)
export const TRAVEL_TIME_OPTIONS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60] as const;
