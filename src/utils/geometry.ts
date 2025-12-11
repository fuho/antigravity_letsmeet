import * as turf from "@turf/turf";

/**
 * Calculate the intersection of multiple polygons
 * @param polygons - Array of GeoJSON polygons to intersect
 * @returns Intersection polygon or MultiPolygon, or null if no overlap
 */
export function calculateIntersection(
    polygons: GeoJSON.Polygon[]
): GeoJSON.Polygon | GeoJSON.MultiPolygon | null {
    if (polygons.length === 0) return null;
    if (polygons.length === 1) return polygons[0];

    // Start with the first polygon
    let currentGeometry: GeoJSON.Polygon | GeoJSON.MultiPolygon | null = polygons[0];

    // Intersect with each subsequent polygon
    for (let i = 1; i < polygons.length; i++) {
        if (!currentGeometry) return null;

        const result: ReturnType<typeof turf.intersect> = turf.intersect(
            turf.featureCollection([
                turf.feature(currentGeometry),
                turf.feature(polygons[i])
            ])
        );

        if (!result || !result.geometry) return null;
        currentGeometry = result.geometry;
    }

    // Return the geometry (can be Polygon or MultiPolygon)
    return currentGeometry;
}

/**
 * Get bounding box from a GeoJSON geometry
 * @param geometry - GeoJSON geometry
 * @returns Bounding box as [minLng, minLat, maxLng, maxLat]
 */
export function getBoundingBox(
    geometry: GeoJSON.Geometry
): [number, number, number, number] {
    return turf.bbox(turf.feature(geometry)) as [number, number, number, number];
}

/**
 * Get centroid (center point) of a GeoJSON geometry
 * @param geometry - GeoJSON geometry
 * @returns Center coordinates as [lng, lat]
 */
export function getCentroid(geometry: GeoJSON.Geometry): [number, number] {
    const centroid = turf.centroid(turf.feature(geometry));
    return centroid.geometry.coordinates as [number, number];
}

/**
 * Check if a point is within a polygon or MultiPolygon
 * @param point - Point coordinates as [lng, lat]
 * @param polygon - GeoJSON polygon or MultiPolygon
 * @returns True if point is inside polygon
 */
export function isPointInPolygon(
    point: [number, number],
    polygon: GeoJSON.Polygon | GeoJSON.MultiPolygon
): boolean {
    const turfPoint = turf.point(point);
    const turfPolygon = turf.feature(polygon);
    return turf.booleanPointInPolygon(turfPoint, turfPolygon);
}
