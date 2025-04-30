import logging
import socket
import time
import json
import threading
import queue
import tkinter as tk
from tkinter import messagebox
import websocket
import tobii_research as tr

WS_URL = "ws://persuasive.research.cs.dal.ca:9987/ws/gaze-collector/"

# throttle interval for sending gaze data
SEND_THROTTLE = 0.05  

class BiasBreakerApp:
    def __init__(self, master):
        self.master = master
        master.title("BiasBreaker 👁️ Tobii Eye Tracker")
        master.geometry("600x460")
        master.configure(bg="#f7f9fc")
        master.resizable(False, False)

        # Header
        tk.Label(master, text="BiasBreaker 👁️", font=("Helvetica", 22, "bold"), bg="#f7f9fc").pack(pady=(25, 5))
        tk.Label(master, text="Tobii Eye Tracker Companion", font=("Helvetica", 12), bg="#f7f9fc").pack()

        # Status Line
        self.tobii_status_label = tk.Label(master, text="🔍 Checking for Tobii device...", font=("Helvetica", 11), bg="#f7f9fc")
        self.tobii_status_label.pack(pady=(20, 10))

        # Session ID
        session_frame = tk.Frame(master, bg="#f7f9fc")
        session_frame.pack(pady=10)
        tk.Label(session_frame, text="Session ID:", font=("Helvetica", 12), bg="#f7f9fc").pack(side=tk.LEFT, padx=(0, 10))
        self.session_entry = tk.Entry(session_frame, font=("Helvetica", 12), width=30, relief=tk.SOLID)
        self.session_entry.pack(side=tk.LEFT)

        # Buttons
        button_frame = tk.Frame(master, bg="#f7f9fc")
        button_frame.pack(pady=(20, 10))
        self.start_btn = tk.Button(button_frame, text="🚀 Start Tracking", font=("Helvetica", 12),
                                   bg="#4caf50", fg="white", width=16, command=self.start_tracking)
        self.start_btn.pack(side=tk.LEFT, padx=10)
        self.stop_btn = tk.Button(button_frame, text="🛑 Stop Tracking", font=("Helvetica", 12),
                                  bg="#f44336", fg="white", width=16, command=self.stop_tracking, state=tk.DISABLED)
        self.stop_btn.pack(side=tk.LEFT, padx=10)

        # Live status & gaze readout
        self.status_label = tk.Label(master, text="Status: Idle", font=("Helvetica", 11), bg="#f7f9fc")
        self.status_label.pack(pady=5)
        self.gaze_label = tk.Label(master, text="👁️ Gaze: N/A | 🎯 Pupil: N/A", font=("Helvetica", 11), bg="#f7f9fc")
        self.gaze_label.pack()

        # Internal state
        self.eyetracker = None
        self.ws = None
        self.ws_thread = None
        self.ws_queue = queue.Queue()
        self.ws_running = False
        self.tracking = False
        self.last_emit_time = 0

        self.check_tobii()
        master.protocol("WM_DELETE_WINDOW", self.on_close)

    def check_tobii(self):
        trackers = tr.find_all_eyetrackers()
        if trackers:
            self.eyetracker = trackers[0]
            info = f"✅ Tobii Device: {self.eyetracker.model}"
            self.tobii_status_label.config(text=info, fg="#388e3c")
            self.start_btn.config(state=tk.NORMAL)
        else:
            self.tobii_status_label.config(text="❌ No Tobii device found.", fg="#c62828")
            self.start_btn.config(state=tk.DISABLED)

    def start_tracking(self):
        session_id = self.session_entry.get().strip()
        if not session_id:
            messagebox.showerror("⚠️ Error", "Enter a valid session ID.")
            return
        self.session_id = session_id

        if not self._connect_ws():
            messagebox.showerror("⚠️ Error", "WebSocket connection failed.")
            return

        # subscribe to Tobii
        try:
            self.eyetracker.subscribe_to(tr.EYETRACKER_GAZE_DATA, self.gaze_callback, as_dictionary=True)
        except Exception as e:
            messagebox.showerror("❌ Tobii Error", str(e))
            return

        # update UI
        self.tracking = True
        self.status_label.config(text=f"✅ Tracking '{self.session_id}'", fg="#388e3c")
        self.start_btn.config(state=tk.DISABLED)
        self.stop_btn.config(state=tk.NORMAL)

    def _connect_ws(self):
        """Establish WebSocket, enable keepalive, and start sender thread."""
        try:
            self.ws = websocket.create_connection(WS_URL)
            # set a short timeout so we can detect dropped connections
            self.ws.settimeout(5)
            # enable TCP keepalive
            sock = self.ws.sock
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_KEEPALIVE, 1)

            self.ws_running = True
            self.ws_thread = threading.Thread(target=self.ws_sender, daemon=True)
            self.ws_thread.start()
            return True

        except Exception as e:
            print("WS connect error:", e)
            return False

    def ws_sender(self):
        """Continuously pull from queue, send, and reconnect on failure."""
        while self.ws_running:
            try:
                msg = self.ws_queue.get(timeout=0.1)
                self.ws.send(msg)

            except queue.Empty:
                continue

            except Exception as e:
                # socket was aborted by host
                print(f"WS Send Error: {e}")
                self.ws_running = False
                self._attempt_reconnect()

    def _attempt_reconnect(self):
        """Try to re-open the WebSocket in a loop."""
        self.status_label.config(text="⚠️ Connection lost — reconnecting…", fg="#fbc02d")
        # give the server a moment
        time.sleep(1)

        while not self.ws_running:
            if self._connect_ws():
                self.status_label.config(text="🔄 Reconnected", fg="#388e3c")
                break
            time.sleep(2)

    def gaze_callback(self, gaze_data):
        if not self.tracking:
            return

        now = time.time()
        if now - self.last_emit_time < SEND_THROTTLE:
            return
        self.last_emit_time = now

        left = gaze_data.get("left_gaze_point_on_display_area")
        pupil = gaze_data.get("left_pupil_diameter")
        if not left or None in left:
            return

        x = round(left[0] * 1920, 2)
        y = round(left[1] * 1080, 2)

        self.gaze_label.config(text=f"👁️ Gaze: ({x}, {y}) | 🎯 Pupil: {round(pupil,2)}")
        packet = json.dumps({
            "type": "eye.data",
            "payload": {
                "session_id": self.session_id,
                "gaze_x": x,
                "gaze_y": y,
                "pupil_diameter": pupil,
                "source": "tobii",
            }
        })
        self.ws_queue.put(packet)

    def stop_tracking(self):
        self.tracking = False
        # unsubscribe Tobii
        try:
            self.eyetracker.unsubscribe_from(tr.EYETRACKER_GAZE_DATA, self.gaze_callback)
        except Exception:
            pass

        # tear down WS
        self.ws_running = False
        try:
            self.ws.close()
        except Exception:
            pass

        self.status_label.config(text="⛔️ Tracking stopped", fg="#c62828")
        self.gaze_label.config(text="👁️ Gaze: N/A | 🎯 Pupil: N/A")
        self.start_btn.config(state=tk.NORMAL)
        self.stop_btn.config(state=tk.DISABLED)

    def on_close(self):
        if self.tracking:
            self.stop_tracking()
        self.master.destroy()

if __name__ == "__main__":
    root = tk.Tk()
    app = BiasBreakerApp(root)
    root.mainloop()
