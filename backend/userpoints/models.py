from django.db import models
from django.conf import settings

class UserPoints(models.Model):
    """Stores the total points and badges for each user"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="points"
    )
    total_points = models.IntegerField(default=0)
    badges = models.JSONField(default=list)  # Stores a list of badge names

    def __str__(self):
        return f"{self.user.username} - {self.total_points} Points"

class UserActivity(models.Model):
    """Tracks actions performed by users to earn points"""
    ACTION_CHOICES = [
        ("article_view", "Read an Article"),
        ("alternative_click", "Viewed Alternative Perspective"),
        ("quiz_attempt", "Attempted a Quiz"),
        ("quiz_score_high", "Scored 80+ in Quiz"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="activities")
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    points_awarded = models.IntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.action} (+{self.points_awarded})"
