from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from Resume.models import Resume

from AI.Services.ResumeProcessService import ResumeProcessingService
from AI.Services.JobMatchingService import JobMatchingService


class ResumeProcessView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, resume_id):

        # Step 1: Get resume from database

        resume = get_object_or_404(Resume,id=resume_id,user=request.user)

        # Step 2: Process resume

        try:
            result = ResumeProcessingService.process(resume)

        except ValueError as exc:

            return Response(
                {
                    "error": str(exc)
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception as exc:

            return Response(
                {
                    "error": "Resume AI processing failed.",
                    "details": str(exc)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Step 3: Return response

        return Response(
            {
                "message": "Resume processed successfully.",

                "parser_result_id": (result["parser_result"].id),

                "analysis_result_id": (result["analysis_result"].id),

                "parser_created": (result["parser_created"]),

                "analysis_created": (result["analysis_created"]),

                "score_result_id": (result["score_result"].id),

                "score_created": (result["score_created"])

            },
            status=status.HTTP_200_OK
        )

class JobMatchingView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self,request,resume_id):

        resume = get_object_or_404(Resume,id=resume_id,user=request.user)

        job_description = request.data.get("job_description")

        job_title = request.data.get("job_title","")

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
