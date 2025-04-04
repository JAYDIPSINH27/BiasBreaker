import React from "react";
import { FaEye } from "react-icons/fa";

interface EyeTrackingCardProps {
  tobiData: { tobi_available: boolean } | undefined;
  eyeTrackingSessionId: string | null;
  isGazeTracking: boolean;
  handleStartEyeTracking: () => void;
  handleStopEyeTracking: () => void;
  handleStartGazeTracking: () => void;
  handleStopGazeTracking: () => void;
  isStartingSession: boolean;
  isStoppingSession: boolean;
  isStartingGaze: boolean;
  isStoppingGaze: boolean;
}

const EyeTrackingCard: React.FC<EyeTrackingCardProps> = ({
  tobiData,
  eyeTrackingSessionId,
  isGazeTracking,
  handleStartEyeTracking,
  handleStopEyeTracking,
  handleStartGazeTracking,
  handleStopGazeTracking,
  isStartingSession,
  isStoppingSession,
  isStartingGaze,
  isStoppingGaze,
}) => {
  return (
    <div className="border p-3 rounded-lg shadow-md bg-white flex flex-col space-y-2">
      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
        <FaEye /> Eye Tracking
      </h3>

      {/* Start / Stop Session */}
      {!eyeTrackingSessionId ? (
        <button
          onClick={handleStartEyeTracking}
          disabled={isStartingSession}
          className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {isStartingSession ? "Starting..." : "Start Session"}
        </button>
      ) : (
        <button
          onClick={handleStopEyeTracking}
          disabled={isStoppingSession}
          className="px-3 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          {isStoppingSession ? "Stopping..." : "Stop Session"}
        </button>
      )}

      {/* Start / Stop Gaze Tracking */}
      {eyeTrackingSessionId && (
        <>
          {!isGazeTracking ? (
            <button
              onClick={handleStartGazeTracking}
              disabled={isStartingGaze}
              className="px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              {isStartingGaze ? "Starting Gaze..." : "Start Gaze Tracking"}
            </button>
          ) : (
            <button
              onClick={handleStopGazeTracking}
              disabled={isStoppingGaze}
              className="px-3 py-1 text-xs bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              {isStoppingGaze ? "Stopping..." : "Stop Gaze Tracking"}
            </button>
          )}
        </>
      )}

      {/* Tobi info */}
      {tobiData && (
        <p className="text-xs text-gray-500 mt-2">
          {tobiData.tobi_available
            ? "Tobii Eye Tracker detected!"
            : "No Tobii found → using webcam"}
        </p>
      )}
    </div>
  );
};

export default EyeTrackingCard;
