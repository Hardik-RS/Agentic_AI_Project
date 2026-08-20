from django.db import models

from Resume.models import Resume

class JobMatchResult(models.Model):

    resume = models.ForeignKey(
        Resume,
        on_delete=models.CASCADE,
        related_name="job_matches"
    )

    job_title = models.CharField(max_length=355,blank=True)

    job_description = models.TextField(blank=True)

    match_data = models.JSONField()

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return (f"Job Match - {self.job_title} - Resume {self.resume.id}")