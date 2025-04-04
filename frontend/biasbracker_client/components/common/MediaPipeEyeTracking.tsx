// MediaPipeEyeTracking.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { Camera } from "@mediapipe/camera_utils";

interface MediaPipeEyeTrackingProps {
  active: boolean;
}

const MediaPipeEyeTracking: React.FC<MediaPipeEyeTrackingProps> = ({ active }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraRef = useRef<Camera | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const faceMeshRef = useRef<any>(null);
  const [cameraStarted, setCameraStarted] = useState(false);

  // We use a ref to always hold the current value of "active"
  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // Setup: Request webcam stream, open WebSocket, and load FaceMesh on mount.
  useEffect(() => {
    // Request the webcam stream
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch((err) => console.error("Error playing video:", err));
            console.log("[MediaPipe] Webcam stream acquired.");
          }
        })
        .catch((error) => {
          console.error("[MediaPipe] Error accessing webcam:", error);
        });
    } else {
      console.error("[MediaPipe] Media Devices API not supported.");
    }

    // Open a WebSocket connection to send gaze data.
    const wsUrl = `${process.env.NEXT_PUBLIC_HOST_WS}/ws/gaze-collector/`;
    socketRef.current = new WebSocket(wsUrl);
    socketRef.current.onopen = () => console.log("[MediaPipe] WebSocket connected to gaze-collector.");
    socketRef.current.onerror = (err) => console.error("[MediaPipe] WebSocket error:", err);
    socketRef.current.onclose = () => console.log("[MediaPipe] WebSocket connection closed.");

    // Dynamically load the FaceMesh module.
    import("@mediapipe/face_mesh").then(({ FaceMesh }) => {
      const faceMesh = new FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });
      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      faceMesh.onResults((results) => {
        if (!activeRef.current) return;
        if (results.multiFaceLandmarks && results.multiFaceLandmarks[0]) {
          // Use a specific landmark as an example for gaze estimation.
          const landmark = results.multiFaceLandmarks[0][1];
          if (landmark && landmark.x !== undefined && landmark.y !== undefined) {
            const gaze_x = landmark.x * 1920;
            const gaze_y = landmark.y * 1080;
            console.log("[MediaPipe] Sending gaze data:", { gaze_x, gaze_y, source: "webcam" });
            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
              socketRef.current.send(JSON.stringify({
                type: "eye.data",
                payload: { gaze_x, gaze_y, source: "webcam" },
              }));
            } else {
              console.warn("[MediaPipe] WebSocket is not open.");
            }
          }
        }
      });
      faceMeshRef.current = faceMesh;

      // If active when mounting, start the camera.
      if (active && videoRef.current) {
        const camera = new Camera(videoRef.current, {
          onFrame: async () => {
            try {
              await faceMesh.send({ image: videoRef.current! });
            } catch (error) {
              console.error("[MediaPipe] Error processing frame:", error);
            }
          },
          width: 640,
          height: 480,
        });
        camera.start()
          .then(() => {
            console.log("[MediaPipe] Camera started.");
            setCameraStarted(true);
          })
          .catch((error) => console.error("[MediaPipe] Camera failed to start:", error));
        cameraRef.current = camera;
      }
    }).catch((err) => console.error("[MediaPipe] Failed to load FaceMesh module:", err));

    // Cleanup on unmount: close WebSocket and stop camera.
    return () => {
      console.log("[MediaPipe] Cleaning up.");
      socketRef.current?.close();
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      // Stop all video tracks.
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  // Watch for changes in the "active" prop to start or stop the camera accordingly.
  useEffect(() => {
    if (!active) {
      console.log("[MediaPipe] Active is false. Stopping camera.");
      if (cameraRef.current) {
        cameraRef.current.stop();
        setCameraStarted(false);
      }
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
        console.log("[MediaPipe] Video stream tracks stopped.");
      }
    } else {
      // If active is true and the camera is not already started, restart the camera.
      if (!cameraStarted && videoRef.current && faceMeshRef.current) {
        console.log("[MediaPipe] Active is true and camera is not running. Restarting camera.");
        const camera = new Camera(videoRef.current, {
          onFrame: async () => {
            try {
              await faceMeshRef.current.send({ image: videoRef.current! });
            } catch (error) {
              console.error("[MediaPipe] Error processing frame on restart:", error);
            }
          },
          width: 640,
          height: 480,
        });
        camera.start()
          .then(() => {
            console.log("[MediaPipe] Camera restarted.");
            setCameraStarted(true);
          })
          .catch((error) => console.error("[MediaPipe] Camera failed to restart:", error));
        cameraRef.current = camera;
      }
    }
  }, [active, cameraStarted]);

  // The video element is hidden from view.
  return (
    <div style={{ display: "none" }}>
      <video ref={videoRef} autoPlay muted playsInline />
    </div>
  );
};

export default MediaPipeEyeTracking;
