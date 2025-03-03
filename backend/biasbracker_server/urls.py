from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('djoser.urls')),
    path('api/', include('users.urls')),
    path("api/articles/", include("articles.urls")),
    path("api/eye-track/", include("eye_tracking.urls")),
]
