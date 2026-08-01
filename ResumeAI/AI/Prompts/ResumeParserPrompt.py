RESUME_PARSER_PROMPT = """
You are an expert resume parser.

Your task is to extract structured information from the resume text.

Return ONLY valid JSON.

Schema:

{{
    "name": "",
    "email": "",
    "phone": "",
    "education": [],
    "experience": [],
    "projects": [],
    "skills": [],
    "certifications": []
}}

Resume:

{resume_text}
"""