import numpy as np

import services.semantic_matcher as semantic_matcher


class FakeSentenceTransformer:
    def __init__(self, model_name: str):
        self.model_name = model_name

    def encode(self, texts, convert_to_numpy=True, normalize_embeddings=True):
        assert convert_to_numpy is True
        assert normalize_embeddings is True
        assert len(texts) == 2
        return np.array(
            [
                [1.0, 0.0, 0.0],
                [0.6, 0.8, 0.0],
            ]
        )


def test_generate_embeddings_returns_cv_and_offer_vectors(monkeypatch):
    def fake_get_embedding_model(model_name: str):
        assert model_name == "fake-model"
        return FakeSentenceTransformer(model_name)

    monkeypatch.setattr(semantic_matcher, "get_embedding_model", fake_get_embedding_model)

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
    assert result["cosine_similarity"] == 0.6
    assert result["similarity_percent"] == 60.0


def test_generate_embeddings_rejects_empty_text():
    try:
        semantic_matcher.generate_embeddings("   ", "Offre")
    except ValueError as exc:
        assert "doivent contenir du texte" in str(exc)
    else:
        raise AssertionError("generate_embeddings doit refuser un texte vide")
