import logging

from langchain_core.prompts import ChatPromptTemplate
from AI.Services.GeminiService import GeminiService


from AI.Prompts.ResumeScoringPrompt import RESUME_SCORING_PROMPT

from AI.Schemas.ResumeSchema import ResumeSchema
from AI.Schemas.AnalysisSchema import AnalysisSchema
from AI.Schemas.ResumeScoreSchema import ResumeScoreSchema


logger = logging.getLogger(__name__)


class ResumeScoringAgent:
    """
    LangChain-based Resume Scoring Agent.

    Evaluates resume quality and generates:
    - Overall score
    - ATS compatibility
    - Format score
    - Keyword score
    - Content score
    - Readability score
    """

    def __init__(self):

        # Get the centralized Gemini service
        self.gemini_service = GeminiService()

        # Configure Gemini to return ResumeSchema directly
        self.llm = self.gemini_service.get_structured_llm(ResumeScoreSchema)

        self.prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    RESUME_SCORING_PROMPT
                ),
                (
                    "human",
                    """
                    Evaluate the following resume.
                    """
                )
            ]
        )

        self.chain = self.prompt| self.llm

    def run(self,resume: ResumeSchema,analysis: AnalysisSchema) -> ResumeScoreSchema:

        if resume is None:
            raise ValueError(
                "Resume cannot be None."
            )

        if analysis is None:
            raise ValueError(
                "Resume analysis cannot be None."
            )

        try:

            result = self.chain.invoke(
                {
                    "resume": resume.model_dump_json(
                        indent=2
                    ),
                    "analysis": analysis.model_dump_json(
                        indent=2
                    )
                }
            )

        except Exception as exc:

            logger.exception(
                "Resume scoring failed."
            )

            raise RuntimeError(
                "Failed to generate resume score."
            ) from exc

        return result