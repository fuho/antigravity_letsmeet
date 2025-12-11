export interface POIType {
    id: string;
    label: string;
    icon: string;
    query: string; // Mapbox Search Box API canonical category ID
}

export const POI_TYPES: POIType[] = [
    { id: 'coffee', label: 'Coffee', icon: '☕', query: 'coffee' },
    { id: 'restaurant', label: 'Restaurants', icon: '🍽️', query: 'restaurant' },
    { id: 'bar', label: 'Bars', icon: '🍺', query: 'bar' },
    { id: 'food_and_drink', label: 'Food & Drink', icon: '🍴', query: 'food_and_drink' },
    { id: 'nightlife', label: 'Nightlife', icon: '🌙', query: 'nightlife' },
    { id: 'shopping', label: 'Shopping', icon: '🛍️', query: 'shopping' },
];

export const DEFAULT_POI_TYPES = ['coffee', 'restaurant', 'bar'];
