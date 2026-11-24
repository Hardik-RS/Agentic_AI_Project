from pydantic import BaseModel, Field
from typing import List


class FeedbackSchema(BaseModel):

    overall_score: float = Field(
        ge=0,
        le=10
    )

    technical_score: float = Field(
        ge=0,
        le=10
    )

    communication_score: float = Field(
        ge=0,
        le=10
    )

    answer_quality_score: float = Field(
        ge=0,
        le=10
    )

    strengths: List[str] = Field(
        default_factory=list
    )

    weaknesses: List[str] = Field(
        default_factory=list
    )

    repeated_mistakes: List[str] = Field(
        default_factory=list
    )

    improvement_areas: List[str] = Field(
        default_factory=list
    )

    recommendations: List[str] = Field(
        default_factory=list
    )

    final_feedback: str