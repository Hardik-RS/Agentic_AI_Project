from django.urls import path
from .views import JobMatchingView, ResumeProcessView

urlpatterns = [
    path("resume-process/<int:resume_id>/",ResumeProcessView.as_view(),name="resume-process",),
    path("resume/<int:resume_id>/job-match/",JobMatchingView.as_view(),name="job-matching",),
]