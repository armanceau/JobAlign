from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


def test_nlp_analyze_endpoint_returns_structured_categories(monkeypatch):
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
    assert data["matching"]["method"] == "deterministic_rule_based"
    assert data["matching"]["global_score_percent"] == 90.0
    assert data["matching"]["subscores"]["technical_skills"]["score_percent"] == 100.0
    assert data["matching"]["subscores"]["soft_skills"]["score_percent"] == 0.0
    assert any(
        "Score global déterministe" in item for item in data["matching"]["justifications"]
    )
