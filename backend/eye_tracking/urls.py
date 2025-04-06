from django.urls import path
from .views import (
    StartEyeTrackingSession, StopEyeTrackingSession,
    GetEyeTrackingSessions, GetGazeData
)

urlpatterns = [
    path('sessions/start/', StartEyeTrackingSession.as_view(), name='start_eye_tracking'),
    path('sessions/stop/<str:session_id>/', StopEyeTrackingSession.as_view(), name='stop_eye_tracking'),
    path('sessions/', GetEyeTrackingSessions.as_view(), name='get_eye_tracking_sessions'),
    path('sessions/<str:session_id>/gaze/', GetGazeData.as_view(), name='get_gaze_data'),
]
