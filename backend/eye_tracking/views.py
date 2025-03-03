from django.shortcuts import get_object_or_404
import tobii_research as tr
import cv2
import mediapipe as mp
import threading
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

class StartEyeTrackingSession(APIView):
    """ Start an eye tracking session (Tobii or Webcam) """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        session = EyeTrackingSession.objects.create(user=user, session_id=f"session_{now().timestamp()}")
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

# Tobii Eye Tracker Callback
def gaze_data_callback(gaze_data):
    """ Handles incoming Tobii gaze data and sends alerts if user is not looking """
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "eye_tracking", {"type": "eye.alert", "message": "User looking away!"}
    )

    try:
        session = EyeTrackingSession.objects.latest('start_time')
        GazeData.objects.create(
            session=session,
            gaze_x=gaze_data['left_gaze_point_on_display_area'][0],
            gaze_y=gaze_data['left_gaze_point_on_display_area'][1],
            pupil_diameter=gaze_data['left_pupil_diameter']
        )
    except Exception as e:
        print(f"Error saving gaze data: {e}")

class StartGazeTracking(APIView):
    """ Start gaze tracking using Tobii (if available) or webcam """
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
    """ Stop gaze tracking (Tobii) """
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        if eyetracker:
            eyetracker.unsubscribe_from(tr.EYETRACKER_GAZE_DATA, gaze_data_callback)
        return Response({"message": "Gaze tracking stopped"}, status=status.HTTP_200_OK)

def webcam_gaze_tracking(session):
    """ Webcam-based gaze tracking using Mediapipe """
    cap = cv2.VideoCapture(0)

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(rgb_frame)

        if results.multi_face_landmarks:
            for face_landmarks in results.multi_face_landmarks:
                nose_tip = face_landmarks.landmark[1]  # Nose tip landmark
                gaze_x, gaze_y = nose_tip.x, nose_tip.y

                GazeData.objects.create(
                    session=session,
                    gaze_x=gaze_x,
                    gaze_y=gaze_y,
                    pupil_diameter=0.0
                )
        else:
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                "eye_tracking", {"type": "eye.alert", "message": "User looking away!"}
            )

        cv2.imshow("Eye Tracking", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
