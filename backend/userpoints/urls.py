from django.urls import path
from .views import GetUserPoints, AddUserPoints

urlpatterns = [
    path("userpoints/", GetUserPoints.as_view(), name="get_user_points"),
    path("userpoints/add/", AddUserPoints.as_view(), name="add_user_points"),
]
