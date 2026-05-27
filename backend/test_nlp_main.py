from fastapi.testclient import TestClient

import main as main_module
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
    assert data["matching"]["global_score_percent"] == 88.89
    assert data["matching"]["subscores"]["technical_skills"]["score_percent"] == 100.0
    assert data["matching"]["subscores"]["soft_skills"]["score_percent"] == 0.0
    assert any(
        "Score global déterministe" in item for item in data["matching"]["justifications"]
    )


def test_nlp_recommendations_endpoint_returns_local_suggestions(monkeypatch):
    payload = {
        "cv_text": "Développeur Python avec autonomie.",
        "offer_text": "Offre demandant Python, FastAPI et Docker.",
    }

    async def fake_generate_local_recommendations(analysis):
        return {
            "provider": "ollama",
            "model": "qwen3.5",
            "status": "ok",
            "summary": "Suggestions locales prêtes.",
            "missing_keywords": ["FastAPI", "Docker"],
            "reformulations": [
                {
                    "before": "Résumé générique.",
                    "after": "Ajoutez FastAPI et Docker.",
                    "reason": "Terme clé demandé.",
                }
            ],
            "improvements": ["Mettre en avant FastAPI."],
        }

    monkeypatch.setattr(
        main_module,
        "generate_local_recommendations",
        fake_generate_local_recommendations,
    )

    response = client.post("/nlp/recommendations", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["provider"] == "ollama"
    assert data["missing_keywords"] == ["FastAPI", "Docker"]


def test_nlp_motivation_letter_endpoint_returns_letter(monkeypatch):
    payload = {
        "cv_text": "Développeur Python avec expérience FastAPI.",
        "offer_text": "Poste backend Python chez Acme.",
        "company_name": "Acme",
        "candidate_name": "Alex",
    }

    async def fake_generate_motivation_letter(**kwargs):
        return {
            "provider": "ollama",
            "model": "qwen3.5",
            "status": "ok",
            "letter": "Madame, Monsieur, je vous adresse ma candidature...",
        }

    monkeypatch.setattr(
        main_module,
        "generate_motivation_letter",
        fake_generate_motivation_letter,
    )

    response = client.post("/nlp/motivation-letter", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["provider"] == "ollama"
    assert data["status"] == "ok"
    assert "candidature" in data["letter"]
