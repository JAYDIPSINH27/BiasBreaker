"use client";

import React, { useEffect } from "react";
import { toast } from "react-hot-toast";

interface EyeTrackingSocketListenerProps {
  onGazeData?: (data: { gaze_x: number; gaze_y: number }) => void;
}

const EyeTrackingSocketListener: React.FC<EyeTrackingSocketListenerProps> = ({ onGazeData }) => {
  useEffect(() => {
    let socket: WebSocket | null = null;
    if (typeof window !== "undefined") {
      // Ensure the URL is correct and matches your Channels routing configuration.
      socket = new WebSocket("wss://biasbreaker-a2l8.onrender.com/ws/eye-tracking/");

      socket.onopen = () => {
        console.log("[WebSocket] Connected to /ws/eye-tracking/");
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("[WebSocket] Received:", data); // Log every message

          if (data.type === "eye.alert") {
            toast.error(data.message || "User looking away!");
          } else if (data.type === "eye.data") {
            const { gaze_x, gaze_y } = data.payload || {};
            console.log("Live gaze data:", { gaze_x, gaze_y });
            if (onGazeData && typeof gaze_x === "number" && typeof gaze_y === "number") {
              onGazeData({ gaze_x, gaze_y });
            }
          }
        } catch (err) {
          console.warn("[WebSocket] Unable to parse message:", event.data);
        }
      };

      socket.onerror = (err) => {
        console.error("[WebSocket] Error:", err);
      };

      socket.onclose = () => {
        console.log("[WebSocket] Disconnected from /ws/eye-tracking/");
      };
    }

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [onGazeData]);

  return null;
};

export default EyeTrackingSocketListener;
