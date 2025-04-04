"use client";
import { useEffect, useRef } from "react";
import { Camera } from "@mediapipe/camera_utils";

const MediaPipeEyeTracking = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Open WebSocket connection
    socketRef.current = new WebSocket(`${process.env.NEXT_PUBLIC_HOST}/ws/gaze-collector/`);

    // Dynamically import FaceMesh to ensure it's available as a constructor
    import("@mediapipe/face_mesh").then(({ FaceMesh }) => {
      const faceMesh = new FaceMesh({ refineLandmarks: true } as any);
      faceMesh.onResults(({ multiFaceLandmarks }) => {
        if (multiFaceLandmarks?.[0]) {
          const { x, y } = multiFaceLandmarks[0][1];
          socketRef.current?.send(JSON.stringify({
            type: "eye.data",
            payload: { gaze_x: x * 1920, gaze_y: y * 1080 }
          }));
        }
      });

      if (videoRef.current) {
        new Camera(videoRef.current, { 
          onFrame: () => faceMesh.send({ image: videoRef.current! }) 
        }).start();
      }
    });

    return () => socketRef.current?.close();
  }, []);

  return <video ref={videoRef} style={{ display: "none" }} />;
};

export default MediaPipeEyeTracking;
