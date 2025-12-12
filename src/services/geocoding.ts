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

// Helper to determine the default provider from environment or config
export function getDefaultGeocodingProvider(): GeocodingProvider {
    const provider = process.env.NEXT_PUBLIC_MAP_PROVIDER;
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
