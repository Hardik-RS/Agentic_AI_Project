from pydantic import ValidationError

from AI.Agents.BaseAgent import BaseAgent
from AI.Prompts.ResumeParserPrompt import RESUME_PARSER_PROMPT
from AI.Schemas.ResumeSchema import ResumeSchema
from AI.Utils.jsonParser import parse_json


class ResumeParserAgent(BaseAgent):
    """
    AI agent responsible for converting raw resume text
    into structured resume data.
    """

    def run(self, resume_text: str) -> ResumeSchema:
        # Build the prompt
        prompt = RESUME_PARSER_PROMPT.format(
            resume_text=resume_text
        )

        # Call Gemini
        response = self.llm.generate(prompt)

        # Parse JSON
        data = parse_json(response)

        # Validate with Pydantic
        try:
            resume = ResumeSchema.model_validate(data)
        except ValidationError as exc:
            raise ValueError(f"Invalid resume data returned by Gemini:\n{exc}") from exc

        return resume