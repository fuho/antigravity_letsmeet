import { GeocodingFeature } from "@/services/mapbox";
import { isPointInPolygon } from "./geometry";

/**
 * Generate search points distributed across a bounding box
 * Creates a center point and 4 quadrant points for comprehensive POI coverage
 * 
 * @param center - Center coordinates [lng, lat]
 * @param bbox - Bounding box [minLng, minLat, maxLng, maxLat]
 * @returns Array of 5 search points [center, SW, SE, NW, NE]
 */
export function generateSearchPoints(
    center: [number, number],
    bbox: [number, number, number, number]
): Array<[number, number]> {
    const [minLng, minLat, maxLng, maxLat] = bbox;

    return [
        center,                                                                      // Center
        [minLng + (maxLng - minLng) * 0.25, minLat + (maxLat - minLat) * 0.25],  // SW quadrant
        [maxLng - (maxLng - minLng) * 0.25, minLat + (maxLat - minLat) * 0.25],  // SE quadrant
        [minLng + (maxLng - minLng) * 0.25, maxLat - (maxLat - minLat) * 0.25],  // NW quadrant
        [maxLng - (maxLng - minLng) * 0.25, maxLat - (maxLat - minLat) * 0.25],  // NE quadrant
    ];
}

/**
 * Deduplicate POIs by creating a unique key from place name and coordinates
 * 
 * @param pois - Array of POIs to deduplicate
 * @returns Deduplicated array of POIs
 */
export function deduplicatePOIs(pois: GeocodingFeature[]): GeocodingFeature[] {
    const seen = new Set<string>();

    return pois.filter(poi => {
        const key = `${poi.place_name}-${poi.center[0]}-${poi.center[1]}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

/**
 * Filter POIs to only include those within a polygon
 * 
 * @param pois - Array of POIs to filter
 * @param polygon - GeoJSON polygon or MultiPolygon to filter by
 * @returns POIs that are within the polygon
 */
export function filterPOIsInPolygon(
    pois: GeocodingFeature[],
    polygon: GeoJSON.Polygon | GeoJSON.MultiPolygon
): GeocodingFeature[] {
    return pois.filter(poi => isPointInPolygon(poi.center, polygon));
}

/**
 * Search for POIs across multiple points in an area
 * This function distributes search queries across a bounding box to ensure
 * comprehensive coverage of the entire area, not just the center.
 * 
 * @param searchFn - Function to search POIs at a specific point
 * @param center - Center coordinates of the area
 * @param bbox - Bounding box of the area
 * @param polygon - Optional polygon or MultiPolygon to filter results
 * @param maxResults - Maximum number of results to return (default: 50)
 * @returns Deduplicated and filtered array of POIs
 */
export async function searchPOIsInArea(
    searchFn: (lng: number, lat: number, bbox: [number, number, number, number]) => Promise<GeocodingFeature[]>,
    center: [number, number],
    bbox: [number, number, number, number],
    polygon?: GeoJSON.Polygon | GeoJSON.MultiPolygon,
    maxResults: number = 50
): Promise<GeocodingFeature[]> {
    // Generate search points distributed across the area
    const searchPoints = generateSearchPoints(center, bbox);

    // Search from all points and combine results
    const allResults: GeocodingFeature[] = [];
    for (const point of searchPoints) {
        const pois = await searchFn(point[0], point[1], bbox);
        allResults.push(...pois);
    }

    // Deduplicate results
    let uniquePois = deduplicatePOIs(allResults);

    // Filter to polygon if provided
    if (polygon) {
        uniquePois = filterPOIsInPolygon(uniquePois, polygon);
    }

    // Limit results
    return uniquePois.slice(0, maxResults);
}
