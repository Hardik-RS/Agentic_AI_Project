from langchain_core.prompts import ChatPromptTemplate

from AI.Services.GeminiService import GeminiService
from AI.Prompts.ResumeAnalysisPrompt import RESUME_ANALYSIS_PROMPT
from AI.Schemas.AnalysisSchema import AnalysisSchema
from AI.Schemas.ResumeSchema import ResumeSchema


class ResumeAnalysisAgent:
    """
    LangChain-based Resume Analysis Agent.

    Analyzes a structured resume and identifies:

    - Strengths
    - Weaknesses
    - Achievements
    - Improvement Areas
    """

    def __init__(self):

        # Centralized Gemini configuration
        self.gemini_service = GeminiService()

        # Tell Gemini/LangChain to return AnalysisSchema
        self.llm = self.gemini_service.get_structured_llm(
            AnalysisSchema
        )

        # Create LangChain prompt
        self.prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    RESUME_ANALYSIS_PROMPT
                ),
                (
                    "human",
                    """
                    Analyze the following structured resume.

                    Resume:
                    {resume}
                    """
                ),
            ]
        )

        # Create LangChain chain
        self.chain = self.prompt | self.llm

    def run(self,resume: ResumeSchema) -> AnalysisSchema:
        """
        Analyze a parsed resume and return a validated
        AnalysisSchema object.
        """

        if resume is None:
            raise ValueError(
                "Resume cannot be None."
            )

        result = self.chain.invoke(
            {
                "resume": resume.model_dump_json(
                    indent=2
                )
            }
        )

        return result