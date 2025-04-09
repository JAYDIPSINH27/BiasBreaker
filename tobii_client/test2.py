import tkinter as tk
from tkinter import messagebox
import websocket
import json
import random
import threading
import time

WS_URL = "ws://localhost:9987/ws/gaze-collector/"

class GazeSenderApp:
    def __init__(self, master):
        self.master = master
        master.title("🟢 Eye Tracker Gaze Sender")
        master.geometry("400x250")
        master.configure(bg="#f5f5f5")

        # Heading
        self.header = tk.Label(master, text="Eye Tracker Data Sender", font=("Helvetica", 16, "bold"), bg="#f5f5f5")
        self.header.pack(pady=(15,10))

        # Session ID Label and Entry
        self.session_frame = tk.Frame(master, bg="#f5f5f5")
        self.session_frame.pack(pady=(5,10))

        self.session_label = tk.Label(self.session_frame, text="Session ID:", font=("Helvetica", 12), bg="#f5f5f5")
        self.session_label.pack(side=tk.LEFT, padx=(0,10))

        self.session_entry = tk.Entry(self.session_frame, width=30, font=("Helvetica", 12), bd=2, relief=tk.GROOVE)
        self.session_entry.pack(side=tk.LEFT)

        # Buttons Frame
        self.buttons_frame = tk.Frame(master, bg="#f5f5f5")
        self.buttons_frame.pack(pady=(15,5))

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
        self.status_label.pack(pady=(10,5))

        self.ws = None
        self.running = False

    def start_sending(self):
        session_id = self.session_entry.get().strip()
        if not session_id:
            messagebox.showerror("⚠️ Error", "Please enter a valid session ID!")
            return

        try:
            self.ws = websocket.create_connection(WS_URL)
            self.running = True
            self.thread = threading.Thread(target=self.send_gaze_data, args=(session_id,), daemon=True)
            self.thread.start()

            self.start_button.config(state=tk.DISABLED)
            self.stop_button.config(state=tk.NORMAL)
            self.status_label.config(text=f"✅ Sending data for session: {session_id}", fg="#4CAF50")
        except Exception as e:
            messagebox.showerror("⚠️ Connection Error", f"Cannot connect to WebSocket: {e}")

    def stop_sending(self):
        self.running = False
        if self.ws:
            self.ws.close()
            self.ws = None
        self.start_button.config(state=tk.NORMAL)
        self.stop_button.config(state=tk.DISABLED)
        self.status_label.config(text="⛔ Stopped sending data.", fg="#f44336")

    def send_gaze_data(self, session_id):
        try:
            while self.running:
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
                        "source": "tobii"  # or "webcam"
                    }
                }

                self.ws.send(json.dumps(payload))
                print(f"Sent: {payload}")
                time.sleep(1/30)
        except Exception as e:
            messagebox.showerror("⚠️ Error", f"An error occurred: {e}")
            self.stop_sending()

if __name__ == "__main__":
    root = tk.Tk()
    app = GazeSenderApp(root)
    root.mainloop()
