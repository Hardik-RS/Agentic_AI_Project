from typing import List
from pydantic import BaseModel, Field


class AnalysisSchema(BaseModel):
    strengths: List[str] = Field(
        default_factory=list,
        max_length=10,
        description="Positive aspects identified in the resume."
    )

    weaknesses: List[str] = Field(
        default_factory=list,
        max_length=10,
        description="Weak points or missing information in the resume."
    )

    achievements: List[str] = Field(
        default_factory=list,
        max_length=10,
        description="Key achievements extracted from the resume."
    )

    improvement_areas: List[str] = Field(
        default_factory=list,
        max_length=10,
        description="Suggestions for improving the resume."
    )