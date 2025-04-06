"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";

interface WebcamGazeTrackerProps {
  onGazeData: (gaze: { x: number; y: number }) => void;
  isActive: boolean;
}

const WebcamGazeTracker: React.FC<WebcamGazeTrackerProps> = ({ onGazeData, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const animationFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleGazeEstimation = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isActive || !isCameraActive) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context?.drawImage(video, 0, 0, canvas.width, canvas.height);

    // **Replace this with your actual gaze estimation logic.**
    // This is a placeholder that simulates gaze data based on time.
    const now = Date.now() % 5000;
    const simulatedX = (Math.sin(now * 0.001) * 0.3 + 0.5) * window.innerWidth;
    const simulatedY = (Math.cos(now * 0.0015) * 0.3 + 0.5) * window.innerHeight;

    onGazeData({ x: simulatedX, y: simulatedY });

    animationFrameId.current = requestAnimationFrame(handleGazeEstimation);
  }, [isActive, isCameraActive, onGazeData]);

  useEffect(() => {
    const startCamera = async () => {
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = streamRef.current;
          setIsCameraActive(true);
        }
      } catch (error) {
        console.error("Error accessing webcam:", error);
        setIsCameraActive(false);
      }
    };

    const stopCamera = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setIsCameraActive(false);
      }
    };

    if (isActive) {
      startCamera();
      // Start gaze estimation only after the camera is active
      if (isCameraActive) {
        animationFrameId.current = requestAnimationFrame(handleGazeEstimation);
      }
    } else {
      stopCamera();
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    }

    return () => {
      stopCamera();
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
  }, [isActive, handleGazeEstimation, isCameraActive]); // Added isCameraActive to dependency array

  // Re-trigger gaze estimation if camera becomes active while isActive is true
  useEffect(() => {
    if (isActive && isCameraActive && !animationFrameId.current) {
      animationFrameId.current = requestAnimationFrame(handleGazeEstimation);
    }
  }, [isActive, isCameraActive, handleGazeEstimation, animationFrameId]);

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: 0, height: 0, overflow: "hidden" }}>
      <video ref={videoRef} autoPlay style={{ display: "none" }} />
      <canvas ref={canvasRef} style={{ display: "none" }} />
      {!isCameraActive && isActive && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            color: "white",
            padding: "20px",
            borderRadius: "8px",
            zIndex: 1000,
          }}
        >
          <p>Waiting for webcam access...</p>
          <p className="text-sm">Please ensure your webcam is enabled and permissions are granted.</p>
        </div>
      )}
    </div>
  );
};

export default WebcamGazeTracker;