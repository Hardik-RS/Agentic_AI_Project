from django.contrib import admin
from .Models.ResumeParserResult import ResumeParserResult
from .Models.ResumeAnalysisResult import ResumeAnalysisResult
from .Models.ResumeScoreResult import ResumeScoreResult
from .Models.JobMatchResult import JobMatchResult

# Register your models here.
admin.site.register(ResumeParserResult)
admin.site.register(ResumeAnalysisResult)
admin.site.register(ResumeScoreResult)
admin.site.register(JobMatchResult)
