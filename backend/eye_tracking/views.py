# views.py
from django.shortcuts import get_object_or_404
from django.utils.timezone import now
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import EyeTrackingSession, GazeData
from .serializers import EyeTrackingSessionSerializer, GazeDataSerializer

class CheckTobiiAvailability(APIView):
    """
    Optional endpoint: If your Tobii script is running, you might store
    a timestamp in 'consumers.py' and check if it's recent, or skip entirely.
    For now, let's say it's always unknown from the server's perspective.
    """
    def get(self, request):
        return Response({"tobi_available": False}, status=status.HTTP_200_OK)

class StartEyeTrackingSession(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        user = request.user
        import time
        session = EyeTrackingSession.objects.create(
            user=user,
            session_id=f"session_{time.time()}"
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
        sessions = EyeTrackingSession.objects.filter(user=request.user).order_by("-start_time")
        serializer = EyeTrackingSessionSerializer(sessions, many=True)
        return Response(serializer.data)

class GetGazeData(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, session_id):
        session = get_object_or_404(EyeTrackingSession, session_id=session_id)
        gaze_data = GazeData.objects.filter(session=session).order_by("-timestamp")
        serializer = GazeDataSerializer(gaze_data, many=True)
        return Response(serializer.data)

class StartGazeTracking(APIView):
    """
    If you want to have a formal endpoint that does nothing but 'acknowledge' we want to start capturing,
    the real capturing is done via WebSocket from local Tobii or the webcam script.
    """
    permission_classes = [IsAuthenticated]
    def post(self, request, session_id):
        return Response({"message": "Gaze tracking started (client side)..."}, status=status.HTTP_200_OK)

class StopGazeTracking(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, session_id):
        return Response({"message": "Gaze tracking stopped (client side)..."}, status=status.HTTP_200_OK)
