from django.db import models

from Resume.models import Resume


class ResumeScoreResult(models.Model):
    """
    Stores the scoring result generated for a resume.
    """

    resume = models.OneToOneField(
        Resume,
        on_delete=models.CASCADE,
        related_name="score_result"
    )

    score_data = models.JSONField()

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        db_table = "resume_score_results"

    def __str__(self):
        return f"Score Result - Resume {self.resume.id}"