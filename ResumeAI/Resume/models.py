from django.db import models
from django.contrib.auth.models import User


class Resume(models.Model):
    STATUS_CHOICES = [
        ("Pending", "Pending"),
        ("Processing", "Processing"),
        ("Completed", "Completed"),
        ("Failed", "Failed"),
    ]

    user = models.ForeignKey(User,on_delete=models.CASCADE, related_name="resumes",)

    resume_file = models.FileField(upload_to="resumes/")

    extracted_text = models.TextField(blank=True, null=True)

    uploaded_at = models.DateTimeField(auto_now_add=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Pending",)

    def __str__(self):
        return f"{self.user.username} - Resume {self.id}"
