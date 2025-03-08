import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from django.urls import path
from eye_tracking.consumers import EyeTrackingConsumer

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "biasbracker_server.settings")
django_asgi_app = get_asgi_application()

websocket_urlpatterns = [
    path("ws/eye-tracking/", EyeTrackingConsumer.as_asgi()),
]

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": URLRouter(websocket_urlpatterns),
})
