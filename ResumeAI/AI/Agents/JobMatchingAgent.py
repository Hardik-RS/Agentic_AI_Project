import logging

from AI.Services.GeminiService import GeminiService
from langchain_core.prompts import ChatPromptTemplate

from AI.Schemas.ResumeSchema import ResumeSchema
from AI.Schemas.JobMatchSchema import JobMatchSchema
from AI.Prompts.JobMatchingPrompt import JOB_MATCHING_PROMPT


logger = logging.getLogger(__name__)


class JobMatchingAgent:
    """
    Compares a structured resume against a job description
    and produces a validated job matching result.
    """

    def __init__(self):

        # Get the centralized Gemini service
        self.gemini_service = GeminiService()
        
        # Configure Gemini to return ResumeSchema directly
        self.llm = self.gemini_service.get_structured_llm(JobMatchSchema)
        
        self.prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    JOB_MATCHING_PROMPT
                ),
                (
                    "human",
                    """
                    Analyze the candidate against the supplied job description.
                    """
                ),
            ]
        )

        self.chain = self.prompt | self.llm

    def run(self,resume: ResumeSchema,job_title: str,job_description: str = "",) -> JobMatchSchema:

        if resume is None:
            raise ValueError(
                "Resume cannot be None."
            )

        if not job_title or not job_title.strip():
            raise ValueError("Job title cannot be empty.")

        try:

            result = self.chain.invoke(
                {
                    "resume": resume.model_dump_json(indent=2),
                    "job_title": job_title,
                    "job_description": (job_description.strip() if job_description else ""),
                }
            )

            return result

        except Exception as exc:

            logger.exception(
                "Job matching failed."
            )

            raise RuntimeError(
                "Failed to generate job matching result."
            ) from exc