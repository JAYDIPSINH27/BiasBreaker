"use client";

import useWebSocket from "@/components/hooks/useWebSocket";

const EyeTrackingNotifier = () => {
  useWebSocket();

  return (
    <div className="fixed top-4 right-4 p-4 bg-gray-900 text-white rounded-md shadow-lg">
      <h3 className="text-lg font-semibold">Eye Tracking Active</h3>
    </div>
  );
};

export default EyeTrackingNotifier;
