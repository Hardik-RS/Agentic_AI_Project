import logging

from django.db import transaction
from django.utils import timezone

from AI.Models.InterviewPlanResult import (
    InterviewPlanResult
)

from AI.Models.MockInterview import (
    MockInterview
)

from AI.Models.MockInterviewAnswer import (
    MockInterviewAnswer
)

from AI.Services.InterviewPlanningService import (
    InterviewPlanningService
)


logger = logging.getLogger(__name__)


class MockInterviewService:

    # =====================================================
    # START MOCK INTERVIEW
    # =====================================================

    @staticmethod
    @transaction.atomic
    def start_interview(
        user,
        resume,
        interview_plan_id
    ):

        try:

            interview_plan = InterviewPlanResult.objects.get(
                id=interview_plan_id,
                resume=resume
            )

        except InterviewPlanResult.DoesNotExist:

            raise ValueError(
                "Interview plan not found."
            )

        # ---------------------------------------------
        # Get all questions from interview plan
        # ---------------------------------------------

        questions = (
            MockInterviewService._get_questions(
                interview_plan
            )
        )

        if not questions:

            raise ValueError(
                "Interview plan contains no questions."
            )

        # ---------------------------------------------
        # Create mock interview
        # ---------------------------------------------

        interview = MockInterview.objects.create(
            user=user,
            resume=resume,
            interview_plan=interview_plan,
            status="IN_PROGRESS",
            current_question_number=1,
            total_questions=len(questions),
            started_at=timezone.now()
        )

        return interview

    # =====================================================
    # GET MOCK INTERVIEW
    # =====================================================

    @staticmethod
    def get_interview(
        user,
        interview_id
    ):

        try:

            return MockInterview.objects.get(
                id=interview_id,
                user=user
            )

        except MockInterview.DoesNotExist:

            raise ValueError(
                "Mock interview not found."
            )

    # =====================================================
    # GET CURRENT QUESTION
    # =====================================================

    @staticmethod
    def get_current_question(
        user,
        interview_id
    ):

        interview = (
            MockInterviewService.get_interview(
                user=user,
                interview_id=interview_id
            )
        )

        if interview.status != "IN_PROGRESS":

            raise ValueError(
                "Mock interview is not in progress."
            )

        question = (
            MockInterviewService._get_question(
                interview.interview_plan,
                interview.current_question_number
            )
        )

        if question is None:

            raise ValueError(
                "Current interview question not found."
            )

        # ---------------------------------------------
        # Always return question text
        # ---------------------------------------------

        question_text = (
            MockInterviewService._get_question_text(
                question
            )
        )

        if not question_text:

            raise ValueError(
                "Current interview question text not found."
            )

        return {
            "interview": interview,
            "question": question_text,
            "question_number": (
                interview.current_question_number
            ),
            "total_questions": (
                interview.total_questions
            )
        }

    # =====================================================
    # SUBMIT MOCK INTERVIEW ANSWER
    # =====================================================

    @staticmethod
    @transaction.atomic
    def submit_answer(
        user,
        interview_id,
        question_number,
        answer_text
    ):

        # ---------------------------------------------
        # Get interview
        # ---------------------------------------------

        interview = (
            MockInterviewService.get_interview(
                user=user,
                interview_id=interview_id
            )
        )

        # ---------------------------------------------
        # Validate interview status
        # ---------------------------------------------

        if interview.status != "IN_PROGRESS":

            raise ValueError(
                "Mock interview is not in progress."
            )

        # ---------------------------------------------
        # Validate question number
        # ---------------------------------------------

        if question_number != (
            interview.current_question_number
        ):

            raise ValueError(
                "Invalid question number."
            )

        # ---------------------------------------------
        # Validate answer
        # ---------------------------------------------

        if not answer_text or not answer_text.strip():

            raise ValueError(
                "Answer cannot be empty."
            )

        answer_text = answer_text.strip()

        # ---------------------------------------------
        # Prevent duplicate answer
        # ---------------------------------------------

        existing_answer = (
            MockInterviewAnswer.objects.filter(
                mock_interview=interview,
                question_number=question_number
            ).first()
        )

        if existing_answer is not None:

            raise ValueError(
                "This question has already been answered."
            )

        # ---------------------------------------------
        # Get current question
        # ---------------------------------------------

        question = (
            MockInterviewService._get_question(
                interview.interview_plan,
                question_number
            )
        )

        if question is None:

            raise ValueError(
                "Interview question not found."
            )

        question_text = (
            MockInterviewService._get_question_text(
                question
            )
        )

        if not question_text:

            raise ValueError(
                "Interview question text not found."
            )

        # =================================================
        # ANSWER EVALUATION
        # =================================================
        #
        # IMPORTANT:
        #
        # save_result=False tells
        # InterviewPlanningService not to create
        # AnswerEvaluationResult.
        #
        # The evaluation will be stored only inside
        # MockInterviewAnswer.
        #
        # This prevents duplicate evaluation records.
        #
        # =================================================

        try:

            evaluation_result = (
                InterviewPlanningService.evaluate_answer(
                    resume=interview.resume,
                    interview_plan_id=(
                        interview.interview_plan_id
                    ),
                    question_number=question_number,
                    user_answer=answer_text,
                    save_result=False
                )
            )

        except ValueError as exc:

            logger.exception(
                "Mock interview answer evaluation validation failed."
            )

            raise ValueError(
                str(exc)
            ) from exc

        except Exception as exc:

            logger.exception(
                "Mock interview answer evaluation failed: %s",
                exc
            )

            raise RuntimeError(
                f"Answer evaluation failed: {exc}"
            ) from exc

        # =================================================
        # CONVERT EVALUATION TO DICTIONARY
        # =================================================

        evaluation_data = (
            MockInterviewService._evaluation_to_dict(
                evaluation_result
            )
        )

        # =================================================
        # EXTRACT SCORE AND FEEDBACK
        # =================================================

        score = (
            MockInterviewService._get_evaluation_score(
                evaluation_data
            )
        )

        feedback = (
            MockInterviewService._get_evaluation_feedback(
                evaluation_data
            )
        )

        # =================================================
        # SAVE MOCK INTERVIEW ANSWER
        # =================================================

        try:

            answer = MockInterviewAnswer.objects.create(

                mock_interview=interview,

                question_number=question_number,

                question_text=question_text,

                answer_text=answer_text,

                evaluation=evaluation_data,

                score=score,

                feedback=feedback
            )

        except Exception as exc:

            logger.exception(
                "Failed to save mock interview answer."
            )

            raise RuntimeError(
                "Failed to save interview answer."
            ) from exc

        # =================================================
        # LAST QUESTION
        # =================================================

        if question_number >= interview.total_questions:

            final_feedback = None

            # ---------------------------------------------
            # Reuse existing final feedback
            # ---------------------------------------------

            if interview.final_feedback is not None:

                final_feedback = (
                    interview.final_feedback
                )

            # ---------------------------------------------
            # Generate final feedback only once
            # ---------------------------------------------

            else:

                try:

                    final_feedback = (
                        InterviewPlanningService.generate_feedback(
                            resume=interview.resume,
                            interview_plan_id=(
                                interview.interview_plan_id
                            ),
                            mock_interview_id=(
                                interview.id
                            )
                        )
                    )

                except ValueError as exc:

                    logger.exception(
                        "Final interview feedback validation failed."
                    )

                    raise ValueError(
                        str(exc)
                    ) from exc

                except Exception as exc:

                    logger.exception(
                        "Final interview feedback generation failed: %s",
                        exc
                    )

                    raise RuntimeError(
                        f"Final interview feedback generation failed: {exc}"
                    ) from exc

                # -----------------------------------------
                # Convert feedback to JSON-compatible data
                # -----------------------------------------

                final_feedback_data = (
                    MockInterviewService._feedback_to_dict(
                        final_feedback
                    )
                )

                if final_feedback_data is not None:

                    interview.final_feedback = (
                        final_feedback_data
                    )

                    final_feedback = (
                        final_feedback_data
                    )

            # ---------------------------------------------
            # Complete interview
            # ---------------------------------------------

            interview.status = "COMPLETED"

            interview.completed_at = timezone.now()

            interview.save(
                update_fields=[
                    "status",
                    "completed_at",
                    "final_feedback",
                    "updated_at"
                ]
            )

            return {
                "interview": interview,
                "answer": answer,
                "evaluation": evaluation_result,
                "next_question": None,
                "completed": True,
                "final_feedback": final_feedback
            }

        # =================================================
        # MOVE TO NEXT QUESTION
        # =================================================

        interview.current_question_number = (
            question_number + 1
        )

        interview.save(
            update_fields=[
                "current_question_number",
                "updated_at"
            ]
        )

        next_question = (
            MockInterviewService._get_question(
                interview.interview_plan,
                interview.current_question_number
            )
        )

        # ---------------------------------------------
        # Always return next question as text
        # ---------------------------------------------

        next_question_text = None

        if next_question is not None:

            next_question_text = (
                MockInterviewService._get_question_text(
                    next_question
                )
            )

        return {
            "interview": interview,
            "answer": answer,
            "evaluation": evaluation_result,
            "next_question": next_question_text,
            "completed": False,
            "final_feedback": None
        }

    # =====================================================
    # COMPLETE MOCK INTERVIEW
    # =====================================================

    @staticmethod
    @transaction.atomic
    def complete_interview(
        user,
        interview_id
    ):

        interview = (
            MockInterviewService.get_interview(
                user=user,
                interview_id=interview_id
            )
        )

        # ---------------------------------------------
        # Already completed
        # ---------------------------------------------

        if interview.status == "COMPLETED":

            return interview

        # =================================================
        # GENERATE FINAL FEEDBACK ONLY IF NOT AVAILABLE
        # =================================================

        if interview.final_feedback is None:

            # ---------------------------------------------
            # Make sure at least one answer exists
            # ---------------------------------------------

            answers_exist = (
                MockInterviewAnswer.objects.filter(
                    mock_interview=interview
                ).exists()
            )

            if not answers_exist:

                raise ValueError(
                    "No answers found for this mock interview."
                )

            try:

                final_feedback = (
                    InterviewPlanningService.generate_feedback(
                        resume=interview.resume,
                        interview_plan_id=(
                            interview.interview_plan_id
                        ),
                        mock_interview_id=(
                            interview.id
                        )
                    )
                )

            except ValueError as exc:

                logger.exception(
                    "Final interview feedback validation failed."
                )

                raise ValueError(
                    str(exc)
                ) from exc

            except Exception as exc:

                logger.exception(
                    "Final interview feedback generation failed."
                )

                raise RuntimeError(
                    "Final interview feedback generation failed."
                ) from exc

            final_feedback_data = (
                MockInterviewService._feedback_to_dict(
                    final_feedback
                )
            )

            if final_feedback_data is not None:

                interview.final_feedback = (
                    final_feedback_data
                )

        # =================================================
        # COMPLETE INTERVIEW
        # =================================================

        interview.status = "COMPLETED"

        interview.completed_at = timezone.now()

        interview.save(
            update_fields=[
                "status",
                "completed_at",
                "final_feedback",
                "updated_at"
            ]
        )

        return interview

    # =====================================================
    # GET MOCK INTERVIEW RESULT
    # =====================================================

    @staticmethod
    def get_result(
        user,
        interview_id
    ):

        interview = (
            MockInterviewService.get_interview(
                user=user,
                interview_id=interview_id
            )
        )

        answers = (
            interview.answers.all()
        )

        questions = [
            {
                "question_number": question_number,
                "question_text": MockInterviewService._get_question_text(question),
                "category": question.get("category") if isinstance(question, dict) else None,
                "difficulty": question.get("difficulty") if isinstance(question, dict) else None,
            }
            for question_number, question in enumerate(
                MockInterviewService._get_questions(interview.interview_plan),
                start=1
            )
        ]

        return {
            "interview": interview,
            "answers": answers,
            "questions": questions,
            "final_feedback": (
                interview.final_feedback
            )
        }

    # =====================================================
    # GET ALL QUESTIONS
    # =====================================================

    @staticmethod
    def _get_questions(
        interview_plan
    ):

        plan_data = interview_plan.plan_data

        if not isinstance(
            plan_data,
            dict
        ):

            return []

        rounds = plan_data.get(
            "rounds",
            []
        )

        if not isinstance(
            rounds,
            list
        ):

            return []

        questions = []

        for round_data in rounds:

            if not isinstance(
                round_data,
                dict
            ):

                continue

            round_questions = round_data.get(
                "questions",
                []
            )

            if not isinstance(
                round_questions,
                list
            ):

                continue

            for question in round_questions:

                # -----------------------------------------
                # String question
                # -----------------------------------------

                if isinstance(
                    question,
                    str
                ):

                    question_text = (
                        question.strip()
                    )

                    if question_text:

                        questions.append(
                            question_text
                        )

                # -----------------------------------------
                # Dictionary question
                # -----------------------------------------

                elif isinstance(
                    question,
                    dict
                ):

                    question_text = (
                        MockInterviewService._get_question_text(
                            question
                        )
                    )

                    if question_text:

                        # Keep complete question data
                        # internally because category,
                        # difficulty etc. may be useful.
                        questions.append(
                            question
                        )

        return questions

    # =====================================================
    # GET QUESTION BY NUMBER
    # =====================================================

    @staticmethod
    def _get_question(
        interview_plan,
        question_number
    ):

        questions = (
            MockInterviewService._get_questions(
                interview_plan
            )
        )

        index = question_number - 1

        if index < 0:

            return None

        if index >= len(questions):

            return None

        return questions[index]

    # =====================================================
    # GET QUESTION TEXT
    # =====================================================

    @staticmethod
    def _get_question_text(
        question
    ):

        # ---------------------------------------------
        # String
        # ---------------------------------------------

        if isinstance(
            question,
            str
        ):

            text = question.strip()

            return text if text else None

        # ---------------------------------------------
        # Dictionary
        # ---------------------------------------------

        if isinstance(
            question,
            dict
        ):

            question_text = (
                question.get("question")
                or question.get("text")
                or question.get("question_text")
            )

            if question_text is None:

                return None

            question_text = str(
                question_text
            ).strip()

            return (
                question_text
                if question_text
                else None
            )

        return None

    # =====================================================
    # CONVERT EVALUATION TO DICT
    # =====================================================

    @staticmethod
    def _evaluation_to_dict(
        evaluation
    ):

        if evaluation is None:

            return None

        # ---------------------------------------------
        # Pydantic model
        # ---------------------------------------------

        if hasattr(
            evaluation,
            "model_dump"
        ):

            return evaluation.model_dump()

        # ---------------------------------------------
        # Already dictionary
        # ---------------------------------------------

        if isinstance(
            evaluation,
            dict
        ):

            return evaluation

        # ---------------------------------------------
        # Django/database object fallback
        # ---------------------------------------------

        if hasattr(
            evaluation,
            "evaluation_data"
        ):

            data = evaluation.evaluation_data

            if isinstance(
                data,
                dict
            ):

                return data

        return None

    # =====================================================
    # EXTRACT SCORE
    # =====================================================

    @staticmethod
    def _get_evaluation_score(
        evaluation_data
    ):

        if not isinstance(
            evaluation_data,
            dict
        ):

            return None

        score = (
            evaluation_data.get(
                "score"
            )
        )

        if score is None:

            score = (
                evaluation_data.get(
                    "overall_score"
                )
            )

        return score

    # =====================================================
    # EXTRACT FEEDBACK
    # =====================================================

    @staticmethod
    def _get_evaluation_feedback(
        evaluation_data
    ):

        if not isinstance(
            evaluation_data,
            dict
        ):

            return None

        feedback = (
            evaluation_data.get(
                "feedback"
            )
        )

        if feedback is None:

            feedback = (
                evaluation_data.get(
                    "overall_feedback"
                )
            )

        return feedback

    # =====================================================
    # CONVERT FINAL FEEDBACK TO DICT
    # =====================================================

    @staticmethod
    def _feedback_to_dict(
        feedback
    ):

        if feedback is None:

            return None

        # ---------------------------------------------
        # Pydantic feedback object
        # ---------------------------------------------

        if hasattr(
            feedback,
            "model_dump"
        ):

            return feedback.model_dump()

        # ---------------------------------------------
        # Existing FeedbackResult object
        # ---------------------------------------------

        if hasattr(
            feedback,
            "feedback_data"
        ):

            data = feedback.feedback_data

            if isinstance(
                data,
                dict
            ):

                return data

        # ---------------------------------------------
        # Dictionary
        # ---------------------------------------------

        if isinstance(
            feedback,
            dict
        ):

            return feedback

        return None