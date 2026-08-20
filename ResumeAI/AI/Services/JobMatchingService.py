import logging

from django.db import transaction

from Resume.models import Resume

from AI.Models.JobMatchResult import JobMatchResult
from AI.Schemas.ResumeSchema import ResumeSchema
from AI.Graphs.JobMatchingGraph import run_job_matching_graph


logger = logging.getLogger(__name__)


class JobMatchingService:
    """
    Handles database operations and orchestration
    for resume-to-job matching.
    """

    @staticmethod
    @transaction.atomic
    def match_resume_to_job(resume: Resume,job_title: str,job_description: str = "",) -> JobMatchResult:

        if resume is None:
            raise ValueError(
                "Resume cannot be None."
            )

        if not resume.extracted_text:
            raise ValueError(
                "Resume extracted text not found."
            )

        if not job_title or not job_title.strip():
            raise ValueError(
                "Job title is required."
            )

        # Convert existing parsed resume into ResumeSchema

        try:
            parser_result = resume.parser_result

        except Exception as exc:

            raise ValueError(
                "Resume must be parsed before job matching."
            ) from exc

        resume_schema = ResumeSchema.model_validate(parser_result.parsed_data)

        # Run LangGraph

        try:

            result = run_job_matching_graph(
                resume=resume_schema,
                job_title=job_title.strip(),
                job_description=(job_description.strip() if job_description else ""),
            )

        except Exception as exc:

            logger.exception(
                "Job matching graph failed."
            )

            raise RuntimeError(
                "Job matching process failed."
            ) from exc

        # Get result

        match_result = result.get("match_result")

        if match_result is None:

            raise RuntimeError(
                "Job matching agent returned no result."
            )

        # Save result

        saved_result = JobMatchResult.objects.create(
            resume=resume,
            job_title=job_title,
            job_description=(job_description.strip() if job_description else ""),
            match_data=match_result.model_dump(),
        )

        return saved_result