from rest_framework import serializers
from .models import Article, AlternativePerspective, Quiz

class ArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Article
        fields = "__all__"

class AlternativePerspectiveSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlternativePerspective
        fields = "__all__"

class QuizSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quiz
        fields = "__all__"
