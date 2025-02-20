import json
import requests
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

class GenerateArticleAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        topic = request.data.get("topic", "").strip()

        if not topic:
            return Response({"error": "Topic is required"}, status=400)

        # **Prompt with explicit JSON enforcement**
        prompt = (
            f"Generate a unique and structured JSON response for an engaging 5-minute article about {topic}. "
            "Ensure the response strictly adheres to the following JSON format and does not contain any extra text, explanations, or markdown:\n\n"
            "{\n"
            '  "title": "Title of the article",\n'
            '  "introduction": "A compelling introduction",\n'
            '  "sections": [\n'
            '    {"heading": "Section 1 Heading", "content": "Detailed content for section 1"},\n'
            '    {"heading": "Section 2 Heading", "content": "Detailed content for section 2"},\n'
            '    {"heading": "Section 3 Heading", "content": "Detailed content for section 3"}\n'
            "  ],\n"
            '  "conclusion": "A thought-provoking conclusion"\n'
            "}\n\n"
            "Do not return any explanation before or after the JSON. The response should contain only the JSON object."
        )

        # **Step 1: Send API request with structured JSON enforcement**
        payload = {
            "inputs": prompt,
            "parameters": {
                "return_full_text": False,  # Avoids returning the prompt
                "max_new_tokens": 1000,  # Ensures detailed responses
                "temperature": 0.7,  # Balances creativity and coherence
                "do_sample": True,  # Enables variation in output
                "json_mode": True  # Forces JSON-only response (if supported)
            }
        }

        try:
            response = requests.post(API_URL, headers=HEADERS, json=payload, timeout=180)

            if response.status_code != 200:
                return Response({"error": "Failed to generate article", "details": response.json()}, status=500)

            # **Step 2: Extract JSON response**
            generated_json = response.json()[0]  # Expected to be a JSON object

            if not isinstance(generated_json, dict):  # Ensure valid JSON object
                return Response({"error": "Invalid response format from AI"}, status=500)

        except requests.Timeout:
            return Response({"error": "Request timed out. Try again later."}, status=500)
        except requests.RequestException as e:
            return Response({"error": f"Request failed: {str(e)}"}, status=500)
        except (json.JSONDecodeError, KeyError):
            return Response({"error": "Invalid JSON response from AI"}, status=500)

        # **Step 3: Store response in DB**
        article = Article.objects.create(
            user=user,
            title=generated_json.get("title", f"AI-Generated Article on {topic}"),
            content=json.dumps(generated_json, indent=2)  # Store formatted JSON
        )

        return Response(ArticleSerializer(article).data, status=201)


class UserArticlesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        articles = Article.objects.filter(user=request.user).order_by("-created_at")
        serializer = ArticleSerializer(articles, many=True)
        return Response(serializer.data)
