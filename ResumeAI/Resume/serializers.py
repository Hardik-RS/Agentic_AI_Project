from rest_framework import serializers

from .models import Resume


class ResumeUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = [
            "id",
            "resume_file",
            "uploaded_at",
            "status",
        ]
        read_only_fields = [
            "id",
            "uploaded_at",
            "status",
        ]