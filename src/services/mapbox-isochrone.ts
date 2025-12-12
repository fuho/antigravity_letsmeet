import { IsochroneProfile, IsochroneService } from "./isochrone-types";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export class MapboxAdapter implements IsochroneService {
    async getIsochrone(
        coordinates: [number, number],
        minutes: number | number[],
        profile: IsochroneProfile = "driving"
    ): Promise<GeoJSON.Polygon | GeoJSON.MultiPolygon | null> {
        if (!MAPBOX_TOKEN) return null;

        const minutesStr = Array.isArray(minutes) ? minutes.join(",") : minutes.toString();

        const url = `https://api.mapbox.com/isochrone/v1/mapbox/${profile}/${coordinates.join(
            ","
        )}?contours_minutes=${minutesStr}&polygons=true&access_token=${MAPBOX_TOKEN}`;

        try {
            const res = await fetch(url);
            const data = await res.json();
            if (data.features && data.features.length > 0) {
                return data.features[0].geometry; // Polygon
            }
            return null;
        } catch (error) {
            console.error("Isochrone fetch error:", error);
            return null;
        }
    }
}
