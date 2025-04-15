import tkinter as tk
from tkinter import messagebox
import websocket
import json
import random
import threading
import time
import queue

WS_URL = "ws://localhost:8000/ws/gaze-collector/"

class SimulatedGazeSenderApp:
    def __init__(self, master):
        self.master = master
        master.title("🟢 Simulated Eye Tracker Data Sender")
        master.geometry("400x250")
        master.configure(bg="#f5f5f5")

        # Heading Label
        self.header = tk.Label(master, text="Simulated Eye Tracker Data Sender", font=("Helvetica", 16, "bold"), bg="#f5f5f5")
        self.header.pack(pady=(15, 10))

        # Session ID Input
        self.session_frame = tk.Frame(master, bg="#f5f5f5")
        self.session_frame.pack(pady=(5, 10))
        self.session_label = tk.Label(self.session_frame, text="Session ID:", font=("Helvetica", 12), bg="#f5f5f5")
        self.session_label.pack(side=tk.LEFT, padx=(0, 10))
        self.session_entry = tk.Entry(self.session_frame, width=30, font=("Helvetica", 12), bd=2, relief=tk.GROOVE)
        self.session_entry.pack(side=tk.LEFT)

        # Buttons Frame
        self.buttons_frame = tk.Frame(master, bg="#f5f5f5")
        self.buttons_frame.pack(pady=(15, 5))
        self.start_button = tk.Button(
            self.buttons_frame, text="▶️ Start Sending", command=self.start_sending, 
            font=("Helvetica", 12), bg="#4CAF50", fg="white", activebackground="#45a049",
            width=15, bd=0, padx=5, pady=5, cursor="hand2"
        )
        self.start_button.pack(side=tk.LEFT, padx=10)
        self.stop_button = tk.Button(
            self.buttons_frame, text="⏹️ Stop Sending", command=self.stop_sending,
            font=("Helvetica", 12), bg="#f44336", fg="white", activebackground="#e53935",
            width=15, bd=0, padx=5, pady=5, state=tk.DISABLED, cursor="hand2"
        )
        self.stop_button.pack(side=tk.LEFT, padx=10)

        # Status Label
        self.status_label = tk.Label(master, text="Status: Idle", font=("Helvetica", 11), bg="#f5f5f5", fg="gray")
        self.status_label.pack(pady=(10, 5))
        
        # Internal State
        self.ws = None
        self.ws_running = False
        self.msg_queue = queue.Queue()  # Queue for outgoing WebSocket messages
        self.sender_thread = None       # Thread for sending messages from the queue
        self.generator_thread = None    # Thread for generating simulated gaze data
        self.message_count = 0

    def start_sending(self):
        session_id = self.session_entry.get().strip()
        if not session_id:
            messagebox.showerror("⚠️ Error", "Please enter a valid session ID!")
            return
        try:
            # Establish WebSocket connection
            self.ws = websocket.create_connection(WS_URL)
            self.ws_running = True
        except Exception as e:
            messagebox.showerror("⚠️ Connection Error", f"Cannot connect to WebSocket: {e}")
            return
        
        self.message_count = 0
        self.status_label.config(text=f"✅ Connected. Sending data for session: {session_id}", fg="#4CAF50")
        self.start_button.config(state=tk.DISABLED)
        self.stop_button.config(state=tk.NORMAL)
        
        # Start sender thread to flush queue messages to the WebSocket
        self.sender_thread = threading.Thread(target=self.ws_sender, daemon=True)
        self.sender_thread.start()
        # Start generator thread to produce simulated gaze data
        self.generator_thread = threading.Thread(target=self.generate_gaze_data, args=(session_id,), daemon=True)
        self.generator_thread.start()

    def stop_sending(self):
        self.ws_running = False
        # Clear any queued messages
        with self.msg_queue.mutex:
            self.msg_queue.queue.clear()
        if self.ws:
            try:
                self.ws.close()
            except Exception as e:
                print(f"Error closing WebSocket: {e}")
            self.ws = None
        self.start_button.config(state=tk.NORMAL)
        self.stop_button.config(state=tk.DISABLED)
        self.status_label.config(text="⛔ Stopped sending data.", fg="#f44336")

    def generate_gaze_data(self, session_id):
        """Simulate random gaze data at ~30 FPS and enqueue message payloads."""
        try:
            while self.ws_running:
                gaze_x = round(random.uniform(0, 1920), 2)
                gaze_y = round(random.uniform(0, 1080), 2)
                pupil_diameter = round(random.uniform(2.0, 5.0), 2)
                payload = {
                    "type": "eye.data",
                    "payload": {
                        "session_id": session_id,
                        "gaze_x": gaze_x,
                        "gaze_y": gaze_y,
                        "pupil_diameter": pupil_diameter,
                        "source": "simulated"
                    }
                }
                self.msg_queue.put(json.dumps(payload))
                self.message_count += 1
                self.update_status(f"Sent {self.message_count} messages", success=True)
                time.sleep(1/30)  # simulate 30 FPS
        except Exception as e:
            messagebox.showerror("⚠️ Error", f"An error occurred while generating data: {e}")
            self.stop_sending()

    def ws_sender(self):
        """Continuously send messages from the queue over the WebSocket."""
        while self.ws_running:
            try:
                message = self.msg_queue.get(timeout=0.1)
                try:
                    self.ws.send(message)
                    print(f"Sent: {message}")
                except websocket.WebSocketConnectionClosedException:
                    print("WebSocket connection closed unexpectedly.")
                    self.ws_running = False
                    break
                except Exception as e:
                    print(f"Send error: {e}")
            except queue.Empty:
                continue

    def update_status(self, message, success=True):
        """Thread-safe status update of the status label."""
        def update():
            color = "#4CAF50" if success else "#f44336"
            self.status_label.config(text=f"Status: {message}", fg=color)
        self.master.after(0, update)

if __name__ == "__main__":
    root = tk.Tk()
    app = SimulatedGazeSenderApp(root)
    root.mainloop()
