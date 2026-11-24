from typing import TypedDict, List

from langgraph.graph import StateGraph, START, END

from AI.Agents.InterviewPlannerAgent import InterviewPlannerAgent
from AI.Agents.AnswerEvaluatorAgent import AnswerEvaluatorAgent
from AI.Agents.FeedbackAgent import FeedbackAgent

from AI.Schemas.ResumeSchema import ResumeSchema
from AI.Schemas.AnalysisSchema import AnalysisSchema
from AI.Schemas.ResumeScoreSchema import ResumeScoreSchema
from AI.Schemas.JobMatchSchema import JobMatchSchema
from AI.Schemas.InterviewPlanSchema import InterviewPlanSchema
from AI.Schemas.AnswerEvaluationSchema import AnswerEvaluationSchema
from AI.Schemas.FeedbackSchema import FeedbackSchema


class InterviewPlanningState(TypedDict, total=False):

    # =====================================================
    # OPERATION
    # =====================================================

    operation: str

    # =====================================================
    # RESUME / JOB CONTEXT
    # =====================================================

    resume: ResumeSchema

    analysis: AnalysisSchema

    score: ResumeScoreSchema

    job_match: JobMatchSchema

    job_title: str

    job_description: str

    # =====================================================
    # INTERVIEW PLANNING
    # =====================================================

    interview_plan: InterviewPlanSchema

    questions: List[dict]

    current_question: str

    current_question_index: int

    question_number: int

    question_category: str

    question_difficulty: str

    # =====================================================
    # CANDIDATE ANSWER
    # =====================================================

    user_answer: str

    # =====================================================
    # ANSWER EVALUATION
    # =====================================================

    answer_evaluation: AnswerEvaluationSchema

    # =====================================================
    # ALL EVALUATIONS
    # =====================================================

    evaluations: List[dict]

    # =====================================================
    # FINAL FEEDBACK
    # =====================================================

    feedback: FeedbackSchema

    # =====================================================
    # ERROR
    # =====================================================

    error: str


# =========================================================
# INTERVIEW PLANNER NODE
# =========================================================

def plan_interview_node(
    state: InterviewPlanningState
) -> dict:

    agent = InterviewPlannerAgent()

    result = agent.run(
        resume=state["resume"],
        analysis=state["analysis"],
        score=state["score"],
        job_match=state["job_match"],
        job_title=state["job_title"],
        job_description=state.get(
            "job_description",
            ""
        ),
    )

    questions = [
        question.model_dump()
        for round_data in result.rounds
        for question in round_data.questions
    ]

    return {
        "interview_plan": result,
        "questions": questions,
    }


# =========================================================
# ANSWER EVALUATOR NODE
# =========================================================

def evaluate_answer_node(
    state: InterviewPlanningState
) -> dict:

    agent = AnswerEvaluatorAgent()

    question_text = state.get(
        "current_question",
        ""
    )

    if not question_text:
        raise ValueError(
            "Current interview question is required."
        )

    user_answer = state.get(
        "user_answer",
        ""
    )

    if not user_answer or not user_answer.strip():
        raise ValueError(
            "User answer is required."
        )

    category = state.get(
        "question_category",
        ""
    )

    difficulty = state.get(
        "question_difficulty",
        ""
    )

    # -----------------------------------------------------
    # If category/difficulty were not explicitly supplied,
    # try to find them from the interview plan.
    # -----------------------------------------------------

    interview_plan = state.get(
        "interview_plan"
    )

    if interview_plan:

        for round_data in interview_plan.rounds:

            for question in round_data.questions:

                if question.question == question_text:

                    if not category:
                        category = question.category

                    if not difficulty:
                        difficulty = question.difficulty

                    break

    # -----------------------------------------------------
    # Resume context
    # -----------------------------------------------------

    resume = state.get("resume")

    resume_text = ""

    if resume:
        resume_text = resume.model_dump_json(
            indent=2
        )

    # -----------------------------------------------------
    # Run Answer Evaluator
    # -----------------------------------------------------

    result = agent.run(
        question=question_text,
        answer=user_answer.strip(),
        job_title=state["job_title"],
        resume=resume_text,
        category=category,
        difficulty=difficulty,
    )

    return {
        "answer_evaluation": result
    }


# =========================================================
# FEEDBACK NODE
# =========================================================

def generate_feedback_node(
    state: InterviewPlanningState
) -> dict:

    agent = FeedbackAgent()

    evaluations = state.get(
        "evaluations",
        []
    )

    # -----------------------------------------------------
    # If evaluations were not directly supplied,
    # use the current evaluation.
    # -----------------------------------------------------

    if not evaluations:

        current_evaluation = state.get(
            "answer_evaluation"
        )

        if current_evaluation:

            evaluations = [
                current_evaluation.model_dump()
            ]

    if not evaluations:
        raise ValueError(
            "Interview evaluations are required "
            "to generate feedback."
        )

    resume = state.get("resume")

    resume_text = ""

    if resume:
        resume_text = resume.model_dump_json(
            indent=2
        )

    # -----------------------------------------------------
    # Convert evaluations to text/JSON
    # -----------------------------------------------------

    import json

    evaluations_text = json.dumps(
        evaluations,
        indent=2,
        ensure_ascii=False
    )

    # -----------------------------------------------------
    # Run Feedback Agent
    # -----------------------------------------------------

    result = agent.run(
        job_title=state["job_title"],
        resume=resume_text,
        evaluations=evaluations_text,
    )

    return {
        "feedback": result
    }


# =========================================================
# OPERATION ROUTER
# =========================================================

def route_interview_operation(
    state: InterviewPlanningState
):

    operation = state.get(
        "operation",
        "plan"
    )

    if operation == "plan":

        return "plan_interview"

    if operation == "evaluate_answer":

        return "evaluate_answer"

    if operation == "feedback":

        return "generate_feedback"

    raise ValueError(
        f"Unknown interview operation: {operation}"
    )


# =========================================================
# BUILD GRAPH
# =========================================================

def build_interview_planning_graph():

    graph = StateGraph(
        InterviewPlanningState
    )

    # -----------------------------------------------------
    # Nodes
    # -----------------------------------------------------

    graph.add_node(
        "plan_interview",
        plan_interview_node
    )

    graph.add_node(
        "evaluate_answer",
        evaluate_answer_node
    )

    graph.add_node(
        "generate_feedback",
        generate_feedback_node
    )

    # -----------------------------------------------------
    # START -> ROUTER
    # -----------------------------------------------------

    graph.add_conditional_edges(
        START,
        route_interview_operation,
        {
            "plan_interview": "plan_interview",
            "evaluate_answer": "evaluate_answer",
            "generate_feedback": "generate_feedback",
        }
    )

    # -----------------------------------------------------
    # Each operation ends after its work
    # -----------------------------------------------------

    graph.add_edge(
        "plan_interview",
        END
    )

    graph.add_edge(
        "evaluate_answer",
        END
    )

    graph.add_edge(
        "generate_feedback",
        END
    )

    return graph.compile()


# =========================================================
# COMPILE ONCE
# =========================================================

interview_planning_graph = (
    build_interview_planning_graph()
)


# =========================================================
# PUBLIC GRAPH RUNNER
# =========================================================

def run_interview_planning_graph(
    resume: ResumeSchema,
    job_title: str,

    analysis: AnalysisSchema | None = None,

    score: ResumeScoreSchema | None = None,

    job_match: JobMatchSchema | None = None,

    job_description: str = "",

    interview_plan: InterviewPlanSchema | None = None,

    current_question: str = "",

    question_category: str = "",

    question_difficulty: str = "",

    question_number: int = 0,

    user_answer: str = "",

    evaluations: List[dict] | None = None,

    operation: str = "plan",
):

    state = {
        "operation": operation,

        "resume": resume,

        "job_title": job_title,

        "job_description": job_description,

        "current_question": current_question,

        "question_category": question_category,

        "question_difficulty": question_difficulty,

        "question_number": question_number,

        "user_answer": user_answer,
    }

    # -----------------------------------------------------
    # Optional values
    # -----------------------------------------------------

    if analysis is not None:

        state["analysis"] = analysis

    if score is not None:

        state["score"] = score

    if job_match is not None:

        state["job_match"] = job_match

    if interview_plan is not None:

        state["interview_plan"] = interview_plan

    if evaluations is not None:

        state["evaluations"] = evaluations

    # -----------------------------------------------------
    # Execute Graph
    # -----------------------------------------------------

    return interview_planning_graph.invoke(
        state
    )