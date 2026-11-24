from django.db import models

from Resume.models import Resume

from AI.Models.JobMatchResult import JobMatchResult


class InterviewPlanResult(models.Model):

    resume = models.ForeignKey(
        Resume,
        on_delete=models.CASCADE,
        related_name="interview_plans"
    )

    job_match = models.ForeignKey(
        JobMatchResult,
        on_delete=models.CASCADE,
        related_name="interview_plans"
    )

    plan_data = models.JSONField()

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        db_table = "InterviewPlanResult"
        verbose_name = "Interview Plan Result"
        verbose_name_plural = "Interview Plan Results"

    def __str__(self):
        return (
            f"ID - "
            f"{self.id}-"
            f"Interview Plan - "
            f"{self.resume.id} - "
            f"{self.job_match.job_title}"
        )