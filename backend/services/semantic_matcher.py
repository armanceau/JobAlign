from __future__ import annotations

import json
import logging
import os
from functools import lru_cache
from typing import Any

import httpx
import numpy as np

DEFAULT_OLLAMA_BASE_URL = os.getenv("JOBALIGN_OLLAMA_BASE_URL", "http://localhost:11434")
DEFAULT_OLLAMA_EMBED_MODEL = os.getenv("JOBALIGN_OLLAMA_MODEL", "nomic-embed-text")
DEFAULT_OLLAMA_CHAT_MODEL = os.getenv("JOBALIGN_OLLAMA_CHAT_MODEL", "llama3.2:1b")
DEFAULT_OLLAMA_TIMEOUT = float(os.getenv("JOBALIGN_OLLAMA_TIMEOUT", "60000"))

logger = logging.getLogger(__name__)


@lru_cache(maxsize=4)
def get_ollama_client(base_url: str = DEFAULT_OLLAMA_BASE_URL) -> httpx.Client:
    """Create a cached HTTP client for the local Ollama server."""
    return httpx.Client(base_url=base_url, timeout=httpx.Timeout(DEFAULT_OLLAMA_TIMEOUT))


def _fix_text_encoding(value: str) -> str:
    if not isinstance(value, str):
        return value
    if "Ã" in value:
        try:
            return value.encode("latin-1").decode("utf-8")
        except Exception:
            return value
    return value


def _fix_encoding_in_obj(obj: Any) -> Any:
    if isinstance(obj, str):
        return _fix_text_encoding(obj)
    if isinstance(obj, dict):
        return {key: _fix_encoding_in_obj(value) for key, value in obj.items()}
    if isinstance(obj, list):
        return [_fix_encoding_in_obj(value) for value in obj]
    if isinstance(obj, tuple):
        return tuple(_fix_encoding_in_obj(value) for value in obj)
    return obj


def _normalize_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []

    items: list[str] = []
    for item in value:
        if isinstance(item, str):
            stripped = item.strip()
            if stripped:
                items.append(stripped)
    return items


def _clean_json_payload(raw_text: str) -> str:
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        cleaned = cleaned.replace("json\n", "", 1).strip()
    return cleaned


def _ollama_post(path: str, payload: dict[str, Any]) -> dict[str, Any]:
    client = get_ollama_client()
    try:
        response = client.post(path, json=payload)
        response.raise_for_status()
    except httpx.RequestError as exc:
        logger.exception("Erreur réseau lors de l'appel à Ollama: %s", exc)
        raise RuntimeError(
            f"Impossible de joindre Ollama sur {DEFAULT_OLLAMA_BASE_URL}. Vérifie que 'ollama serve' est lancé."
        ) from exc
    except httpx.HTTPStatusError as exc:
        try:
            resp_text = exc.response.text
        except Exception:
            resp_text = "<unable to read response text>"
        logger.error(
            "Ollama HTTP error: status=%s model=%s path=%s payload=%s response=%s",
            exc.response.status_code,
            payload.get("model"),
            path,
            json.dumps(payload, ensure_ascii=False),
            resp_text,
        )
        raise RuntimeError(
            f"Ollama a refusé la requête pour le modèle '{payload.get('model')}'. Voir logs pour plus de détails."
        ) from exc

    try:
        data = json.loads(response.content.decode("utf-8"))
    except Exception:
        try:
            data = response.json()
        except Exception:
            try:
                logger.error("Réponse Ollama non JSON valide. Raw response: %s", response.text)
            except Exception:
                logger.exception("Impossible de lire la réponse brute d'Ollama.")
            raise RuntimeError("Réponse Ollama invalide (impossible d'interpréter le JSON).")

    if not isinstance(data, dict):
        raise RuntimeError("Réponse Ollama invalide: format inattendu.")

    try:
        data = _fix_encoding_in_obj(data)
    except Exception:
        logger.exception("Échec du nettoyage d'encodage sur la réponse Ollama")

    return data


def _fetch_embedding(text: str, model_name: str) -> np.ndarray:
    payload = _ollama_post(
        "/api/embeddings",
        {
            "model": model_name,
            "prompt": text,
        },
    )

    embedding = payload.get("embedding")
    if not isinstance(embedding, list) or not embedding:
        raise RuntimeError("Réponse Ollama invalide: embedding manquant.")

    return np.asarray(embedding, dtype=np.float32)


def generate_embeddings(
    cv_text: str,
    offer_text: str,
    model_name: str = DEFAULT_OLLAMA_EMBED_MODEL,
) -> tuple[np.ndarray, np.ndarray]:
    """Generate embeddings for CV and offer texts using local Ollama."""
    cv_clean = cv_text.strip()
    offer_clean = offer_text.strip()

    if not cv_clean or not offer_clean:
        raise ValueError("Le CV et l'offre doivent contenir du texte.")

    return _fetch_embedding(cv_clean, model_name), _fetch_embedding(offer_clean, model_name)


def _cosine_similarity(vector_a: np.ndarray, vector_b: np.ndarray) -> float:
    denominator = float(np.linalg.norm(vector_a) * np.linalg.norm(vector_b))
    if denominator == 0:
        raise ValueError("Impossible de calculer une similarité sur des vecteurs nuls.")
    return float(np.dot(vector_a, vector_b) / denominator)


def compute_semantic_similarity(
    cv_text: str,
    offer_text: str,
    model_name: str = DEFAULT_OLLAMA_EMBED_MODEL,
) -> dict[str, float | str]:
    """Compute cosine similarity from CV/offer embeddings fetched from Ollama."""
    cv_embedding, offer_embedding = generate_embeddings(cv_text, offer_text, model_name=model_name)
    cosine_similarity = _cosine_similarity(cv_embedding, offer_embedding)

    return {
        "model": model_name,
        "backend": "ollama",
        "cosine_similarity": round(cosine_similarity, 4),
        "similarity_percent": round(cosine_similarity * 100, 2),
    }


def generate_cv_recommendations(
    cv_text: str,
    offer_text: str,
    cv_analysis: dict[str, Any],
    offer_analysis: dict[str, Any],
    model_name: str = DEFAULT_OLLAMA_CHAT_MODEL,
) -> dict[str, Any]:
    """Generate actionable CV recommendations locally with Ollama."""
    prompt = f"""
Tu es un coach CV. Tu travailles en français.

Objectif: produire des recommandations concrètes et actionnables pour améliorer un CV à partir d'une offre d'emploi.

Contraintes:
- Utilise uniquement les informations fournies.
- N'invente pas d'expérience, de diplôme ou de compétence.
- Réponds en JSON strict uniquement, sans texte autour.
- Le JSON doit contenir exactement ces clés:
  - summary: une phrase courte en français
  - missing_keywords: liste de mots-clés manquants ou sous-représentés
  - reformulations: liste d'objets avec "section", "current", "suggestion"
  - improvements: liste d'objets avec "action" et "reason"
  - prioritized_actions: liste de 3 à 5 actions prioritaires

Contexte CV:
{json.dumps(cv_analysis, ensure_ascii=False, indent=2)}

Contexte offre:
{json.dumps(offer_analysis, ensure_ascii=False, indent=2)}

Texte CV:
{cv_text}

Texte offre:
{offer_text}
""".strip()

    max_prompt_chars = 3500
    sent_prompt = prompt[:max_prompt_chars] + "\n\n...TRUNCATED..." if len(prompt) > max_prompt_chars else prompt

    try:
        payload = _ollama_post(
            "/api/generate",
            {
                "model": model_name,
                "prompt": sent_prompt,
                "stream": False,
                "format": "json",
            },
        )
    except Exception as exc:
        logger.exception("Échec de génération des recommandations Ollama: %s", exc)
        return {
            "model": model_name,
            "backend": "ollama",
            "summary": "",
            "missing_keywords": [],
            "reformulations": [],
            "improvements": [],
            "prioritized_actions": [],
            "error": str(exc),
        }

    response_text = payload.get("response")
    if not isinstance(response_text, str) or not response_text.strip():
        raise RuntimeError("Réponse Ollama invalide: suggestions manquantes.")

    response_text = _fix_text_encoding(response_text)

    try:
        suggestions_text = _clean_json_payload(response_text)
        suggestions = json.loads(suggestions_text)
    except json.JSONDecodeError:
        start = suggestions_text.find("{")
        end = suggestions_text.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise RuntimeError("Impossible de parser les recommandations générées par Ollama.")
        suggestions = json.loads(suggestions_text[start : end + 1])

    if not isinstance(suggestions, dict):
        suggestions = {}

    return {
        "model": model_name,
        "backend": "ollama",
        "summary": str(suggestions.get("summary", "")).strip(),
        "missing_keywords": _normalize_list(suggestions.get("missing_keywords")),
        "reformulations": suggestions.get("reformulations", []) or [],
        "improvements": suggestions.get("improvements", []) or [],
        "prioritized_actions": _normalize_list(suggestions.get("prioritized_actions")),
    }
