from pydantic import BaseModel, Field


class ResumeScoreSchema(BaseModel):
    """
    Represents the quality and ATS-related scores
    generated from a resume.
    """

    overall: int = Field(
        ge=0,
        le=100,
        description="Overall resume score from 0 to 100."
    )

    ats_compatibility: int = Field(
        ge=0,
        le=100,
        description="ATS compatibility score from 0 to 100."
    )

    format: int = Field(
        ge=0,
        le=100,
        description="Resume formatting score from 0 to 100."
    )

    keywords: int = Field(
        ge=0,
        le=100,
        description="Keyword quality score from 0 to 100."
    )

    content: int = Field(
        ge=0,
        le=100,
        description="Resume content quality score from 0 to 100."
    )

    readability: int = Field(
        ge=0,
        le=100,
        description="Resume readability score from 0 to 100."
    )