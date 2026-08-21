from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

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