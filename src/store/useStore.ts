import { create } from "zustand";
import { createLocationSlice, LocationSlice } from "./slices/createLocationSlice";
import { createMeetingSlice, MeetingSlice } from "./slices/createMeetingSlice";
import { createUISlice, UISlice } from "./slices/createUISlice";

// Combine slice interfaces
export type AppState = LocationSlice & MeetingSlice & UISlice;

export const useStore = create<AppState>()((...a) => ({
    ...createLocationSlice(...a),
    ...createMeetingSlice(...a),
    ...createUISlice(...a),
}));

// Export Location type for convenience since it was exported from here before
export type { Location } from "./slices/createLocationSlice";
