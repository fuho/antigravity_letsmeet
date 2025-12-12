import { IsochroneProvider, IsochroneService, IsochroneProfile } from "./isochrone-types";
import { MapboxAdapter } from "./mapbox-isochrone";
import { OpenRouteServiceAdapter } from "./ors-isochrone";

export * from "./isochrone-types";

const mapboxService = new MapboxAdapter();
const orsService = new OpenRouteServiceAdapter();

export function getIsochroneService(provider: IsochroneProvider): IsochroneService {
    switch (provider) {
        case "ors":
            return orsService;
        case "mapbox":
        default:
            return mapboxService;
    }
}

// Deprecated: for backward compatibility until refactor is complete, or helper wrapper
export async function getIsochrone(
    coordinates: [number, number],
    minutes: number | number[],
    profile: IsochroneProfile = "driving",
    provider: IsochroneProvider = "mapbox"
): Promise<GeoJSON.Polygon | GeoJSON.MultiPolygon | null> {
    const service = getIsochroneService(provider);
    return service.getIsochrone(coordinates, minutes, profile);
}
