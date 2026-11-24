from django.urls import path

from .views import (
    ResumeProcessView,
    JobMatchHistoryView,
    JobMatchingView,

    InterviewPlanningView,
    InterviewPlanHistoryView,
    InterviewAnswerEvaluationView,
    InterviewFeedbackView,

    StartMockInterviewView,
    MockInterviewHistoryView,
    MockInterviewDetailView,
    SubmitMockInterviewAnswerView,
    CompleteMockInterviewView,
    MockInterviewResultView,
)


urlpatterns = [

    # =========================================================
    # RESUME PROCESSING
    # =========================================================

    path(
        "resume-process/<int:resume_id>/",
        ResumeProcessView.as_view(),
        name="resume-process",
    ),


    # =========================================================
    # JOB MATCHING
    # =========================================================

    path(
        "resume/<int:resume_id>/job-match/",
        JobMatchingView.as_view(),
        name="job-matching",
    ),
    path(
        "job-matches/",
        JobMatchHistoryView.as_view(),
        name="job-match-history",
    ),


    # =========================================================
    # INTERVIEW PLANNING
    # =========================================================

    path(
        "resume/<int:resume_id>/job-match/<int:job_match_id>/interview-plan/",
        InterviewPlanningView.as_view(),
        name="interview-planning",
    ),
    path(
        "interview-plans/",
        InterviewPlanHistoryView.as_view(),
        name="interview-plan-history",
    ),


    # =========================================================
    # INTERVIEW ANSWER EVALUATION
    # =========================================================

    path(
        "resume/<int:resume_id>/interview-plan/<int:interview_plan_id>/answer/",
        InterviewAnswerEvaluationView.as_view(),
        name="interview-answer-evaluation",
    ),


    # =========================================================
    # INTERVIEW FEEDBACK
    # =========================================================

    path(
        "resume/<int:resume_id>/interview-plan/<int:interview_plan_id>/feedback/",
        InterviewFeedbackView.as_view(),
        name="interview-feedback",
    ),


    # =========================================================
    # MOCK INTERVIEW
    # =========================================================

    # Start a new mock interview
    path(
        "mock-interviews/",
        MockInterviewHistoryView.as_view(),
        name="mock-interview-history",
    ),
    path(
        "resume/<int:resume_id>/mock-interview/start/",
        StartMockInterviewView.as_view(),
        name="start-mock-interview",
    ),

    # Get current mock interview/question
    path(
        "mock-interview/<int:interview_id>/",
        MockInterviewDetailView.as_view(),
        name="mock-interview-detail",
    ),

    # Submit user's answer
    path(
        "mock-interview/<int:interview_id>/answer/",
        SubmitMockInterviewAnswerView.as_view(),
        name="submit-mock-interview-answer",
    ),

    # Complete mock interview
    path(
        "mock-interview/<int:interview_id>/complete/",
        CompleteMockInterviewView.as_view(),
        name="complete-mock-interview",
    ),

    # Get complete mock interview result
    path(
        "mock-interview/<int:interview_id>/result/",
        MockInterviewResultView.as_view(),
        name="mock-interview-result",
    ),
]