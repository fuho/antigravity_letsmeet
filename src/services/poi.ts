import { GeocodingFeature, searchNearby } from "@/services/mapbox";
import { POI_TYPES } from "@/constants/poiTypes";

/**
 * Search for multiple types of POIs near a location
 * 
 * @param types - Array of POI type IDs to search for
 * // ... (rest of parameters similar to original)
 */
export const searchMultiplePOITypes = async (
    types: string[],
    lng: number,
    lat: number,
    bbox?: [number, number, number, number]
): Promise<GeocodingFeature[]> => {
    if (types.length === 0) return [];

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
};
