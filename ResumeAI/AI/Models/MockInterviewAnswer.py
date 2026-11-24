from django.db import models

from AI.Models.MockInterview import (
    MockInterview
)


class MockInterviewAnswer(models.Model):

    mock_interview = models.ForeignKey(
        MockInterview,
        on_delete=models.CASCADE,
        related_name="answers"
    )

    question_number = models.PositiveIntegerField()

    question_text = models.TextField()

    answer_text = models.TextField()

    evaluation = models.JSONField(
        null=True,
        blank=True
    )

    score = models.FloatField(
        null=True,
        blank=True
    )

    feedback = models.TextField(
        null=True,
        blank=True
    )

    answered_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:

        ordering = [
            "question_number"
        ]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "mock_interview",
                    "question_number"
                ],
                name="unique_mock_interview_question"
            )
        ]

    def __str__(self):

        return (
            f"Interview #{self.mock_interview_id} - "
            f"Question {self.question_number}"
        )