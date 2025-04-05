import os
import json
import re
import random
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Article, AlternativePerspective, Quiz
from .serializers import ArticleSerializer, AlternativePerspectiveSerializer, QuizSerializer
import google.generativeai as genai

# OLd Setup
"""
API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3"
HEADERS = {
    "Authorization": f"Bearer {settings.HUGGINGFACE_TOKEN}",
    "Content-Type": "application/json",
}
"""
# Configure Gemini API with your API key from Django settings
genai.configure(api_key=settings.GEMINI_TOKEN)

# Select the Gemini model you want to use (consider 'gemini-pro' for general tasks)
MODEL_NAME = 'models/gemini-1.5-pro'

PERSPECTIVE_CHOICES = ["Neutral", "Optimistic", "Critical", "Innovative", "Ethical"]
BIAS_CHOICES = [
    "Confirmation Bias",
    "Anchoring Bias",
    "Availability Bias",
    "Framing Effect",
    "Overconfidence Bias",
    "Bandwagon Effect",
    "Sunk Cost Fallacy",
    "Hindsight Bias",
    "Self-Serving Bias",
    "Fundamental Attribution Error",
    "Halo Effect",
    "In-group Bias",
    "Out-group Homogeneity Bias",
    "Optimism Bias",
    "Status Quo Bias",
    "Dunning-Kruger Effect",
    "Illusory Superiority",
    "Gambler's Fallacy",
    "False Consensus Effect",
    "Choice-supportive Bias",
    "Projection Bias",
    "Recency Bias",
    "Belief Bias",
    "Authority Bias",
    "Clustering Illusion",
    "Contrast Effect",
    "Curse of Knowledge",
    "Endowment Effect",
    "Focusing Effect",
    "Just-World Hypothesis",
    "Planning Fallacy",
    "Survivorship Bias",
    "Ostrich Effect",
    "Placebo Effect",
    "Pessimism Bias",
    "Pro-innovation Bias",
    "Reactance",
    "Reciprocity Bias",
    "Salience Bias",
    "Selective Perception",
    "Semmelweis Reflex",
    "Social Desirability Bias",
    "Zero-risk Bias"
]


def extract_json_content_gemini(response_text):
    """Extracts JSON content enclosed within ```json ... ``` from Gemini response."""
    match = re.search(r"```json\n(.*?)\n```", response_text, re.DOTALL)
    if match:
        json_content = match.group(1).strip()
        try:
            return json.loads(json_content)
        except json.JSONDecodeError:
            print(f"Error decoding JSON: {json_content}")
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
            "Ensure the article is factually accurate, logically structured, and compelling. "
            "Enclose the entire JSON response within ```json ... ```"
        )

        model = genai.GenerativeModel(MODEL_NAME)

        try:
            response = model.generate_content(prompt)
            response.resolve()
            if response.text:
                parsed_content = extract_json_content_gemini(response.text)
                if parsed_content:
                    article = Article.objects.create(
                        user=user,
                        title=parsed_content.get("title", "Untitled"),
                        content=parsed_content,
                        perspective=perspective,
                        cognitive_bias=cognitive_bias,
                        topic=topic
                    )
                    return Response(ArticleSerializer(article).data, status=201)
                else:
                    return Response({"error": "Invalid JSON response received from Gemini"}, status=500)
            else:
                return Response({"error": "Empty response from Gemini"}, status=500)

        except Exception as e:
            return Response({"error": f"Gemini API error: {e}"}, status=500)


class GenerateAlternativePerspectiveAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, article_id):
        try:
            article = Article.objects.get(id=article_id)
        except Article.DoesNotExist:
            return Response({"error": "Article not found"}, status=404)

        alternative_perspective_prompt = (
            f"Generate an alternative positive perspective for the article titled '{article.title}' with the following content: '{article.content}'. "
            "Challenge or expand on its key arguments while remaining factually accurate. "
            "The JSON should include exactly these keys: 'title', 'introduction', 'sections' (two sections having a list of objects with 'heading' and 'content'), "
            "'conclusion'. "
            "Ensure the response is in valid JSON format and enclose it within ```json ... ```"
        )

        model = genai.GenerativeModel(MODEL_NAME)

        try:
            response = model.generate_content(alternative_perspective_prompt)
            response.resolve()
            if response.text:
                parsed_content = extract_json_content_gemini(response.text)
                if parsed_content:
                    alternative = AlternativePerspective.objects.create(article=article, content=parsed_content)
                    return Response(AlternativePerspectiveSerializer(alternative).data, status=201)
                else:
                    return Response({"error": "Invalid JSON response received from Gemini for alternative perspective"}, status=500)
            else:
                return Response({"error": "Empty response from Gemini for alternative perspective"}, status=500)

        except Exception as e:
            return Response({"error": f"Gemini API error (alternative perspective): {e}"}, status=500)


class GenerateQuizAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, article_id):
        try:
            article = Article.objects.get(id=article_id)
            alternative_perspective = AlternativePerspective.objects.get(article=article)
        except Article.DoesNotExist:
            return Response({"error": "Article not found"}, status=404)
        except AlternativePerspective.DoesNotExist:
            return Response({"error": "Alternative perspective not found for this article"}, status=404)

        quiz_prompt = (
            f"Generate a multiple-choice quiz based on the article titled '{article.title}' with content: '{article.content}' "
            f"and its alternative perspective: '{alternative_perspective.content}'. "
            "Include exactly 10 distinct questions covering both viewpoints. "
            "Return a valid JSON array of objects where each object has exactly the keys 'question' (string), 'options' (an array of strings with 4 options), and 'answer' (string, one of the options). "
            "Ensure the response is in valid JSON format and enclose the entire array within ```json ... ```"
        )

        model = genai.GenerativeModel(MODEL_NAME)

        try:
            response = model.generate_content(quiz_prompt)
            response.resolve()
            if response.text:
                parsed_content = extract_json_content_gemini(response.text)
                if isinstance(parsed_content, list) and len(parsed_content) == 10 and all(
                    isinstance(q, dict) and
                    'question' in q and isinstance(q['question'], str) and
                    'options' in q and isinstance(q['options'], list) and len(q['options']) == 4 and all(isinstance(opt, str) for opt in q['options']) and
                    'answer' in q and isinstance(q['answer'], str) and q['answer'] in q['options']
                    for q in parsed_content
                ):
                    quiz = Quiz.objects.create(article=article, questions=parsed_content)
                    return Response(QuizSerializer(quiz).data, status=201)
                else:
                    print(f"Invalid quiz JSON structure: {parsed_content}")
                    return Response({"error": "Invalid JSON response format received from Gemini for quiz"}, status=500)
            else:
                return Response({"error": "Empty response from Gemini for quiz"}, status=500)

        except Exception as e:
            return Response({"error": f"Gemini API error (quiz generation): {e}"}, status=500)


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


class GetArticleAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, article_id):
        try:
            article = Article.objects.get(id=article_id)
        except Article.DoesNotExist:
            return Response({"error": "Article not found"}, status=404)

        serializer = ArticleSerializer(article)
        return Response(serializer.data, status=200)