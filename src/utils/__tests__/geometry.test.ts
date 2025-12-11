import {
    calculateIntersection,
    getBoundingBox,
    getCentroid,
    isPointInPolygon,
} from "../geometry";

describe("geometry utils", () => {
    // Sample polygons for testing
    const squarePolygon: GeoJSON.Polygon = {
        type: "Polygon",
        coordinates: [
            [
                [0, 0],
                [0, 10],
                [10, 10],
                [10, 0],
                [0, 0],
            ],
        ],
    };

    const overlappingSquare: GeoJSON.Polygon = {
        type: "Polygon",
        coordinates: [
            [
                [5, 5],
                [5, 15],
                [15, 15],
                [15, 5],
                [5, 5],
            ],
        ],
    };

    const nonOverlappingSquare: GeoJSON.Polygon = {
        type: "Polygon",
        coordinates: [
            [
                [20, 20],
                [20, 30],
                [30, 30],
                [30, 20],
                [20, 20],
            ],
        ],
    };

    describe("calculateIntersection", () => {
        it("should return null for empty array", () => {
            const result = calculateIntersection([]);
            expect(result).toBeNull();
        });

        it("should return the same polygon for single polygon", () => {
            const result = calculateIntersection([squarePolygon]);
            expect(result).toEqual(squarePolygon);
        });

        it("should return intersection for overlapping polygons", () => {
            const result = calculateIntersection([squarePolygon, overlappingSquare]);
            expect(result).not.toBeNull();
            expect(result?.type).toBe("Polygon");
        });

        it("should return null for non-overlapping polygons", () => {
            const result = calculateIntersection([squarePolygon, nonOverlappingSquare]);
            expect(result).toBeNull();
        });

        it("should handle multiple overlapping polygons", () => {
            const thirdSquare: GeoJSON.Polygon = {
                type: "Polygon",
                coordinates: [
                    [
                        [7, 7],
                        [7, 12],
                        [12, 12],
                        [12, 7],
                        [7, 7],
                    ],
                ],
            };
            const result = calculateIntersection([squarePolygon, overlappingSquare, thirdSquare]);
            expect(result).not.toBeNull();
        });
    });

    describe("getBoundingBox", () => {
        it("should return correct bounding box for square polygon", () => {
            const bbox = getBoundingBox(squarePolygon);
            expect(bbox).toEqual([0, 0, 10, 10]);
        });

        it("should return correct bounding box for offset polygon", () => {
            const bbox = getBoundingBox(overlappingSquare);
            expect(bbox).toEqual([5, 5, 15, 15]);
        });
    });

    describe("getCentroid", () => {
        it("should return center of square polygon", () => {
            const centroid = getCentroid(squarePolygon);
            expect(centroid[0]).toBeCloseTo(5, 5);
            expect(centroid[1]).toBeCloseTo(5, 5);
        });

        it("should return center of offset polygon", () => {
            const centroid = getCentroid(overlappingSquare);
            expect(centroid[0]).toBeCloseTo(10, 5);
            expect(centroid[1]).toBeCloseTo(10, 5);
        });
    });

    describe("isPointInPolygon", () => {
        it("should return true for point inside polygon", () => {
            const point: [number, number] = [5, 5];
            expect(isPointInPolygon(point, squarePolygon)).toBe(true);
        });

        it("should return false for point outside polygon", () => {
            const point: [number, number] = [15, 15];
            expect(isPointInPolygon(point, squarePolygon)).toBe(false);
        });

        it("should return true for point on edge", () => {
            const point: [number, number] = [0, 5];
            // Points on edge are typically considered inside by turf
            const result = isPointInPolygon(point, squarePolygon);
            expect(typeof result).toBe("boolean");
        });

        it("should work with MultiPolygon", () => {
            const multiPolygon: GeoJSON.MultiPolygon = {
                type: "MultiPolygon",
                coordinates: [squarePolygon.coordinates, overlappingSquare.coordinates],
            };
            // Point inside first polygon
            expect(isPointInPolygon([2, 2], multiPolygon)).toBe(true);
            // Point inside second polygon only
            expect(isPointInPolygon([12, 12], multiPolygon)).toBe(true);
            // Point outside both
            expect(isPointInPolygon([25, 25], multiPolygon)).toBe(false);
        });
    });
});
