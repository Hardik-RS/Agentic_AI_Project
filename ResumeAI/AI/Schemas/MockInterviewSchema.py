from typing import Optional

from pydantic import BaseModel, Field


class StartMockInterviewSchema(BaseModel):

    interview_plan_id: int = Field(
        ...,
        description="Interview plan ID"
    )


class SubmitMockInterviewAnswerSchema(BaseModel):

    question_number: int = Field(
        ...,
        ge=1
    )

    answer_text: str = Field(
        ...,
        min_length=1
    )


class MockInterviewResponseSchema(BaseModel):

    mock_interview_id: int

    status: str

    current_question_number: int

    total_questions: int

    question: Optional[str] = None

    message: str


class MockInterviewAnswerResponseSchema(BaseModel):

    mock_interview_id: int

    question_number: int

    answer_text: str

    score: Optional[float] = None

    evaluation: Optional[dict] = None

    feedback: Optional[str] = None

    next_question: Optional[str] = None

    completed: bool

    message: str