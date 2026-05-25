from fastapi.testclient import TestClient
from main import app
import main as main_module
import io
import os
import pytest
from pypdf import PdfWriter

client = TestClient(app)


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.fixture()
def tmp_upload_dir(tmp_path, monkeypatch):
    """Redirect uploads to a temporary directory so tests leave no artifacts."""
    monkeypatch.setattr(main_module, "UPLOAD_DIR", str(tmp_path))
    os.makedirs(str(tmp_path), exist_ok=True)
    return tmp_path


def test_upload_pdf_success(tmp_upload_dir):
    fake_pdf = io.BytesIO(b"%PDF-1.4 fake content")

    response = client.post(
        "/upload-cv",
        files={"file": ("test.pdf", fake_pdf, "application/pdf")}
    )

    assert response.status_code == 201
    data = response.json()
    assert data["original_filename"] == "test.pdf"


def test_upload_wrong_type():
    fake_txt = io.BytesIO(b"hello")

    response = client.post(
        "/upload-cv",
        files={"file": ("test.txt", fake_txt, "text/plain")}
    )

    assert response.status_code == 400
    assert "Type de fichier invalide" in response.json()["detail"]


def test_upload_no_extension():
    fake_pdf = io.BytesIO(b"%PDF-1.4 fake content")

    response = client.post(
        "/upload-cv",
        files={"file": ("test", fake_pdf, "application/pdf")}
    )

    assert response.status_code == 400
    assert "extension .pdf" in response.json()["detail"]


def test_upload_too_large():
    big_file = io.BytesIO(b"x" * (10 * 1024 * 1024 + 1))

    response = client.post(
        "/upload-cv",
        files={"file": ("big.pdf", big_file, "application/pdf")}
    )

    assert response.status_code == 400
    assert "dépasse la limite" in response.json()["detail"]


def build_pdf_bytes(text: str) -> io.BytesIO:
    writer = PdfWriter()
    page = writer.add_blank_page(width=300, height=300)
    page.extract_text = lambda: text

    buffer = io.BytesIO()
    writer.write(buffer)
    buffer.seek(0)
    return buffer


def test_extract_pdf_text_success():
    fake_pdf = build_pdf_bytes("  Bonjour   monde\n\nDeuxieme   ligne  ")

    response = client.post(
        "/extract-cv-text",
        files={"file": ("cv.pdf", fake_pdf, "application/pdf")}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["text"] == "Bonjour monde\nDeuxieme ligne"


def test_extract_pdf_text_invalid_file_type():
    fake_txt = io.BytesIO(b"hello")

    response = client.post(
        "/extract-cv-text",
        files={"file": ("cv.txt", fake_txt, "text/plain")}
    )

    assert response.status_code == 400
    assert "Type de fichier invalide" in response.json()["detail"]


def test_extract_pdf_text_empty_payload():
    response = client.post(
        "/extract-cv-text",
        files={"file": ("cv.pdf", io.BytesIO(b""), "application/pdf")}
    )

    assert response.status_code == 400
    assert "vide" in response.json()["detail"]