#from altair import value
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

        def validate_resume_file(self, value):

            if not value.name.endswith(".pdf"):
                raise serializers.ValidationError("Only PDF files are allowed.")

            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError("Maximum file size is 5 MB.")

            return value