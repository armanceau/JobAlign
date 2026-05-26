import services.semantic_matcher as semantic_matcher


import numpy as np


def test_generate_embeddings_returns_cv_and_offer_vectors(monkeypatch):
    calls: list[str] = []


    def fake_fetch_embedding(text: str, model_name: str):
        assert model_name == "fake-model"
        calls.append(text)
        if len(calls) == 1:
            return np.array([1.0, 0.0, 0.0])
        return np.array([0.6, 0.8, 0.0])

    monkeypatch.setattr(semantic_matcher, "_fetch_embedding", fake_fetch_embedding)

    cv_embedding, offer_embedding = semantic_matcher.generate_embeddings(
        "CV avec Python",
        "Offre Python",
        model_name="fake-model",
    )

    assert cv_embedding.tolist() == [1.0, 0.0, 0.0]
    assert offer_embedding.tolist() == [0.6, 0.8, 0.0]


def test_compute_semantic_similarity_returns_cosine_score(monkeypatch):
    monkeypatch.setattr(
        semantic_matcher,
        "generate_embeddings",
        lambda cv_text, offer_text, model_name: (
            np.array([1.0, 0.0, 0.0]),
            np.array([0.6, 0.8, 0.0]),
        ),
    )

    result = semantic_matcher.compute_semantic_similarity(
        "CV",
        "Offre",
        model_name="fake-model",
    )

    assert result["model"] == "fake-model"
    assert result["backend"] == "ollama"
    assert result["cosine_similarity"] == 0.6
    assert result["similarity_percent"] == 60.0


def test_generate_embeddings_rejects_empty_text():
    try:
        semantic_matcher.generate_embeddings("   ", "Offre")
    except ValueError as exc:
        assert "doivent contenir du texte" in str(exc)
    else:
        raise AssertionError("generate_embeddings doit refuser un texte vide")


def test_generate_cv_recommendations_parses_ollama_json(monkeypatch):
    def fake_post(path: str, payload: dict[str, object]):
        assert path == "/api/generate"
        assert payload["model"] == "fake-chat-model"
        return {
            "response": (
                "{\"summary\":\"Ajoute des preuves chiffrées\","
                "\"missing_keywords\":[\"Docker\",\"CI/CD\"],"
                "\"reformulations\":[{\"section\":\"Expérience\",\"current\":\"Développement\",\"suggestion\":\"Développement Python Docker\"}],"
                "\"improvements\":[{\"action\":\"Ajouter des métriques\",\"reason\":\"Rend le CV plus crédible\"}],"
                "\"prioritized_actions\":[\"Ajouter Docker\",\"Ajouter CI/CD\"]}"
            )
        }

    monkeypatch.setattr(semantic_matcher, "_ollama_post", fake_post)

    result = semantic_matcher.generate_cv_recommendations(
        "CV",
        "Offre",
        {"hard_skills": ["Python"]},
        {"hard_skills": ["Python", "Docker"]},
        model_name="fake-chat-model",
    )

    assert result["backend"] == "ollama"
    assert result["model"] == "fake-chat-model"
    assert result["summary"] == "Ajoute des preuves chiffrées"
    assert result["missing_keywords"] == ["Docker", "CI/CD"]
    assert result["prioritized_actions"] == ["Ajouter Docker", "Ajouter CI/CD"]
