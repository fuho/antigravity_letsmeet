import { IsochroneProfile, IsochroneService } from "./isochrone-types";

const ORS_API_KEY = process.env.NEXT_PUBLIC_ORS_TOKEN;

export class OpenRouteServiceAdapter implements IsochroneService {
    async getIsochrone(
        coordinates: [number, number],
        minutes: number | number[],
        profile: IsochroneProfile = "driving"
    ): Promise<GeoJSON.Polygon | GeoJSON.MultiPolygon | null> {
        if (!ORS_API_KEY) {
            console.error("OpenRouteService API key missing. Check NEXT_PUBLIC_ORS_TOKEN");
            return null;
        }

        console.log("Fetching ORS Isochrone...");


        const orsProfile = this.mapProfile(profile);

        // ORS expects range in seconds
        const range = Array.isArray(minutes)
            ? minutes.map(m => m * 60)
            : [minutes * 60];

        // Ensure range is not empty and create comma separated string if needed, 
        // but ORS POST endpoint often takes an array. 
        // Let's use the GET endpoint for simplicity if possible, or POST.
        // ORS V2 API usually recommends POST for isochrones to handle parameters better.
        // https://api.openrouteservice.org/v2/isochrones/{profile}

        const url = `https://api.openrouteservice.org/v2/isochrones/${orsProfile}`;

        try {
            const body = {
                locations: [coordinates],
                range: range,
                range_type: "time",
                // attributes: ["total_pop"] // optional
            };

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': ORS_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                console.error(`ORS Error: ${res.statusText}`);
                const err = await res.text();
                console.error(err);
                return null;
            }

            const data = await res.json();

            // ORS returns a FeatureCollection. We want the geometry of the first feature.
            if (data.features && data.features.length > 0) {
                return data.features[0].geometry;
            }

            return null;
        } catch (error) {
            console.error("ORS Isochrone fetch error:", error);
            return null;
        }
    }

    private mapProfile(profile: IsochroneProfile): string {
        switch (profile) {
            case "driving": return "driving-car";
            case "walking": return "foot-walking";
            case "cycling": return "cycling-regular";
            default: return "driving-car";
        }
    }
}
