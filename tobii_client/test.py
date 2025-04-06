import tobii_research as tr
import time
import requests
import json
import tkinter as tk
from tkinter import ttk, messagebox
import threading
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# --- Configuration ---
SERVER_BASE_URL = "http://your-django-server.com/eye-tracking/"  # Replace with your Django server URL

class TobiiApp:
    """
    Tkinter-based client for interfacing with a Tobii eye tracker and a Django backend.
    """
    def __init__(self, master):
        self.master = master
        master.title("Tobii Eye Tracker Client")
        master.geometry("500x300")
        self.style = ttk.Style(master)
        self.style.theme_use('clam')

        # Remove API key input; only session ID is available now.
        self.session_id = tk.StringVar()
        self.tracking_active = False
        self.eyetracker = None
        self.tracking_thread = None
        self._current_session_id = None

        self._create_widgets()
        self._find_eyetracker()

    def _create_widgets(self):
        # Session ID Frame
        session_id_frame = ttk.LabelFrame(self.master, text="Session Management")
        session_id_frame.pack(padx=10, pady=10, fill="x")
        ttk.Label(session_id_frame, text="Optional: Use existing Session ID:").pack(padx=5, pady=5, anchor="w")
        ttk.Entry(session_id_frame, textvariable=self.session_id, width=40).pack(padx=5, pady=5, fill="x")

        # Control Buttons
        controls_frame = ttk.Frame(self.master)
        controls_frame.pack(pady=15)
        self.start_button = ttk.Button(
            controls_frame, text="Start Tracking",
            command=self._start_session_and_track, style='Accent.TButton'
        )
        self.start_button.pack(side="left", padx=10)
        self.stop_button = ttk.Button(
            controls_frame, text="Stop Tracking",
            command=self.stop_tracking, state=tk.DISABLED
        )
        self.stop_button.pack(side="left", padx=10)

        # Status Label
        self.status_label = ttk.Label(self.master, text="Status: Idle", anchor="w")
        self.status_label.pack(padx=10, pady=5, fill="x")

        # Style Configuration
        self.style.configure('Accent.TButton', foreground='white', background='#4CAF50')
        self.style.map('Accent.TButton',
                       foreground=[('active', 'white')],
                       background=[('active', '#45a049')])

    def _find_eyetracker(self):
        """
        Searches for a connected Tobii eye tracker.
        """
        self.status_label.config(text="Status: Searching for Tobii tracker...")
        try:
            found_eyetrackers = tr.find_all_eyetrackers()
            if found_eyetrackers:
                self.eyetracker = found_eyetrackers[0]
                self.status_label.config(text=f"Status: Tracker found - {self.eyetracker.model}")
                logging.info(f"Tobii tracker found: {self.eyetracker.model}")
            else:
                self.status_label.config(text="Status: No Tobii tracker found.")
                messagebox.showerror("Error", "No Tobii eye tracker found. Please connect one and restart the application.")
                self.start_button.config(state=tk.DISABLED)
        except Exception as e:
            self.status_label.config(text=f"Status: Error finding tracker - {e}")
            messagebox.showerror("Error", f"An error occurred while finding the tracker: {e}")
            self.start_button.config(state=tk.DISABLED)

    def _start_session_and_track(self):
        """
        Starts a new session (or uses an existing one) and begins gaze tracking.
        """
        existing_session_id = self.session_id.get().strip()

        if existing_session_id:
            self._current_session_id = existing_session_id
            self.start_tracking()
        else:
            start_session_url = f"{SERVER_BASE_URL}start/"
            self.status_label.config(text="Status: Starting session...")
            self.start_button.config(state=tk.DISABLED)
            try:
                response = requests.post(start_session_url, headers={'Content-Type': 'application/json'})
                response.raise_for_status()
                session_data = response.json()
                self._current_session_id = session_data.get('session_id')
                if self._current_session_id:
                    self.status_label.config(text=f"Status: Session started - {self._current_session_id}")
                    logging.info(f"Session started: {self._current_session_id}")
                    self.start_tracking()
                else:
                    raise ValueError("No session_id received")
            except Exception as e:
                self.status_label.config(text="Status: Failed to start session.")
                messagebox.showerror("Error", f"Failed to start session: {e}")
                self.start_button.config(state=tk.NORMAL)

    def start_tracking(self):
        """
        Initiates gaze tracking if an eye tracker is available and a session is active.
        """
        if self.eyetracker and not self.tracking_active and self._current_session_id:
            self.tracking_active = True
            self.start_button.config(state=tk.DISABLED)
            self.stop_button.config(state=tk.NORMAL)
            self.status_label.config(text=f"Status: Tracking session - {self._current_session_id}...")
            self.tracking_thread = threading.Thread(target=self._track_gaze, daemon=True)
            self.tracking_thread.start()
        elif not self._current_session_id:
            messagebox.showerror("Error", "No session ID available. Please start a new session.")
            self.stop_tracking()

    def stop_tracking(self):
        """
        Stops the tracking session and informs the backend to end the session.
        """
        if self.tracking_active:
            self.tracking_active = False
            self.start_button.config(state=tk.NORMAL)
            self.stop_button.config(state=tk.DISABLED)
            self.status_label.config(text="Status: Stopping tracking...")
            # Let the tracking thread finish naturally since it's marked daemon.
            if self._current_session_id:
                stop_session_url = f"{SERVER_BASE_URL}stop/{self._current_session_id}/"
                try:
                    response = requests.post(stop_session_url, headers={'Content-Type': 'application/json'})
                    response.raise_for_status()
                    self.status_label.config(text="Status: Tracking stopped. Session ended on server.")
                    logging.info("Session stopped on server.")
                    self._current_session_id = None
                except Exception as e:
                    self.status_label.config(text=f"Status: Error stopping session - {e}")
                    messagebox.showerror("Error", f"Error stopping session on server: {e}")
            else:
                self.status_label.config(text="Status: Idle")

    def _track_gaze(self):
        """
        Subscribes to gaze data from the Tobii tracker and sends data to the backend.
        """
        def gaze_data_callback(gaze_data):
            if not self.tracking_active or not self._current_session_id:
                return

            if gaze_data.get('left_gaze_point_on_display_area') is not None:
                gaze_x, gaze_y = gaze_data['left_gaze_point_on_display_area']
                timestamp = gaze_data.get('device_time_stamp', time.time())
                pupil_diameter = gaze_data.get('left_pupil_diameter', 0.0)

                data_to_send = {
                    'timestamp': timestamp,
                    'gaze_x': gaze_x,
                    'gaze_y': gaze_y,
                    'pupil_diameter': pupil_diameter,
                }

                gaze_data_url = f"{SERVER_BASE_URL}gaze/start/{self._current_session_id}/"
                try:
                    response = requests.post(
                        gaze_data_url,
                        headers={'Content-Type': 'application/json'},
                        json=data_to_send
                    )
                    if response.status_code != 200:
                        logging.error(f"Error sending gaze data: {response.status_code} - {response.text}")
                except requests.exceptions.ConnectionError as e:
                    logging.error(f"Connection error while sending gaze data: {e}")
                except Exception as e:
                    logging.error(f"Unexpected error sending gaze data: {e}")

        if self.eyetracker:
            try:
                self.eyetracker.subscribe_to(tr.EYETRACKER_GAZE_DATA, gaze_data_callback, as_dictionary=True)
                logging.info("Subscribed to Tobii gaze data.")
                while self.tracking_active:
                    time.sleep(0.015)
                self.eyetracker.unsubscribe_from(tr.EYETRACKER_GAZE_DATA, gaze_data_callback)
                logging.info("Unsubscribed from Tobii gaze data and tracking thread finished.")
            except tr.TobiiException as e:
                self.status_label.config(text=f"Status: Tobii error - {e}")
                messagebox.showerror("Tobii Error", f"An error occurred with the Tobii tracker: {e}")
                self.stop_tracking()
            except Exception as e:
                self.status_label.config(text=f"Status: Tracking error - {e}")
                messagebox.showerror("Error", f"An unexpected error occurred during tracking: {e}")
                self.stop_tracking()

def main():
    root = tk.Tk()
    app = TobiiApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()
