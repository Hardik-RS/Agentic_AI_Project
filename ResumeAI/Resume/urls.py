from django.urls import path

from .views import ResumeDashboardView, ResumeUploadView

urlpatterns = [
    path("dashboard/", ResumeDashboardView.as_view(), name="resume-dashboard"),
    path("upload/", ResumeUploadView.as_view(), name="resume-upload",),
]