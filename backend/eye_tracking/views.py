from django.shortcuts import get_object_or_404
import tobii_research as tr
import cv2
import mediapipe as mp
import threading
import time  # For throttling alerts
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

# Global variables for throttling alerts in Tobii callback
LAST_ALERT_TIME = 0
ALERT_COOLDOWN = 10  # seconds

# A list of alternative messages to prompt the user.
ALERT_MESSAGES = [
    "Not fully engaged? Check out an alternative perspective for fresh insights!",
    "Your attention seems to drift—why not try a quick quiz?",
    "Looks like you're looking away. Explore alternative views to keep learning!",
]

def choose_alert_message():
    # Randomly choose one of the alert messages.
    return random.choice(ALERT_MESSAGES)

class CheckTobiiAvailability(APIView):
    """
    Simple endpoint to check if Tobii is detected on the system.
    """
    def get(self, request):
        found_eyetrackers = tr.find_all_eyetrackers()
        if found_eyetrackers:
            return Response({"tobi_available": True}, status=status.HTTP_200_OK)
        return Response({"tobi_available": False}, status=status.HTTP_200_OK)

class StartEyeTrackingSession(APIView):
    """ Start an eye tracking session (Tobii or Webcam) """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        session = EyeTrackingSession.objects.create(
            user=user, session_id=f"session_{now().timestamp()}"
        )
        return Response(EyeTrackingSessionSerializer(session).data, status=status.HTTP_201_CREATED)

class StopEyeTrackingSession(APIView):
    """ Stop an active eye tracking session """
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        session = get_object_or_404(EyeTrackingSession, session_id=session_id)
        session.end_time = now()
        session.save()
        return Response({"message": "Session ended successfully"}, status=status.HTTP_200_OK)

class GetEyeTrackingSessions(APIView):
    """ Retrieve all eye tracking sessions for a user """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sessions = EyeTrackingSession.objects.filter(user=request.user).order_by('-start_time')
        return Response(EyeTrackingSessionSerializer(sessions, many=True).data)

class GetGazeData(APIView):
    """ Retrieve gaze data for a session """
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        session = get_object_or_404(EyeTrackingSession, session_id=session_id)
        gaze_data = GazeData.objects.filter(session=session).order_by('-timestamp')
        return Response(GazeDataSerializer(gaze_data, many=True).data)

# Tobii Eye Tracker Callback with alert throttling and multiple messages
def gaze_data_callback(gaze_data):
    """Handles incoming Tobii gaze data and sends contextual alerts if the user is not looking."""
    global LAST_ALERT_TIME
    print("Received Gaze Data:", gaze_data)  # Log the entire gaze data

    if gaze_data:
        # Parse gaze data if available
        gaze_x = gaze_data['left_gaze_point_on_display_area'][0] if 'left_gaze_point_on_display_area' in gaze_data else None
        gaze_y = gaze_data['left_gaze_point_on_display_area'][1] if 'left_gaze_point_on_display_area' in gaze_data else None
        pupil_diameter = gaze_data['left_pupil_diameter'] if 'left_pupil_diameter' in gaze_data else None
        
        print(f"Parsed Gaze Data: x={gaze_x}, y={gaze_y}, pupil_diameter={pupil_diameter}")

        if gaze_x is not None and gaze_y is not None and pupil_diameter is not None:
            try:
                session = EyeTrackingSession.objects.latest('start_time')
                GazeData.objects.create(
                    session=session,
                    gaze_x=gaze_x,
                    gaze_y=gaze_y,
                    pupil_diameter=pupil_diameter
                )
                print(f"Gaze data saved: x={gaze_x}, y={gaze_y}, pupil_diameter={pupil_diameter}")
            except Exception as e:
                print(f"Error saving gaze data: {e}")
        else:
            print("Invalid gaze data received: missing x, y, or pupil_diameter.")
    else:
        print("No gaze data received.")

    # Send a contextual alert only if gaze data is invalid (indicating user isn't looking)
    if gaze_data is None or gaze_data.get('left_gaze_point_on_display_area') is None:
        current_time = time.time()
        if current_time - LAST_ALERT_TIME > ALERT_COOLDOWN:
            channel_layer = get_channel_layer()
            alert_message = choose_alert_message()
            async_to_sync(channel_layer.group_send)(
                "eye_tracking", {"type": "eye.alert", "message": alert_message}
            )
            LAST_ALERT_TIME = current_time

class StartGazeTracking(APIView):
    """ Start gaze tracking using Tobii (if available) or webcam """
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        session = get_object_or_404(EyeTrackingSession, session_id=session_id)
        if eyetracker:
            eyetracker.subscribe_to(tr.EYETRACKER_GAZE_DATA, gaze_data_callback, as_dictionary=True)
            print("Tobii gaze tracking started")
            return Response({"message": "Tobii gaze tracking started"}, status=status.HTTP_200_OK)
        else:
            # Start webcam tracking in a separate thread
            threading.Thread(target=webcam_gaze_tracking, args=(session,)).start()
            print("Webcam gaze tracking started")
            return Response({"message": "Webcam gaze tracking started"}, status=status.HTTP_200_OK)

class StopGazeTracking(APIView):
    """ Stop gaze tracking (Tobii or webcam) """
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        if eyetracker:
            eyetracker.unsubscribe_from(tr.EYETRACKER_GAZE_DATA, gaze_data_callback)
            print("Tobii gaze tracking stopped")
        # For webcam tracking, a stop signal could be implemented if needed.
        return Response({"message": "Gaze tracking stopped"}, status=status.HTTP_200_OK)

def webcam_gaze_tracking(session):
    """Webcam-based gaze tracking using Mediapipe with single alert logic and additional messages."""
    cap = cv2.VideoCapture(0)
    alert_sent = False  # Local flag to send alert only once while no face is detected

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(rgb_frame)

        if results.multi_face_landmarks:
            # Reset alert flag when face is detected
            alert_sent = False
            for face_landmarks in results.multi_face_landmarks:
                nose_tip = face_landmarks.landmark[1]  # Nose tip landmark
                gaze_x, gaze_y = nose_tip.x, nose_tip.y

                print(f"Webcam Gaze Data: x={gaze_x}, y={gaze_y}")
                try:
                    GazeData.objects.create(
                        session=session,
                        gaze_x=gaze_x,
                        gaze_y=gaze_y,
                        pupil_diameter=0.0
                    )
                except Exception as e:
                    print(f"Error saving webcam gaze data: {e}")
        else:
            # No face detected: send an alert only once.
            if not alert_sent:
                print("No face detected, sending alert for looking away.")
                channel_layer = get_channel_layer()
                alert_message = choose_alert_message()
                async_to_sync(channel_layer.group_send)(
                    "eye_tracking", {"type": "eye.alert", "message": alert_message}
                )
                alert_sent = True

        cv2.imshow("Eye Tracking", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
