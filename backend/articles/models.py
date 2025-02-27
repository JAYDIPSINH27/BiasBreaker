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
    summary = models.TextField(blank=True, null=True)
    content = models.JSONField()
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
    word_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        """Automatically update word count before saving."""
        if self.content:
            text_content = json.dumps(self.content)
            self.word_count = len(text_content.split())
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} ({self.perspective} - {self.cognitive_bias})"

class AlternativePerspective(models.Model):
    article = models.OneToOneField(Article, on_delete=models.CASCADE, related_name="alternative_perspective")
    content = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Alternative Perspective for {self.article.title}"

class Quiz(models.Model):
    article = models.OneToOneField(Article, on_delete=models.CASCADE, related_name="quiz")
    questions = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Quiz for {self.article.title}"
