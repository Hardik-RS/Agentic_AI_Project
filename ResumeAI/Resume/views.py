from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from AI.Models.JobMatchResult import JobMatchResult
from AI.Models.MockInterview import MockInterview
from Resume.models import Resume
from .serializers import ResumeUploadSerializer
from .Utils.pdfExtractor import extract_text_from_pdf


class ResumeUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        serializer = ResumeUploadSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        resume = serializer.save(
            user=request.user,
            status="Processing",
        )

        try:

            text = extract_text_from_pdf(
                resume.resume_file.path
            )

            if not text.strip():
                resume.status = "Failed"
                resume.save()

                return Response(
                    {
                        "message": "No text could be extracted from the uploaded PDF."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Remove NUL characters from extracted PDF/OCR text
            text = text.replace("\x00", "")

            # Normalize line endings
            text = text.replace("\r\n", "\n").replace("\r", "\n")

            resume.extracted_text = text
            resume.status = "Completed"
            resume.save()

            return Response(
                {
                    "message": "Resume uploaded successfully.",
                    "resume_id": resume.id,
                    "characters": len(text),
                    "status": resume.status,
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:

            resume.status = "Failed"
            resume.save()

            return Response(
                {
                    "message": "Failed to process resume.",
                    "error": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ResumeDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        resumes = list(
            Resume.objects.filter(user=request.user).order_by("-uploaded_at")
        )
        resume_items = []
        analysis_count = 0

        for resume in resumes:
            analysis_result = getattr(resume, "analysis_result", None)
            score_result = getattr(resume, "score_result", None)
            if analysis_result is not None:
                analysis_count += 1

            resume_items.append(
                {
                    "id": resume.id,
                    "file_name": resume.resume_file.name.rsplit("/", 1)[-1],
                    "status": resume.status,
                    "uploaded_at": resume.uploaded_at,
                    "analysis_date": (
                        analysis_result.updated_at
                        if analysis_result is not None
                        else None
                    ),
                    "analysis_result": (
                        analysis_result.analysis_data
                        if analysis_result is not None
                        else None
                    ),
                    "score_result": (
                        score_result.score_data
                        if score_result is not None
                        else None
                    ),
                }
            )

        return Response(
            {
                "counts": {
                    "resumes": len(resumes),
                    "analyses": analysis_count,
                    "job_matches": JobMatchResult.objects.filter(
                        resume__user=request.user
                    ).count(),
                    "mock_interviews": MockInterview.objects.filter(
                        user=request.user,
                        resume__user=request.user,
                    ).count(),
                },
                "resumes": resume_items,
            },
            status=status.HTTP_200_OK,
        )