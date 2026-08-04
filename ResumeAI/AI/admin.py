from django.contrib import admin
from .Models.ResumeParserResult import ResumeParserResult
from .Models.ResumeAnalysisResult import ResumeAnalysisResult

# Register your models here.
admin.site.register(ResumeParserResult)
admin.site.register(ResumeAnalysisResult)
