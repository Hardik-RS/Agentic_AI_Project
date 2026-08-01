from pydantic import BaseModel


class ResumeSchema(BaseModel):
    name: str
    email: str
    phone: str

    education: list[str]
    experience: list[str]
    projects: list[str]
    skills: list[str]
    certifications: list[str]