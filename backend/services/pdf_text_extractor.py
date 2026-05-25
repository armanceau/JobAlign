from io import BytesIO
import re

from fastapi import HTTPException
from pypdf import PdfReader


SPACED_LETTER_PATTERN = re.compile(
    r"(?<!\S)(?:[A-Za-zÀ-ÖØ-öø-ÿ]\s+){2,}[A-Za-zÀ-ÖØ-öø-ÿ](?=[\s\.,;:!?\"')\]]|$)"
)


def _collapse_spaced_letters(text: str) -> str:
    """Join words that were extracted as spaced letters, e.g. `D é v e l o p p e u r`."""

    def compact(match: re.Match[str]) -> str:
        return match.group(0).replace(" ", "")

    return SPACED_LETTER_PATTERN.sub(compact, text)


def _normalize_text(text: str) -> str:
    """Collapse repeated whitespace, remove empty lines and fix spaced-letter OCR output."""

    lines = []
    for line in text.splitlines():
        cleaned_chunks = []
        for chunk in re.split(r"\s{2,}", line):
            chunk = _collapse_spaced_letters(chunk)
            chunk = re.sub(r"\s*[-–—]\s*", "-", chunk)
            chunk = re.sub(r"\s+", " ", chunk).strip()
            if chunk:
                cleaned_chunks.append(chunk)

        if cleaned_chunks:
            lines.append(" ".join(cleaned_chunks))
    return "\n".join(lines)


def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """Extract normalized text from a PDF byte stream."""

    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="Le fichier PDF est vide.")

    try:
        reader = PdfReader(BytesIO(pdf_bytes))
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Impossible de lire le PDF fourni: {exc}",
        ) from exc

    extracted_pages = []
    for page in reader.pages:
        page_text = page.extract_text() or ""
        extracted_pages.append(page_text)

    raw_text = "\n".join(extracted_pages).strip()
    normalized_text = _normalize_text(raw_text)

    if not normalized_text:
        raise HTTPException(
            status_code=422,
            detail="Aucun texte exploitable n'a pu être extrait de ce PDF.",
        )

    return normalized_text
