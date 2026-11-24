import logging

from langchain_core.prompts import ChatPromptTemplate

from AI.Services.GeminiService import GeminiService

from AI.Prompts.InterviewPlanningPrompt import INTERVIEW_PLANNING_PROMPT
from AI.Utils.TokenCounter import TokenCounter

from AI.Schemas.ResumeSchema import ResumeSchema
from AI.Schemas.AnalysisSchema import AnalysisSchema
from AI.Schemas.ResumeScoreSchema import ResumeScoreSchema
from AI.Schemas.JobMatchSchema import JobMatchSchema
from AI.Schemas.InterviewPlanSchema import InterviewPlanSchema


logger = logging.getLogger(__name__)


class InterviewPlannerAgent:
    """
    LangChain-based Interview Planning Agent.

    Creates a personalized interview plan using:

    - Structured resume
    - Resume analysis
    - Resume score
    - Job matching result
    - Target job
    """

    def __init__(self):

        # Centralized Gemini configuration
        self.gemini_service = GeminiService()

        # Configure Gemini to return InterviewPlanSchema
        self.llm = self.gemini_service.get_structured_llm(
            InterviewPlanSchema
        )

        # Create LangChain prompt
        self.prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    INTERVIEW_PLANNING_PROMPT
                ),
                (
                    "human",
                    """
                    Create the personalized interview plan
                    for the candidate.
                    """
                ),
            ]
        )

        # Create LangChain chain
        self.chain = self.prompt | self.llm

    def run(self,resume: ResumeSchema,analysis: AnalysisSchema,score: ResumeScoreSchema,job_match: JobMatchSchema,job_title: str,job_description: str = "",) -> InterviewPlanSchema:

        if resume is None:
            raise ValueError(
                "Resume cannot be None."
            )

        if analysis is None:
            raise ValueError(
                "Resume analysis cannot be None."
            )

        if score is None:
            raise ValueError(
                "Resume score cannot be None."
            )

        if job_match is None:
            raise ValueError(
                "Job match result cannot be None."
            )

        if not job_title or not job_title.strip():
            raise ValueError(
                "Job title cannot be empty."
            )

        try:
            token_counter = TokenCounter(agent_name="interview_planner_agent")

            result = self.chain.invoke(
                {
                    "resume": resume.model_dump_json(
                        indent=2
                    ),

                    "analysis": analysis.model_dump_json(
                        indent=2
                    ),

                    "score": score.model_dump_json(
                        indent=2
                    ),

                    "job_match": job_match.model_dump_json(
                        indent=2
                    ),

                    "job_title": job_title.strip(),

                    "job_description": (job_description.strip() if job_description else ""),
                },
                config={
                        "callbacks": [token_counter]
                        }
            )

            return result

        except Exception as exc:

            logger.exception(
                "Interview planning failed."
            )

            raise RuntimeError(
                "Failed to generate interview plan."
            ) from exc