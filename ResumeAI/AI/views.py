from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from Resume.models import Resume

from AI.Models.ResumeParserResult import ResumeParserResult
from AI.Agents.ResumeParserAgent import ResumeParserAgent
from AI.Models.ResumeAnalysisResult import ResumeAnalysisResult
from AI.Agents.ResumeAnalysisAgent import ResumeAnalysisAgent
from AI.Schemas.ResumeSchema import ResumeSchema

class ResumeParserView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, resume_id):

        # Get uploaded resume
        resume = get_object_or_404(
            Resume,
            id=resume_id,
            user=request.user
        )

        # Check extracted text exists
        if not resume.extracted_text:
            return Response(
                {
                    "error": "Resume text not found."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Run parser agent
        parser = ResumeParserAgent()

        parsed_resume = parser.run(
            resume.extracted_text
        )

        # Save parser output
        parser_result, created = ResumeParserResult.objects.update_or_create(
            resume=resume,
            defaults={
                "parsed_data": parsed_resume.model_dump()
            }
        )

        return Response(
            {
                "message": "Resume parsed successfully.",
                "parser_result_id": parser_result.id,
                "created": created,
            },
            status=status.HTTP_200_OK
        )

class ResumeAnalysisView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, resume_id):

        # Step 1: Get resume
        resume = get_object_or_404(
            Resume,
            id=resume_id,
            user=request.user
        )

        # Step 2: Get parser result
        try:
            parser_result = resume.parser_result

        except ResumeParserResult.DoesNotExist:
            return Response(
                {
                    "error": "Resume must be parsed before analysis."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Step 3: Convert JSON to ResumeSchema
        resume_schema = ResumeSchema.model_validate(
            parser_result.parsed_data
        )

        # Step 4: Run analysis agent
        analysis_agent = ResumeAnalysisAgent()

        analysis = analysis_agent.run(
            resume_schema
        )

        # Step 5: Save analysis result
        analysis_result, created = ResumeAnalysisResult.objects.update_or_create(
            resume=resume,
            defaults={
                "analysis_data": analysis.model_dump()
            }
        )

        return Response(
            {
                "message": "Resume analyzed successfully.",
                "analysis_result_id": analysis_result.id,
                "created": created,
            },
            status=status.HTTP_200_OK
        )