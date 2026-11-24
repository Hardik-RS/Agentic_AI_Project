import logging

from django.db import transaction

from Resume.models import Resume

from AI.Graphs.InterviewPlanningGraph import (
    run_interview_planning_graph
)

from AI.Models.InterviewPlanResult import (
    InterviewPlanResult
)

from AI.Models.AnswerEvaluationResult import (
    AnswerEvaluationResult
)

from AI.Models.JobMatchResult import (
    JobMatchResult
)

from AI.Models.FeedbackResult import (
    FeedbackResult
)

from AI.Models.MockInterview import (
    MockInterview
)

from AI.Models.MockInterviewAnswer import (
    MockInterviewAnswer
)

from AI.Schemas.ResumeSchema import (
    ResumeSchema
)

from AI.Schemas.AnalysisSchema import (
    AnalysisSchema
)

from AI.Schemas.ResumeScoreSchema import (
    ResumeScoreSchema
)

from AI.Schemas.JobMatchSchema import (
    JobMatchSchema
)

from AI.Schemas.InterviewPlanSchema import (
    InterviewPlanSchema
)


logger = logging.getLogger(__name__)


class InterviewPlanningService:

    @staticmethod
    @transaction.atomic
    def create_plan(
        resume,
        job_match_id
    ):

        try:

            job_match = JobMatchResult.objects.get(
                id=job_match_id,
                resume=resume
            )

        except JobMatchResult.DoesNotExist:

            raise ValueError(
                "Job match result not found."
            )

        try:

            parser_result = resume.parser_result

        except Exception as exc:

            raise ValueError(
                "Resume has not been parsed yet."
            ) from exc

        try:

            analysis_result = resume.analysis_result

        except Exception as exc:

            raise ValueError(
                "Resume has not been analyzed yet."
            ) from exc

        try:

            score_result = resume.score_result

        except Exception as exc:

            raise ValueError(
                "Resume has not been scored yet."
            ) from exc

        resume_schema = ResumeSchema.model_validate(
            parser_result.parsed_data
        )

        analysis_schema = AnalysisSchema.model_validate(
            analysis_result.analysis_data
        )

        score_schema = ResumeScoreSchema.model_validate(
            score_result.score_data
        )

        job_match_schema = JobMatchSchema.model_validate(
            job_match.match_data
        )

        try:

            graph_result = run_interview_planning_graph(
                operation="plan",
                resume=resume_schema,
                analysis=analysis_schema,
                score=score_schema,
                job_match=job_match_schema,
                job_title=job_match.job_title,
                job_description=(
                    job_match.job_description
                    or ""
                )
            )

        except Exception as exc:

            logger.exception(
                "Interview planning graph failed."
            )

            raise RuntimeError(
                "Interview planning failed."
            ) from exc

        interview_plan = graph_result.get(
            "interview_plan"
        )

        if interview_plan is None:

            raise RuntimeError(
                "Interview planner returned no result."
            )

        result = InterviewPlanResult.objects.create(
            resume=resume,
            job_match=job_match,
            plan_data=interview_plan.model_dump()
        )

        return result


    @staticmethod
    @transaction.atomic
    def evaluate_answer(
        resume,
        interview_plan_id,
        question_number,
        user_answer,
        save_result=True
    ):

        if not user_answer or not user_answer.strip():

            raise ValueError(
                "User answer cannot be empty."
            )

        try:

            interview_plan = InterviewPlanResult.objects.get(
                id=interview_plan_id,
                resume=resume
            )

        except InterviewPlanResult.DoesNotExist as exc:

            raise ValueError(
                "Interview plan not found."
            ) from exc

        try:

            interview_plan_schema = (
                InterviewPlanSchema.model_validate(
                    interview_plan.plan_data
                )
            )

        except Exception as exc:

            logger.exception(
                "Stored interview plan is invalid."
            )

            raise RuntimeError(
                "Stored interview plan is invalid."
            ) from exc

        selected_question = None

        current_question_number = 0

        for round_data in interview_plan_schema.rounds:

            for question in round_data.questions:

                current_question_number += 1

                if current_question_number == question_number:

                    selected_question = question

                    break

            if selected_question is not None:

                break

        if selected_question is None:

            raise ValueError(
                "Interview question not found."
            )

        job_match = interview_plan.job_match

        try:

            parser_result = resume.parser_result

        except Exception as exc:

            raise ValueError(
                "Resume has not been parsed yet."
            ) from exc

        resume_schema = ResumeSchema.model_validate(
            parser_result.parsed_data
        )

        try:

            graph_result = run_interview_planning_graph(
                operation="evaluate_answer",
                resume=resume_schema,
                job_title=job_match.job_title,
                job_description=(
                    job_match.job_description
                    or ""
                ),
                interview_plan=interview_plan_schema,
                current_question=selected_question.question,
                question_category=(
                    selected_question.category
                ),
                question_difficulty=(
                    selected_question.difficulty
                ),
                question_number=question_number,
                user_answer=user_answer.strip()
            )

        except Exception as exc:

            logger.exception(
                "Answer evaluation graph failed: %s",
                exc
            )

            raise RuntimeError(
                f"Answer evaluation failed: {exc}"
            ) from exc

        evaluation = graph_result.get(
            "answer_evaluation"
        )

        if evaluation is None:

            raise RuntimeError(
                "Answer evaluator returned no result."
            )

        # -------------------------------------------------
        # MOCK INTERVIEW FLOW
        # -------------------------------------------------
        #
        # For mock interviews we only need the generated
        # evaluation object. MockInterviewService will save
        # it inside MockInterviewAnswer.evaluation.
        #
        # This prevents creating a duplicate
        # AnswerEvaluationResult database record.
        # -------------------------------------------------

        if not save_result:

            return evaluation

        # -------------------------------------------------
        # NORMAL INTERVIEW FLOW
        # -------------------------------------------------
        #
        # Existing API behavior is preserved.
        # Normal interview answer evaluations continue
        # to be stored in AnswerEvaluationResult.
        # -------------------------------------------------

        saved_evaluation = (
            AnswerEvaluationResult.objects.create(

                interview_plan=interview_plan,

                question_number=question_number,

                question=selected_question.question,

                category=selected_question.category,

                difficulty=selected_question.difficulty,

                user_answer=user_answer.strip(),

                evaluation_data=evaluation.model_dump()
            )
        )

        return saved_evaluation


    @staticmethod
    @transaction.atomic
    def generate_feedback(
        resume,
        interview_plan_id,
        mock_interview_id=None
    ):

        try:

            interview_plan = InterviewPlanResult.objects.get(
                id=interview_plan_id,
                resume=resume
            )

        except InterviewPlanResult.DoesNotExist as exc:

            raise ValueError(
                "Interview plan not found."
            ) from exc

        # -------------------------------------------------
        # MOCK INTERVIEW FEEDBACK
        # -------------------------------------------------

        if mock_interview_id is not None:

            try:

                mock_interview = MockInterview.objects.get(
                    id=mock_interview_id,
                    user=resume.user,
                    resume=resume,
                    interview_plan=interview_plan
                )

            except MockInterview.DoesNotExist as exc:

                raise ValueError(
                    "Mock interview not found."
                ) from exc

            mock_answers = (
                MockInterviewAnswer.objects.filter(
                    mock_interview=mock_interview
                ).order_by(
                    "question_number"
                )
            )

            if not mock_answers.exists():

                raise ValueError(
                    "No answer evaluations found for this mock interview."
                )

            evaluation_data = []

            for answer in mock_answers:

                if answer.evaluation is not None:

                    evaluation_data.append(
                        answer.evaluation
                    )

            if not evaluation_data:

                raise ValueError(
                    "No valid answer evaluations found for this mock interview."
                )

            try:

                parser_result = resume.parser_result

            except Exception as exc:

                raise ValueError(
                    "Resume has not been parsed yet."
                ) from exc

            resume_schema = ResumeSchema.model_validate(
                parser_result.parsed_data
            )

            job_match = interview_plan.job_match

            try:

                graph_result = run_interview_planning_graph(
                    operation="feedback",
                    resume=resume_schema,
                    job_title=job_match.job_title,
                    job_description=(
                        job_match.job_description
                        or ""
                    ),
                    evaluations=evaluation_data
                )

            except Exception as exc:

                logger.exception(
                    "Mock interview feedback graph failed: %s",
                    exc
                )

                raise RuntimeError(
                    f"Interview feedback generation failed: {exc}"
                ) from exc

            feedback = graph_result.get(
                "feedback"
            )

            if feedback is None:

                raise RuntimeError(
                    "Feedback agent returned no result."
                )

            return feedback

        # -------------------------------------------------
        # NORMAL INTERVIEW FEEDBACK
        # -------------------------------------------------

        evaluations = (
            AnswerEvaluationResult.objects.filter(
                interview_plan=interview_plan
            ).order_by(
                "question_number"
            )
        )

        if not evaluations.exists():

            raise ValueError(
                "No answer evaluations found for this interview."
            )

        try:

            parser_result = resume.parser_result

        except Exception as exc:

            raise ValueError(
                "Resume has not been parsed yet."
            ) from exc

        resume_schema = ResumeSchema.model_validate(
            parser_result.parsed_data
        )

        evaluation_data = [
            evaluation.evaluation_data
            for evaluation in evaluations
        ]

        job_match = interview_plan.job_match

        try:

            graph_result = run_interview_planning_graph(
                operation="feedback",
                resume=resume_schema,
                job_title=job_match.job_title,
                job_description=(
                    job_match.job_description
                    or ""
                ),
                evaluations=evaluation_data
            )

        except Exception as exc:

            logger.exception(
                "Interview feedback graph failed."
            )

            raise RuntimeError(
                "Interview feedback generation failed."
            ) from exc

        feedback = graph_result.get(
            "feedback"
        )

        if feedback is None:

            raise RuntimeError(
                "Feedback agent returned no result."
            )

        saved_feedback = (
            FeedbackResult.objects.update_or_create(
                interview_plan=interview_plan,
                defaults={
                    "feedback_data": (
                        feedback.model_dump()
                    )
                }
            )[0]
        )

        return saved_feedback