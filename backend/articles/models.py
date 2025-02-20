from django.db import models
from django.conf import settings
import json

class Article(models.Model):
    class PerspectiveChoices(models.TextChoices):
        NEUTRAL = "Neutral", "Neutral"
        OPTIMISTIC = "Optimistic", "Optimistic"
        CRITICAL = "Critical", "Critical"
        INNOVATIVE = "Innovative", "Innovative"
        ETHICAL = "Ethical", "Ethical"

    class BiasChoices(models.TextChoices):
        CONFIRMATION = "Confirmation Bias", "Confirmation Bias"
        ANCHORING = "Anchoring Bias", "Anchoring Bias"
        AVAILABILITY = "Availability Bias", "Availability Bias"
        FRAMING = "Framing Effect", "Framing Effect"
        OVERCONFIDENCE = "Overconfidence Bias", "Overconfidence Bias"
        NEGATIVITY = "Negativity Bias", "Negativity Bias"
        BANDWAGON = "Bandwagon Effect", "Bandwagon Effect"
        SUNK_COST = "Sunk Cost Fallacy", "Sunk Cost Fallacy"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="articles"
    )
    title = models.CharField(max_length=255)
    summary = models.TextField(blank=True, null=True)  # ✅ Store a short summary of the article
    content = models.JSONField()  # ✅ Stores structured JSON instead of plain text
    perspective = models.CharField(
        max_length=20,
        choices=PerspectiveChoices.choices,
        default=PerspectiveChoices.NEUTRAL,
        db_index=True
    )
    cognitive_bias = models.CharField(
        max_length=50,
        choices=BiasChoices.choices,
        default=BiasChoices.CONFIRMATION,
        db_index=True
    )
    word_count = models.IntegerField(default=0)  # ✅ Store word count for analytics
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)  # ✅ Track last modification time

    def save(self, *args, **kwargs):
        """ Automatically update the word count before saving. """
        if self.content:
            text_content = json.dumps(self.content)  # Convert JSON to string
            self.word_count = len(text_content.split())  # Count words
        super().save(*args, **kwargs)

    def get_preview(self, char_limit=200):
        """ Generate a short preview of the article for quick display. """
        if not self.content:
            return "No content available."
        first_section = self.content.get("sections", [{}])[0].get("content", "")
        return (first_section[:char_limit] + "...") if len(first_section) > char_limit else first_section

    def __str__(self):
        return f"{self.title} ({self.perspective} - {self.cognitive_bias})"
