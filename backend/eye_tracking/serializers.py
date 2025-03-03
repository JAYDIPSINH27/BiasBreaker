from rest_framework import serializers
from .models import EyeTrackingSession, GazeData

class EyeTrackingSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = EyeTrackingSession
        fields = '__all__'

class GazeDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = GazeData
        fields = '__all__'
