from django.shortcuts import get_object_or_404
from django.utils.timezone import now
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import EyeTrackingSession, GazeData
from .serializers import EyeTrackingSessionSerializer, GazeDataSerializer

class StartEyeTrackingSession(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        session = EyeTrackingSession.objects.create(
            user=user, session_id=f"session_{int(now().timestamp())}"
        )
        return Response(EyeTrackingSessionSerializer(session).data, status=status.HTTP_201_CREATED)

class StopEyeTrackingSession(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        session = get_object_or_404(EyeTrackingSession, session_id=session_id, user=request.user)
        session.end_time = now()
        session.save()
        return Response({"message": "Session ended successfully"}, status=status.HTTP_200_OK)

class GetEyeTrackingSessions(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sessions = EyeTrackingSession.objects.filter(user=request.user).order_by('-start_time')
        serializer = EyeTrackingSessionSerializer(sessions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class GetGazeData(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        session = get_object_or_404(EyeTrackingSession, session_id=session_id, user=request.user)
        gaze_data = GazeData.objects.filter(session=session).order_by('-timestamp')
        serializer = GazeDataSerializer(gaze_data, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
