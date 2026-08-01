import fitz

from .ocrService import OCRService


OCR_THRESHOLD = 100


def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extract text from a PDF.

    1. Try normal text extraction.
    2. If very little text is found, use OCR.
    """

    document = fitz.open(pdf_path)

    try:
        text = ""

        for page in document:
            text += page.get_text()

    finally:
        document.close()

    text = text.strip()

    # If almost no text was extracted,
    # it's probably a scanned PDF.
    if len(text) < OCR_THRESHOLD:
        print("Using OCR...")
        return OCRService.extract_text(pdf_path)

    return text