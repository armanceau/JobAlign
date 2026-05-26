import numpy as np

import services.semantic_matcher as semantic_matcher


def test_generate_embeddings_returns_cv_and_offer_vectors(monkeypatch):
    calls = []

    def fake_ollama_post(path: str, payload: dict):
        calls.append((path, payload))
        if payload["prompt"] == "CV avec Python":
            return {"embedding": [1.0, 0.0, 0.0]}
        return {"embedding": [0.6, 0.8, 0.0]}

    monkeypatch.setattr(semantic_matcher, "_ollama_post", fake_ollama_post)

    cv_embedding, offer_embedding = semantic_matcher.generate_embeddings(
        "CV avec Python",
        "Offre Python",
        model_name="fake-model",
    )

    assert calls == [
        ("/api/embeddings", {"model": "fake-model", "prompt": "CV avec Python"}),
        ("/api/embeddings", {"model": "fake-model", "prompt": "Offre Python"}),
    ]
    assert np.allclose(cv_embedding, np.array([1.0, 0.0, 0.0], dtype=np.float32))
    assert np.allclose(offer_embedding, np.array([0.6, 0.8, 0.0], dtype=np.float32))


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

    assert result["backend"] == "ollama"
    assert result["model"] == "fake-model"
    assert result["cosine_similarity"] == 0.6
    assert result["similarity_percent"] == 60.0


def test_generate_cv_recommendations_parses_json(monkeypatch):
    monkeypatch.setattr(
        semantic_matcher,
        "_ollama_post",
        lambda path, payload: {
            "response": '{"summary":"Test","missing_keywords":["Docker"],"reformulations":[{"section":"CV","current":"A","suggestion":"B"}],"improvements":[{"action":"C","reason":"D"}],"prioritized_actions":["E"]}'
        },
    )

    result = semantic_matcher.generate_cv_recommendations(
        "CV",
        "Offre",
        cv_analysis={"hard_skills": ["Python"]},
        offer_analysis={"hard_skills": ["Docker"]},
        model_name="fake-chat-model",
    )

    assert result["backend"] == "ollama"
    assert result["model"] == "fake-chat-model"
    assert result["summary"] == "Test"
    assert result["missing_keywords"] == ["Docker"]
    assert result["prioritized_actions"] == ["E"]


def test_generate_embeddings_rejects_empty_text():
    try:
        semantic_matcher.generate_embeddings("   ", "Offre")
    except ValueError as exc:
        assert "doivent contenir du texte" in str(exc)
    else:
        raise AssertionError("generate_embeddings doit refuser un texte vide")
