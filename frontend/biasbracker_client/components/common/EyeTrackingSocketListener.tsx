"use client";

import React, { useEffect } from "react";
import { toast } from "react-hot-toast";

const EyeTrackingSocketListener = () => {
  useEffect(() => {
    let socket: WebSocket | null = null;

    // Only run on client side
    if (typeof window !== "undefined") {
      // Replace "localhost:8000" with your Django Channels host if different.
      socket = new WebSocket("ws://127.0.0.1:8000/ws/eye-tracking/");

      socket.onopen = () => {
        console.log("[WebSocket] Connected to /ws/eye-tracking/");
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // If your consumer sends: { type: "eye.alert", message: "User looking away!" }
          if (data.type === "eye.alert") {
            toast.error(data.message || "User looking away!");
          }
          // If your consumer sends: { type: "eye.data", payload: { gaze_x, gaze_y } }
          else if (data.type === "eye.data") {
            const { gaze_x, gaze_y } = data.payload || {};
            // Do something with the real-time gaze coords
            console.log("Real-time Gaze:", { x: gaze_x, y: gaze_y });
          }
        } catch (err) {
          console.warn("[WebSocket] Unable to parse message:", event.data);
        }
      };

      socket.onclose = () => {
        console.log("[WebSocket] Disconnected from /ws/eye-tracking/");
      };
    }

    // Cleanup
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, []);

  // This component renders nothing; it just listens in the background.
  return null;
};

export default EyeTrackingSocketListener;
