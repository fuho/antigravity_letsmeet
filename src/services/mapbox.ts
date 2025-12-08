const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export interface GeocodingFeature {
    id: string;
    place_name: string;
    center: [number, number]; // [lng, lat]
    text: string;
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

export async function searchNearby(query: string, lng: number, lat: number): Promise<GeocodingFeature[]> {
    if (!MAPBOX_TOKEN) return [];
    // Use Geocoding API with proximity for POIs
    const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        query
    )}.json?access_token=${MAPBOX_TOKEN}&proximity=${lng},${lat}&types=poi&limit=10`;

    try {
        const res = await fetch(endpoint);
        const data = await res.json();
        return data.features || [];
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
