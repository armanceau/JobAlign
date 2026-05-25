from io import BytesIO
import os

import pytest
from fastapi.testclient import TestClient

import main as main_module
from main import app

client = TestClient(app)


@pytest.fixture()
def tmp_upload_dir(tmp_path, monkeypatch):
    """Redirect uploads to a temporary directory so tests leave no artifacts."""
    monkeypatch.setattr(main_module, "UPLOAD_DIR", str(tmp_path))
    os.makedirs(str(tmp_path), exist_ok=True)
    return tmp_path


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_upload_pdf_success(tmp_upload_dir):
    fake_pdf = BytesIO(b"%PDF-1.4 fake content")

    response = client.post(
        "/upload-cv",
        files={"file": ("test.pdf", fake_pdf, "application/pdf")},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["original_filename"] == "test.pdf"
    assert data["stored_filename"].endswith("test.pdf")
    assert data["size"] == len(b"%PDF-1.4 fake content")


def test_upload_wrong_type():
    fake_txt = BytesIO(b"hello")

    response = client.post(
        "/upload-cv",
        files={"file": ("test.txt", fake_txt, "text/plain")},
    )

    assert response.status_code == 400
    assert "Type de fichier invalide" in response.json()["detail"]


def test_upload_no_extension():
    fake_pdf = BytesIO(b"%PDF-1.4 fake content")

    response = client.post(
        "/upload-cv",
        files={"file": ("test", fake_pdf, "application/pdf")},
    )

    assert response.status_code == 400
    assert "extension .pdf" in response.json()["detail"]


def test_upload_too_large():
    big_file = BytesIO(b"x" * (10 * 1024 * 1024 + 1))

    response = client.post(
        "/upload-cv",
        files={"file": ("big.pdf", big_file, "application/pdf")},
    )

    assert response.status_code == 400
    assert "dépasse la limite" in response.json()["detail"]


def test_extract_cv_text_success(monkeypatch):
    expected_text = "Bonjour monde\nDeuxieme ligne"

    def fake_extract_text_from_pdf_bytes(pdf_bytes):
        assert pdf_bytes == b"%PDF-1.4 fake content"
        return expected_text

    monkeypatch.setattr(main_module, "extract_text_from_pdf_bytes", fake_extract_text_from_pdf_bytes)

    response = client.post(
        "/extract-cv-text",
        files={"file": ("cv.pdf", BytesIO(b"%PDF-1.4 fake content"), "application/pdf")},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "cv.pdf"
    assert data["text"] == expected_text


def test_extract_cv_text_invalid_file_type():
    fake_txt = BytesIO(b"hello")

    response = client.post(
        "/extract-cv-text",
        files={"file": ("cv.txt", fake_txt, "text/plain")},
    )

    assert response.status_code == 400
    assert "Type de fichier invalide" in response.json()["detail"]


def test_extract_cv_text_empty_payload():
    response = client.post(
        "/extract-cv-text",
        files={"file": ("cv.pdf", BytesIO(b""), "application/pdf")},
    )

    assert response.status_code == 400
    assert "vide" in response.json()["detail"]
