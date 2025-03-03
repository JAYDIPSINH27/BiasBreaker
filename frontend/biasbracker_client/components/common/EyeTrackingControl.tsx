"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import {
  useStartEyeTrackingSessionMutation,
  useStopEyeTrackingSessionMutation,
  useStartGazeTrackingMutation,
  useStopGazeTrackingMutation,
} from "@/redux/features/eyeTrackingApiSlice";

const EyeTrackingControl = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [trackingMode, setTrackingMode] = useState<string | null>(null);

  const [startSession] = useStartEyeTrackingSessionMutation();
  const [stopSession] = useStopEyeTrackingSessionMutation();
  const [startGaze] = useStartGazeTrackingMutation();
  const [stopGaze] = useStopGazeTrackingMutation();

  const startTracking = async (mode: "webcam" | "tobii") => {
    try {
      const { data } = await startSession({ mode }).unwrap();
      setSessionId(data.session_id);
      setTrackingMode(mode);
      await startGaze(data.session_id);
      toast.success(`✅ ${mode.toUpperCase()} tracking started`);
    } catch (error) {
      toast.error("Failed to start tracking");
    }
  };

  const stopTracking = async () => {
    if (!sessionId) return toast.error("No active session");

    try {
      await stopGaze(sessionId);
      await stopSession(sessionId);
      setSessionId(null);
      setTrackingMode(null);
      toast.success("🛑 Tracking stopped");
    } catch (error) {
      toast.error("Failed to stop tracking");
    }
  };

  return (
    <div className="flex flex-col items-center p-6 bg-gray-100 shadow-lg rounded-lg">
      <h2 className="text-xl font-bold mb-4">👀 Eye Tracking Control</h2>

      <div className="flex gap-4">
        <button
          onClick={() => startTracking("webcam")}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition"
          disabled={!!sessionId}
        >
          Start Webcam Tracking
        </button>

        <button
          onClick={() => startTracking("tobii")}
          className="px-4 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition"
          disabled={!!sessionId}
        >
          Start Tobii Tracking
        </button>
      </div>

      {sessionId && (
        <button
          onClick={stopTracking}
          className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition"
        >
          Stop Tracking
        </button>
      )}

      {trackingMode && <p className="mt-3 text-gray-700">🟢 Tracking Mode: {trackingMode.toUpperCase()}</p>}
    </div>
  );
};

export default EyeTrackingControl;
