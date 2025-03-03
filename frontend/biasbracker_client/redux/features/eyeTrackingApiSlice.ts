import { apiSlice } from "../services/apiSlice";

export const eyeTrackingApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    startEyeTrackingSession: builder.mutation({
      query: () => ({
        url: "eye-track/start/",
        method: "POST",
      }),
    }),
    stopEyeTrackingSession: builder.mutation({
      query: (sessionId) => ({
        url: `eye-track/stop/${sessionId}/`,
        method: "POST",
      }),
    }),
    startGazeTracking: builder.mutation({
      query: (sessionId) => ({
        url: `eye-track/gaze/start/${sessionId}/`,
        method: "POST",
      }),
    }),
    stopGazeTracking: builder.mutation({
      query: (sessionId) => ({
        url: `eye-track/gaze/stop/${sessionId}/`,
        method: "POST",
      }),
    }),
    getEyeTrackingSessions: builder.query({
      query: () => "eye-track/sessions/",
    }),
    getGazeData: builder.query({
      query: (sessionId) => `eye-track/gaze/${sessionId}/`,
    }),
  }),
});

export const {
  useStartEyeTrackingSessionMutation,
  useStopEyeTrackingSessionMutation,
  useStartGazeTrackingMutation,
  useStopGazeTrackingMutation,
  useGetEyeTrackingSessionsQuery,
  useGetGazeDataQuery,
} = eyeTrackingApiSlice;
