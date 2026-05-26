from fastapi.testclient import TestClient

import main as main_module
from main import app


client = TestClient(app)


def test_nlp_analyze_endpoint_returns_structured_categories(monkeypatch):
    monkeypatch.setattr(
        main_module,
        "compute_semantic_similarity",
        lambda cv_text, offer_text: {
            "model": "fake-model",
            "cosine_similarity": 0.82,
            "similarity_percent": 82.0,
        },
    )

    payload = {
        "cv_text": (
            "Ingénieur logiciel avec 5 ans d'expérience en Python, FastAPI et Docker. "
            "Travail d'équipe et autonomie. Master en informatique."
        ),
        "offer_text": (
            "Nous recherchons un développeur Python avec 3 ans d'expérience. "
            "Esprit d'équipe, rigueur. Bac+5 exigé. Docker apprécié."
        ),
    }

    response = client.post("/nlp/analyze", json=payload)

    assert response.status_code == 200
    data = response.json()

    assert data["cv"]["hard_skills"] == ["Python", "FastAPI", "Docker"]
    assert data["offer"]["hard_skills"] == ["Python", "Docker"]
    assert data["summary"]["shared_hard_skills"] == ["Docker", "Python"]
    assert data["cv"]["diplomas"] == ["Master"]
    assert data["offer"]["diplomas"] == ["Bac+5"]
    assert data["semantic_matching"]["model"] == "fake-model"
    assert data["semantic_matching"]["cosine_similarity"] == 0.82
