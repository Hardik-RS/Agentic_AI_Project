from django.db import models

from AI.Models.InterviewPlanResult import InterviewPlanResult


class FeedbackResult(models.Model):

    interview_plan = models.OneToOneField(
        InterviewPlanResult,
        on_delete=models.CASCADE,
        related_name="feedback"
    )

    feedback_data = models.JSONField()

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:

        db_table = "FeedbackResult"

        verbose_name = " Feedback Result"

        verbose_name_plural = "Feedback Results"

    def __str__(self):

        return (
            f"Interview Feedback - "
            f"Interview Plan {self.interview_plan.id}"
        )