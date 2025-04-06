"use client";

import { useEffect } from "react";
import { toast } from "react-hot-toast";

export function useEyeTrackingSocket(
  onGazeData?: (data: { gaze_x: number; gaze_y: number }) => void
) {
  useEffect(() => {
    const socket = new WebSocket(`${process.env.NEXT_PUBLIC_HOST_WS}/ws/eye-tracking/`);

    socket.onopen = () => {
      console.log("✅ [Shared EyeTrackingSocket] Connected");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "eye.alert") {
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
                fontSize: "16px",
                fontWeight: "bold",
                zIndex: 9999,
              }}
              onClick={() => toast.dismiss(t.id)}
            >
              {data.message || "👀 You are looking away!"}
            </div>
          ));
        } else if (data.type === "eye.data" && onGazeData) {
          const { gaze_x, gaze_y } = data.payload || {};
          if (typeof gaze_x === "number" && typeof gaze_y === "number") {
            onGazeData({ gaze_x, gaze_y });
          }
        }
      } catch (err) {
        console.warn("[EyeTrackingSocket] Invalid message format:", event.data);
      }
    };

    socket.onerror = (err) => {
      console.error("❌ [EyeTrackingSocket] Error:", err);
    };

    socket.onclose = () => {
      console.log("🔌 [EyeTrackingSocket] Closed");
    };

    return () => {
      socket.close();
    };
  }, [onGazeData]);
}
