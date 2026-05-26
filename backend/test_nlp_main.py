from fastapi.testclient import TestClient

import main as main_module


client = TestClient(main_module.app)


def test_nlp_analyze_endpoint_returns_structured_categories(monkeypatch):
    monkeypatch.setattr(
        main_module,
        "compute_semantic_similarity",
        lambda cv_text, offer_text: {
            "backend": "ollama",
            "model": "fake-embed-model",
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
    assert data["semantic_matching"]["backend"] == "ollama"
    assert data["semantic_matching"]["model"] == "fake-embed-model"
    assert data["semantic_matching"]["cosine_similarity"] == 0.82


def test_nlp_recommendations_endpoint_uses_analysis_context(monkeypatch):
    monkeypatch.setattr(
        main_module,
        "generate_cv_recommendations",
        lambda cv_text, offer_text, cv_analysis, offer_analysis: {
            "backend": "ollama",
            "model": "fake-chat-model",
            "summary": "Ajoutez davantage de preuves concrètes.",
            "missing_keywords": ["Docker", "CI/CD"],
            "reformulations": [
                {
                    "section": "Expérience",
                    "current": "Développement d'applications",
                    "suggestion": "Développement d'applications Python en environnement Docker et CI/CD",
                }
            ],
            "improvements": [
                {
                    "action": "Ajoutez des métriques chiffrées.",
                    "reason": "Les résultats mesurables renforcent l'impact du CV.",
                }
            ],
            "prioritized_actions": ["Ajouter Docker", "Ajouter CI/CD"],
        },
    )

    payload = {
        "cv_text": "CV",
        "offer_text": "Offre",
        "cv_analysis": {"hard_skills": ["Python"]},
        "offer_analysis": {"hard_skills": ["Docker"]},
    }

    response = client.post("/nlp/recommendations", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["recommendations"]["backend"] == "ollama"
    assert data["recommendations"]["model"] == "fake-chat-model"
    assert data["recommendations"]["missing_keywords"] == ["Docker", "CI/CD"]
