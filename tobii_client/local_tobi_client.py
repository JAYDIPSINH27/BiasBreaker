import tobii_research as tr
import websocket
import json
import time

# WebSocket URL (adjust to your server address/port if needed)
ws_url = "ws://localhost:8000/ws/gaze-collector/"

def create_websocket_connection():
    """Creates and returns a WebSocket connection."""
    try:
        ws = websocket.create_connection(ws_url)
        print("WebSocket connection established.")
        return ws
    except Exception as e:
        print(f"Error connecting to WebSocket: {e}")
        return None

def gaze_callback(gaze_data, ws):
    """Handles incoming Tobii gaze data and sends it to the WebSocket server."""
    if gaze_data and 'left_gaze_point_on_display_area' in gaze_data:
        x, y = gaze_data['left_gaze_point_on_display_area']
        pupil_diameter = gaze_data.get('left_pupil_diameter', None)

        # Ensure x, y, and pupil_diameter are not None
        if x is not None and y is not None and pupil_diameter is not None:
            # Construct payload with "source": "tobii"
            payload = {
                "type": "eye.data",
                "payload": {
                    "gaze_x": x,
                    "gaze_y": y,
                    "pupil_diameter": pupil_diameter,
                    "source": "tobii"
                }
            }

            # Send to WebSocket
            if ws:
                try:
                    ws.send(json.dumps(payload))
                    print(f"Gaze data sent: x={x}, y={y}, pupil_diameter={pupil_diameter}")
                except websocket.WebSocketConnectionClosedException as e:
                    print(f"WebSocket connection closed: {e}")
                    # Attempt to reconnect
                    ws = create_websocket_connection()
                    if ws:
                        print("Reconnected to WebSocket.")
                    return ws
                except Exception as e:
                    print(f"Error sending gaze data to WebSocket: {e}")
                    return ws
        else:
            print(f"Invalid gaze data: x={x}, y={y}, pupil_diameter={pupil_diameter}")
    else:
        print("No gaze data available.")

    return ws  # Keep the connection alive if possible

# Initial WebSocket connection
ws = create_websocket_connection()

# Find all connected Tobii eye trackers
eyetrackers = tr.find_all_eyetrackers()
if not eyetrackers:
    print("No Tobii hardware detected!")
    exit(1)

eyetracker = eyetrackers[0]
print(f"Found Tobii device: {eyetracker.address}")

# Subscribe to Tobii gaze data stream
eyetracker.subscribe_to(tr.EYETRACKER_GAZE_DATA, gaze_callback, as_dictionary=True)

# Keep running
try:
    while True:
        if not ws:
            print("Reconnecting to WebSocket...")
            ws = create_websocket_connection()
        time.sleep(0.1)  # Sleep to avoid hogging CPU
except KeyboardInterrupt:
    eyetracker.unsubscribe_from(tr.EYETRACKER_GAZE_DATA, gaze_callback)
    if ws:
        ws.close()
    print("Stopped Tobii tracking.")
