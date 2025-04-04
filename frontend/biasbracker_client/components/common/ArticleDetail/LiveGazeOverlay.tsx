import React from "react";
import useWindowSize from "./useWindowSize";

interface Gaze {
  x: number;
  y: number;
}

interface LiveGazeOverlayProps {
  gaze: Gaze | null;
}

const LiveGazeOverlay: React.FC<LiveGazeOverlayProps> = ({ gaze }) => {
  const { width, height } = useWindowSize();
  if (!gaze) return null;

  let left: number, top: number;
  if (gaze.x <= 1 && gaze.y <= 1) {
    left = gaze.x * width;
    top = gaze.y * height;
  } else {
    const scaleX = width / 1920;
    const scaleY = height / 1080;
    left = gaze.x * scaleX;
    top = gaze.y * scaleY;
  }

  return (
    <div
      style={{
        position: "fixed",
        left: left,
        top: top,
        pointerEvents: "none",
        transform: "translate(-50%, -50%)",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "red",
          opacity: 0.7,
        }}
      ></div>
    </div>
  );
};

export default LiveGazeOverlay;
