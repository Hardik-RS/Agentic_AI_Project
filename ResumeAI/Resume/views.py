from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Resume
from .serializers import ResumeUploadSerializer
from .Utils.pdfParser import extract_text_from_pdf


class ResumeUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ResumeUploadSerializer(data=request.data)

        if serializer.is_valid():
            resume=serializer.save(user=request.user,status="Processing",)

            text = extract_text_from_pdf(
                resume.resume_file.path
            )

            resume.extracted_text = text

            resume.status = "Completed"

            resume.save()

            return Response(
                {
                    "message": "Resume uploaded successfully",
                    "resume_id": resume.id,
                    "characters": len(text),
                    "status": resume.status,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )