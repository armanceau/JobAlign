from __future__ import annotations

import json
import os
import re
from typing import Any

import httpx


OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3.5")
OLLAMA_TIMEOUT_SECONDS = float(os.getenv("OLLAMA_TIMEOUT_SECONDS", "30"))


def _truncate(text: str, limit: int = 4000) -> str:
    cleaned = re.sub(r"\s+", " ", text).strip()
    if len(cleaned) <= limit:
        return cleaned
    return cleaned[: limit - 3].rstrip() + "..."


def _unique_preserving_order(values: list[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for value in values:
        candidate = value.strip()
        key = candidate.lower()
        if candidate and key not in seen:
            seen.add(key)
            ordered.append(candidate)
    return ordered


def _merge_keywords(*groups: list[str]) -> list[str]:
    flattened: list[str] = []
    for group in groups:
        flattened.extend(group)
    return _unique_preserving_order(flattened)


def _build_fallback_recommendations(analysis: dict[str, Any]) -> dict[str, Any]:
    cv = analysis.get("cv", {})
    offer = analysis.get("offer", {})
    summary = analysis.get("summary", {})

    cv_hard = {item.lower() for item in cv.get("hard_skills", [])}
    offer_hard = _unique_preserving_order(offer.get("hard_skills", []))
    missing_hard = [item for item in offer_hard if item.lower() not in cv_hard]

    cv_soft = {item.lower() for item in cv.get("soft_skills", [])}
    offer_soft = _unique_preserving_order(offer.get("soft_skills", []))
    missing_soft = [item for item in offer_soft if item.lower() not in cv_soft]

    cv_lang = {item.lower() for item in cv.get("languages", [])}
    offer_lang = _unique_preserving_order(offer.get("languages", []))
    missing_languages = [item for item in offer_lang if item.lower() not in cv_lang]

    cv_diplomas = {item.lower() for item in cv.get("diplomas", [])}
    offer_diplomas = _unique_preserving_order(offer.get("diplomas", []))
    missing_diplomas = [item for item in offer_diplomas if item.lower() not in cv_diplomas]

    missing_keywords = _merge_keywords(
        missing_hard,
        missing_soft,
        missing_languages,
        missing_diplomas,
    )

    reformulations: list[dict[str, str]] = []
    if missing_hard:
        reformulations.append(
            {
                "before": "Résumé générique du CV.",
                "after": f"Ajoutez explicitement: {', '.join(missing_hard[:4])}.",
                "reason": "Ces mots-clés sont présents dans l'offre mais pas dans le CV analysé.",
            }
        )

    if summary.get("shared_hard_skills"):
        reformulations.append(
            {
                "before": "Décrire les compétences sans contexte.",
                "after": f"Mettez en avant vos preuves sur: {', '.join(summary['shared_hard_skills'][:4])}.",
                "reason": "Les compétences déjà partagées avec l'offre doivent être visibles dès le résumé.",
            }
        )

    improvements = [
        "Déplacez les compétences les plus proches du poste dans le résumé ou le haut du CV.",
        "Ajoutez des exemples chiffrés lorsque l'offre demande de l'impact ou des résultats.",
    ]
    if missing_soft:
        improvements.append(
            f"Illustrez les soft skills demandées: {', '.join(missing_soft[:3])}."
        )
    if missing_languages:
        improvements.append(
            f"Indiquez clairement le niveau des langues attendues: {', '.join(missing_languages[:3])}."
        )
    if missing_diplomas:
        improvements.append(
            f"Mentionnez le diplôme ou la certification attendue: {', '.join(missing_diplomas[:3])}."
        )

    return {
        "provider": "ollama",
        "model": OLLAMA_MODEL,
        "status": "fallback",
        "summary": (
            "Suggestions générées localement à partir des écarts détectés entre le CV et l'offre."
        ),
        "missing_keywords": missing_keywords,
        "reformulations": reformulations,
        "improvements": _unique_preserving_order(improvements),
    }


def _parse_json_payload(content: str) -> dict[str, Any] | None:
    candidate = content.strip()
    if candidate.startswith("```"):
        candidate = re.sub(r"^```(?:json)?\s*", "", candidate, count=1, flags=re.IGNORECASE)
        candidate = re.sub(r"\s*```$", "", candidate)

    start = candidate.find("{")
    end = candidate.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None

    try:
        return json.loads(candidate[start : end + 1])
    except json.JSONDecodeError:
        return None


def _normalize_recommendations(payload: dict[str, Any]) -> dict[str, Any]:
    missing_keywords = payload.get("missing_keywords", [])
    reformulations = payload.get("reformulations", [])
    improvements = payload.get("improvements", [])

    normalized_reformulations: list[dict[str, str]] = []
    for item in reformulations:
        if isinstance(item, dict):
            before = str(item.get("before", "")).strip()
            after = str(item.get("after", "")).strip()
            reason = str(item.get("reason", "")).strip()
            if before or after or reason:
                normalized_reformulations.append(
                    {"before": before, "after": after, "reason": reason}
                )

    return {
        "provider": "ollama",
        "model": str(payload.get("model", OLLAMA_MODEL)),
        "status": str(payload.get("status", "ok")),
        "summary": str(payload.get("summary", "")) or "Recommandations locales générées par Ollama.",
        "missing_keywords": _unique_preserving_order([str(item) for item in missing_keywords if item]),
        "reformulations": normalized_reformulations,
        "improvements": _unique_preserving_order([str(item) for item in improvements if item]),
    }


def _build_prompt(analysis: dict[str, Any]) -> tuple[str, str]:
    cv = analysis.get("cv", {})
    offer = analysis.get("offer", {})
    summary = analysis.get("summary", {})
    matching = analysis.get("matching", {})

    system_prompt = (
        "Tu es un assistant de recrutement en français. "
        "Tu dois produire des recommandations actionnables, locales et factuelles à partir d'un CV et d'une offre. "
        "Réponds uniquement en JSON valide, sans texte autour."
    )

    user_prompt = json.dumps(
        {
            "cv": {
                "hard_skills": cv.get("hard_skills", []),
                "soft_skills": cv.get("soft_skills", []),
                "diplomas": cv.get("diplomas", []),
                "languages": cv.get("languages", []),
                "experiences": cv.get("experiences", []),
                "text": _truncate(analysis.get("cv_text", "")),
            },
            "offer": {
                "hard_skills": offer.get("hard_skills", []),
                "soft_skills": offer.get("soft_skills", []),
                "diplomas": offer.get("diplomas", []),
                "languages": offer.get("languages", []),
                "experiences": offer.get("experiences", []),
                "text": _truncate(analysis.get("offer_text", "")),
            },
            "summary": summary,
            "matching": {
                "global_score_percent": matching.get("global_score_percent"),
                "technical_skills": matching.get("subscores", {}).get("technical_skills", {}).get("score_percent"),
                "soft_skills": matching.get("subscores", {}).get("soft_skills", {}).get("score_percent"),
                "education": matching.get("subscores", {}).get("education", {}).get("score_percent"),
                "language": matching.get("subscores", {}).get("language", {}).get("score_percent"),
                "experience": matching.get("subscores", {}).get("experience", {}).get("score_percent"),
            },
            "output_schema": {
                "summary": "string",
                "missing_keywords": ["string"],
                "reformulations": [
                    {
                        "before": "string",
                        "after": "string",
                        "reason": "string",
                    }
                ],
                "improvements": ["string"],
            },
        },
        ensure_ascii=False,
    )
    return system_prompt, user_prompt


async def generate_local_recommendations(analysis: dict[str, Any]) -> dict[str, Any]:
    fallback = _build_fallback_recommendations(analysis)
    system_prompt, user_prompt = _build_prompt(analysis)

    try:
        async with httpx.AsyncClient(timeout=OLLAMA_TIMEOUT_SECONDS) as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/chat",
                json={
                    "model": OLLAMA_MODEL,
                    "stream": False,
                    "format": "json",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                },
            )
            response.raise_for_status()
    except (httpx.HTTPError, ValueError, json.JSONDecodeError):
        return fallback

    message = response.json().get("message", {})
    content = message.get("content", "")
    parsed = _parse_json_payload(content)
    if not isinstance(parsed, dict):
        return fallback

    normalized = _normalize_recommendations(parsed)
    if not normalized["missing_keywords"] and not normalized["reformulations"] and not normalized["improvements"]:
        return fallback

    normalized["status"] = "ok"
    normalized["provider"] = "ollama"
    normalized["model"] = OLLAMA_MODEL
    return normalized