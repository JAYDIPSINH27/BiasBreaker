from django.db import models
from django.utils.timezone import now
from django.conf import settings


class EyeTrackingSession(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="eyetrack"
    )
    session_id = models.CharField(max_length=255, unique=True)
    start_time = models.DateTimeField(default=now)
    end_time = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Session {self.session_id} - {self.user.username}"

class GazeData(models.Model):
    session = models.ForeignKey(EyeTrackingSession, on_delete=models.CASCADE)
    gaze_x = models.FloatField()
    gaze_y = models.FloatField()
    pupil_diameter = models.FloatField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Gaze Data {self.session.session_id} at {self.timestamp}"
