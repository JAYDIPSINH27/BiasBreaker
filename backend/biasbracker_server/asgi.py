import os
import django


os.environ.setdefault("DJANGO_SETTINGS_MODULE", "biasbracker_server.settings")
django.setup()  # Initialize Django and load apps

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from django.urls import path
from eye_tracking.consumers import EyeTrackingConsumer, GazeCollectorConsumer

django_asgi_app = get_asgi_application()

websocket_urlpatterns = [
    path("ws/eye-tracking/", EyeTrackingConsumer.as_asgi()),
    path("ws/gaze-collector/", GazeCollectorConsumer.as_asgi()),
]

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": URLRouter(websocket_urlpatterns),
})
