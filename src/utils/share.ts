import { Location } from "@/store/useStore";

export interface ShareData {
    v: number;
    t: number;
    p: string[];
    l: {
        c: [number, number];
        a: string;
        n?: string;
        col: string;
    }[];
}

export const generateShareString = (locations: Location[], maxTravelTime: number, selectedPOITypes: string[]): string => {
    // Compact schema
    const data: ShareData = {
        v: 1, // version
        t: maxTravelTime,
        p: selectedPOITypes, // POI types
        l: locations.map(loc => ({
            c: loc.coordinates,
            a: loc.address,
            n: loc.name,
            col: loc.color
        }))
    };

    try {
        // Robust Unicode Handling for Base64
        // 1. Stringify JSON
        // 2. Percent-encode (UTF-8 safe)
        // 3. Unescape to get Latin1 characters representing the bytes
        // 4. btoa
        const json = JSON.stringify(data);
        const utf8Bytes = encodeURIComponent(json).replace(/%([0-9A-F]{2})/g,
            (match, p1) => String.fromCharCode(parseInt(p1, 16))
        );
        return btoa(utf8Bytes);
    } catch (e) {
        console.error("Failed to generate share string", e);
        return "";
    }
};

export const parseShareString = (shareString: string): ShareData | null => {
    try {
        // Reverse of getShareString
        const utf8Bytes = atob(shareString);
        const json = decodeURIComponent(
            utf8Bytes.split('').map(c =>
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            ).join('')
        );

        const data = JSON.parse(json);

        if (data.v !== 1 || !Array.isArray(data.l)) {
            return null;
        }

        return data;
    } catch (e) {
        console.error("Failed to parse share string", e);
        return null;
    }
};
