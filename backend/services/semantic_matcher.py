from __future__ import annotations

import os
from functools import lru_cache

import numpy as np
from sentence_transformers import SentenceTransformer

DEFAULT_EMBEDDING_MODEL = os.getenv(
    "JOBALIGN_EMBEDDING_MODEL",
    "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
)


@lru_cache(maxsize=2)
def get_embedding_model(model_name: str = DEFAULT_EMBEDDING_MODEL) -> SentenceTransformer:
    """Load and cache the sentence-transformers model used for semantic matching."""
    return SentenceTransformer(model_name)


def generate_embeddings(
    cv_text: str,
    offer_text: str,
    model_name: str = DEFAULT_EMBEDDING_MODEL,
) -> tuple[np.ndarray, np.ndarray]:
    """Generate normalized embeddings for CV and offer texts."""
    cv_clean = cv_text.strip()
    offer_clean = offer_text.strip()

    if not cv_clean or not offer_clean:
        raise ValueError("Le CV et l'offre doivent contenir du texte.")

    model = get_embedding_model(model_name)
    vectors = model.encode(
        [cv_clean, offer_clean],
        convert_to_numpy=True,
        normalize_embeddings=True,
    )

    return vectors[0], vectors[1]


def compute_semantic_similarity(
    cv_text: str,
    offer_text: str,
    model_name: str = DEFAULT_EMBEDDING_MODEL,
) -> dict[str, float | str]:
    """Compute cosine similarity from CV/offer embeddings."""
    cv_embedding, offer_embedding = generate_embeddings(cv_text, offer_text, model_name=model_name)
    cosine_similarity = float(np.dot(cv_embedding, offer_embedding))

    return {
        "model": model_name,
        "cosine_similarity": round(cosine_similarity, 4),
        "similarity_percent": round(cosine_similarity * 100, 2),
    }
