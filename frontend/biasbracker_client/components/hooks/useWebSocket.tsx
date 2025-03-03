import { useEffect } from "react";
import { toast } from "react-hot-toast";

const useWebSocket = () => {
  useEffect(() => {
    const socket = new WebSocket("ws://127.0.0.1:8000/ws/eye_tracking/");

    socket.onopen = () => console.log("✅ WebSocket Connected");

    socket.onmessage = (event) => {
      console.log("📩 WebSocket Message:", event.data);
      if (event.data.includes("User looking away!")) {
        toast.error("👀 Look at the article!", { duration: 3000 });
      }
    };

    socket.onerror = (error) => console.error("❌ WebSocket Error:", error);
    socket.onclose = () => console.log("🔌 WebSocket Disconnected");

    return () => {
      socket.close();
    };
  }, []);
};

export default useWebSocket;
