from django.urls import path
from .views import ResumeParserView, ResumeAnalysisView

urlpatterns = [
    path("resume-parser/<int:resume_id>/",ResumeParserView.as_view(),name="resume-parser",),
    path("resume-analysis/<int:resume_id>/",ResumeAnalysisView.as_view(),name="resume-analysis",),
]