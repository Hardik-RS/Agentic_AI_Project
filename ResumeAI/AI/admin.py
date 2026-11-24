from django.contrib import admin
from .Models.ResumeParserResult import ResumeParserResult
from .Models.ResumeAnalysisResult import ResumeAnalysisResult
from .Models.ResumeScoreResult import ResumeScoreResult
from .Models.JobMatchResult import JobMatchResult
from .Models.InterviewPlanResult import InterviewPlanResult
from .Models.AnswerEvaluationResult import AnswerEvaluationResult
from .Models.FeedbackResult import FeedbackResult
from .Models.MockInterview import MockInterview
from .Models.MockInterviewAnswer import MockInterviewAnswer

# Register your models here.
admin.site.register(ResumeParserResult)
admin.site.register(ResumeAnalysisResult)
admin.site.register(ResumeScoreResult)
admin.site.register(JobMatchResult)
admin.site.register(InterviewPlanResult)
admin.site.register(FeedbackResult)
admin.site.register(AnswerEvaluationResult)
admin.site.register(MockInterview)
admin.site.register(MockInterviewAnswer)