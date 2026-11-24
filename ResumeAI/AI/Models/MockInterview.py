from django.db import models
from django.contrib.auth.models import User

from Resume.models import Resume
from AI.Models.InterviewPlanResult import InterviewPlanResult


class MockInterview(models.Model):

    STATUS_CHOICES = [
        ("NOT_STARTED", "Not Started"),
        ("IN_PROGRESS", "In Progress"),
        ("COMPLETED", "Completed"),
        ("CANCELLED", "Cancelled"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="mock_interviews"
    )

    resume = models.ForeignKey(
        Resume,
        on_delete=models.CASCADE,
        related_name="mock_interviews"
    )

    interview_plan = models.ForeignKey(
        InterviewPlanResult,
        on_delete=models.CASCADE,
        related_name="mock_interviews"
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="NOT_STARTED"
    )

    current_question_number = models.PositiveIntegerField(
        default=1
    )

    total_questions = models.PositiveIntegerField(
        default=0
    )

    started_at = models.DateTimeField(
        null=True,
        blank=True
    )

    completed_at = models.DateTimeField(
        null=True,
        blank=True
    )

    final_feedback = models.JSONField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"ID - "
            f"{self.id}-"
            f"Mock Interview #{self.id} - "
            f"{self.user.username} - "
            f"{self.status}"
        )