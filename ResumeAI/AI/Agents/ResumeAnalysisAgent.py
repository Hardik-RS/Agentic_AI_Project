import logging

from pydantic import ValidationError

from AI.Agents.BaseAgent import BaseAgent
from AI.Prompts.ResumeAnalysisPrompt import RESUME_ANALYSIS_PROMPT
from AI.Schemas.AnalysisSchema import AnalysisSchema
from AI.Schemas.ResumeSchema import ResumeSchema
from AI.Utils.jsonParser import parse_json


logger = logging.getLogger(__name__)


class ResumeAnalysisAgent(BaseAgent):
    """
    Analyze a parsed resume and identify:

    - Strengths
    - Weaknesses
    - Achievements
    - Improvement Areas
    """

    def run(self, resume: ResumeSchema) -> AnalysisSchema:

        if resume is None:
            raise ValueError("Resume cannot be None.")

        prompt = RESUME_ANALYSIS_PROMPT.format(
            resume=resume.model_dump_json(indent=2)
        )

        try:
            response = self.llm.generate(prompt)

        except Exception as exc:
            logger.exception("Gemini request failed.")
            raise RuntimeError(
                "Failed to generate resume analysis."
            ) from exc

        try:
            data = parse_json(response)

        except Exception as exc:
            logger.exception("Failed to parse Gemini JSON.")
            raise ValueError(
                "Gemini returned invalid JSON."
            ) from exc

        try:
            return AnalysisSchema.model_validate(data)

        except ValidationError as exc:
            logger.exception("Analysis validation failed.")

            raise ValueError(
                f"Invalid analysis returned by Gemini:\n{exc}"
            ) from exc