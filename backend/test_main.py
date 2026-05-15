from fastapi.testclient import TestClient
from main import app
import main as main_module
import io
import os
import pytest

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