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
      socket = new WebSocket(`${process.env.NEXT_PUBLIC_HOST_WS}/ws/eye-tracking/`);

      socket.onopen = () => {
        console.log("[WebSocket] Connected to /ws/eye-tracking/");
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("[WebSocket] Received:", data); // Log every message

          if (data.type === "eye.alert") {
            // toast.error(data.message || "User looking away!");
            toast.custom((t) => (
              <div
                style={{
                  position: "fixed",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  background: "#ff4d4f",
                  color: "white",
                  padding: "16px 24px",
                  borderRadius: "8px",
                  textAlign: "center",
                  fontSize: "16px",
                  fontWeight: "bold",
                  boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
                  zIndex: 9999, // Ensure it's on top of everything
                  width: "max-content", // Adjust width based on content
                  minWidth: "250px", // Prevents the box from being too small
                  maxWidth: "90vw", // Prevents it from becoming too wide
                  whiteSpace: "nowrap", // Prevents text wrapping
                }}
                onClick={() => toast.dismiss(t.id)} // Click to dismiss
              >
                {data.message || "👀 You are looking away!"}
              </div>
            ), { duration: 4000 });
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
