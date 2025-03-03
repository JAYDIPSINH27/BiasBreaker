import os
import requests
import json
import re
import random
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Article, AlternativePerspective, Quiz
from .serializers import ArticleSerializer, AlternativePerspectiveSerializer, QuizSerializer


API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3"
HEADERS = {
    "Authorization": f"Bearer {settings.HUGGINGFACE_TOKEN}",
    "Content-Type": "application/json",
}


PERSPECTIVE_CHOICES = ["Neutral", "Optimistic", "Critical", "Innovative", "Ethical"]
BIAS_CHOICES = [
    "Confirmation Bias", "Anchoring Bias", "Availability Bias",
    "Framing Effect", "Overconfidence Bias", "Negativity Bias",
    "Bandwagon Effect", "Sunk Cost Fallacy"
]


def extract_json_content(response_text):
    """Extracts JSON content enclosed within ```json ... ```"""
    match = re.search(r"```json\n(.*?)\n```", response_text, re.DOTALL)
    if match:
        json_content = match.group(1)
        try:
            return json.loads(json_content) 
        except json.JSONDecodeError:
            return None  # Invalid JSON format
    return None  # No valid JSON found



class GenerateArticleAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        topic = request.data.get("topic", "").strip()

        if not topic:
            return Response({"error": "Topic is required"}, status=400)

        perspective = random.choice(PERSPECTIVE_CHOICES)
        cognitive_bias = random.choice(BIAS_CHOICES)

        prompt = (
            f"You are a professional AI writer. Generate an engaging, well-structured article in valid JSON format with no extra text. "
            f"The JSON should include exactly these keys: 'title', 'introduction', 'sections' (sections key contains two sections a list of objects with 'heading' and 'content'), "
            f"'conclusion', and 'word_count' (an integer representing the approximate word count). "
           f"Topic: {topic}. The article should primarily focus on {topic}, providing in-depth insights, examples, and analysis. "
           f"Perspective: {perspective} (use this perspective to subtly frame the discussion, but do not make it the main subject). "
           f"Cognitive Bias: {cognitive_bias} (allow this bias to subtly shape the narrative, but do not explicitly discuss the bias itself). "
            "Ensure the article is factually accurate, logically structured, and compelling."
        )

        response = requests.post(API_URL, headers=HEADERS, json={"inputs": prompt}, timeout=180)
        if response.status_code != 200:
            return Response({"error": "Failed to generate article", "details": response.json()}, status=500)

        parsed_content = extract_json_content(response.json()[0]["generated_text"])
        if not parsed_content:
            return Response({"error": "Invalid JSON response from model"}, status=500)

        article = Article.objects.create(
            user=user,
            title=parsed_content["title"],
            content=parsed_content,
            perspective=perspective,
            cognitive_bias=cognitive_bias,
            topic=topic
        )

        return Response(ArticleSerializer(article).data, status=201)



class GenerateAlternativePerspectiveAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, article_id):
        try:
            article = Article.objects.get(id=article_id)
        except Article.DoesNotExist:
            return Response({"error": "Article not found"}, status=404)

        alternative_perspective_prompt = (
            f"Generate an alternative perspective for the article '{article}', "
            "challenging or expanding on its key arguments while remaining factually accurate. "
             f"The JSON should include exactly these keys: 'title', 'introduction', 'sections' (two sections having a list of objects with 'heading' and 'content'), "
            f"'conclusion',"
            "Ensure the response is in JSON format."
        )

        response = requests.post(API_URL, headers=HEADERS, json={"inputs": alternative_perspective_prompt}, timeout=180)
        if response.status_code != 200:
            return Response({"error": "Failed to generate alternative perspective", "details": response.json()}, status=500)

        parsed_content = extract_json_content(response.json()[0]["generated_text"])
        if not parsed_content:
            return Response({"error": "Invalid JSON response from model"}, status=500)

        alternative = AlternativePerspective.objects.create(article=article, content=parsed_content)
        return Response(AlternativePerspectiveSerializer(alternative).data, status=201)


class GenerateQuizAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, article_id):
        try:
            article = Article.objects.get(id=article_id)
            alternative_perspective = AlternativePerspective.objects.get(article=article)
        except Article.DoesNotExist:
            return Response({"error": "Article not found"}, status=404)
        except AlternativePerspective.DoesNotExist:
            return Response({"error": "Alternative perspective not found"}, status=404)

        quiz_prompt = (
            f"Generate a multiple-choice quiz with answers based on the article '{article}' "
            f"and its alternative perspective '{alternative_perspective.content}'. Include 10 questions covering both viewpoints. "
            f"The JSON should include exactly these keys: 'question', 'options' (array of options), and 'answer'. "
            "Ensure the response is in JSON format."
        )

        response = requests.post(API_URL, headers=HEADERS, json={"inputs": quiz_prompt}, timeout=180)
        if response.status_code != 200:
            return Response({"error": "Failed to generate quiz", "details": response.json()}, status=500)

        parsed_content = extract_json_content(response.json()[0]["generated_text"])
        if not parsed_content:
            return Response({"error": "Invalid JSON response from model"}, status=500)

        quiz = Quiz.objects.create(article=article, questions=parsed_content)
        return Response(QuizSerializer(quiz).data, status=201)



class UserArticlesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Retrieve all articles belonging to the authenticated user."""
        articles = Article.objects.filter(user=request.user).order_by("-created_at")
        serializer = ArticleSerializer(articles, many=True)
        return Response(serializer.data)

class GetAlternativePerspectiveAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, article_id):
        """Retrieve the alternative perspective for a given article"""
        try:
            alternative = AlternativePerspective.objects.get(article_id=article_id)
        except AlternativePerspective.DoesNotExist:
            return Response({"error": "Alternative perspective not found"}, status=404)

        return Response(AlternativePerspectiveSerializer(alternative).data, status=200)


class GetQuizAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, article_id):
        """Retrieve the quiz for a given article"""
        try:
            quiz = Quiz.objects.get(article_id=article_id)
        except Quiz.DoesNotExist:
            return Response({"error": "Quiz not found"}, status=404)

        return Response(QuizSerializer(quiz).data, status=200)