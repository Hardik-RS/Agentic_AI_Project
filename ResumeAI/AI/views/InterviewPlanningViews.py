from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from Resume.models import Resume
from AI.Models.InterviewPlanResult import InterviewPlanResult

from AI.Services.InterviewPlanningService import (
    InterviewPlanningService
)


class InterviewPlanningView(APIView):

    permission_classes = [IsAuthenticated]

    def post(
        self,
        request,
        resume_id,
        job_match_id
    ):

        # ---------------------------------------
        # Step 1: Get user's resume
        # ---------------------------------------

        try:

            resume = Resume.objects.get(
                id=resume_id,
                user=request.user
            )

        except Resume.DoesNotExist:

            return Response(
                {
                    "error": "Resume not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # ---------------------------------------
        # Step 2: Run interview planning service
        # ---------------------------------------

        try:

            result = InterviewPlanningService.create_plan(
                resume=resume,
                job_match_id=job_match_id
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

        # ---------------------------------------
        # Step 3: Return interview plan
        # ---------------------------------------

        return Response(
            {
                "message": "Interview plan created successfully.",

                "interview_plan_id": result.id,

                "plan_data": result.plan_data
            },
            status=status.HTTP_200_OK
        )


class InterviewPlanHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        plans = (
            InterviewPlanResult.objects
            .filter(resume__user=request.user)
            .select_related("resume", "job_match")
            .order_by("-created_at")
        )

        return Response(
            [
                {
                    "id": plan.id,
                    "interview_plan_id": plan.id,
                    "resume_id": plan.resume_id,
                    "job_match_id": plan.job_match_id,
                    "job_title": plan.job_match.job_title,
                    "plan_data": plan.plan_data,
                    "created_at": plan.created_at,
                }
                for plan in plans
            ],
            status=status.HTTP_200_OK,
        )


class InterviewAnswerEvaluationView(APIView):

    permission_classes = [IsAuthenticated]

    def post(
        self,
        request,
        resume_id,
        interview_plan_id
    ):

        # ---------------------------------------
        # 1. Get Resume
        # ---------------------------------------

        try:

            resume = Resume.objects.get(
                id=resume_id,
                user=request.user
            )

        except Resume.DoesNotExist:

            return Response(
                {
                    "error": "Resume not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # ---------------------------------------
        # 2. Get Request Data
        # ---------------------------------------

        question_number = request.data.get(
            "question_number"
        )

        user_answer = request.data.get(
            "user_answer"
        )

        # ---------------------------------------
        # 3. Validate Question Number
        # ---------------------------------------

        if question_number is None:

            return Response(
                {
                    "error": "question_number is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            question_number = int(
                question_number
            )

        except (TypeError, ValueError):

            return Response(
                {
                    "error": (
                        "question_number must be "
                        "an integer."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if question_number <= 0:

            return Response(
                {
                    "error": (
                        "question_number must be "
                        "greater than 0."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ---------------------------------------
        # 4. Validate Answer
        # ---------------------------------------

        if not user_answer or not str(
            user_answer
        ).strip():

            return Response(
                {
                    "error": "user_answer is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ---------------------------------------
        # 5. Evaluate Answer
        # ---------------------------------------

        try:

            result = (
                InterviewPlanningService.evaluate_answer(

                    resume=resume,

                    interview_plan_id=(
                        interview_plan_id
                    ),

                    question_number=(
                        question_number
                    ),

                    user_answer=str(
                        user_answer
                    ).strip()
                )
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

        except Exception:

            return Response(
                {
                    "error": (
                        "Failed to evaluate "
                        "interview answer."
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # ---------------------------------------
        # 6. Return Evaluation
        # ---------------------------------------

        return Response(
            {
                "message": (
                    "Interview answer evaluated "
                    "successfully."
                ),

                "evaluation_id": result.id,

                "interview_plan_id": (
                    interview_plan_id
                ),

                "question_number": (
                    result.question_number
                ),

                "question": result.question,

                "category": result.category,

                "difficulty": result.difficulty,

                "user_answer": result.user_answer,

                "evaluation": (
                    result.evaluation_data
                ),

                "created_at": (
                    result.created_at
                ),
            },

            status=status.HTTP_200_OK
        )


class InterviewFeedbackView(APIView):

    permission_classes = [IsAuthenticated]

    def post(
        self,
        request,
        resume_id,
        interview_plan_id
    ):

        try:

            resume = Resume.objects.get(
                id=resume_id,
                user=request.user
            )

        except Resume.DoesNotExist:

            return Response(
                {
                    "error": "Resume not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        try:

            result = (
                InterviewPlanningService.generate_feedback(
                    resume=resume,
                    interview_plan_id=interview_plan_id
                )
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

        except Exception:

            return Response(
                {
                    "error": (
                        "Failed to generate "
                        "interview feedback."
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(
            {
                "message": (
                    "Interview feedback generated "
                    "successfully."
                ),

                "feedback_id": result.id,

                "interview_plan_id": (
                    interview_plan_id
                ),

                "feedback": result.feedback_data,

                "created_at": result.created_at,
            },

            status=status.HTTP_200_OK
        )