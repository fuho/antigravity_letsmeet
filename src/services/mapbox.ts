const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export interface GeocodingFeature {
    id: string;
    place_name: string;
    center: [number, number]; // [lng, lat]
    text: string;
    poiType?: string; // Optional: POI type ID (e.g., 'coffee', 'meal', 'beer')
    properties?: any; // Optional: Additional properties from API
}

export async function searchAddress(query: string): Promise<GeocodingFeature[]> {
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

export async function searchNearby(category: string, lng: number, lat: number, bbox?: [number, number, number, number]): Promise<GeocodingFeature[]> {
    if (!MAPBOX_TOKEN) return [];

    // Use Search Box API for category-based POI search
    // https://docs.mapbox.com/api/search/search-box/#category-search
    let endpoint = `https://api.mapbox.com/search/searchbox/v1/category/${encodeURIComponent(
        category
    )}?access_token=${MAPBOX_TOKEN}&proximity=${lng},${lat}&limit=25&language=en`;

    // Add bounding box if provided (helps constrain results to sweet spot area)
    if (bbox) {
        endpoint += `&bbox=${bbox.join(',')}`;
    }

    try {
        const res = await fetch(endpoint);
        const data = await res.json();

        // Transform Search Box API response to match our GeocodingFeature interface
        const features: GeocodingFeature[] = (data.features || []).map((feature: any) => ({
            id: feature.id || feature.properties?.mapbox_id || crypto.randomUUID(),
            place_name: feature.properties?.full_address || feature.properties?.place_formatted || 'Unknown',
            center: feature.geometry?.coordinates || [lng, lat],
            text: feature.properties?.name || feature.properties?.name_preferred || category
        }));

        return features;
    } catch (error) {
        console.error("POI Search error:", error);
        return [];
    }
}

export async function reverseGeocode(lng: number, lat: number): Promise<GeocodingFeature | null> {
    if (!MAPBOX_TOKEN) return null;

    const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&limit=1`;

    try {
        const res = await fetch(endpoint);
        const data = await res.json();
        if (data.features && data.features.length > 0) {
            return data.features[0];
        }
        return null; // No address found
    } catch (error) {
        console.error("Reverse Geocoding error:", error);
        return null;
    }
}
