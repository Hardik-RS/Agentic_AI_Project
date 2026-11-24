import logging

from langchain_core.prompts import ChatPromptTemplate

from AI.Services.GeminiService import GeminiService

from AI.Prompts.FeedbackPrompt import FEEDBACK_PROMPT

from AI.Schemas.FeedbackSchema import FeedbackSchema

from AI.Utils.TokenCounter import TokenCounter


logger = logging.getLogger(__name__)


class FeedbackAgent:
    """
    AI Agent responsible for generating the final interview
    feedback from all evaluated interview answers.
    """

    def __init__(self):

        # ---------------------------------------
        # Gemini Service
        # ---------------------------------------

        self.gemini_service = GeminiService()

        # ---------------------------------------
        # Structured LLM
        # ---------------------------------------

        self.llm = self.gemini_service.get_structured_llm(
            FeedbackSchema
        )

        # ---------------------------------------
        # Prompt
        # ---------------------------------------

        self.prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    FEEDBACK_PROMPT
                ),
                (
                    "human",
                    """
                    Generate the final interview feedback report
                    using the candidate context and all answer
                    evaluations.
                    """
                ),
            ]
        )

        # ---------------------------------------
        # Chain
        # ---------------------------------------

        # Structured feedback responses can fail transiently while the
        # provider is formatting the Pydantic response.
        self.chain = (self.prompt | self.llm).with_retry(
            stop_after_attempt=2
        )

    def run(
        self,
        job_title: str,
        resume: str,
        evaluations: str,
    ) -> FeedbackSchema:

        # ---------------------------------------
        # Validation
        # ---------------------------------------

        if not job_title or not job_title.strip():

            raise ValueError(
                "Job title cannot be empty."
            )

        if not evaluations or not evaluations.strip():

            raise ValueError(
                "Interview evaluations cannot be empty."
            )

        try:

            # ---------------------------------------
            # Token Counter
            # ---------------------------------------

            token_counter = TokenCounter(
                agent_name="FeedbackAgent"
            )

            # ---------------------------------------
            # Invoke LLM
            # ---------------------------------------

            result = self.chain.invoke(
                {
                    "job_title": job_title.strip(),

                    "resume": (
                        resume.strip()
                        if resume
                        else ""
                    ),

                    "evaluations": evaluations.strip(),
                },
                config={
                    "callbacks": [
                        token_counter
                    ]
                }
            )

            return result

        except Exception as exc:

            logger.exception(
                "Interview feedback generation failed: %s",
                exc
            )

            raise RuntimeError(
                f"Failed to generate interview feedback: {exc}"
            ) from exc