import websocket, json, tobii_research as tr, time

ws = websocket.create_connection("ws://localhost:8000/ws/gaze-collector/")
eyetrackers = tr.find_all_eyetrackers()
if eyetrackers:
    eyetracker = eyetrackers[0]
    def callback(gaze_data):
        gaze_x, gaze_y = gaze_data['left_gaze_point_on_display_area']
        if gaze_x and gaze_y:
            ws.send(json.dumps({
                "type": "eye.data",
                "payload": {"gaze_x": gaze_x*1920, "gaze_y": gaze_y*1080}
            }))
    eyetracker.subscribe_to(tr.EYETRACKER_GAZE_DATA, callback, as_dictionary=True)
    try:
        while True: time.sleep(1)
    except KeyboardInterrupt:
        eyetracker.unsubscribe_from(tr.EYETRACKER_GAZE_DATA, callback); ws.close()
else:
    print("No Tobii hardware detected.")
