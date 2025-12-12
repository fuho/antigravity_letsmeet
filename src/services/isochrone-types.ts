
export type IsochroneProfile = "driving" | "walking" | "cycling";

export type IsochroneProvider = "mapbox" | "ors";

export interface IsochroneService {
    getIsochrone(
        coordinates: [number, number],
        minutes: number | number[],
        profile: IsochroneProfile
    ): Promise<GeoJSON.Polygon | GeoJSON.MultiPolygon | null>;
}
