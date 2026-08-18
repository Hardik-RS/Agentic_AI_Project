from django.urls import path
from .views import ResumeProcessView

urlpatterns = [
    path("resume-process/<int:resume_id>/",ResumeProcessView.as_view(),name="resume-process",),
]