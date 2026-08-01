import os

from dotenv import load_dotenv
from google import genai

load_dotenv()


class GeminiService:
    """
    Handles all communication with Google Gemini.
    """

    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in .env")

        self.client = genai.Client(api_key=api_key)
        self.model = os.getenv("GEMINI_MODEL")

    def generate(self, prompt: str) -> str:
        """
        Send a prompt to Gemini and return the text response.
        """
        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
        )

        return response.text.strip()

# prompt=GeminiService()
# print(prompt.generate("hello "))