import React, { useEffect, useRef } from "react";
import useWindowSize from "./useWindowSize";

interface Gaze {
  gaze_x: number;
  gaze_y: number;
}

const LiveGazeOverlay: React.FC = () => {
  const { width, height } = useWindowSize();

  // Ref for the red dot DOM element.
  const dotRef = useRef<HTMLDivElement>(null);
  // Ref for the latest gaze data. Updating this does not trigger re-renders.
  const latestGaze = useRef<Gaze | null>(null);

  useEffect(() => {
    const socket = new WebSocket(`${process.env.NEXT_PUBLIC_HOST_WS}/ws/eye-tracking/`);

    socket.onopen = () => {
      console.log("Connected to eye tracking WebSocket (optimized)!");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "eye.data") {
          const { gaze_x, gaze_y } = data.payload || {};
          if (typeof gaze_x === "number" && typeof gaze_y === "number") {
            // Update the ref with latest gaze coordinates.
            latestGaze.current = { gaze_x, gaze_y };
          }
        }
      } catch (err) {
        console.warn("Invalid message format:", event.data);
      }
    };

    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    socket.onclose = () => {
      console.log("WebSocket closed.");
    };

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    let frameId: number;

    const updateDotPosition = () => {
      if (latestGaze.current && dotRef.current) {
        let { gaze_x, gaze_y } = latestGaze.current;
        // If values are normalized (0–1), convert to screen coordinates.
        if (gaze_x <= 1 && gaze_y <= 1) {
          gaze_x = gaze_x * width;
          gaze_y = gaze_y * height;
        } else {
          // If data is based on 1920x1080, adjust proportionally.
          const scaleX = width / 1920;
          const scaleY = height / 1080;
          gaze_x = gaze_x * scaleX;
          gaze_y = gaze_y * scaleY;
        }
        // Directly update the dot's CSS transform for a smooth transition.
        dotRef.current.style.transform = `translate(${gaze_x}px, ${gaze_y}px)`;
      }
      frameId = requestAnimationFrame(updateDotPosition);
    };

    frameId = requestAnimationFrame(updateDotPosition);
    return () => cancelAnimationFrame(frameId);
  }, [width, height]);

  return (
    <div
      ref={dotRef}
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        pointerEvents: "none",
        transform: "translate(-50%, -50%)",
        zIndex: 9999,
        width: 20,
        height: 20,
        borderRadius: "50%",
        background: "red",
        opacity: 0.7,
      }}
    ></div>
  );
};

export default LiveGazeOverlay;
