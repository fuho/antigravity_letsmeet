export interface GeocodingFeature {
    id: string;
    place_name: string;
    center: [number, number]; // [lng, lat]
    text: string;
    poiType?: string; // Optional: POI type ID
    properties?: any; // Optional: Additional properties
}

export interface GeocodingService {
    searchAddress(query: string): Promise<GeocodingFeature[]>;
    searchNearby(category: string, lng: number, lat: number, bbox?: [number, number, number, number]): Promise<GeocodingFeature[]>;
    reverseGeocode(lng: number, lat: number): Promise<GeocodingFeature | null>;
}

export type GeocodingProvider = "mapbox" | "ors";
