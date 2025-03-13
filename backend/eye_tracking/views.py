from django.shortcuts import get_object_or_404
import tobii_research as tr
import cv2
import mediapipe as mp
import threading
import time  # For tracking engagement
import numpy as np  # For heatmap
import random  # To choose different messages
from django.utils.timezone import now
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import EyeTrackingSession, GazeData
from .serializers import EyeTrackingSessionSerializer, GazeDataSerializer

# Initialize Tobii Eye Tracker
found_eyetrackers = tr.find_all_eyetrackers()
eyetracker = found_eyetrackers[0] if found_eyetrackers else None

# Initialize Mediapipe Face Mesh
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(refine_landmarks=True)

# Global Parameters
LAST_ALERT_TIME = 0
ALERT_COOLDOWN = 10  # seconds
GAZE_HISTORY_SIZE = 10  # Sliding window size for gaze tracking
FIXATION_THRESHOLD = 0.02  # Max movement allowed for fixation
FIXATION_TIME = 0.3  # Minimum time for fixation (seconds)
LOST_FOCUS_THRESHOLD = 3  # Time before alert triggers
heatmap = np.zeros((1080, 1920), dtype=np.float32)  # Heatmap array

# Random Alert Messages
ALERT_MESSAGES = [
    "Not fully engaged? Check out an alternative perspective for fresh insights!",
    "Your attention seems to drift—why not try a quick quiz?",
    "Looks like you're looking away. Explore alternative views to keep learning!",
]

def choose_alert_message():
    return random.choice(ALERT_MESSAGES)

class CheckTobiiAvailability(APIView):
    def get(self, request):
        found_eyetrackers = tr.find_all_eyetrackers()
        return Response({"tobi_available": bool(found_eyetrackers)}, status=status.HTTP_200_OK)

class StartEyeTrackingSession(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        session = EyeTrackingSession.objects.create(
            user=user, session_id=f"session_{now().timestamp()}"
        )
        return Response(EyeTrackingSessionSerializer(session).data, status=status.HTTP_201_CREATED)

class StopEyeTrackingSession(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        session = get_object_or_404(EyeTrackingSession, session_id=session_id)
        session.end_time = now()
        session.save()
        return Response({"message": "Session ended successfully"}, status=status.HTTP_200_OK)

class GetEyeTrackingSessions(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sessions = EyeTrackingSession.objects.filter(user=request.user).order_by('-start_time')
        return Response(EyeTrackingSessionSerializer(sessions, many=True).data)

class GetGazeData(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        session = get_object_or_404(EyeTrackingSession, session_id=session_id)
        gaze_data = GazeData.objects.filter(session=session).order_by('-timestamp')
        return Response(GazeDataSerializer(gaze_data, many=True).data)

# Gaze Data Processing with Fixation & Heatmap Tracking
gaze_history = []
last_reading_timestamp = time.time()

def update_heatmap(gaze_x, gaze_y):
    """Updates heatmap with new gaze coordinates."""
    global heatmap
    if 0 <= gaze_x < 1920 and 0 <= gaze_y < 1080:
        heatmap[int(gaze_y), int(gaze_x)] += 1

def detect_fixation(gaze_x, gaze_y):
    """Detects if the user is fixating within a small area."""
    global gaze_history, last_reading_timestamp

    gaze_history.append((gaze_x, gaze_y, time.time()))
    if len(gaze_history) > GAZE_HISTORY_SIZE:
        prev_x, prev_y, _ = gaze_history[-GAZE_HISTORY_SIZE]
        distance = ((gaze_x - prev_x) ** 2 + (gaze_y - prev_y) ** 2) ** 0.5

        if distance < FIXATION_THRESHOLD:
            last_reading_timestamp = time.time()
            return True
    return False

def gaze_data_callback(gaze_data):
    """Handles Tobii gaze data and detects attention loss."""
    global LAST_ALERT_TIME, last_reading_timestamp

    if gaze_data and 'left_gaze_point_on_display_area' in gaze_data:
        gaze_x, gaze_y = gaze_data['left_gaze_point_on_display_area']
        
        # Update heatmap and fixation tracking
        update_heatmap(gaze_x, gaze_y)
        is_fixating = detect_fixation(gaze_x, gaze_y)

        # Save gaze data
        try:
            session = EyeTrackingSession.objects.latest('start_time')
            GazeData.objects.create(
                session=session,
                gaze_x=gaze_x,
                gaze_y=gaze_y,
                pupil_diameter=gaze_data.get('left_pupil_diameter', 0.0)
            )
        except Exception as e:
            print(f"Error saving gaze data: {e}")
        
        # NEW: Send real-time gaze coordinates to frontend
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "eye_tracking",
            {"type": "eye.data", "payload": {"gaze_x": gaze_x, "gaze_y": gaze_y}}
        )

        # Trigger alert if attention is lost
        if time.time() - last_reading_timestamp > LOST_FOCUS_THRESHOLD:
            if time.time() - LAST_ALERT_TIME > ALERT_COOLDOWN:
                async_to_sync(channel_layer.group_send)(
                    "eye_tracking", {"type": "eye.alert", "message": choose_alert_message()}
                )
                LAST_ALERT_TIME = time.time()

class StartGazeTracking(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        session = get_object_or_404(EyeTrackingSession, session_id=session_id)
        if eyetracker:
            eyetracker.subscribe_to(tr.EYETRACKER_GAZE_DATA, gaze_data_callback, as_dictionary=True)
            return Response({"message": "Tobii gaze tracking started"}, status=status.HTTP_200_OK)
        else:
            threading.Thread(target=webcam_gaze_tracking, args=(session,)).start()
            return Response({"message": "Webcam gaze tracking started"}, status=status.HTTP_200_OK)

class StopGazeTracking(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        if eyetracker:
            eyetracker.unsubscribe_from(tr.EYETRACKER_GAZE_DATA, gaze_data_callback)
        return Response({"message": "Gaze tracking stopped"}, status=status.HTTP_200_OK)

def webcam_gaze_tracking(session):
    """Webcam-based gaze tracking using Mediapipe FaceMesh with live gaze data updates (headless version)."""
    cap = cv2.VideoCapture(0)
    # Optionally, set a fixed resolution:
    # cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
    # cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)

    channel_layer = get_channel_layer()  # Get channel layer for sending messages

    ALERT_COOLDOWN = 10  # seconds
    last_alert_time = 0

    # Choose the landmark index for the nose tip.
    nose_index = 1

    # Get the actual frame resolution
    frame_width = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
    frame_height = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
    print(f"Camera resolution: {frame_width} x {frame_height}")

    while cap.isOpened():
        session.refresh_from_db()
        if session.end_time is not None:
            break

        ret, frame = cap.read()
        if not ret:
            break

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(rgb_frame)

        if results.multi_face_landmarks:
            for face_landmarks in results.multi_face_landmarks:
                if len(face_landmarks.landmark) > nose_index:
                    nose_tip = face_landmarks.landmark[nose_index]
                    if nose_tip.x is None or nose_tip.y is None:
                        print(f"Landmark at index {nose_index} is null. Trying index 4.")
                        if len(face_landmarks.landmark) > 4:
                            nose_tip = face_landmarks.landmark[4]
                    if nose_tip.x is not None and nose_tip.y is not None:
                        # Use the actual capture resolution
                        gaze_x = nose_tip.x * frame_width
                        gaze_y = nose_tip.y * frame_height
                        print(f"Detected gaze: x={gaze_x}, y={gaze_y}")
                        try:
                            GazeData.objects.create(
                                session=session,
                                gaze_x=gaze_x,
                                gaze_y=gaze_y,
                                pupil_diameter=0.0
                            )
                        except Exception as e:
                            print(f"Error saving webcam gaze data: {e}")

                        try:
                            async_to_sync(channel_layer.group_send)(
                                "eye_tracking",
                                {"type": "eye.data", "payload": {"gaze_x": gaze_x, "gaze_y": gaze_y}}
                            )
                        except Exception as e:
                            print(f"Error sending gaze data: {e}")
                    else:
                        print("Valid nose_tip coordinates not found after fallback.")
                else:
                    print("Not enough landmarks in detected face.")
        else:
            current_time = time.time()
            if current_time - last_alert_time > ALERT_COOLDOWN:
                try:
                    async_to_sync(channel_layer.group_send)(
                        "eye_tracking",
                        {"type": "eye.alert", "message": choose_alert_message()}
                    )
                except Exception as e:
                    print(f"Error sending alert message: {e}")
                last_alert_time = current_time

        time.sleep(0.03)

    cap.release()
    cv2.destroyAllWindows()

