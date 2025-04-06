import React from "react";
import { FaEye, FaCheckCircle, FaVideo, FaCopy } from "react-icons/fa";

interface EyeTrackingCardProps {
  eyeTrackingSessionId: string | null;
  handleStartEyeTracking: () => void;
  handleStopEyeTracking: () => void;
  isStartingSession: boolean;
  isStoppingSession: boolean;
  trackingMethod: "tobii" | "webcam";
  setTrackingMethod: React.Dispatch<React.SetStateAction<"tobii" | "webcam">>;
}

const EyeTrackingCard: React.FC<EyeTrackingCardProps> = ({
  eyeTrackingSessionId,
  handleStartEyeTracking,
  handleStopEyeTracking,
  isStartingSession,
  isStoppingSession,
  trackingMethod,
  setTrackingMethod,
}) => {
  const handleCopy = () => {
    if (eyeTrackingSessionId) {
      navigator.clipboard.writeText(eyeTrackingSessionId);
    }
  };

  return (
    <div className="border p-4 rounded-lg shadow-md bg-white hover:shadow-lg transition flex flex-col space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
        <FaEye /> Eye Tracking
      </h3>

      {/* Session Status + Copy */}
      <div className="text-xs text-gray-700 flex flex-col gap-1">
        <span className="flex items-center gap-2">
          Session:{" "}
          {eyeTrackingSessionId ? (
            <span className="text-green-600 flex items-center gap-1">
              Active <FaCheckCircle />
            </span>
          ) : (
            "Not started"
          )}
        </span>
        {eyeTrackingSessionId && (
          <div className="flex items-center justify-between text-[11px] bg-gray-100 px-2 py-1 rounded-md">
            <span className="truncate">{eyeTrackingSessionId}</span>
            <button
              onClick={handleCopy}
              className="text-blue-500 hover:underline ml-2"
            >
              <FaCopy className="inline mr-1" /> Copy
            </button>
          </div>
        )}
      </div>

      {/* Tracking Method */}
      <div className="text-xs text-gray-600">
        <label className="block font-semibold mb-1">Tracking Method:</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="trackingMethod"
              value="tobii"
              checked={trackingMethod === "tobii"}
              onChange={() => setTrackingMethod("tobii")}
            />
            Tobii
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="trackingMethod"
              value="webcam"
              checked={trackingMethod === "webcam"}
              onChange={() => setTrackingMethod("webcam")}
            />
            Webcam
          </label>
        </div>
      </div>

      {/* Start/Stop Button */}
      <button
        onClick={eyeTrackingSessionId ? handleStopEyeTracking : handleStartEyeTracking}
        disabled={isStartingSession || isStoppingSession}
        className={`px-3 py-2 text-xs font-medium rounded-lg text-white transition ${
          eyeTrackingSessionId ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {eyeTrackingSessionId
          ? isStoppingSession
            ? "Stopping Session..."
            : "Stop Session"
          : isStartingSession
          ? "Starting Session..."
          : "Start Session"}
      </button>

      {/* Description */}
      <div className="text-xs mt-2 text-gray-600 bg-gray-100 p-2 rounded-md flex items-start gap-2">
        <FaVideo className="text-blue-500 mt-0.5" />
        Eye tracking allows live gaze visualization and attention analysis. Select a method and start a session to begin collecting data.
      </div>
    </div>
  );
};

export default EyeTrackingCard;
