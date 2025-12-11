export const TIMING_CONSTANTS = {
    // Debounce delays
    DEBOUNCE_DELAY: 800,

    // Calculation delays
    CALCULATION_DELAY_SHORT: 500,
    CALCULATION_DELAY_LONG: 1000,

    // UI feedback
    COPY_FEEDBACK_DURATION: 2000,

    // Drag interaction
    DRAG_END_DELAY: 100,
} as const;

// Travel time options for optimization (in minutes)
export const TRAVEL_TIME_OPTIONS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60] as const;
