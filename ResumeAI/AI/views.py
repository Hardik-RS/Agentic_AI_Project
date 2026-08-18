from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from Resume.models import Resume

from AI.Models.ResumeParserResult import ResumeParserResult
from AI.Models.ResumeAnalysisResult import ResumeAnalysisResult

from AI.Graphs.ResumeGraph import run_resume_graph


class ResumeProcessView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, resume_id):

        # ----------------------------------
        # Step 1: Get resume from database
        # ----------------------------------

        resume = get_object_or_404(Resume,id=resume_id,user=request.user)

        # ----------------------------------
        # Step 2: Check extracted text
        # ----------------------------------

        if not resume.extracted_text:

            return Response(
                {
                    "error": "Resume text not found."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------
        # Step 3: Run complete LangGraph
        # ----------------------------------

        try:
            result = run_resume_graph(resume.extracted_text)

        except Exception as exc:

            return Response(
                {
                    "error": "Resume AI processing failed.",
                    "details": str(exc)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # ----------------------------------
        # Step 4: Get graph results
        # ----------------------------------

        parsed_resume = result.get("parsed_resume")

        analysis = result.get("analysis")

        if parsed_resume is None:

            return Response(
                {
                    "error": "Resume parser did not return a result."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        if analysis is None:

            return Response(
                {
                    "error": "Resume analysis did not return a result."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # ----------------------------------
        # Step 5: Save parser result
        # ----------------------------------

        parser_result, parser_created = (
            ResumeParserResult.objects.update_or_create(
                resume=resume,
                defaults={
                    "parsed_data": parsed_resume.model_dump()
                }
            )
        )

        # ----------------------------------
        # Step 6: Save analysis result
        # ----------------------------------

        analysis_result, analysis_created = (
            ResumeAnalysisResult.objects.update_or_create(
                resume=resume,
                defaults={
                    "analysis_data": analysis.model_dump()
                }
            )
        )

        # ----------------------------------
        # Step 7: Return response
        # ----------------------------------

        return Response(
            {
                "message": "Resume processed successfully.",

                "parser_result_id": parser_result.id,

                "analysis_result_id": analysis_result.id,

                "parser_created": parser_created,

                "analysis_created": analysis_created,
            },
            status=status.HTTP_200_OK
        )