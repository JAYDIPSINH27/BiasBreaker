# 🌐 Website Running Guide

To run the **BiasBreaker** web application locally or on a remote lab server where the domain is not HTTPS-enabled, webcam access in browsers like Chrome is **restricted by default** due to security policies. To bypass this and allow webcam access over HTTP for development/testing, follow the steps below.

---


## 🛠 Enabling Webcam Access for HTTP (Temporary Chrome Bypass)

If you're running the site over **HTTP**, Chrome blocks webcam access. To override this restriction, launch Chrome with special flags:

### ✅ Windows (PowerShell)
```bash
Start-Process "chrome.exe" -ArgumentList '--unsafely-treat-insecure-origin-as-secure="http://persuasive.research.cs.dal.ca:4987/"', '--user-data-dir=C:\tempchrome', '--disable-web-security'
```

This command:
- Treats the HTTP origin as if it's secure.
- Temporarily disables web security for that session.
- Stores session data separately (`C:\tempchrome`) so it doesn't affect your main Chrome profile.


---

## 🚀 Accessing the Website

The website is hosted at:

👉 [http://persuasive.research.cs.dal.ca:4987/](http://persuasive.research.cs.dal.ca:4987/)

You can directly visit the above URL to interact with the application.

---

## 👁️ Running the Tobii Eye Tracker

BiasBreaker supports **real-time eye-tracking** using the **Tobii Eye Tracker 5**, providing insights into user attention and engagement while reading.

---

### 🛠 Prerequisites

Before running the tracker:

1. ✅ **Tobii Pro Spark** is recommended (tested for better compatibility) and it  must be connected and functioning.
2. ✅ **Tobii Pro Eye Tracker Manager** must be installed.

Make sure your tracker is properly calibrated and recognized in the Tobii software before proceeding.

---

### 🚀 How to Run the Tracker

1. **Start the Web Application**

   Ensure the BiasBreaker app is running locally or accessible via the lab server.

2. **Navigate to the Tobii Client**

   Open a terminal or file explorer and go to the Tobii WebSocket client folder:

   ```
   BiasBreaker/tobii_client/
   ```

3. **Run the Executable as Administrator**

   Right-click on:
   ```
   biasbreaker_eye_tracker.exe
   ```
   and choose **"Run as Administrator"** to allow access to hardware and ports.

4. **Generate a Session**

   - Visit the BiasBreaker web app.
   - Start a new **eye-tracking session** from the UI.
   - Copy the **generated session ID**.

5. **Paste the Session ID**

   When prompted by the terminal or GUI window, paste the session ID to start streaming gaze data to the backend.

---

### 🧪 Notes

- Gaze data will be sent to the WebSocket server (`/ws/gaze-collector/`) in real-time.
- Data includes gaze coordinates (`x`, `y`) and pupil diameter.
- This data is stored in the backend and used for **focus analysis**, **fixation detection**, and **analytics**.

---

### 🧯 Troubleshooting

| Issue                         | Solution                                       |
|------------------------------|------------------------------------------------|
| Tracker not detected         | Ensure Tobii software is running and updated  |
| Session not started          | Check WebSocket connection and ID accuracy    |
| No data in analytics         | Ensure session was active long enough         |
| Permissions error            | Always run the `.exe` as Administrator        |


## 🔐 Future HTTPS Hosting

Once the frontend is deployed under an **HTTPS-secured domain**, this step will no longer be necessary. Browsers will automatically allow webcam access when served over HTTPS.

You can also use services like:
- [Let's Encrypt](https://letsencrypt.org/) for free SSL certificates
- [Cloudflare](https://www.cloudflare.com/) for HTTPS tunneling and caching
- A reverse proxy like NGINX to terminate SSL

---

## 🧪 Quick Test Checklist

| Feature                     | Should Work? | Notes |
|----------------------------|--------------|-------|
| Webcam Gaze Tracking       | ✅            | Only with HTTPS or Chrome override |
| Tobii Eye Tracker          | ✅            | Works via local Python WebSocket bridge |
| WebSocket Communication    | ✅            | Requires proper CORS and WS handling |
| Points & Analytics         | ✅            | After reading articles or quizzes |

---

If you face any issue, please ensure:
- You used the correct Chrome launch flags
- Your webcam is not blocked by browser/system
- No other app is using the webcam
