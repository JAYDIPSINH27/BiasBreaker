import React, { useEffect, useRef, useState } from "react";
import useWindowSize from "./useWindowSize";

interface Gaze {
  gaze_x: number;
  gaze_y: number;
  server_time?: number;
}

const LiveGazeOverlay: React.FC = () => {
  const { width, height } = useWindowSize();
  const dotRef = useRef<HTMLDivElement>(null);
  const latestGaze = useRef<Gaze | null>(null);
  const rafId = useRef<number | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef<number>(0);
  const [lagMs, setLagMs] = useState<number>(0);
  const [connected, setConnected] = useState<boolean>(false);
  const [showDebug, setShowDebug] = useState<boolean>(false);
  
  // Toggle debug display with keyboard shortcut (Ctrl+Shift+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setShowDebug(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Connect to WebSocket with auto-reconnect
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const wsUrl = `${process.env.NEXT_PUBLIC_HOST_WS}/ws/eye-tracking/`;
        
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          return; // Already connected
        }
        
        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onopen = () => {
          console.log("WebSocket connected");
          setConnected(true);
          reconnectAttempts.current = 0;
        };
        
        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "eye.data") {
              const payload = data.payload;
              
              if (payload && typeof payload.gaze_x === "number" && typeof payload.gaze_y === "number") {
                // Record client receipt time
                const clientTime = performance.now() / 1000;
                
                latestGaze.current = {
                  gaze_x: payload.gaze_x,
                  gaze_y: payload.gaze_y,
                  client_time: clientTime
                };
                
                // Calculate lag if server time is available
                if (payload.server_time) {
                  const lag = (clientTime - payload.server_time) * 1000;
                  setLagMs(Math.round(lag));
                }
              }
            }
          } catch (e) {
            console.warn("Invalid message format", e);
          }
        };

        socket.onclose = (event) => {
          console.log("WebSocket disconnected", event.code);
          setConnected(false);
          
          // Attempt to reconnect with exponential backoff
          const backoffTime = Math.min(1000 * Math.pow(1.5, reconnectAttempts.current), 10000);
          reconnectAttempts.current++;
          
          setTimeout(() => {
            if (document.visibilityState === 'visible') {
              connectWebSocket();
            }
          }, backoffTime);
        };

        socket.onerror = (error) => {
          console.error("WebSocket error", error);
        };
      } catch (err) {
        console.error("WebSocket connection error", err);
      }
    };

    // Connect immediately
    connectWebSocket();
    
    // Reconnect when tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && 
          (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN)) {
        connectWebSocket();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  // Optimized position update with no throttling or transitions
  useEffect(() => {
    // Use a simple position update without complex calculations
    const updatePosition = () => {
      if (latestGaze.current && dotRef.current) {
        const { gaze_x, gaze_y } = latestGaze.current;
        
        // Simple, direct coordinate mapping
        let x, y;
        
        // Values less than 1 are normalized (0-1 range)
        if (gaze_x <= 1 && gaze_y <= 1) {
          x = gaze_x * width;
          y = gaze_y * height;
        } else {
          // Scale pixel coordinates to current screen size
          x = (gaze_x / 1920) * width;
          y = (gaze_y / 1080) * height;
        }
        
        // Direct DOM manipulation - no React state updates for performance
        dotRef.current.style.left = `${x}px`;
        dotRef.current.style.top = `${y}px`;
      }
      
      rafId.current = requestAnimationFrame(updatePosition);
    };
    
    // Start the animation loop
    rafId.current = requestAnimationFrame(updatePosition);
    
    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [width, height]);

  return (
    <>
      {/* Gaze dot - positioned with top/left instead of transform for better performance */}
      <div 
        ref={dotRef} 
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 10,                       // Reduced size for less rendering cost
          height: 10,
          marginTop: -5,                   // Half size for centering
          marginLeft: -5,
          background: "rgba(255,0,0,0.7)",
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: 9999,
        }} 
      />
      
      {/* Debug overlay - only shown when enabled */}
      {showDebug && (
        <div 
          style={{
            position: "fixed",
            top: 10,
            right: 10,
            background: "rgba(0,0,0,0.7)",
            color: "white",
            padding: "8px",
            borderRadius: "4px",
            fontSize: "12px",
            fontFamily: "monospace",
            zIndex: 10000,
            pointerEvents: "none",
          }}
        >
          <div>Connection: {connected ? "✅" : "❌"}</div>
          <div>Lag: <span style={{color: lagMs > 100 ? 'red' : 'lime'}}>{lagMs}ms</span></div>
          <div>Screen: {width}×{height}</div>
          <div>Position: {latestGaze.current?.gaze_x?.toFixed(0) || '-'}, {latestGaze.current?.gaze_y?.toFixed(0) || '-'}</div>
        </div>
      )}
    </>
  );
};

export default LiveGazeOverlay;