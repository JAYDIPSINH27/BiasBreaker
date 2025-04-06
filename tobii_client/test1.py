import websocket
import json
import time
import random

# WebSocket URL to your backend consumer
WS_URL = "ws://localhost:8000/ws/gaze-collector/"

def send_mock_gaze_data(ws):
    try:
        while True:
            # Generate random gaze coordinates within typical screen resolution (1920x1080)
            gaze_x = random.uniform(0, 1920)
            gaze_y = random.uniform(0, 1080)
            pupil_diameter = random.uniform(2.0, 5.0)

            payload = {
                "type": "eye.data",
                "payload": {
                    "gaze_x": gaze_x,
                    "gaze_y": gaze_y,
                    "pupil_diameter": pupil_diameter,
                    "source": "tobii"
                }
            }

            # Send JSON payload to the backend
            ws.send(json.dumps(payload))
            print(f"Sent: {payload}")

            # Mimic realistic data frequency (~30 Hz)
            time.sleep(1/30)  # about 33 milliseconds
    except KeyboardInterrupt:
        print("Stopping mock gaze data sender.")

if __name__ == "__main__":
    ws = websocket.create_connection(WS_URL)
    print(f"Connected to {WS_URL}")

    send_mock_gaze_data(ws)

    ws.close()
    print("WebSocket connection closed.")
