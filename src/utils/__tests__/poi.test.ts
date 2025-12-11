import {
    generateSearchPoints,
    deduplicatePOIs,
    filterPOIsInPolygon,
    searchPOIsInArea,
} from "../poi";
import { GeocodingFeature } from "@/services/mapbox";

describe("poi utils", () => {
    describe("generateSearchPoints", () => {
        const center: [number, number] = [14.4378, 50.0755];
        const bbox: [number, number, number, number] = [14.0, 49.5, 15.0, 50.5];

        it("should return 5 search points", () => {
            const points = generateSearchPoints(center, bbox);
            expect(points).toHaveLength(5);
        });

        it("should include the center point first", () => {
            const points = generateSearchPoints(center, bbox);
            expect(points[0]).toEqual(center);
        });

        it("should generate points within the bounding box", () => {
            const points = generateSearchPoints(center, bbox);
            const [minLng, minLat, maxLng, maxLat] = bbox;

            points.forEach((point) => {
                expect(point[0]).toBeGreaterThanOrEqual(minLng);
                expect(point[0]).toBeLessThanOrEqual(maxLng);
                expect(point[1]).toBeGreaterThanOrEqual(minLat);
                expect(point[1]).toBeLessThanOrEqual(maxLat);
            });
        });

        it("should generate quadrant points at 25% from edges", () => {
            const points = generateSearchPoints(center, bbox);
            // SW quadrant (index 1)
            expect(points[1][0]).toBeCloseTo(14.25, 2); // minLng + 0.25 * width
            expect(points[1][1]).toBeCloseTo(49.75, 2); // minLat + 0.25 * height
        });
    });

    describe("deduplicatePOIs", () => {
        const basePOI: GeocodingFeature = {
            id: "1",
            place_name: "Coffee Shop",
            center: [14.4378, 50.0755],
            text: "Coffee Shop",
        };

        it("should return empty array for empty input", () => {
            expect(deduplicatePOIs([])).toEqual([]);
        });

        it("should return single POI unchanged", () => {
            const result = deduplicatePOIs([basePOI]);
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual(basePOI);
        });

        it("should remove exact duplicates", () => {
            const duplicate = { ...basePOI, id: "2" }; // Same name and coords, different id
            const result = deduplicatePOIs([basePOI, duplicate]);
            expect(result).toHaveLength(1);
        });

        it("should keep POIs with different coordinates", () => {
            const differentLocation: GeocodingFeature = {
                ...basePOI,
                id: "2",
                center: [15.0, 51.0],
            };
            const result = deduplicatePOIs([basePOI, differentLocation]);
            expect(result).toHaveLength(2);
        });

        it("should keep POIs with different names", () => {
            const differentName: GeocodingFeature = {
                ...basePOI,
                id: "2",
                place_name: "Different Coffee Shop",
            };
            const result = deduplicatePOIs([basePOI, differentName]);
            expect(result).toHaveLength(2);
        });
    });

    describe("filterPOIsInPolygon", () => {
        const polygon: GeoJSON.Polygon = {
            type: "Polygon",
            coordinates: [
                [
                    [14.0, 50.0],
                    [14.0, 51.0],
                    [15.0, 51.0],
                    [15.0, 50.0],
                    [14.0, 50.0],
                ],
            ],
        };

        const insidePOI: GeocodingFeature = {
            id: "1",
            place_name: "Inside",
            center: [14.5, 50.5],
            text: "Inside",
        };

        const outsidePOI: GeocodingFeature = {
            id: "2",
            place_name: "Outside",
            center: [16.0, 52.0],
            text: "Outside",
        };

        it("should return empty array for empty input", () => {
            expect(filterPOIsInPolygon([], polygon)).toEqual([]);
        });

        it("should keep POIs inside polygon", () => {
            const result = filterPOIsInPolygon([insidePOI], polygon);
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual(insidePOI);
        });

        it("should filter out POIs outside polygon", () => {
            const result = filterPOIsInPolygon([outsidePOI], polygon);
            expect(result).toHaveLength(0);
        });

        it("should correctly filter mixed array", () => {
            const result = filterPOIsInPolygon([insidePOI, outsidePOI], polygon);
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe("1");
        });

        it("should work with MultiPolygon", () => {
            const multiPolygon: GeoJSON.MultiPolygon = {
                type: "MultiPolygon",
                coordinates: [polygon.coordinates],
            };
            const result = filterPOIsInPolygon([insidePOI, outsidePOI], multiPolygon);
            expect(result).toHaveLength(1);
        });
    });

    describe("searchPOIsInArea", () => {
        const center: [number, number] = [14.5, 50.5];
        const bbox: [number, number, number, number] = [14.0, 50.0, 15.0, 51.0];
        const polygon: GeoJSON.Polygon = {
            type: "Polygon",
            coordinates: [
                [
                    [14.0, 50.0],
                    [14.0, 51.0],
                    [15.0, 51.0],
                    [15.0, 50.0],
                    [14.0, 50.0],
                ],
            ],
        };

        const mockPOI: GeocodingFeature = {
            id: "1",
            place_name: "Coffee Shop",
            center: [14.5, 50.5],
            text: "Coffee Shop",
        };

        it("should call searchFn for each search point", async () => {
            const searchFn = jest.fn().mockResolvedValue([mockPOI]);
            await searchPOIsInArea(searchFn, center, bbox, polygon, 50);

            // Should be called 5 times (center + 4 quadrants)
            expect(searchFn).toHaveBeenCalledTimes(5);
        });

        it("should pass bbox to searchFn", async () => {
            const searchFn = jest.fn().mockResolvedValue([]);
            await searchPOIsInArea(searchFn, center, bbox, polygon, 50);

            expect(searchFn).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), bbox);
        });

        it("should deduplicate results from multiple search points", async () => {
            // Same POI returned from all search points
            const searchFn = jest.fn().mockResolvedValue([mockPOI]);
            const result = await searchPOIsInArea(searchFn, center, bbox, polygon, 50);

            // Should only have 1 unique POI
            expect(result).toHaveLength(1);
        });

        it("should limit results to maxResults", async () => {
            // Generate many unique POIs
            const manyPOIs: GeocodingFeature[] = Array.from({ length: 20 }, (_, i) => ({
                id: String(i),
                place_name: `POI ${i}`,
                center: [14.0 + i * 0.01, 50.0 + i * 0.01] as [number, number],
                text: `POI ${i}`,
            }));

            const searchFn = jest.fn().mockResolvedValue(manyPOIs);
            const result = await searchPOIsInArea(searchFn, center, bbox, undefined, 10);

            expect(result.length).toBeLessThanOrEqual(10);
        });

        it("should work without polygon filter", async () => {
            const outsidePOI: GeocodingFeature = {
                id: "2",
                place_name: "Outside",
                center: [16.0, 52.0],
                text: "Outside",
            };
            const searchFn = jest.fn().mockResolvedValue([outsidePOI]);

            // Without polygon, should include POIs outside
            const result = await searchPOIsInArea(searchFn, center, bbox, undefined, 50);
            expect(result).toHaveLength(1);
        });
    });
});
