from pydantic import BaseModel, Field
from typing import List


class AnswerEvaluationSchema(BaseModel):

    correctness_score: float = Field(
        ge=0,
        le=10
    )

    relevance_score: float = Field(
        ge=0,
        le=10
    )

    technical_depth_score: float = Field(
        ge=0,
        le=10
    )

    clarity_score: float = Field(
        ge=0,
        le=10
    )

    completeness_score: float = Field(
        ge=0,
        le=10
    )

    communication_score: float = Field(
        ge=0,
        le=10
    )

    overall_score: float = Field(
        ge=0,
        le=10
    )

    strengths: List[str] = Field(
        default_factory=list
    )

    missing_points: List[str] = Field(
        default_factory=list
    )

    improvement_suggestions: List[str] = Field(
        default_factory=list
    )

    ideal_answer: str