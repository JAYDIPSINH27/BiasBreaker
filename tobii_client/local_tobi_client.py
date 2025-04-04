import tobii_research as tr
import websocket
import json
import time

# Replace with your actual WebSocket path for production.
ws = websocket.create_connection("ws://localhost:8000/ws/gaze-collector/")

eyetrackers = tr.find_all_eyetrackers()
if not eyetrackers:
    print("No Tobii hardware detected!")
    exit(1)

eyetracker = eyetrackers[0]
print(f"Found Tobii device: {eyetracker.address}")

def gaze_callback(gaze_data):
    if 'left_gaze_point_on_display_area' in gaze_data:
        x, y = gaze_data['left_gaze_point_on_display_area']
        if x is not None and y is not None:
            payload = {
                "type": "eye.data",
                "payload": {"gaze_x": x, "gaze_y": y, "source": "tobii"}
            }
            ws.send(json.dumps(payload))

eyetracker.subscribe_to(tr.EYETRACKER_GAZE_DATA, gaze_callback, as_dictionary=True)

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    eyetracker.unsubscribe_from(tr.EYETRACKER_GAZE_DATA, gaze_callback)
    ws.close()
    print("Stopped Tobii tracking.")
