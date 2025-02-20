import os
import requests
import json
import re
import random
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Article
from .serializers import ArticleSerializer

# Hugging Face API details
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

class GenerateArticleAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        topic = request.data.get("topic", "").strip()

        if not topic:
            return Response({"error": "Topic is required"}, status=400)

        # **Step 1: Assign Random Perspective & Bias**
        perspective = random.choice(PERSPECTIVE_CHOICES)
        cognitive_bias = random.choice(BIAS_CHOICES)

        # **Step 2: Send Prompt**
        prompt = (
            "You are a professional AI writer. Generate an engaging, well-structured article in valid JSON format with no extra text. "
            "The JSON should include exactly these keys: 'title', 'summary', 'introduction', 'sections' (a list of objects with 'heading' and 'content'), "
            "'conclusion', and 'word_count' (an integer representing the approximate word count). "
            f"Topic: {topic}. Perspective: {perspective}. Cognitive Bias: {cognitive_bias}. Use this cognitive bias and perspective to influence the article but write only about the topic."
        )

        # **Step 3: Make API Request**
        try:
            response = requests.post(API_URL, headers=HEADERS, json={"inputs": prompt}, timeout=180)

            if response.status_code != 200:
                return Response({"error": "Failed to generate article", "details": response.json()}, status=500)

            generated_text = response.json()[0]["generated_text"]

        except requests.Timeout:
            return Response({"error": "Request timed out. Try again later."}, status=500)

        except requests.RequestException as e:
            return Response({"error": f"Request failed: {str(e)}"}, status=500)

        # **Step 4: Extract JSON from Markdown Block**
        match = re.search(r"```json\n(.*?)\n```", generated_text, re.DOTALL)
        if match:
            json_content = match.group(1)  # Extract JSON content
        else:
            return Response({"error": "Invalid JSON response from model"}, status=500)

        # **Step 5: Validate JSON**
        try:
            parsed_content = json.loads(json_content)  # Convert string to JSON
        except json.JSONDecodeError:
            return Response({"error": "Failed to parse JSON output"}, status=500)

        # **Step 6: Store in Database**
        article = Article.objects.create(
            user=user,
            title=parsed_content.get("title", "AI-Generated Article"),
            content=json.dumps(parsed_content, indent=4),  # Store cleaned JSON
            perspective=perspective,
            cognitive_bias=cognitive_bias,
        )

        return Response(ArticleSerializer(article).data, status=201)

class UserArticlesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        articles = Article.objects.filter(user=request.user).order_by("-created_at")
        serializer = ArticleSerializer(articles, many=True)
        return Response(serializer.data)
