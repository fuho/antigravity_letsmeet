import { GeocodingService, GeocodingFeature } from "./geocoding-types";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Re-export GeocodingFeature for backward compatibility if needed, 
// though consumers should switch to types file.
export type { GeocodingFeature };

export class MapboxGeocodingAdapter implements GeocodingService {
    async searchAddress(query: string): Promise<GeocodingFeature[]> {
        if (!query || !MAPBOX_TOKEN) return [];

        const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            query
        )}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=5`;

        try {
            const res = await fetch(endpoint);
            const data = await res.json();
            return data.features || [];
        } catch (error) {
            console.error("Geocoding error:", error);
            return [];
        }
    }

    async searchNearby(category: string, lng: number, lat: number, bbox?: [number, number, number, number]): Promise<GeocodingFeature[]> {
        if (!MAPBOX_TOKEN) return [];

        // Use Search Box API for category-based POI search
        let endpoint = `https://api.mapbox.com/search/searchbox/v1/category/${encodeURIComponent(
            category
        )}?access_token=${MAPBOX_TOKEN}&proximity=${lng},${lat}&limit=25&language=en`;

        // Add bounding box if provided
        if (bbox) {
            endpoint += `&bbox=${bbox.join(',')}`;
        }

        try {
            const res = await fetch(endpoint);
            const data = await res.json();

            // Transform Search Box API response
            const features: GeocodingFeature[] = (data.features || []).map((feature: any) => ({
                id: feature.id || feature.properties?.mapbox_id || crypto.randomUUID(),
                place_name: feature.properties?.full_address || feature.properties?.place_formatted || 'Unknown',
                center: feature.geometry?.coordinates || [lng, lat],
                text: feature.properties?.name || feature.properties?.name_preferred || category,
                properties: feature.properties
            }));

            return features;
        } catch (error) {
            console.error("POI Search error:", error);
            return [];
        }
    }

    async reverseGeocode(lng: number, lat: number): Promise<GeocodingFeature | null> {
        if (!MAPBOX_TOKEN) return null;

        const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&limit=1`;

        try {
            const res = await fetch(endpoint);
            const data = await res.json();
            if (data.features && data.features.length > 0) {
                return data.features[0];
            }
            return null;
        } catch (error) {
            console.error("Reverse Geocoding error:", error);
            return null;
        }
    }
}

// Deprecated standalone functions for backward compatibility during migration
const adapter = new MapboxGeocodingAdapter();
export const searchAddress = adapter.searchAddress.bind(adapter);
export const searchNearby = adapter.searchNearby.bind(adapter);
export const reverseGeocode = adapter.reverseGeocode.bind(adapter);
