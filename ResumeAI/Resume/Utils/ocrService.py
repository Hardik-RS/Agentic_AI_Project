import io

import fitz
import pytesseract
from PIL import Image


# Uncomment and update if Tesseract is not in PATH
pytesseract.pytesseract.tesseract_cmd = (
     r"C:\Program Files\Tesseract-OCR\tesseract.exe"
 )


class OCRService:
    """
    OCR fallback for scanned/image-based PDFs.
    """

    @staticmethod
    def extract_text(pdf_path: str) -> str:
        document = fitz.open(pdf_path)

        extracted_text = []

        try:
            for page in document:

                # Render page at high resolution
                pix = page.get_pixmap(dpi=300)

                image = Image.open(
                    io.BytesIO(
                        pix.tobytes("png")
                    )
                )

                text = pytesseract.image_to_string(image)

                extracted_text.append(text)

        finally:
            document.close()

        return "\n".join(extracted_text)