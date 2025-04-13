import tkinter as tk
from tkinter import messagebox
import websocket
import json
import threading
import time
import queue
import tobii_research as tr

WS_URL = "wss://biasbreaker-a2l8.onrender.com"

class BiasBreakerApp:
    def __init__(self, master):
        self.master = master
        master.title("BiasBreaker 👁️ Tobii Eye Tracker")
        master.geometry("600x460")
        master.configure(bg="#f7f9fc")
        master.resizable(False, False)

        # === Title ===
        tk.Label(master, text="BiasBreaker 👁️", font=("Helvetica", 22, "bold"), bg="#f7f9fc", fg="#212121").pack(pady=(25, 5))
        tk.Label(master, text="Tobii Eye Tracker Companion", font=("Helvetica", 12), bg="#f7f9fc", fg="#607d8b").pack()

        # === Tobii Status ===
        self.tobii_status_label = tk.Label(master, text="🔍 Checking for Tobii device...", font=("Helvetica", 11), bg="#f7f9fc", fg="#546e7a")
        self.tobii_status_label.pack(pady=(20, 10))

        # === Session ID Entry ===
        session_frame = tk.Frame(master, bg="#f7f9fc")
        session_frame.pack()
        tk.Label(session_frame, text="Session ID:", font=("Helvetica", 12), bg="#f7f9fc").pack(side=tk.LEFT, padx=(0, 10))
        self.session_entry = tk.Entry(session_frame, font=("Helvetica", 12), width=30, bd=1, relief=tk.SOLID)
        self.session_entry.pack(side=tk.LEFT)

        # === Buttons ===
        button_frame = tk.Frame(master, bg="#f7f9fc")
        button_frame.pack(pady=(25, 10))
        self.start_btn = tk.Button(button_frame, text="🚀 Start Tracking", font=("Helvetica", 12), bg="#4caf50", fg="white", width=16,
                                   relief="flat", command=self.start_tracking, cursor="hand2", activebackground="#43a047")
        self.start_btn.pack(side=tk.LEFT, padx=10)
        self.stop_btn = tk.Button(button_frame, text="🛑 Stop Tracking", font=("Helvetica", 12), bg="#f44336", fg="white", width=16,
                                  relief="flat", command=self.stop_tracking, cursor="hand2", activebackground="#e53935", state=tk.DISABLED)
        self.stop_btn.pack(side=tk.LEFT, padx=10)

        # === Status Labels ===
        self.status_label = tk.Label(master, text="Status: Idle", font=("Helvetica", 11), bg="#f7f9fc", fg="#607d8b")
        self.status_label.pack(pady=(10, 5))
        self.gaze_label = tk.Label(master, text="👁️ Gaze: N/A  |  🎯 Pupil Diameter: N/A", font=("Helvetica", 11), bg="#f7f9fc", fg="#455a64")
        self.gaze_label.pack()

        # === Internal State ===
        self.ws = None
        self.eyetracker = None
        self.running = False
        self.session_id = ""
        self.ws_queue = queue.Queue()  # Queue for outgoing WebSocket messages
        self.ws_thread = None         # Dedicated thread for sending messages
        self.ws_thread_running = False

        # Check for a connected Tobii device
        self.check_tobii()

    def check_tobii(self):
        eyetrackers = tr.find_all_eyetrackers()
        if eyetrackers:
            self.eyetracker = eyetrackers[0]
            info = f"✅ Found Tobii Device: {self.eyetracker.model} @ {self.eyetracker.address}"
            self.tobii_status_label.config(text=info, fg="#388e3c")
            self.start_btn.config(state=tk.NORMAL)
        else:
            self.eyetracker = None
            self.tobii_status_label.config(text="❌ No Tobii device detected. Connect & restart.", fg="#c62828")
            self.start_btn.config(state=tk.DISABLED)

    def start_tracking(self):
        self.session_id = self.session_entry.get().strip()
        if not self.session_id:
            messagebox.showerror("⚠️ Error", "Please enter a valid session ID.")
            return

        try:
            self.ws = websocket.create_connection(WS_URL)
        except Exception as e:
            messagebox.showerror("❌ WebSocket Error", f"Could not connect to backend.\n\n{e}")
            return

        self.running = True
        self.status_label.config(text=f"✅ Tracking: Session '{self.session_id}'", fg="#2e7d32")
        self.start_btn.config(state=tk.DISABLED)
        self.stop_btn.config(state=tk.NORMAL)

        # Start the WebSocket sender thread
        self.ws_thread_running = True
        self.ws_thread = threading.Thread(target=self.ws_sender, daemon=True)
        self.ws_thread.start()

        threading.Thread(target=self.subscribe_tobii, daemon=True).start()

    def ws_sender(self):
        # Dedicated loop for sending queued messages over WebSocket
        while self.ws_thread_running:
            try:
                message = self.ws_queue.get(timeout=0.1)
                try:
                    self.ws.send(message)
                    print(f"Sent: {message}")
                except websocket.WebSocketConnectionClosedException:
                    print("WebSocket closed. Attempting reconnect...")
                    try:
                        self.ws = websocket.create_connection(WS_URL)
                        self.ws.send(message)
                    except Exception as e:
                        print(f"Reconnect failed: {e}")
                except Exception as e:
                    print(f"Send error: {e}")
            except queue.Empty:
                continue

    def subscribe_tobii(self):
        try:
            self.eyetracker.subscribe_to(
                tr.EYETRACKER_GAZE_DATA,
                lambda data: self.gaze_callback(data),
                as_dictionary=True
            )
        except Exception as e:
            print(f"Tobii subscribe error: {e}")
            messagebox.showerror("❌ Tobii Error", f"Error subscribing to Tobii data.\n\n{e}")
            self.stop_tracking()

    def stop_tracking(self):
        self.running = False
        self.ws_thread_running = False
        try:
            if self.eyetracker:
                self.eyetracker.unsubscribe_from(tr.EYETRACKER_GAZE_DATA, self.gaze_callback)
        except Exception as e:
            print(f"Unsubscribe error: {e}")

        if self.ws:
            try:
                self.ws.close()
            except Exception as e:
                print(f"WebSocket close error: {e}")
            self.ws = None

        self.status_label.config(text="⛔️ Tracking stopped", fg="#b71c1c")
        self.gaze_label.config(text="👁️ Gaze: N/A  |  🎯 Pupil Diameter: N/A")
        self.start_btn.config(state=tk.NORMAL)
        self.stop_btn.config(state=tk.DISABLED)

    def gaze_callback(self, gaze_data):
        if not self.running:
            return

        left_gaze = gaze_data.get('left_gaze_point_on_display_area')
        pupil = gaze_data.get('left_pupil_diameter')

        if left_gaze and None not in left_gaze and pupil is not None:
            x = round(left_gaze[0] * 1920, 2)
            y = round(left_gaze[1] * 1080, 2)
            self.gaze_label.config(text=f"👁️ Gaze: ({x}, {y})  |  🎯 Pupil Diameter: {round(pupil, 2)}")

            payload = {
                "type": "eye.data",
                "payload": {
                    "session_id": self.session_id,
                    "gaze_x": x,
                    "gaze_y": y,
                    "pupil_diameter": pupil,
                    "source": "tobii"
                }
            }
            message = json.dumps(payload)
            # Enqueue the message so the WS sender thread sends it asynchronously
            self.ws_queue.put(message)

if __name__ == "__main__":
    root = tk.Tk()
    app = BiasBreakerApp(root)
    root.mainloop()
