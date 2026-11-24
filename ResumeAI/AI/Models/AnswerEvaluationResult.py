from django.db import models

from AI.Models.InterviewPlanResult import InterviewPlanResult



class AnswerEvaluationResult(models.Model):

    interview_plan = models.ForeignKey(
        InterviewPlanResult,
        on_delete=models.CASCADE,
        related_name="answer_evaluations"
    )

    question_number = models.PositiveIntegerField()

    question = models.TextField()

    category = models.CharField(
        max_length=100,
        blank=True
    )

    difficulty = models.CharField(
        max_length=50,
        blank=True
    )

    user_answer = models.TextField()

    evaluation_data = models.JSONField()

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = ["question_number", "created_at"]

        db_table = "AnswerEvaluation"

        verbose_name = "Answer Evaluation"

        verbose_name_plural = "Answer Evaluations"

    def __str__(self):

        return (
            f"Answer Evaluation - "
            f"Interview Plan {self.interview_plan.id} - "
            f"Question {self.question_number}"
        )