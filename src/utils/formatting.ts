/**
 * Remove country (last part after last comma) from address
 * @param address - Full address string
 * @returns Address without country
 */
export function formatAddress(address: string): string {
    const parts = address.split(',');
    return parts.length > 1 ? parts.slice(0, -1).join(',') : address;
}

/**
 * Generate a random hex color
 * @returns Random color in hex format (e.g., "#a3f2b1")
 */
export function generateRandomColor(): string {
    return "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

/**
 * Truncate text to a maximum length with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
}
