from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


class Education(BaseModel):
    degree: str = ""
    institution: str = ""
    location: str = ""
    start_date: str = ""
    end_date: str = ""
    grade: str = ""
    description: str = ""


class Experience(BaseModel):
    role: str = ""
    organization: str = ""
    location: str = ""
    start_date: str = ""
    end_date: str = ""
    currently_working: bool = False
    description: str = ""
    technologies: List[str] = Field(default_factory=list)


class Project(BaseModel):
    name: str = ""
    description: str = ""
    technologies: List[str] = Field(default_factory=list)
    github_url: str = ""
    live_url: str = ""


class Certification(BaseModel):
    name: str = ""
    organization: str = ""
    issue_date: str = ""
    credential_id: str = ""


class ResumeSchema(BaseModel):
    name: str = ""
    email: Optional[EmailStr] = None
    phone: str = ""

    summary: str = ""

    education: List[Education] = Field(default_factory=list)
    experience: List[Experience] = Field(default_factory=list)
    projects: List[Project] = Field(default_factory=list)

    skills: List[str] = Field(default_factory=list)
    certifications: List[Certification] = Field(default_factory=list)

    languages: List[str] = Field(default_factory=list)
    achievements: List[str] = Field(default_factory=list)