import { apiSlice } from "../services/apiSlice";

export const eyeTrackingApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Start an eye tracking session
    startEyeTrackingSession: builder.mutation({
      query: () => ({
        url: "eye-track/sessions/start/",
        method: "POST",
      }),
    }),

    // Stop an eye tracking session
    stopEyeTrackingSession: builder.mutation({
      query: (sessionId: string) => ({
        url: `eye-track/sessions/stop/${sessionId}/`,
        method: "POST",
      }),
    }),

    // Retrieve all sessions
    getEyeTrackingSessions: builder.query<any, void>({
      query: () => "eye-track/sessions/",
    }),

    // Retrieve gaze data for a specific session
    getGazeData: builder.query<any, string>({
      query: (sessionId) => `eye-track/sessions/${sessionId}/gaze/`,
    }),
  }),
});

export const {
  useStartEyeTrackingSessionMutation,
  useStopEyeTrackingSessionMutation,
  useGetEyeTrackingSessionsQuery,
  useGetGazeDataQuery,
} = eyeTrackingApiSlice;
