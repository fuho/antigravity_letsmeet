import { GeocodingService, GeocodingFeature } from "./geocoding-types";

const ORS_API_KEY = process.env.NEXT_PUBLIC_ORS_TOKEN;

export class ORSGeocodingAdapter implements GeocodingService {
    async searchAddress(query: string): Promise<GeocodingFeature[]> {
        if (!query || !ORS_API_KEY) return [];

        const endpoint = `https://api.openrouteservice.org/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(query)}&size=5`;

        try {
            const res = await fetch(endpoint);
            const data = await res.json();

            return (data.features || []).map(this.transformFeature);
        } catch (error) {
            console.error("ORS Geocoding error:", error);
            return [];
        }
    }

    async searchNearby(category: string, lng: number, lat: number, bbox?: [number, number, number, number]): Promise<GeocodingFeature[]> {
        if (!ORS_API_KEY) return [];

        // ORS/Pelias uses different category mappings, but 'text' search usually works for POIs
        // ideally we would use structured search or specific POI endpoint if available, 
        // but ORS Geocode /search is the main entry point.
        // We can use focus.point.lon/lat for proximity.

        let endpoint = `https://api.openrouteservice.org/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(category)}&focus.point.lon=${lng}&focus.point.lat=${lat}&size=25`;

        if (bbox) {
            // ORS supports boundary.rect.min_lon, etc.
            endpoint += `&boundary.rect.min_lon=${bbox[0]}&boundary.rect.min_lat=${bbox[1]}&boundary.rect.max_lon=${bbox[2]}&boundary.rect.max_lat=${bbox[3]}`;
        }

        try {
            const res = await fetch(endpoint);
            const data = await res.json();
            return (data.features || []).map((f: any) => this.transformFeature(f, category));
        } catch (error) {
            console.error("ORS POI Search error:", error);
            return [];
        }
    }

    async reverseGeocode(lng: number, lat: number): Promise<GeocodingFeature | null> {
        if (!ORS_API_KEY) return null;

        const endpoint = `https://api.openrouteservice.org/geocode/reverse?api_key=${ORS_API_KEY}&point.lon=${lng}&point.lat=${lat}&size=1`;

        try {
            const res = await fetch(endpoint);
            const data = await res.json();
            if (data.features && data.features.length > 0) {
                return this.transformFeature(data.features[0]);
            }
            return null;
        } catch (error) {
            console.error("ORS Reverse Geocoding error:", error);
            return null;
        }
    }

    private transformFeature(feature: any, fallbackText?: string): GeocodingFeature {
        return {
            id: feature.properties?.id || crypto.randomUUID(),
            place_name: feature.properties?.label || "Unknown Location",
            center: feature.geometry?.coordinates || [0, 0],
            text: feature.properties?.name || fallbackText || feature.properties?.label || "Unknown",
            properties: feature.properties
        };
    }
}
