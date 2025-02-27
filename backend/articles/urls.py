from django.urls import path
from .views import (
    GenerateArticleAPIView, UserArticlesAPIView, 
    GenerateAlternativePerspectiveAPIView, GetAlternativePerspectiveAPIView,
    GenerateQuizAPIView, GetQuizAPIView
)

urlpatterns = [
    path("generate/", GenerateArticleAPIView.as_view(), name="generate-article"),
    path("user-articles/", UserArticlesAPIView.as_view(), name="user-articles"),
    path("alternative/<int:article_id>/", GetAlternativePerspectiveAPIView.as_view(), name="get-alternative"),
    path("alternative/generate/<int:article_id>/", GenerateAlternativePerspectiveAPIView.as_view(), name="generate-alternative"),
    path("quiz/<int:article_id>/", GetQuizAPIView.as_view(), name="get-quiz"),
    path("quiz/generate/<int:article_id>/", GenerateQuizAPIView.as_view(), name="generate-quiz"),
]
