from io import BytesIO
import re

from fastapi import HTTPException
from pypdf import PdfReader


def _normalize_text(text: str) -> str:
    """Collapse repeated whitespace and remove empty lines."""

    lines = [re.sub(r"\s+", " ", line).strip() for line in text.splitlines()]
    lines = [line for line in lines if line]
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
