import { act } from '@testing-library/react';
import { useStore, Location } from '../useStore';

// Mock dependencies
jest.mock('@/services/mapbox', () => ({
    searchNearby: jest.fn(),
    reverseGeocode: jest.fn(),
}));

jest.mock('@/services/isochrone', () => ({
    getIsochrone: jest.fn(),
}));

jest.mock('@/utils/geometry', () => ({
    calculateIntersection: jest.fn(),
    getBoundingBox: jest.fn(),
    getCentroid: jest.fn(),
}));

jest.mock('@/utils/poi', () => ({
    searchPOIsInArea: jest.fn(),
}));

// Mock Crypto UUID
Object.defineProperty(global, 'crypto', {
    value: {
        randomUUID: () => 'test-uuid-' + Math.random().toString(36).substring(7),
    },
});

describe('useStore Baseline Tests', () => {
    const initialState = useStore.getState();

    beforeEach(() => {
        useStore.setState(initialState, true);
        jest.clearAllMocks();
    });

    describe('Locations', () => {
        it('should add a location', () => {
            const newLoc: Location = {
                id: '1',
                address: '123 Test St',
                coordinates: [10, 20],
                color: '#fff',
            };

            act(() => {
                useStore.getState().addLocation(newLoc);
            });

            expect(useStore.getState().locations).toHaveLength(1);
            expect(useStore.getState().locations[0]).toEqual(newLoc);
        });

        it('should remove a location', () => {
            const newLoc: Location = {
                id: '1',
                address: '123 Test St',
                coordinates: [10, 20],
                color: '#fff',
            };

            act(() => {
                useStore.getState().addLocation(newLoc);
            });

            expect(useStore.getState().locations).toHaveLength(1);

            act(() => {
                useStore.getState().removeLocation('1');
            });

            expect(useStore.getState().locations).toHaveLength(0);
        });
    });

    describe('Project & Sharing', () => {
        it('should generate a share string', () => {
            const loc: Location = {
                id: '1',
                address: 'Test Addr',
                name: 'Test Name',
                coordinates: [10, 20],
                color: '#ffffff'
            };

            act(() => {
                useStore.getState().addLocation(loc);
                useStore.getState().setMaxTravelTime(45);
            });

            const shareString = useStore.getState().getShareString();
            expect(shareString).toBeTruthy();
            expect(typeof shareString).toBe('string');
        });

        it('should import from share string', () => {
            // Construct a known valid payload
            const data = {
                v: 1,
                t: 45,
                p: [],
                l: [{
                    c: [10, 20],
                    a: 'Imported Addr',
                    n: 'Imported Name',
                    col: '#000000'
                }]
            };

            const json = JSON.stringify(data);
            // Minimal encoding simulation (not doing full UTF-8 dance here for simplicity unless needed)
            // actually existing code does btoa(utf8Bytes).
            // Let's rely on the fact that for simple ASCII it matches btoa(json)
            const shareString = btoa(json);

            let success = false;
            act(() => {
                success = useStore.getState().importFromShareString(shareString);
            });

            expect(success).toBe(true);
            expect(useStore.getState().maxTravelTime).toBe(45);
            expect(useStore.getState().locations).toHaveLength(1);
            expect(useStore.getState().locations[0].address).toBe('Imported Addr');
        });
    });
});
