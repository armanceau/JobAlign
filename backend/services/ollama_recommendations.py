from __future__ import annotations

import json
import logging
from typing import Any

from services.semantic_matcher import (
    DEFAULT_OLLAMA_CHAT_MODEL,
    _clean_json_payload,
    _fix_text_encoding,
    _normalize_list,
    _ollama_post,
)

logger = logging.getLogger(__name__)


def _coerce_text(value: Any) -> str:
    if isinstance(value, str):
        return value.strip()

    if isinstance(value, dict):
        for key in ("text", "summary", "action", "reason", "current", "suggestion", "label"):
            candidate = value.get(key)
            if isinstance(candidate, str) and candidate.strip():
                return candidate.strip()
        try:
            return json.dumps(value, ensure_ascii=False)
        except Exception:
            return ""

    if value is None:
        return ""

    return str(value).strip()


def _coerce_reformulations(value: Any) -> list[dict[str, str]]:
    if not isinstance(value, list):
        return []

    items: list[dict[str, str]] = []
    for item in value:
        if isinstance(item, dict):
            section = _coerce_text(item.get("section"))
            current = _coerce_text(item.get("current"))
            suggestion = _coerce_text(item.get("suggestion"))
            if section or current or suggestion:
                items.append(
                    {
                        "section": section,
                        "current": current,
                        "suggestion": suggestion,
                    }
                )
        else:
            text = _coerce_text(item)
            if text:
                items.append({"section": "", "current": text, "suggestion": text})

    return items


def _coerce_improvements(value: Any) -> list[dict[str, str]]:
    if not isinstance(value, list):
        return []

    items: list[dict[str, str]] = []
    for item in value:
        if isinstance(item, dict):
            action = _coerce_text(item.get("action"))
            reason = _coerce_text(item.get("reason"))
            if action or reason:
                items.append({"action": action, "reason": reason})
        else:
            text = _coerce_text(item)
            if text:
                items.append({"action": text, "reason": ""})

    return items


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
        "summary": _coerce_text(suggestions.get("summary")),
        "missing_keywords": [_coerce_text(item) for item in _normalize_list(suggestions.get("missing_keywords"))],
        "reformulations": _coerce_reformulations(suggestions.get("reformulations")),
        "improvements": _coerce_improvements(suggestions.get("improvements")),
        "prioritized_actions": [_coerce_text(item) for item in _normalize_list(suggestions.get("prioritized_actions"))],
    }
