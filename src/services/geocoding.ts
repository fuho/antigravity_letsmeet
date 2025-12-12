import { GeocodingService, GeocodingProvider } from "./geocoding-types";
import { MapboxGeocodingAdapter } from "./mapbox";
import { ORSGeocodingAdapter } from "./ors-geocoding";

const mapboxAdapter = new MapboxGeocodingAdapter();
const orsAdapter = new ORSGeocodingAdapter();

export function getGeocodingService(provider: GeocodingProvider = "mapbox"): GeocodingService {
    switch (provider) {
        case "ors":
            return orsAdapter;
        case "mapbox":
        default:
            return mapboxAdapter;
    }
}

import { useStore } from "@/store/useStore";

// Helper to determine the default provider from environment or config
export function getDefaultGeocodingProvider(): GeocodingProvider {
    // Try to get from store first (runtime switch)
    try {
        const storeProvider = useStore.getState().mapProvider;
        if (storeProvider === "maplibre") return "ors";
        if (storeProvider === "mapbox") return "mapbox";
    } catch (e) {
        // Fallback if store not initialized (unlikely in app, possible in tests)
    }

    const provider = process.env.NEXT_PUBLIC_DEFAULT_MAP_PROVIDER;
    return provider === "maplibre" ? "ors" : "mapbox";
}

// Convenience exports that use the default provider (for backward compatibility / ease of use)
export const geocodingService = {
    searchAddress: (query: string) => getGeocodingService(getDefaultGeocodingProvider()).searchAddress(query),
    searchNearby: (category: string, lng: number, lat: number, bbox?: [number, number, number, number]) =>
        getGeocodingService(getDefaultGeocodingProvider()).searchNearby(category, lng, lat, bbox),
    reverseGeocode: (lng: number, lat: number) =>
        getGeocodingService(getDefaultGeocodingProvider()).reverseGeocode(lng, lat)
};
