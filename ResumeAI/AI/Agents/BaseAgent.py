from abc import ABC, abstractmethod

from AI.Services.GeminiService import GeminiService


class BaseAgent(ABC):
    """
    Base class for all AI agents.
    """

    def __init__(self):
        self.llm = GeminiService()

    @abstractmethod
    def run(self, data):
        """
        Execute the agent.
        """
        pass