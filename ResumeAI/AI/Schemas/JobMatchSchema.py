from pydantic import BaseModel, Field
from typing import List


class JobMatchSchema(BaseModel):
    """
    Structured result produced by the Job Matching Agent.
    """

    overall_match_score: int = Field(
        ge=0,
        le=100,
        description="Overall compatibility between resume and job."
    )

    skill_match_score: int = Field(
        ge=0,
        le=100,
        description="How well the candidate skills match the job."
    )

    experience_match_score: int = Field(
        ge=0,
        le=100,
        description="How well the candidate experience matches the job."
    )

    education_match_score: int = Field(
        ge=0,
        le=100,
        description="How well the candidate education matches the job."
    )

    matched_skills: List[str] = Field(
        default_factory=list
    )

    missing_skills: List[str] = Field(
        default_factory=list
    )

    matched_keywords: List[str] = Field(
        default_factory=list
    )

    missing_keywords: List[str] = Field(
        default_factory=list
    )

    strengths: List[str] = Field(
        default_factory=list
    )

    gaps: List[str] = Field(
        default_factory=list
    )

    recommendations: List[str] = Field(
        default_factory=list
    )