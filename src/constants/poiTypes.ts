export interface POIType {
    id: string;
    label: string;
    icon: string;
    color: string; // Hex color for map markers
    query: string; // Mapbox Search Box API canonical category ID
}

export const POI_TYPES: POIType[] = [
    { id: 'coffee', label: 'Coffee', icon: '☕', color: '#8B4513', query: 'coffee' },
    { id: 'meal', label: 'Meal', icon: '🍽️', color: '#FF6347', query: 'restaurant' },
    { id: 'beer', label: 'Beer', icon: '🍺', color: '#FFD700', query: 'bar' },
    { id: 'drink', label: 'Drink', icon: '🍸', color: '#9333ea', query: 'food_and_drink' },
    { id: 'dance', label: 'Dance', icon: '💃', color: '#FF1493', query: 'nightlife' },
    { id: 'shop', label: 'Shop', icon: '🛍️', color: '#4169E1', query: 'shopping' },
];

export const DEFAULT_POI_TYPES = ['coffee', 'meal', 'beer'];
