import logging

from langchain_core.prompts import ChatPromptTemplate

from AI.Services.GeminiService import GeminiService

from AI.Prompts.AnswerEvaluatorPrompt import ANSWER_EVALUATION_PROMPT
from AI.Utils.TokenCounter import TokenCounter

from AI.Schemas.AnswerEvaluationSchema import AnswerEvaluationSchema


logger = logging.getLogger(__name__)


class AnswerEvaluatorAgent:
    """
    LangChain-based Answer Evaluator Agent.

    Evaluates a candidate's interview answer based on:

    - Interview question
    - Candidate answer
    - Target job
    - Resume context
    - Interview question category
    - Interview question difficulty
    """

    def __init__(self):

        # Centralized Gemini configuration
        self.gemini_service = GeminiService()

        # Configure Gemini to return AnswerEvaluationSchema
        self.llm = self.gemini_service.get_structured_llm(
            AnswerEvaluationSchema
        )

        # Create LangChain prompt
        self.prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    ANSWER_EVALUATION_PROMPT
                ),
                (
                    "human",
                    """
                    Evaluate the candidate's interview answer
                    based on the supplied question and candidate context.
                    """
                ),
            ]
        )

        # Create LangChain chain
        # Structured model responses can fail transiently while the
        # provider is formatting the Pydantic response. Retry that
        # invocation without re-running the surrounding interview flow.
        self.chain = (self.prompt | self.llm).with_retry(
            stop_after_attempt=2
        )

    def run(
        self,
        question: str,
        answer: str,
        job_title: str,
        resume: str = "",
        category: str = "",
        difficulty: str = "",
    ) -> AnswerEvaluationSchema:

        if not question or not question.strip():
            raise ValueError(
                "Interview question cannot be empty."
            )

        if not answer or not answer.strip():
            raise ValueError(
                "Candidate answer cannot be empty."
            )

        if not job_title or not job_title.strip():
            raise ValueError(
                "Job title cannot be empty."
            )

        try:

            token_counter = TokenCounter(
                agent_name="AnswerEvaluatorAgent"
            )

            result = self.chain.invoke(
                {
                    "question": question.strip(),

                    "answer": answer.strip(),

                    "job_title": job_title.strip(),

                    "resume": resume.strip()
                    if resume
                    else "",

                    "category": category.strip()
                    if category
                    else "",

                    "difficulty": difficulty.strip()
                    if difficulty
                    else "",
                },
                config={
                    "callbacks": [token_counter]
                }
            )

            return result

        except Exception as exc:

            logger.exception(
                "Answer evaluation failed: %s",
                exc
            )

            raise RuntimeError(
                f"Failed to evaluate interview answer: {exc}"
            ) from exc