"use client";

import React from "react";
import { useEyeTrackingSocket } from "@/components/hooks/useEyeTracking";

interface EyeTrackingSocketListenerProps {
  onGazeData?: (data: { gaze_x: number; gaze_y: number }) => void;
}

const EyeTrackingSocketListener: React.FC<EyeTrackingSocketListenerProps> = ({ onGazeData }) => {
  useEyeTrackingSocket(onGazeData);
  return null; // no UI
};

export default EyeTrackingSocketListener;
