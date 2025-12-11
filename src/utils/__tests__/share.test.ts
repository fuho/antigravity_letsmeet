import { generateShareString, parseShareString, ShareData } from "../share";

// Mock the Location type from store
interface Location {
    id: string;
    name?: string;
    address: string;
    coordinates: [number, number];
    color: string;
}

describe("share utils", () => {
    const sampleLocations: Location[] = [
        {
            id: "1",
            name: "Home",
            address: "123 Main St",
            coordinates: [14.4378, 50.0755],
            color: "#ff0000",
        },
        {
            id: "2",
            name: "Work",
            address: "456 Office Ave",
            coordinates: [14.4500, 50.0800],
            color: "#00ff00",
        },
    ];

    const maxTravelTime = 30;
    const selectedPOITypes = ["coffee", "meal", "beer"];

    describe("generateShareString", () => {
        it("should generate a non-empty string", () => {
            const result = generateShareString(sampleLocations, maxTravelTime, selectedPOITypes);
            expect(result).toBeTruthy();
            expect(typeof result).toBe("string");
        });

        it("should generate valid base64", () => {
            const result = generateShareString(sampleLocations, maxTravelTime, selectedPOITypes);
            // Base64 strings should only contain these characters
            expect(result).toMatch(/^[A-Za-z0-9+/=]+$/);
        });

        it("should handle empty locations array", () => {
            const result = generateShareString([], maxTravelTime, selectedPOITypes);
            expect(result).toBeTruthy();
        });

        it("should handle locations without names", () => {
            const locationsWithoutNames: Location[] = [
                {
                    id: "1",
                    address: "123 Main St",
                    coordinates: [14.4378, 50.0755],
                    color: "#ff0000",
                },
            ];
            const result = generateShareString(locationsWithoutNames, maxTravelTime, []);
            expect(result).toBeTruthy();
        });

        it("should handle unicode characters in addresses", () => {
            const unicodeLocations: Location[] = [
                {
                    id: "1",
                    name: "Café Praha",
                    address: "Náměstí Republiky 1, 110 00 Praha",
                    coordinates: [14.4378, 50.0755],
                    color: "#ff0000",
                },
            ];
            const result = generateShareString(unicodeLocations, maxTravelTime, []);
            expect(result).toBeTruthy();
            // Should be able to parse it back
            const parsed = parseShareString(result);
            expect(parsed?.l[0].a).toBe("Náměstí Republiky 1, 110 00 Praha");
            expect(parsed?.l[0].n).toBe("Café Praha");
        });
    });

    describe("parseShareString", () => {
        it("should parse a valid share string", () => {
            const shareString = generateShareString(sampleLocations, maxTravelTime, selectedPOITypes);
            const result = parseShareString(shareString);

            expect(result).not.toBeNull();
            expect(result?.v).toBe(1);
            expect(result?.t).toBe(maxTravelTime);
            expect(result?.p).toEqual(selectedPOITypes);
            expect(result?.l).toHaveLength(2);
        });

        it("should return null for invalid base64", () => {
            const result = parseShareString("not-valid-base64!!!");
            expect(result).toBeNull();
        });

        it("should return null for invalid JSON", () => {
            const invalidJson = btoa("not valid json");
            const result = parseShareString(invalidJson);
            expect(result).toBeNull();
        });

        it("should return null for wrong version", () => {
            const wrongVersion = { v: 2, t: 30, p: [], l: [] };
            const shareString = btoa(JSON.stringify(wrongVersion));
            const result = parseShareString(shareString);
            expect(result).toBeNull();
        });

        it("should return null when l is not an array", () => {
            const invalidData = { v: 1, t: 30, p: [], l: "not-an-array" };
            const shareString = btoa(JSON.stringify(invalidData));
            const result = parseShareString(shareString);
            expect(result).toBeNull();
        });
    });

    describe("roundtrip", () => {
        it("should preserve all data through encode/decode", () => {
            const shareString = generateShareString(sampleLocations, maxTravelTime, selectedPOITypes);
            const parsed = parseShareString(shareString);

            expect(parsed).not.toBeNull();
            expect(parsed?.t).toBe(maxTravelTime);
            expect(parsed?.p).toEqual(selectedPOITypes);
            expect(parsed?.l).toHaveLength(sampleLocations.length);

            // Check first location
            expect(parsed?.l[0].c).toEqual(sampleLocations[0].coordinates);
            expect(parsed?.l[0].a).toBe(sampleLocations[0].address);
            expect(parsed?.l[0].n).toBe(sampleLocations[0].name);
            expect(parsed?.l[0].col).toBe(sampleLocations[0].color);
        });

        it("should handle special characters in coordinates", () => {
            const extremeLocations: Location[] = [
                {
                    id: "1",
                    address: "North Pole",
                    coordinates: [0, 90],
                    color: "#ffffff",
                },
                {
                    id: "2",
                    address: "Negative coords",
                    coordinates: [-180, -90],
                    color: "#000000",
                },
            ];

            const shareString = generateShareString(extremeLocations, 60, []);
            const parsed = parseShareString(shareString);

            expect(parsed?.l[0].c).toEqual([0, 90]);
            expect(parsed?.l[1].c).toEqual([-180, -90]);
        });
    });
});
