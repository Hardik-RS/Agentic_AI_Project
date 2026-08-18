import os

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI


load_dotenv()


class GeminiService:
    """
    Centralized Gemini LLM service.

    Responsible only for creating and configuring
    the LangChain Gemini model.

    It does NOT contain business logic or agent logic.
    """

    def __init__(self):

        api_key = os.getenv("GEMINI_API_KEY")
        model = os.getenv("GEMINI_MODEL")

        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY not found in .env"
            )

        if not model:
            raise ValueError(
                "GEMINI_MODEL not found in .env"
            )

        self.model = model

        self.llm = ChatGoogleGenerativeAI(
            model=model,
            google_api_key=api_key,
            #temperature=0,
            max_retries=2,
        )

    def get_llm(self) -> ChatGoogleGenerativeAI:
        """
        Return the configured Gemini LangChain model.
        """

        return self.llm

    def get_structured_llm(self, schema):
        """
        Return Gemini configured to produce
        structured output matching the given Pydantic schema.
        """

        return self.llm.with_structured_output(
            schema
        )