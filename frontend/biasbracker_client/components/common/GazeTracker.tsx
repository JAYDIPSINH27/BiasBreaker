"use client";

import React, { useEffect, useRef } from "react";

export default function GazeTracker() {
  const webgazerRef = useRef<any>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let canceled = false;
    async function initWebGazer() {
      try {
        const wgModule = await import("webgazer");
        const webgazer = wgModule.default || wgModule;
        if (canceled) return;

        // Start
        webgazerRef.current = webgazer;
        await webgazer.begin();

        // Hide debug
        webgazer.showVideo(false);
        webgazer.showFaceOverlay(false);
        webgazer.showPredictionPoints(false);

        // Example gaze listener
        webgazer.setGazeListener((data: any) => {
          if (!data) return;
          // normalized coords
          const normX = data.x / window.innerWidth;
          const normY = data.y / window.innerHeight;
          if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
              type: "eye.data",
              payload: { gaze_x: normX, gaze_y: normY, source: "webcam" },
            }));
          }
        });
        console.log("[WebGazer] started successfully");
      } catch (err) {
        console.error("[WebGazer] error:", err);
      }
    }
    initWebGazer();

    // WebSocket
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:8000";
    const ws = new WebSocket(`${wsUrl}/ws/gaze-collector/`);
    socketRef.current = ws;

    ws.onopen = () => console.log("[GazeTracker] WebSocket open");
    ws.onerror = (err) => console.error("[GazeTracker] WebSocket error:", err);
    ws.onclose = () => console.log("[GazeTracker] WebSocket closed");

    // Cleanup
    return () => {
      canceled = true;

      // 1. If webgazer is running, forcibly end it
      if (webgazerRef.current) {
        // (A) Attempt the official end
        webgazerRef.current.end();

        // (B) Also forcibly stop underlying camera tracks
        // webgazer keeps them in .webcamStream or .videoStream
        const wg = webgazerRef.current;
        const webcamStream = wg.webcamStream || wg.videoStream; // depends on version
        if (webcamStream) {
          webcamStream.getTracks().forEach((track: MediaStreamTrack) => {
            track.stop();
          });
          console.log("[WebGazer] forcibly stopped camera tracks");
        }

        webgazerRef.current = null;
      }

      // 2. Close WebSocket
      ws.close();
      console.log("[GazeTracker] unmounted, everything closed");
    };
  }, []);

  return null;
}
