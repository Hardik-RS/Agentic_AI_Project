import json


def parse_json(text: str):
    """
    Parse JSON returned by an LLM.
    Removes Markdown code fences if present.
    """
    text = text.strip()

    if text.startswith("```json"):
        text = text.replace("```json", "", 1)

    if text.endswith("```"):
        text = text[:-3]

    text = text.strip()

    return json.loads(text)