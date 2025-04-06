"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  FaceLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";

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
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const rafId = useRef<number>();
  const [isReady, setIsReady] = useState(false);

  const MODEL_URL =
    "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

  const WASM_PATH =
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm";

  const init = async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
      const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
        numFaces: 1,
      });
      faceLandmarkerRef.current = faceLandmarker;
      setIsReady(true);
      console.log("✅ FaceLandmarker initialized.");
    } catch (err) {
      console.error("❌ Failed to initialize FaceLandmarker:", err);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        console.log("🎥 Webcam started.");
        detectFace();
      }
    } catch (err) {
      console.error("❌ Webcam access error:", err);
    }
  };

  const detectFace = () => {
    const video = videoRef.current;
    if (!video || !faceLandmarkerRef.current) return;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const drawingUtils = new DrawingUtils(ctx);

    const analyze = () => {
      const results = faceLandmarkerRef.current!.detectForVideo(video, performance.now());

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (results?.faceLandmarks?.[0]) {
        drawingUtils.drawConnectors(
          results.faceLandmarks[0],
          FaceLandmarker.FACE_LANDMARKS_TESSELATION,
          { color: "#00FF00", lineWidth: 1 }
        );

        const nose = results.faceLandmarks[0][1]; // Nose tip
        const gazeX = nose.x * window.innerWidth;
        const gazeY = nose.y * window.innerHeight;

        console.log("👁 Gaze:", { x: gazeX, y: gazeY });
        onGazeData({ x: gazeX, y: gazeY });
      }

      rafId.current = requestAnimationFrame(analyze);
    };

    analyze();
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      console.log("🛑 Webcam stopped.");
    }
    if (rafId.current) cancelAnimationFrame(rafId.current);
  };

  useEffect(() => {
    if (isActive) {
      init();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive]);

  useEffect(() => {
    if (isActive && isReady) {
      startCamera();
    }
  }, [isReady, isActive]);

  return (
    <div style={{ display: "none" }}>
      <video ref={videoRef} playsInline muted />
      <canvas ref={canvasRef} />
    </div>
  );
};

export default WebcamGazeTracker;
