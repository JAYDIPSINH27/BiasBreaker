"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  FaceLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";
import { useEyeTrackingSocket } from "@/components/hooks/useEyeTracking";

interface WebcamGazeTrackerProps {
  sessionId: string | null;
  isActive: boolean;
  onGazeData: (data: { x: number; y: number }) => void;
}

const WebcamGazeTracker: React.FC<WebcamGazeTrackerProps> = ({
  sessionId,
  isActive,
  onGazeData,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const rafId = useRef<number>();
  const [isReady, setIsReady] = useState(false);
  const isCameraStarted = useRef(false);

  const MODEL_URL =
    "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
  const WASM_PATH =
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm";

  // Debug logging for props and key state.
  useEffect(() => {
    console.log("WebcamGazeTracker props:", { sessionId, isActive });
    console.log("Internal state:", {
      isReady,
      isCameraStarted: isCameraStarted.current,
    });
  }, [sessionId, isActive, isReady]);

  // Ensure camera stops on page unload.
  useEffect(() => {
    const handleBeforeUnload = () => {
      stopCamera();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Always stop the camera when the component unmounts.
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Initialization: run only once on mount.
  useEffect(() => {
    init();
  }, []);

  // If isActive becomes false, stop the camera.
  useEffect(() => {
    if (!isActive) {
      stopCamera();
    }
  }, [isActive]);

  // When both isActive and isReady are true, start the camera if not already started.
  useEffect(() => {
    if (isActive && isReady && !isCameraStarted.current) {
      startCamera();
    }
  }, [isActive, isReady]);

  const sendGazeToBackend = (x: number, y: number) => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN && sessionId) {
      const payload = {
        type: "eye.data",
        payload: {
          session_id: sessionId,
          gaze_x: x,
          gaze_y: y,
          pupil_diameter: 0.0,
          source: "webcam",
        },
      };
      socket.send(JSON.stringify(payload));
    }
  };

  const runDetectionLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!video || !canvas || !ctx || !faceLandmarkerRef.current) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const drawingUtils = new DrawingUtils(ctx);

    const detect = () => {
      const results = faceLandmarkerRef.current!.detectForVideo(
        video,
        performance.now()
      );
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (results?.faceLandmarks?.[0]) {
        // Optional: draw the full face tessellation for debugging.
        drawingUtils.drawConnectors(
          results.faceLandmarks[0],
          FaceLandmarker.FACE_LANDMARKS_TESSELATION,
          { color: "#00FF00", lineWidth: 1 }
        );

        let gazeX: number;
        let gazeY: number;
        const landmarks = results.faceLandmarks[0];

        // If iris landmarks are available (indices 468-477), compute average iris center.
        if (landmarks.length >= 478) {
          // Left iris indices (typical indexes 468-472)
          const leftIrisIndices = [468, 469, 470, 471, 472];
          let leftX = 0,
            leftY = 0;
          leftIrisIndices.forEach((i) => {
            leftX += landmarks[i].x;
            leftY += landmarks[i].y;
          });
          leftX /= leftIrisIndices.length;
          leftY /= leftIrisIndices.length;

          // Right iris indices (typical indexes 473-477)
          const rightIrisIndices = [473, 474, 475, 476, 477];
          let rightX = 0,
            rightY = 0;
          rightIrisIndices.forEach((i) => {
            rightX += landmarks[i].x;
            rightY += landmarks[i].y;
          });
          rightX /= rightIrisIndices.length;
          rightY /= rightIrisIndices.length;

          // Use the average of both iris centers as the gaze estimation.
          const irisCenterX = (leftX + rightX) / 2;
          const irisCenterY = (leftY + rightY) / 2;
          gazeX = irisCenterX * window.innerWidth;
          gazeY = irisCenterY * window.innerHeight;
        } else {
          // Fallback: use the nose (landmark index 1) if iris data isn't available.
          gazeX = landmarks[1].x * window.innerWidth;
          gazeY = landmarks[1].y * window.innerHeight;
        }

        // Ensure the values are numbers before updating.
        if (!isNaN(gazeX) && !isNaN(gazeY)) {
          onGazeData({ x: gazeX, y: gazeY });
          sendGazeToBackend(gazeX, gazeY);
        }
      }
      rafId.current = requestAnimationFrame(detect);
    };

    detect();
  };

  const init = async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
      const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
        runningMode: "VIDEO",
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
        numFaces: 1,
      });
      faceLandmarkerRef.current = faceLandmarker;
      setIsReady(true);
      console.log("✅ FaceLandmarker initialized.");
    } catch (err) {
      console.error("❌ Failed to init faceLandmarker:", err);
    }
  };

  const startCamera = async () => {
    if (isCameraStarted.current) {
      console.log("Camera already started, skipping startCamera.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Clear any previous onloadedmetadata handler.
        videoRef.current.onloadedmetadata = null;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current
            .play()
            .then(() => {
              isCameraStarted.current = true;
              console.log("🎥 Webcam started.");
              runDetectionLoop();
            })
            .catch((err) => {
              console.error("❌ Error during video play:", err);
            });
        };
      }
    } catch (err) {
      console.error("❌ Webcam access error:", err);
    }
  };

  const stopCamera = () => {
    console.log("🛑 stopCamera triggered");
    if (videoRef.current) {
      videoRef.current.onloadedmetadata = null;
    }
    const video = videoRef.current;
    if (video?.srcObject) {
      const stream = video.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
      console.log("🛑 MediaStream tracks stopped.");
    }
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      console.log("🛑 Animation frame stopped.");
    }
    if (faceLandmarkerRef.current) {
      faceLandmarkerRef.current.close();
      faceLandmarkerRef.current = null;
      console.log("🧹 FaceLandmarker closed.");
    }
    isCameraStarted.current = false;
  };

  // WebSocket effect with a readyState check in cleanup.
  useEffect(() => {
    if (!sessionId) return;
    const socket = new WebSocket(`${process.env.NEXT_PUBLIC_HOST_WS}/ws/gaze-collector/`);
    socketRef.current = socket;

    socket.onopen = () => console.log("✅ [GazeCollectorSocket] Connected");
    socket.onerror = (err) => console.error("❌ [GazeCollectorSocket] Error:", err);
    socket.onclose = () => console.log("🔌 [GazeCollectorSocket] Closed");

    return () => {
      if (socket.readyState === WebSocket.CONNECTING) {
        socket.addEventListener("open", () => socket.close());
      } else {
        socket.close();
      }
      socketRef.current = null;
      console.log("🔌 [GazeCollectorSocket] Closed (cleanup)");
    };
  }, [sessionId]);

  // Shared alerts via your custom hook.
  useEyeTrackingSocket();

  return (
    <div style={{ display: "none" }}>
      {isActive && (
        <>
          <video ref={videoRef} playsInline muted id="webcam-video" />
          <canvas ref={canvasRef} />
        </>
      )}
    </div>
  );
};

export default WebcamGazeTracker;
