from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from Resume.models import Resume

from AI.Models.JobMatchResult import JobMatchResult
from AI.Services.JobMatchingService import JobMatchingService


class JobMatchingView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, resume_id):

        resume = get_object_or_404(
            Resume,
            id=resume_id,
            user=request.user
        )

        job_description = request.data.get(
            "job_description"
        )

        job_title = request.data.get(
            "job_title",
            ""
        )

        # Job title is REQUIRED

        if not job_title or not job_title.strip():

            return Response(
                {
                    "error": "Job title is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            result = JobMatchingService.match_resume_to_job(
                resume=resume,
                job_title=job_title,
                job_description=job_description,
            )

        except ValueError as exc:

            return Response(
                {
                    "error": str(exc)
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        except RuntimeError as exc:

            return Response(
                {
                    "error": str(exc)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(
            {
                "message": "Job matching completed successfully.",
                "job_match_id": result.id,
                "match_data": result.match_data,
            },
            status=status.HTTP_200_OK
        )


class JobMatchHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        matches = (
            JobMatchResult.objects
            .filter(resume__user=request.user)
            .select_related("resume")
            .order_by("-created_at")
        )

        return Response(
            [
                {
                    "id": match.id,
                    "job_match_id": match.id,
                    "resume_id": match.resume_id,
                    "job_title": match.job_title,
                    "job_description": match.job_description,
                    "match_data": match.match_data,
                    "created_at": match.created_at,
                }
                for match in matches
            ],
            status=status.HTTP_200_OK,
        )