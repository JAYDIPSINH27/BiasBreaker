from django.urls import path
from .views import GenerateArticleAPIView, UserArticlesAPIView

urlpatterns = [
    path("generate/", GenerateArticleAPIView.as_view(), name="generate-article"),
    path("user-articles/", UserArticlesAPIView.as_view(), name="user-articles"),
]
