import { apiSlice } from "../services/apiSlice";

export const eyeTrackingApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Check if a Tobii eye tracker is available
    checkTobiAvailability: builder.query({
      query: () => "eye-track/check-tobii/",
    }),

    // Start an eye tracking session
    startEyeTrackingSession: builder.mutation({
      query: () => ({
        url: "eye-track/start/",
        method: "POST",
      }),
    }),

    // Stop an eye tracking session
    stopEyeTrackingSession: builder.mutation({
      query: (sessionId) => ({
        url: `eye-track/stop/${sessionId}/`,
        method: "POST",
      }),
    }),

    // Start gaze tracking (uses Tobii if available; otherwise webcam fallback)
    startGazeTracking: builder.mutation({
      query: (sessionId) => ({
        url: `eye-track/gaze/start/${sessionId}/`,
        method: "POST",
      }),
    }),

    // Stop gaze tracking
    stopGazeTracking: builder.mutation({
      query: (sessionId) => ({
        url: `eye-track/gaze/stop/${sessionId}/`,
        method: "POST",
      }),
    }),

    // Retrieve all eye tracking sessions
    getEyeTrackingSessions: builder.query({
      query: () => "eye-track/sessions/",
    }),

    // Retrieve gaze data for a specific session
    getGazeData: builder.query({
      query: (sessionId) => `eye-track/gaze/${sessionId}/`,
    }),
  }),
});

// Export the auto-generated React hooks
export const {
  useCheckTobiAvailabilityQuery,
  useStartEyeTrackingSessionMutation,
  useStopEyeTrackingSessionMutation,
  useStartGazeTrackingMutation,
  useStopGazeTrackingMutation,
  useGetEyeTrackingSessionsQuery,
  useGetGazeDataQuery,
} = eyeTrackingApiSlice;
