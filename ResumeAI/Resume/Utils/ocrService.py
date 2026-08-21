import io

import fitz
import pytesseract

from PIL import Image


# Tesseract installation path
pytesseract.pytesseract.tesseract_cmd = (
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)


class OCRService:
    """
    OCR fallback for scanned/image-based PDFs.

    Supports:
    - English
    - Hindi
    - Gujarati
    """

    # Tesseract language codes
    OCR_LANGUAGES = "eng+hin+guj"

    @staticmethod
    def extract_text(pdf_path: str) -> str:

        document = fitz.open(pdf_path)
        extracted_text = []

        try:
            for page in document:

                # Render PDF page at high resolution
                pix = page.get_pixmap(dpi=300)

                # Convert rendered page to PIL Image
                image = Image.open(
                    io.BytesIO(
                        pix.tobytes("png")
                    )
                )

                # OCR using multiple languages
                text = pytesseract.image_to_string(
                    image,
                    lang=OCRService.OCR_LANGUAGES
                )

                extracted_text.append(text)

        finally:
            document.close()

        # Combine all pages
        text = "\n".join(extracted_text)

        # Remove NUL characters that can cause
        # Django database ValueError
        text = text.replace("\x00", "")

        return text