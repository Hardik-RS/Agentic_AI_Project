from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from Resume.models import Resume

from AI.Models.MockInterview import MockInterview
from AI.Services.MockInterviewService import MockInterviewService


class MockInterviewHistoryView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        interviews = (
            MockInterview.objects
            .filter(user=request.user)
            .order_by("-created_at")
        )

        return Response(
            {
                "success": True,
                "interviews": [
                    {
                        "mock_interview_id": interview.id,
                        "resume_id": interview.resume_id,
                        "interview_plan_id": interview.interview_plan_id,
                        "status": interview.status,
                        "current_question_number": (
                            interview.current_question_number
                        ),
                        "total_questions": interview.total_questions,
                        "created_at": interview.created_at,
                        "started_at": interview.started_at,
                        "completed_at": interview.completed_at,
                    }
                    for interview in interviews
                ],
            },
            status=status.HTTP_200_OK
        )


class StartMockInterviewView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, resume_id):

        interview_plan_id = request.data.get(
            "interview_plan_id"
        )

        if not interview_plan_id:
            return Response(
                {
                    "success": False,
                    "message": "interview_plan_id is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            resume = Resume.objects.get(
                id=resume_id,
                user=request.user
            )

        except Resume.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Resume not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        try:

            interview = MockInterviewService.start_interview(
                user=request.user,
                resume=resume,
                interview_plan_id=int(interview_plan_id)
            )

            current_question = (
                MockInterviewService.get_current_question(
                    user=request.user,
                    interview_id=interview.id
                )
            )

            return Response(
                {
                    "success": True,
                    "message": "Mock interview started successfully.",
                    "mock_interview_id": interview.id,
                    "resume_id": interview.resume_id,
                    "interview_plan_id": interview.interview_plan_id,
                    "status": interview.status,
                    "current_question_number": (
                        interview.current_question_number
                    ),
                    "total_questions": interview.total_questions,
                    "question": current_question["question"]
                },
                status=status.HTTP_201_CREATED
            )

        except ValueError as error:

            return Response(
                {
                    "success": False,
                    "message": str(error)
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception as error:

            return Response(
                {
                    "success": False,
                    "message": "Failed to start mock interview.",
                    "details": str(error)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MockInterviewDetailView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, interview_id):

        try:

            interview = MockInterviewService.get_interview(
                user=request.user,
                interview_id=interview_id
            )

            result = MockInterviewService.get_current_question(
                user=request.user,
                interview_id=interview_id
            )

            return Response(
                {
                    "success": True,
                    "mock_interview_id": interview.id,
                    "resume_id": interview.resume_id,
                    "interview_plan_id": interview.interview_plan_id,
                    "status": interview.status,
                    "current_question_number": (
                        interview.current_question_number
                    ),
                    "total_questions": interview.total_questions,
                    "question": result["question"]
                },
                status=status.HTTP_200_OK
            )

        except ValueError as error:

            return Response(
                {
                    "success": False,
                    "message": str(error)
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception:

            return Response(
                {
                    "success": False,
                    "message": "Mock interview not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )


class SubmitMockInterviewAnswerView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, interview_id):

        question_number = request.data.get(
            "question_number"
        )

        answer_text = request.data.get(
            "answer_text"
        )

        if question_number is None:

            return Response(
                {
                    "success": False,
                    "message": "question_number is required."
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
                    "success": False,
                    "message": "question_number must be an integer."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if question_number <= 0:

            return Response(
                {
                    "success": False,
                    "message": (
                        "question_number must be greater than 0."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not answer_text or not str(answer_text).strip():

            return Response(
                {
                    "success": False,
                    "message": "answer_text is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            result = MockInterviewService.submit_answer(
                user=request.user,
                interview_id=interview_id,
                question_number=question_number,
                answer_text=str(answer_text).strip()
            )

            interview = result["interview"]
            answer = result["answer"]

            # ---------------------------------------
            # Evaluation is stored directly on
            # MockInterviewAnswer.evaluation
            # ---------------------------------------

            evaluation_data = answer.evaluation

            final_feedback = result.get(
                "final_feedback"
            )

            final_feedback_data = None

            if final_feedback is not None:

                if isinstance(
                    final_feedback,
                    dict
                ):
                    final_feedback_data = (
                        final_feedback
                    )

                elif hasattr(
                    final_feedback,
                    "feedback_data"
                ):
                    final_feedback_data = (
                        final_feedback.feedback_data
                    )

                elif hasattr(
                    final_feedback,
                    "model_dump"
                ):
                    final_feedback_data = (
                        final_feedback.model_dump()
                    )

            return Response(
                {
                    "success": True,
                    "mock_interview_id": interview.id,
                    "question_number": answer.question_number,
                    "answer_text": answer.answer_text,
                    "evaluation": evaluation_data,
                    "score": answer.score,
                    "feedback": answer.feedback,
                    "next_question": result.get(
                        "next_question"
                    ),
                    "completed": result["completed"],
                    "final_feedback": final_feedback_data,
                    "message": "Answer submitted successfully."
                },
                status=status.HTTP_200_OK
            )

        except ValueError as error:

            return Response(
                {
                    "success": False,
                    "message": str(error)
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        except RuntimeError as error:

            return Response(
                {
                    "success": False,
                    "message": str(error)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        except Exception as error:

            return Response(
                {
                    "success": False,
                    "message": (
                        "Failed to submit interview answer."
                    ),
                    "details": str(error)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CompleteMockInterviewView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, interview_id):

        try:

            interview = (
                MockInterviewService.complete_interview(
                    user=request.user,
                    interview_id=interview_id
                )
            )

            return Response(
                {
                    "success": True,
                    "message": (
                        "Mock interview completed successfully."
                    ),
                    "mock_interview_id": interview.id,
                    "resume_id": interview.resume_id,
                    "interview_plan_id": interview.interview_plan_id,
                    "status": interview.status,
                    "completed_at": interview.completed_at,
                    "final_feedback": interview.final_feedback
                },
                status=status.HTTP_200_OK
            )

        except ValueError as error:

            return Response(
                {
                    "success": False,
                    "message": str(error)
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception as error:

            return Response(
                {
                    "success": False,
                    "message": (
                        "Failed to complete mock interview."
                    ),
                    "details": str(error)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MockInterviewResultView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, interview_id):

        try:

            result = MockInterviewService.get_result(
                user=request.user,
                interview_id=interview_id
            )

            interview = result["interview"]
            answers = result["answers"]
            questions = result["questions"]

            answers_data = []

            for answer in answers:

                answers_data.append(
                    {
                        "question_number": (
                            answer.question_number
                        ),
                        "question_text": (
                            answer.question_text
                        ),
                        "answer_text": (
                            answer.answer_text
                        ),
                        "evaluation": (
                            answer.evaluation
                        ),
                        "score": answer.score,
                        "feedback": answer.feedback,
                        "answered_at": (
                            answer.answered_at
                        )
                    }
                )

            return Response(
                {
                    "success": True,
                    "mock_interview_id": interview.id,
                    "resume_id": interview.resume_id,
                    "interview_plan_id": interview.interview_plan_id,
                    "status": interview.status,
                    "current_question_number": (
                        interview.current_question_number
                    ),
                    "total_questions": (
                        interview.total_questions
                    ),
                    "questions": questions,
                    "started_at": interview.started_at,
                    "completed_at": interview.completed_at,
                    "answers": answers_data,
                    "final_feedback": (
                        interview.final_feedback
                    )
                },
                status=status.HTTP_200_OK
            )

        except ValueError as error:

            return Response(
                {
                    "success": False,
                    "message": str(error)
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception as error:

            return Response(
                {
                    "success": False,
                    "message": (
                        "Failed to get mock interview result."
                    ),
                    "details": str(error)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )