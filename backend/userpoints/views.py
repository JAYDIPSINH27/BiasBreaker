from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import UserPoints
from .utils import add_user_points

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
        if not action:
            return Response({"error": "Action is required"}, status=400)

        result = add_user_points(request.user, action)
        return Response(result)
