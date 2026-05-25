import pytest
from fastapi import HTTPException

import services.pdf_text_extractor as extractor


class FakePage:
    def __init__(self, text):
        self._text = text

    def extract_text(self):
        return self._text


class FakePdfReader:
    def __init__(self, pages):
        self.pages = pages


def test_extract_text_from_pdf_bytes_success(monkeypatch):
    monkeypatch.setattr(
        extractor,
        "PdfReader",
        lambda buffer: FakePdfReader([
            FakePage("  Bonjour   monde  "),
            FakePage("\nDeuxieme   ligne\n"),
        ]),
    )

    result = extractor.extract_text_from_pdf_bytes(b"%PDF-1.4 fake content")

    assert result == "Bonjour monde\nDeuxieme ligne"


def test_extract_text_from_pdf_bytes_recovers_spaced_letters(monkeypatch):
    monkeypatch.setattr(
        extractor,
        "PdfReader",
        lambda buffer: FakePdfReader([
            FakePage("D é v e l o p p e u r  f u l l - s t a c k"),
            FakePage("A R T H U R"),
        ]),
    )

    result = extractor.extract_text_from_pdf_bytes(b"%PDF-1.4 fake content")

    assert result == "Développeur full-stack\nARTHUR"


def test_extract_text_from_pdf_bytes_empty_payload():
    with pytest.raises(HTTPException) as exc_info:
        extractor.extract_text_from_pdf_bytes(b"")

    assert exc_info.value.status_code == 400
    assert "vide" in exc_info.value.detail


def test_extract_text_from_pdf_bytes_invalid_pdf(monkeypatch):
    def raise_error(_buffer):
        raise ValueError("bad pdf")

    monkeypatch.setattr(extractor, "PdfReader", raise_error)

    with pytest.raises(HTTPException) as exc_info:
        extractor.extract_text_from_pdf_bytes(b"not-a-pdf")

    assert exc_info.value.status_code == 400
    assert "Impossible de lire le PDF fourni" in exc_info.value.detail


def test_extract_text_from_pdf_bytes_no_text(monkeypatch):
    monkeypatch.setattr(
        extractor,
        "PdfReader",
        lambda buffer: FakePdfReader([
            FakePage(None),
            FakePage("   \n   "),
        ]),
    )

    with pytest.raises(HTTPException) as exc_info:
        extractor.extract_text_from_pdf_bytes(b"%PDF-1.4 fake content")

    assert exc_info.value.status_code == 422
    assert "Aucun texte exploitable" in exc_info.value.detail
