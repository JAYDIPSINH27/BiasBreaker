"use client";
import React, { useEffect } from "react";
import { toast } from "react-hot-toast";

interface EyeTrackingSocketListenerProps {
  onGazeData?: (data: { gaze_x: number; gaze_y: number; source?: string }) => void;
}

const EyeTrackingSocketListener: React.FC<EyeTrackingSocketListenerProps> = ({ onGazeData }) => {
  useEffect(() => {
    let socket: WebSocket | null = null;

    // For production, ensure this is wss://your-domain
    const wsUrl = `${process.env.NEXT_PUBLIC_HOST_WS}/ws/eye-tracking/`;

    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("[EyeTrackingSocketListener] Connected to /ws/eye-tracking/");
    };

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "eye.data") {
        const { gaze_x, gaze_y, source } = msg.payload || {};
        if (onGazeData && typeof gaze_x === "number" && typeof gaze_y === "number") {
          onGazeData({ gaze_x, gaze_y, source });
        }
      } else if (msg.type === "eye.alert") {
        toast.error(msg.message || "Attention lost!");
      }
    };

    socket.onerror = (err) => {
      console.error("[EyeTrackingSocketListener] WebSocket error:", err);
    };

    socket.onclose = () => {
      console.log("[EyeTrackingSocketListener] Disconnected");
    };

    return () => {
      if (socket) socket.close();
    };
  }, [onGazeData]);

  return null;
};

export default EyeTrackingSocketListener;
