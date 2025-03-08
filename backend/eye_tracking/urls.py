from django.urls import path
from .views import (
    StartEyeTrackingSession, StopEyeTrackingSession, GetEyeTrackingSessions,
    GetGazeData, StartGazeTracking, StopGazeTracking, CheckTobiiAvailability
)

urlpatterns = [
    path('start/', StartEyeTrackingSession.as_view(), name='start_eye_tracking'),
    path('stop/<str:session_id>/', StopEyeTrackingSession.as_view(), name='stop_eye_tracking'),
    path('sessions/', GetEyeTrackingSessions.as_view(), name='get_eye_tracking_sessions'),
    path('gaze/<str:session_id>/', GetGazeData.as_view(), name='get_gaze_data'),
    path('gaze/start/<str:session_id>/', StartGazeTracking.as_view(), name='start_gaze_tracking'),
    path('gaze/stop/<str:session_id>/', StopGazeTracking.as_view(), name='stop_gaze_tracking'),
    path('check-tobii/', CheckTobiiAvailability.as_view(), name='check-tobii'),
]
