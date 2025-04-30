from django.urls import path
from .views import GetUserPoints, AddUserPoints, UserAnalyticsSummaryView

urlpatterns = [
    path("userpoints/", GetUserPoints.as_view(), name="get_user_points"),
    path("userpoints/add/", AddUserPoints.as_view(), name="add_user_points"),
    path("userpoints/summary/", UserAnalyticsSummaryView.as_view(), name="user_analytics_summary"),
]
