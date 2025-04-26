from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import models
from django.db.models import Sum, Avg, Max
from .models import UserPoints
from .utils import add_user_points
from articles.models import Article, AlternativePerspective, Quiz
from eye_tracking.models import EyeTrackingSession, GazeData

class GetUserPoints(APIView):
    """Fetches the user's current points and badges"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_points, created = UserPoints.objects.get_or_create(user=request.user)
        return Response({
            "total_points": user_points.total_points,
            "badges": user_points.badges,
        })


class AddUserPoints(APIView):
    """Updates user points based on actions performed"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        action = request.data.get("action")
        article_id = request.data.get("article_id")

        if not action:
            return Response({"error": "Action is required"}, status=400)

        result = add_user_points(request.user, action, article_id)
        if "points" in result:
            result["success"] = True
        return Response(result)


class UserAnalyticsSummaryView(APIView):
    """Returns user engagement analytics and behavior metrics"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        total_articles = Article.objects.filter(user=user).count()
        total_alternatives = AlternativePerspective.objects.filter(article__user=user).count()
        total_quizzes = Quiz.objects.filter(article__user=user).count()

        # Bias breakdown
        bias_counts = Article.objects.filter(user=user).values('cognitive_bias').annotate(count=models.Count('id')).order_by('-count')
        most_common_bias = bias_counts[0]['cognitive_bias'] if bias_counts else "N/A"

        # Article stats
        article_qs = Article.objects.filter(user=user)
        total_word_count = article_qs.aggregate(total=Sum('word_count'))['total'] or 0
        average_article_length = article_qs.aggregate(avg=Avg('word_count'))['avg'] or 0

        # Eye tracking stats
        eye_sessions = EyeTrackingSession.objects.filter(user=user)
        total_sessions = eye_sessions.count()
        total_gaze_points = GazeData.objects.filter(session__user=user).count()

        # Average & Max session duration
        durations = eye_sessions.annotate(
            duration=models.ExpressionWrapper(
                models.F('end_time') - models.F('start_time'),
                output_field=models.DurationField()
            )
        )
        avg_session_duration = durations.aggregate(avg=Avg('duration'))['avg']
        max_session_duration = durations.aggregate(max=Max('duration'))['max']

        # High density sessions (> 200 gaze points)
        high_density_sessions = [
            session.id for session in eye_sessions
            if GazeData.objects.filter(session=session).count() > 200
        ]
        
        # Latest article read
        latest_topic = article_qs.order_by('-created_at').first().topic if article_qs.exists() else "N/A"

        # Badge count
        user_points, _ = UserPoints.objects.get_or_create(user=user)
        badge_count = len(user_points.badges) if user_points.badges else 0

        return Response({
            "total_articles_read": total_articles,
            "total_alternative_views": total_alternatives,
            "total_quizzes_completed": total_quizzes,
            "eye_tracking_sessions": total_sessions,
            "total_gaze_points": total_gaze_points,
            "avg_focus_duration_seconds": avg_session_duration.total_seconds() if avg_session_duration else 0,
            "max_focus_duration_seconds": max_session_duration.total_seconds() if max_session_duration else 0,
            "total_words_read": total_word_count,
            "average_article_length": round(average_article_length, 2),
            "most_common_bias": most_common_bias,
            "badge_count": badge_count,
            "high_density_sessions": len(high_density_sessions),
            "latest_read_topic": latest_topic,
        })
