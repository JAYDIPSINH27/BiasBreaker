**Tobii Eye Tracker Client – Developer Documentation**

**Overview**

The **Tobii Eye Tracker Client** is a Python-based application for real-time eye-tracking data capture and streaming. It connects to a Tobii eye-tracking device using the Tobii Pro SDK and subscribes to live gaze data, including gaze coordinates and pupil diameter, in real-time. The client provides a simple GUI (built with Tkinter) for researchers to start/stop data capture and label the session (e.g., via a Session ID). Gaze data is transmitted over a WebSocket connection to a backend server (e.g., a Django application) for further processing, visualization, and storage. This allows developers and researchers to integrate eye-tracking into interactive applications or experiments, with features like real-time gaze visualization, fixation detection, and automated alert triggers based on where and how long the user is looking. In summary, the Tobii Eye Tracker Client serves as a bridge between Tobii hardware and a web-based analytics pipeline, enabling **live gaze tracking** and data collection in research studies or interactive systems.

**Requirements**

To set up and run the Tobii Eye Tracker Client, make sure you have the following prerequisites:

- **Python 3.10 or higher** – The client is written for Python 3.10+ (Tobii Pro SDK 2.1.0 introduced support for Python 3.10​[pypi.org](https://pypi.org/project/tobii-research/#:~:text=tobii)​developer.tobiipro.com). Using the latest Python 3.10.x release is recommended for compatibility.
- **Tobii Pro eye-tracking device** – A supported Tobii Pro series eye tracker with drivers installed. Supported models include **Tobii Pro Spectrum, Tobii Pro Fusion, Tobii Pro Nano, and Tobii Pro Spark**​developer.tobiipro.com. (Discontinued older models like X2-60/X3-120 may require older SDK versions, and consumer devices such as the **Tobii Eye Tracker 4C/5 or VR headsets are _not_ supported** by the Tobii Pro SDK​developer.tobiipro.com.)
- **Tobii Pro SDK (Python)** – The Tobii Pro SDK provides the tobii_research Python library used to interface with the eye tracker. This can be installed via pip (see Installation) or from Tobii’s official SDK download. Ensure you use the version matching your Python environment (e.g., Tobii Pro SDK 2.1 for Python 3.10).
- **Python Libraries** – Several Python packages are required:
  - tobii_research – Tobii’s Python SDK package for eye tracker access (Pro SDK). This is a proprietary package available via Tobii (pip installable)​[developer.tobiipro.com](https://developer.tobiipro.com/python/python-getting-started.html#:~:text=When%20you%20have%20pip%20installed%2C,pip%20install%20tobii_research).
  - websocket-client – Used for establishing the WebSocket connection from the client to the server.
  - tkinter – Used for the GUI. (Tkinter is included in the standard library for most Python distributions. On some Linux systems, you may need to install an OS package like python3-tk.)
  - queue – Used for thread-safe communication between the data capture thread and the GUI/send thread (part of Python’s standard library).
  - **Backend requirements**: _Django_ (with Django Channels if using WebSockets) – The server-side application is assumed to be a Django project that can receive WebSocket data and provide REST APIs. While Django is not needed to run the client itself, it is listed here for completeness because the typical deployment involves a Django backend. A Django Channels setup is expected to handle WebSocket connections in the backend.
- **Operating System** – This client is cross-platform, but support for Tobii devices depends on the Tobii Pro SDK:
  - **Windows 10/11 (64-bit)** – Fully supported platform for Tobii Pro SDK​developer.tobiipro.com. Most development and testing is typically done on Windows since Tobii’s drivers are readily available on Windows.
  - **macOS 13+ (Intel & Apple Silicon)** – Supported by Tobii Pro SDK 2.1 and above​developer.tobiipro.com​developer.tobiipro.com. On Apple Silicon Macs (M1/M2), Tobii SDK 2.1 provides native support; with older SDK versions, you must use Rosetta 2 compatibility (install an x86_64 Python interpreter to use tobii_research under Rosetta​developer.tobiipro.com). macOS 13 (Ventura) and 14 (Sonoma) on Intel or ARM are officially tested.
  - **Linux (Ubuntu 22.04 LTS 64-bit)** – Officially supported for the Tobii Pro SDK​developer.tobiipro.com. Linux support requires that the avahi-daemon (mDNS/zeroconf service) is running to discover networked eye trackers​developer.tobiipro.com. USB-connected trackers also work on Linux, but you may need additional udev rules (refer to Tobii’s documentation) and ensure your user has permission to access USB HID devices.
  - _Note:_ Regardless of OS, only one application can typically connect to a Tobii eye tracker at a time. Ensure that no other Tobii software (e.g., Tobii Pro Lab or Eye Tracker Manager) is actively streaming data from the device when you run the client.

**Installation Guide**

Follow these steps to install and configure the Tobii Eye Tracker Client application:

1. **Install Python 3.10+**: Ensure that Python (3.10 or newer) is installed on your system. It's recommended to use a 64-bit Python installation, as the Tobii SDK does not support 32-bit on most platforms. You can download Python from the official website or use a package manager. Verify the installation by running python --version in your terminal.
2. **Set Up a Virtual Environment (optional)**: It’s good practice to use a virtual environment for Python projects. You can create one using python -m venv venv and activate it (source venv/bin/activate on Linux/Mac, or .\\venv\\Scripts\\activate on Windows). This will isolate the project’s dependencies.
3. **Install Tobii Pro SDK (tobii_research)**: The Tobii Pro SDK for Python is available via PyPI. Install it using pip:

```bash

pip install tobii_research
```
This will download and install the Tobii SDK package for your platform. (Alternatively, you can download the SDK from Tobii’s website and install it manually, but pip is simpler​[developer.tobiipro.com](https://developer.tobiipro.com/python/python-getting-started.html#:~:text=When%20you%20have%20pip%20installed%2C,pip%20install%20tobii_research).) After installation, you can run pip list and check that tobii-research is listed to confirm it installed successfully​[developer.tobiipro.com](https://developer.tobiipro.com/python/python-getting-started.html#:~:text=When%20you%20have%20pip%20installed%2C,pip%20install%20tobii_research). **Important:** If pip fails with a message about no available version, ensure your Python version is supported by the SDK. Tobii may provide wheels only for specific Python versions. For example, Tobii Pro SDK 1.x only supported up to Python 3.6, but version 2.1.0 supports Python 3.10​[pypi.org](https://pypi.org/project/tobii-research/#:~:text=tobii)​[pypi.org](https://pypi.org/project/tobii-research/#:~:text=,17).

1. **Install Other Dependencies**: Next, install the additional libraries required by the client:

```bash

pip install websocket-client

pip install django channels
```
The websocket-client library is used by the client to communicate with the WebSocket server. Django and Channels are needed on the **server side**; you don't need to install Django to run the client, unless you plan to run server code in the same environment. (If you are only running the client, Django is not mandatory. But for development convenience you might install it to have the same environment as the server.)

1. **Tobii Pro Eye Tracker Manager (Optional, for device setup)**: Tobii provides an application called **Tobii Pro Eye Tracker Manager** which can be useful to install the necessary drivers, update firmware, and perform calibrations. It’s not strictly required to run the client, but it's recommended to have it for managing the device. You can download it from Tobii’s website. Use it to ensure your eye tracker is up-to-date and, if needed, calibrated. (Calibration can also be done via the SDK, but the Manager provides a GUI approach.)
2. **Verify the Tobii Device Connection**: Before running the full client, it’s a good idea to verify that your system can detect the eye tracker via the SDK. You can do this in a Python shell or a simple script:

```python


import tobii_research as tr

trackers = tr.find_all_eyetrackers()

if trackers:

print("Connected eye tracker found:")

for t in trackers:

print(f" Model: {t.model}, Name: {t.device_name}, Serial: {t.serial_number}")

else:

print("No eye tracker found. Check connections and drivers.")

```
This uses the find_all_eyetrackers() function to search for any connected Tobii eye trackers​[developer.tobiipro.com](https://developer.tobiipro.com/python/python-step-by-step-guide.html#:~:text=Now%20you%27re%20ready%20to%20start,output%20to%20a%20new%20variable). If an eye tracker is found, it will list its details such as model, device name, and serial number​[developer.tobiipro.com](https://developer.tobiipro.com/python/python-step-by-step-guide.html#:~:text=The%20return%20value%20of%20,and%20print%20it%2C%20like%20this). If no tracker is found, ensure the device is plugged in, powered on (if applicable), and that you have installed any necessary drivers or services. On Linux, check that avahi-daemon is running if the tracker is network-connected. On Windows, you might need to allow network access if using a networked tracker (the SDK uses mDNS and network sockets).

1. **Configure the Client Application**: If the Tobii Client is part of a larger project or provided as source code, ensure that you have the source files. Typically, the application might be a Python script (e.g., tobii_client.py) or a package. No special configuration is needed beyond installing dependencies, but you may want to edit a config file or constants in the script:
    - **WebSocket URL**: The client likely has a default WebSocket server URL (e.g., ws://localhost:8000/ws/gaze/). If your Django server is running on a different host or port, or uses secure WebSocket (wss://), update the URL accordingly in the client’s source (perhaps a constant like SERVER_URL or similar).
    - **Session Management**: By default, the client will prompt for a Session ID in the GUI. This ID may correspond to a record in the database or simply a label. Ensure you know what format the server expects (it could be a numeric ID or an alphanumeric code). No additional config is usually needed for session, aside from entering it at runtime.
2. **Run a Test**: With everything installed and configured, you can now run the Tobii Client application. Typically, you would use:

```bash

python tobii_client.py
```

(Replace with the actual script name if different.) The first time, run it from a terminal to see any log output. The GUI window should appear (if Tkinter is working properly). We will cover usage in the next section. If you encounter errors on startup, consult the troubleshooting tips in **Developer Notes** below.

By the end of installation, you should have a working environment where the Tobii Client can detect the eye tracker and is ready to stream data to the server.

**Usage Instructions**

Once installation is complete, using the Tobii Eye Tracker Client involves launching the application and interacting with its GUI to control the tracking session. Below are the typical usage steps and features:

1. **Launch the Client Application**: Run the Python script for the Tobii client (e.g., python tobii_client.py). A GUI window will open. The GUI is built with Tkinter and usually contains:
    - A text field or input for **Session ID** (or experiment ID/participant ID). This allows you to label the data stream so the backend knows which session the data belongs to.
    - A button to **Connect/Start Tracking** and a **Stop** button to end the tracking.
    - Status indicators or log area (possibly showing messages like “Connected to server” or “Tracker not found” etc.).
2. **Connect to WebSocket Server**: In the GUI, enter the Session ID (and any other required info, such as server address if not fixed) and then press the **Start** button. This will trigger the client to establish a WebSocket connection to the configured server URL. Under the hood, the websocket-client library is used to create a connection to the server’s WebSocket endpoint (for example, ws://localhost:8000/ws/gaze/&lt;session_id&gt;/). If the connection succeeds, the GUI might display a “Connected” status. If it fails (e.g., server not running or wrong address), an error message will be shown (and logged to console).
3. **Start Eye-Tracking Data Capture**: Upon successful WebSocket connection, the client will initiate gaze tracking:
    - The application calls tobii_research.find_all_eyetrackers() (if not done already) to get the EyeTracker object (assuming one tracker). It then subscribes to gaze data using the Tobii SDK. For example, it may call:

```python

my_tracker.subscribe_to(

tr.EYETRACKER_GAZE_DATA,

gaze_data_callback,

as_dictionary=True

)
```

This tells the SDK to start streaming gaze data and call the provided gaze_data_callback function for each new data sample​[reddit.com](https://www.reddit.com/r/TobiiGaming/comments/1dgdy6g/using_python_sdk_getting_no_tracking_output/#:~:text=def%20gaze_data_callback%28gaze_data%29%3A%20print%28%27aaa%27%29%20,gaze_right_eye%3Dgaze_data%5B%27right_gaze_point_on_display_area). The as_dictionary=True parameter means the SDK will supply gaze data as a Python dict for convenience, instead of a custom object.

- - **Gaze Data Callback**: The gaze_data_callback is a function defined in the client that handles incoming data. Each time the eye tracker captures a new gaze sample (which could be as often as 60-120 times per second depending on the device), this function is invoked with a data dictionary. For example, the data dictionary contains keys like:
        - 'left_gaze_point_on_display_area' and 'right_gaze_point_on_display_area': the \[x, y\] coordinates of the gaze point for the left and right eye, in normalized display coordinates​[reddit.com](https://www.reddit.com/r/TobiiGaming/comments/1dgdy6g/using_python_sdk_getting_no_tracking_output/#:~:text=,gaze_right_eye%3Dgaze_data%5B%27right_gaze_point_on_display_area). (Normalized means (0,0) is top-left of the screen and (1,1) is bottom-right​[developer.tobiipro.com](https://developer.tobiipro.com/commonconcepts/coordinatesystems.html#:~:text=The%20origin%20of%20the%20Active,lower%20right%20corner%20of%20it).)
        - 'left_pupil_diameter' and 'right_pupil_diameter': the pupil size for each eye, typically in millimeters.
        - 'left_gaze_point_validity' / 'right_gaze_point_validity': boolean flags indicating if the gaze data for each eye is valid (True) or if the eye tracker wasn’t confident (False). Similarly, 'left_pupil_validity' for pupil data validity​[github.com](https://github.com/esdalmaijer/PyGaze/blob/master/pygaze/_eyetracker/libtobii.py#:~:text=if%20gaze_sample%5B).
        - Timestamp or device time may also be included (depending on SDK, e.g., 'device_time_stamp').
    - The callback function in the client filters and packages this data for sending. **Invalid data is skipped**: If the eye tracker flags a sample as invalid (e.g., if the participant blinked or the eye moved outside the tracker range, causing a data drop-out), the client will likely **ignore that sample** rather than sending misleading data. For instance, the code may check if not gaze_data\["left_gaze_point_validity"\] and not gaze_data\["right_gaze_point_validity"\]: return to skip processing if neither eye has valid data. This follows Tobii’s recommendation to discard data marked invalid​[developer.tobiipro.com](https://developer.tobiipro.com/commonconcepts/validitycodes.html#:~:text=In%20the%20Tobii%20Pro%20SDK%2C,internal%20noise%20of%20some%20kind).
    - **Data Filtering**: In addition to validity, the client might combine or reduce the data. A common approach is to compute a single gaze point from both eyes (e.g., average the left and right eye coordinates, if both are valid, or use the one valid eye if only one is valid). Similarly, pupil diameter might be averaged between eyes or taken from one eye. This provides one unified set of gaze coordinates and pupil size per timestamp for simplicity. The client can also attach the Session ID and maybe a local timestamp to the data payload.

1. **Streaming Data via WebSocket**: The valid gaze data samples are sent over the WebSocket connection to the server. The client likely uses a small buffer or queue to manage sending:
    - A separate thread or loop may be running to send data to the server so that the callback (which is invoked by the SDK's internal thread) doesn’t get bogged down. For example, the gaze_data_callback could put each new data point into a queue.Queue. Meanwhile, the main thread (or a dedicated sender thread) continuously checks this queue and sends data over the WebSocket.
    - **Data Format**: The data is typically serialized to JSON for sending. For example, a payload might look like:

```json

Copy

{

"session": "ABC123",

"timestamp": 1693512345.123,

"gaze_x": 0.456,

"gaze_y": 0.512,

"pupil_left": 4.2,

"pupil_right": 4.0

}
```

(The exact fields can vary; the key is that gaze coordinates and pupil diameters are included. If only one combined gaze point is used, it might be "gaze_x": 0.47, "gaze_y": 0.51, "pupil": 4.1 etc.)

- - **Throttling**: To avoid flooding the network or backend, the client enforces a send throttle. In the code, a constant like SEND_THROTTLE = 0.05 (50 milliseconds) is used. This means the client will send at most one message every 0.05 seconds (20 messages per second). If the eye tracker is running at a higher frame rate (e.g., 120 Hz), the client might drop some frames and only send the latest data at each 50 ms interval. This **throttling mechanism** ensures that the WebSocket server isn’t overwhelmed by data volume and that network latency is kept in check. (In practice, human gaze doesn’t need every single 2ms sample for analysis – 20 Hz is sufficient for most real-time visualization or interaction.)
    - The throttle might be implemented by tracking the last send time. For example:

```python


if time.time() - last_send_time >= SEND_THROTTLE:

ws.send(json.dumps(payload))

last_send_time = time.time()

```

This way, if data comes in faster than 20 Hz, some messages are skipped. The latest gaze point is typically representative enough for smooth tracking.

1. **Stopping the Session**: You can stop the tracking by clicking the **Stop** button in the GUI. This will cause the client to:
    - Unsubscribe from the Tobii gaze data stream: e.g., calling my_tracker.unsubscribe_from(tr.EYETRACKER_GAZE_DATA, gaze_data_callback) to tell the SDK to stop invoking the callback​[reddit.com](https://www.reddit.com/r/TobiiGaming/comments/1dgdy6g/using_python_sdk_getting_no_tracking_output/#:~:text=my_eyetracker). This stops data collection from the device.
    - Close the WebSocket connection to the server (ws.close()).
    - Update the GUI status (perhaps indicating that tracking has stopped).
    - The backend server will also get a WebSocket disconnect event, which it can use to mark the session as finished if needed.
    - If you wish to start a new session, you can enter a new session ID (or reuse the same) and press Start again to reconnect and stream again.
2. **Data Captured**: During the session, the data being captured and sent includes:
    - **Gaze Coordinates**: 2D coordinates of where the user is looking on the screen. These are normalized to the active display area (0 ≤ x ≤ 1, 0 ≤ y ≤ 1)​[developer.tobiipro.com](https://developer.tobiipro.com/commonconcepts/coordinatesystems.html#:~:text=The%20origin%20of%20the%20Active,lower%20right%20corner%20of%20it). If needed, these can be converted to pixel coordinates on the screen by multiplying by screen resolution in the backend or client.
    - **Pupil Diameter**: Size of each pupil in millimeters (or arbitrary unit depending on device calibration). Pupil data gives insight into dilation (which can correlate with cognitive load or lighting).
    - **Timing**: Each sample can be timestamped. The Tobii SDK provides a timestamp (often in microseconds) for each sample, and the client may also timestamp when it sends or receives it. This can be used later to sync with other data (e.g., stimulus events).
    - The client filters out incomplete data – e.g., if one eye is closed or not detected, you might still get data from the other eye if valid. The application ensures that data with **no valid eyes** is not sent (to avoid sending NaNs or nulls). This keeps the dataset clean.
    - Typically, if one eye is valid and the other is not, the data is still sent (using the valid eye’s info). The end consumer (backend or analysis code) can decide how to handle such cases (e.g., use monocular data or interpolate).
3. **User Feedback**: The GUI may provide some basic feedback:
    - Indicating connection status (Connected/Disconnected).
    - Perhaps a simple real-time indicator (for example, a light or text that blinks when data is being sent, or a counter of samples).
    - Any errors (like “Could not find eye tracker” or “WebSocket connection lost”) might be shown in a status label or printed to the console.

In summary, using the Tobii Client involves launching the app, connecting to the server with a session ID, and letting it stream gaze and pupil data live. The process is largely automated once started, and the user only needs to interact again to stop the session or start a new one. The design makes it easy for researchers to collect gaze data in real-time with minimal setup each run.

**Data Flow and Architecture**

Understanding the data flow helps in extending or debugging the application. The Tobii Eye Tracker Client is part of a pipeline that streams eye-tracking data from the hardware to a backend system. Below is the **real-time data pipeline** breakdown and how each component interacts:

1. **Tobii Eye Tracker Hardware**: A participant/user’s gaze is tracked by the Tobii device (e.g., Tobii Pro Fusion). The device computes gaze point and pupil size continuously (often at 60 Hz, 120 Hz, or higher depending on model). The Tobii hardware and its driver handle the low-level eye tracking and feed data to the Tobii Pro SDK on the computer.
2. **Tobii Pro SDK (in Client Application)**: The client application uses the Tobii Pro SDK (tobii_research) to interface with the hardware. When the client starts tracking, it establishes a connection to the tracker (this might happen behind the scenes on the first subscribe call). The SDK then pushes gaze data to the application via the callback function. Internally, the Tobii SDK manages threading and data acquisition from the device. Each new gaze sample triggers the gaze_data_callback in our code with a data packet. This part of the pipeline is highly optimized by Tobii – data comes in with minimal latency to the client.
3. **Client Gaze Callback Processing**: The gaze_data_callback (running inside the Tobii SDK’s thread context) receives each data point. Here the application **processes and filters** the data:
    - Checks validity flags; if data is not trustworthy (no eyes tracked), it discards it​[developer.tobiipro.com](https://developer.tobiipro.com/commonconcepts/validitycodes.html#:~:text=In%20the%20Tobii%20Pro%20SDK%2C,internal%20noise%20of%20some%20kind).
    - Potentially transforms the data (e.g., averaging eyes, adding session ID, formatting as JSON string).
    - Instead of sending directly from this callback (which could be at a high frequency), the data is typically placed into a thread-safe queue (queue.Queue).
    - By queuing data, the client avoids blocking the Tobii SDK thread (which could cause data loss if it doesn’t return quickly). The queue acts as a buffer if the sending thread is momentarily slower than the incoming data.
4. **Throttling and Send Thread**: The client likely runs a separate loop (on the main thread or a dedicated thread) that monitors the queue of outgoing data. This loop enforces the SEND_THROTTLE (50 ms) interval. At each tick (or whenever data is available and the throttle timer allows), it pulls the latest gaze data from the queue and sends it through the WebSocket:
    - If multiple data points accumulated in the queue since the last send (e.g., tracker running at 120 Hz but sending at 20 Hz), the client might take only the most recent sample or condense them. This ensures the data stream to the server stays real-time and doesn’t lag behind (older samples are dropped if not sent in time).
    - The data is sent via the WebSocket connection by calling websocket.send() with the JSON message. The websocket-client library handles the underlying socket communication.
    - If the WebSocket send fails (due to disconnect or error), the client catches the exception. In case of a failure, it may log the error and attempt a reconnection (described below).
5. **Network Transport (WebSocket)**: The gaze data travels over the network (or local machine) through a WebSocket protocol. WebSockets provide a persistent connection, allowing low-latency, bi-directional communication. The client is the **WebSocket client** and the Django server acts as the **WebSocket server** (via Django Channels). Data sent by the client is received by the server’s consumer almost instantaneously (order of milliseconds).
6. **Django Backend WebSocket Consumer**: On the server side, Django Channels has a **consumer** listening on a route (for example, /ws/gaze/&lt;session_id&gt;/). The flow here is:
    - When the client connects, the Channels consumer’s connect() method is called. It typically does self.group_name = f"session_{session_id}" and then async_to_sync(self.channel_layer.group_add)(self.group_name, self.channel_name) (if using synchronous consumer) to add this socket to a group for that session. This sets up a broadcast group identified by the session.
    - The consumer then accepts the connection (accept()), ready to receive data.
    - When a gaze data message arrives, the consumer’s receive() method is invoked with the text data (the JSON the client sent). The consumer then **processes the data**:
        - Parse the JSON into a Python dict (e.g., using json.loads).
        - It might attach server-side timestamp or augment the data with additional info (like the participant or session info from database).
        - It then **broadcasts** this data to all listeners in the same session group: e.g., self.channel_layer.group_send(self.group_name, {"type": "gaze_message", "data": data}). In Channels, this will forward the data to any WebSocket connections (e.g., a web client viewing the gaze data) that have joined the same group. Essentially, the server fan-outs the data so multiple clients (like a researcher’s dashboard or multiple observers) can see the gaze in real-time.
        - Additionally, the server often **stores the data** in a database. For example, it might create a new GazeData entry in a Django model with fields for timestamp, x, y, pupil, session, etc. This allows offline analysis later. The writing to the database can be done directly in the consumer (though for high-frequency data, one might batch insert or offload to a Celery task to avoid slowing down the async loop).
    - The Channels consumer continues to do this for each message. If the client disconnects, the consumer’s disconnect() method is called, at which point it can perform cleanup (e.g., remove from group, mark session as completed in DB, etc).
7. **Database and Further Processing**: All incoming data is saved in a persistent store (SQL database or time-series store) keyed by session. This raw data can later be retrieved for analysis. Meanwhile, the server can also perform **real-time analysis** on the data stream:
    - For example, detecting fixations (more on this next) or triggering events. Because the server has the live data, it can run algorithms on the fly.
8. **Fixation Detection & Alerts (Real-time Analysis)**: A key feature in many research applications is to detect when the user’s gaze is “fixated” (staying in roughly one spot for a certain duration), as opposed to saccades (rapid moves). The backend can implement a fixation detection algorithm that runs on the stream of gaze points for each session:
    - A simple approach: track the gaze coordinates over the last 100-200 milliseconds and calculate the dispersion (the area of the smallest circle or ellipse covering those points) or the velocity (distance moved per time). If dispersion stays below a threshold for a minimum duration (e.g. >300 ms), declare a fixation. If velocity drops near zero for a period, likewise.
    - When a fixation is detected, the server can trigger an **alert**. This could be implemented by sending a special WebSocket message to any clients in the group (for example, an event message like {"type": "fixation", "x": 0.4, "y": 0.5, "duration": 0.5} indicating a fixation at that location lasting 500 ms). The web dashboard or GUI could then highlight this (e.g., draw a circle on the screen, or sound an alert if it's a safety application).
    - Alerts could also be triggered for other conditions: e.g., if the person looks away from the screen for more than X seconds (no gaze data), or if an area of interest has been gazed at.
    - The client itself **does not** perform fixation detection – it simply streams raw data. The detection logic on the server can be tuned or replaced without modifying the client, which is a benefit of this architecture.
9. **Reconnection Mechanism**: If the WebSocket connection drops (due to network issues or server restart), the client is designed to attempt reconnection. The strategy might be:
    - The websocket-client library can be run in a mode where it automatically tries to reconnect. For example, if using WebSocketApp, one can provide an on_close callback that waits a moment and then calls ws.run_forever() again.
    - Alternatively, the client might run the connection in a loop: while not stopped, if the connection is lost, sleep for a few seconds and then create a new WebSocket() and connect again, re-subscribe the eye tracker (or continue if it remained subscribed).
    - During a temporary disconnect, the Tobii SDK might continue to generate data. The client’s queue might back up if it isn’t cleared. Some implementations may choose to pause subscription when connection is lost. Simpler implementations might drop the data (clear queue) upon reconnect to only send fresh data.
    - On reconnection, a new session ID might be needed or the same can be reused depending on the use case. If continuing the same session, the backend might treat it as a continuation (if within a short time).
    - The reconnection logic helps make the system robust for long-running sessions, where a brief network hiccup shouldn’t completely break the data collection. From the user perspective, they may see a message “Reconnecting...” and then “Connected” again, without needing to manually restart.
10. **Summary of Flow**: To summarize, the **data flows** from the Tobii hardware -> Tobii SDK -> client callback -> (filtered/throttled) -> WebSocket -> Django Channels consumer -> (broadcast + database + analysis). This decoupled pipeline ensures modularity:
    - The client focuses only on data capture and sending.
    - The server focuses on data distribution and analysis.
    - Each component can be modified (e.g., you could replace the Django backend with another WebSocket server or add intermediate processing) as long as the protocol (data format and rate) remains consistent.

This architecture is designed for real-time performance and data integrity, ensuring that the potentially high-frequency eye-tracking data is handled efficiently and delivered to where it’s needed without overload.

**Backend Integration**

The Tobii Client is meant to work in tandem with a backend system (assumed to be Django in this context). This section describes how the backend receives the data and integrates it into a research application context, including data broadcasting, storage, and providing additional interfaces (like REST APIs).

- **WebSocket Endpoint and Django Channels Consumer**: The Django backend uses **Django Channels** to handle WebSocket connections. In routing.py, there would be a route for the gaze data, for example:

```python

websocket_urlpatterns = \[

path("ws/gaze/&lt;str:session_id&gt;/", consumers.GazeDataConsumer.as_asgi()),

\]
```

The GazeDataConsumer (which could subclass WebsocketConsumer or AsyncWebsocketConsumer) manages the connection. As described in the Data Flow:

- - On connect, it authenticates (if needed) and joins a group named for the session.
    - On receive, it processes incoming gaze JSON. It might directly forward it to a group so that any other WebSocket clients (like a web browser client viewing an experiment) receive the gaze data in real-time. This allows live visualization (for example, showing a dot moving where the person is looking, on a remote screen).
    - The consumer can send acknowledgements or pings back if needed, but typically the communication is mostly one-way (client -> server) for data.
    - On disconnect, the consumer removes the socket from the group. It could also update a Session model in the database to mark that the live portion ended.
- **Data Broadcasting to Frontend**: If the research setup involves observers or a real-time UI (maybe a moderator monitoring the experiment), those clients can connect to the same WebSocket group to get updates. For instance, a web dashboard could open a socket to ws://server/ws/gaze/SESSION123/ (with the same session ID). Because the Django consumer added the Tobii client to group "session_SESSION123", and also will add the dashboard’s socket to the same group on connect, the group_send in the consumer will dispatch data to both. In this way, the Tobii data is multicast to any number of subscribed viewers. This is a powerful pattern for multi-user scenarios (one producer, many consumers).
- **Data Storage**: The backend likely has a Django model for gaze data or for sessions:
  - A **Session** model might store metadata: session ID, participant info, start and end timestamps, any summary stats (like number of fixations, etc).
  - A **GazeData** model could record individual gaze points, e.g. fields: session (FK), timestamp, x, y, left_pupil, right_pupil (or an average), maybe fixation_id if post-processed.
  - On each receive, the consumer (or a separate background task) creates a new GazeData entry. If performance is a concern, the system might not save every single point (especially if hundreds per second); instead it could sample or compress. However, given research accuracy needs, it's common to log everything for replay/analysis. The developer should be mindful of database write throughput – writing 50 records per second continuously might require using bulk inserts or switching to a non-relational store optimized for time-series.
- **Fixation Detection Logic**: The backend implements logic to detect higher-level events like fixations. This could be done in two ways:
  - **Online (real-time)**: Within the WebSocket consumer or a dedicated monitoring task, continuously analyze the incoming gaze stream. For example, maintain a sliding window of the last N gaze points (covering, say, the last 300ms). Compute if all those points lie within a small radius. If yes and if N corresponds to at least 100–300ms of data, then trigger a fixation event. Once a fixation is detected, you might hold off detecting another until the gaze moves and another stable period starts (to avoid duplicating events).

When a fixation is detected, the server can do something like:

```python

self.channel_layer.group_send(self.group_name, {

"type": "fixation_event",

"x": avg_x, "y": avg_y, "duration": current_fixation_duration

})
```

The consumer would have a method fixation_event(self, event) that sends this data to WebSocket clients (like the dashboard). The GUI on the dashboard could then highlight that point or display an alert. Additionally, the backend can log this event in a separate model (e.g., Fixation with start_time, end_time, location).

- - **Offline (post-hoc)**: Alternatively or additionally, fixations can be computed after the session ends using the recorded data. There might be a background job or an API that processes all gaze points of a session to identify fixations and other metrics (like heatmaps). This is more accurate (since it can use all data and more complex algorithms) but not real-time. However, since the question mentions alert triggering, it implies at least some real-time detection is happening.

In this application, it sounds like at least simple fixation detection is done online to trigger alerts. The thresholds for fixation (e.g., dispersion threshold in degrees of visual angle or pixels, and duration threshold) can be tuned by developers.

- **Alert Triggering**: Alerts could be any notification the application needs to raise during tracking. For instance:
  - If a fixation is detected on a certain critical object (say, the user keeps staring at the “Exit” button in an interface), the system might want to prompt the user or log that.
  - If the user's gaze leaves the screen (no valid data) for a long time (indicating they looked away), the system might alert the test facilitator.
  - These alerts are usually implemented as special WebSocket messages or as entries in the database that the front-end is polling for. Since the WebSocket connection exists, the easiest is to send a message to the same group or to a specific channel.
  - From a developer perspective, to add a new alert type, you would write a condition in the consumer or related logic, and then use group_send to broadcast an alert. On the front-end, handle that message type accordingly (e.g., show a pop-up or log it).
- **REST API Endpoints**: In addition to the WebSocket real-time channel, the Django backend provides a RESTful API (likely using Django REST Framework) for session management and data access. Key endpoints might include:
  - POST /api/sessions/ – Create a new session (returns a session ID or token). This could be used by an external system to initialize a session before the client connects. In some workflows, a researcher might hit "Start Session" on a web interface which calls this API, then gives the session code to the operator who enters it into the Tobii client.
  - GET /api/sessions/&lt;id&gt;/ – Retrieve details about a session (start time, end time, number of data points, maybe participant info).
  - PATCH /api/sessions/&lt;id&gt;/ – Update a session (e.g., to mark it as finished or attach metadata).
  - GET /api/sessions/&lt;id&gt;/gaze-data/ – Retrieve recorded gaze data for that session. This could return a list of gaze points or perhaps a summarized form (due to potentially large data, sometimes you might stream it or provide download link for a CSV). For analysis, having an API endpoint is useful to quickly fetch data into analysis software or scripts.
  - GET /api/sessions/&lt;id&gt;/fixations/ – (If fixations are computed offline or stored) get the list of fixations detected in that session, with their timestamps and coordinates.
  - GET /api/alerts/ – If alerts are stored (like notable events), this could list them or allow querying by session.

These endpoints allow researchers or developers to integrate the eye-tracking data with other systems. For example, after an experiment, one could use the API to pull all data into a Jupyter notebook for analysis. Or a session management UI could use them to list all recorded sessions and their statuses.

- **Security and Access**: Typically, the WebSocket and API would be secured (with authentication tokens or session cookies). For simplicity, if this is used in a closed lab setting, it might not enforce auth on the WebSocket (assuming only the local machine or trusted machines connect). However, if deploying in a broader context, developers should ensure the WebSocket handshake uses a token or cookie for authentication (and possibly use wss:// with TLS for encryption, especially if over a network). The Django consumer can then authenticate the user or the device before accepting the connection.

Overall, the backend integration ensures that the data coming from the Tobii Client is **immediately usable**: it is stored safely, broadcast to any live viewers, analyzed for events, and made accessible via APIs. This separation of concerns (client just sends data, server handles distribution & persistence) makes the system scalable and easier to maintain.

**Developer Notes**

This section provides additional notes, tips, and troubleshooting information for developers working with the Tobii Eye Tracker Client.

- **Invalid Data Handling**: The client deliberately skips or filters out invalid data points as marked by the Tobii SDK. Each gaze sample includes validity flags for each eye​[github.com](https://github.com/esdalmaijer/PyGaze/blob/master/pygaze/_eyetracker/libtobii.py#:~:text=if%20gaze_sample%5B) and possibly for combined data. The code ensures that if both eyes are invalid for a given sample (meaning the tracker couldn’t reliably compute gaze), that sample is not sent to the server. This prevents cluttering the data stream with "no data" points. Developers can adjust this logic if needed (for example, if you want to send an explicit marker when eyes are lost, you could send a special message instead of skipping). But as a rule, **always check the validity flags**​[developer.tobiipro.com](https://developer.tobiipro.com/commonconcepts/validitycodes.html#:~:text=In%20the%20Tobii%20Pro%20SDK%2C,internal%20noise%20of%20some%20kind) before trusting a gaze or pupil measurement.
- **Common Calibration Issues**: If you find that gaze data is present but not accurate, it may be that the tracker needs calibration for the user. The Tobii Pro SDK allows calibration via the ScreenBasedCalibration class, but this client application does not automate calibration (it assumes either the default factory calibration or that you have calibrated using the Tobii Pro Eye Tracker Manager beforehand). For consistent results, ensure each participant is calibrated. You could extend the client to run a calibration routine (displaying calibration targets on screen and using EyeTracker.collect_data() and compute_and_apply() from the SDK), but this requires more complex GUI work. Many labs simply use the Tobii Pro Eye Tracker Manager prior to running the experiment to calibrate the subject.
- **WebSocket Connection Errors**: If the client fails to connect to the WebSocket:
  - Double-check the server address (hostname and port) and that the server is running. If using Django’s development server for Channels, ensure you started it with an ASGI server (daphne or uvicorn) since the Django dev server may not serve websockets by default.
  - If you see SSL/TLS errors, it might be attempting a wss:// connection without proper certificates. In a testing scenario, you can use ws:// (non-secure) on localhost. In production, set up proper TLS or a reverse proxy.
  - Firewall issues: On Windows, the first time you run the Django Channels server or the Tobii client, Windows Firewall might prompt to allow access. If blocked, the connection won’t be made. Ensure both the server and client are allowed through the firewall on the appropriate network (private or domain network if in lab).
  - If the connection drops frequently, check network stability. The client’s auto-reconnect will handle some dropouts, but frequent drops indicate a bigger issue. Possibly the server is overloaded or crashes – check server logs for exceptions in the consumer (e.g., database errors).
  - **Troubleshooting**: Use a WebSocket testing tool or a simple script to echo messages to ensure the server endpoint is reachable. For example, you could use websocat or browser dev tools to connect to the WebSocket URL.
- **Tobii Device Not Detected**: If find_all_eyetrackers() returns an empty list:
  - Ensure the device is connected via the correct interface (USB or LAN). If USB, try a different port or cable. If network, ensure the PC and the tracker are on the same network and that multicast traffic (mDNS) is allowed (some corporate networks block mDNS).
  - Verify that the Tobii device is powered and not in use by another program. Only one application can stream from the tracker at once.
  - On Windows, check if the Tobii service is running. Some Tobii devices (especially older ones) require the Tobii Service or EyeX Engine. Tobii Pro devices usually don’t need a separate service, but installing the Eye Tracker Manager ensures drivers are in place.
  - On Linux, remember to run avahi-daemon for network discovery​developer.tobiipro.com. If you cannot run avahi (mDNS), you might still connect by using the tracker’s address directly if known (the SDK allows connecting via IP address or hostname of the tracker).
  - Check for any SDK error messages. Tobii SDK might output to console or logs if, for example, the firmware is incompatible with the SDK version.
  - If you have a consumer model (like Tobii EyeX, 4C, or Tobii Eye Tracker 5), note that **these will not appear** via tobii_research​developer.tobiipro.com. They use a different SDK. This client is meant for Tobii Pro line trackers only.
- **Performance Considerations**: The client is lightweight and can generally keep up with the eye tracker’s data rate when throttled to 20 Hz. However, if you attempt to send at the full device rate (especially for high-end devices like Spectrum at 600 Hz), you may encounter performance issues:
  - The Python GIL might become a bottleneck if the callback is doing heavy work. (In our design, we minimize work in the callback.)
  - The network and backend might not handle the throughput. Always use the throttle unless you have a specific need for all data points in real-time.
  - If you need higher frequency data recorded, you can still subscribe at full rate but maybe only use the additional points for local logging. For example, log to a local file every sample, but send to server throttled data. This way you have a backup of all data locally.
  - Ensure the machine running the client isn’t overloaded with other tasks, as missed scheduler slices could delay data sending.
- **Extensibility – Supporting Additional Data**: The Tobii Pro SDK provides more than just gaze point and pupil diameter. For example, it can provide **eye position** in 3D (the location of the eyes in space relative to the tracker) and **eye openness** (a measure related to eyelid closure). Currently, the client focuses on core gaze and pupil data. If a developer wants to extend the client to capture more:
  - You can subscribe to other data streams if available. (The SDK has other subscriptions like EYETRACKER_PUPIL_DATA if not already included, though gaze data already has pupil info, or EYETRACKER_EXTERNAL_SIGNAL if using external sync events.)
  - Add those fields to the data payload to send over WebSocket. Make sure to update the backend to handle and store the new fields.
  - For example, capturing eye openness could enable blink detection – you could then implement an alert for prolonged eye closure (micro-sleep detection).
  - If using multiple Tobii trackers (in rare scenarios of multi-user or multi-device setups), the client would need to handle multiple devices. The current design assumes one tracker. It’s possible to extend by running find_all_eyetrackers() and picking one or even handling two in parallel (each with its own callback). But Tobii’s SDK might have limitations on multiple simultaneous streams, and the data model becomes more complex (you’d identify which tracker a data point came from).
- **Extensibility – Other Alert Types**: The fixation alert is just one example. The system can be extended to detect and act on other gaze-derived events:
  - **Area of Interest (AOI) hit**: If the experiment has defined regions on the screen (AOIs), you can check if gaze coordinates fall into an AOI and for how long. The server can then trigger an event, e.g., “User is looking at the top-right ad for 2 seconds.”
  - **Saccade detection**: Detect rapid movements (high velocity) and possibly log their characteristics (amplitude, direction).
  - **Drowsiness detection**: Using blink rate (which can be derived from periods of missing data if eye openness is available) or long blink durations in combination with gaze patterns.
  - Implementing these might involve more complex logic and possibly machine learning models, but the pipeline supports it – you have the real-time data at the server, so you can plug in additional analysis modules there.
  - If an alert or event should also be fed back to the person being tracked (for biofeedback experiments), the server can send a message _to the Tobii client_ or another app that the participant can see. For example, if using this in a training scenario, upon detecting a certain gaze behavior, the server could send a message back which the Tobii client (if programmed to handle it) could display on its UI. The websocket-client library can listen for messages from server too (via an on_message callback). Right now, the client likely doesn’t expect incoming messages except perhaps acknowledgments, but it can be extended to, say, flash a message in the Tkinter GUI if the server sends an "alert" event.
- **Threading and GUI considerations**: If modifying the client, be mindful that Tkinter is not thread-safe. All GUI updates should happen in the main thread. The data callback from Tobii SDK is on a different thread, so it should not directly modify GUI elements. That’s why using a queue to pass data to the main loop is a good design. The main loop can periodically check the queue (maybe using Tkinter .after() scheduling) and then update GUI or send via WebSocket. Developers should maintain this pattern to avoid weird GUI freezes or crashes.
- **Testing Without a Device**: If you want to test the pipeline without having a Tobii device on hand (for front-end development, for instance), you could create a _simulated data mode_. For example, modify the client to generate dummy gaze data (like a moving dot or random values) and send that instead. You can trigger the same callbacks. Just ensure to disable find_all_eyetrackers() and instead call your dummy generator. This can help test the WebSocket transmission and backend handling. Obviously, replace with real data when a device is connected.
- **Troubleshooting Summary**:
  - _No GUI appears_: Likely an issue with Tkinter. Ensure it’s installed and working. On macOS, sometimes Python Tkinter needs an ActiveTcl installed – but on modern Python versions it’s usually bundled. Also, running remotely (SSH) without X11 forwarding will fail to show GUI.
  - _Client crashes on start with DLL error_: On Windows, if you see a DLL load failure for tobii_research, you might have a mismatch of architecture or missing VC++ redistributables. Tobii SDK might require the Visual C++ 2015-2019 runtime. Install those from Microsoft if needed.
  - _AttributeError or ImportError for tobii_research_: Ensure the package installed correctly. If using a virtual env, did you activate it before running? Also make sure you spelled tobii_research (underscore) correctly, not dash.
  - _Data seems delayed_: If you notice the data shown on the backend or UI is lagging significantly behind the user’s actual gaze, check the throttle and network. Perhaps the throttle is set too high (0.05s should not be very laggy – 50ms). If using a slower throttle, you’ll see more delay. Also, ensure the server’s processing is not the bottleneck (if it’s doing heavy DB writes synchronously, that could slow the loop). In testing on a local machine, it should feel almost instant (well under 0.1s delay).

By keeping these notes in mind, developers can more easily troubleshoot issues and extend the Tobii Eye Tracker Client for their specific research needs. The code is intended to be clear and modular: one part deals with getting data, another with sending data, and the rest is integration with external systems.

**References**

- **Tobii Pro SDK – Python Developer Guide**: Official Tobii documentation for using the Pro SDK with Python​[developer.tobiipro.com](https://developer.tobiipro.com/python/python-getting-started.html#:~:text=When%20you%20have%20pip%20installed%2C,pip%20install%20tobii_research)​[developer.tobiipro.com](https://developer.tobiipro.com/python/python-getting-started.html#:~:text=When%20you%20have%20the%20,EyeTracker.subscribe_to). This guide covers installation, finding eye trackers, subscribing to data, etc., which forms the basis of the Tobii Client’s functionality. (Link: _developer.tobiipro.com/python.html_)
- **Tobii Pro SDK Documentation – Supported Platforms**: Details on which operating systems and Python versions are supported by Tobii Pro SDK (e.g., Windows 10/11, Ubuntu 22.04, macOS 13/14 with Python 3.10)​developer.tobiipro.com​developer.tobiipro.com. This information is crucial for ensuring your environment is compatible.
- **Tobii Pro SDK Documentation – Eye Tracker Compatibility**: Lists which Tobii eye trackers are supported by the SDK​developer.tobiipro.com and notes that certain consumer devices (Tobii Eye Tracker 4C/5, Tobii Glasses, etc.) are not supported​developer.tobiipro.com.
- **Tobii Pro SDK Common Concepts**: Covers concepts like coordinate systems (the normalized screen space used for gaze points)​[developer.tobiipro.com](https://developer.tobiipro.com/commonconcepts/coordinatesystems.html#:~:text=The%20origin%20of%20the%20Active,lower%20right%20corner%20of%20it), and data validity codes (which the client uses to filter out bad data)​[developer.tobiipro.com](https://developer.tobiipro.com/commonconcepts/validitycodes.html#:~:text=In%20the%20Tobii%20Pro%20SDK%2C,internal%20noise%20of%20some%20kind). Understanding these is helpful for interpreting the data correctly.
- **Django Channels Documentation**: For understanding WebSocket consumers and groups in Django (how the server-side is implemented to receive the data). The Channels docs outline patterns used in this client-server setup, such as group_send for broadcasting messages.
- **WebSocket-Client Library**: Documentation of the websocket-client Python library, which explains how to connect, send, and handle reconnects. This is the library used in the client to manage the WebSocket connection to the server.
- **Tobii Pro SDK Python API Reference**: The reference for classes and methods like EyeTracker.subscribe_to(), EyeTracker.unsubscribe_from(), and data format. While the client code is based on it, referring to the API docs can provide details on other available subscriptions and methods (for example, calibration methods, getting device info, etc.).