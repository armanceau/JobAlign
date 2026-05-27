from __future__ import annotations

import os
import re

import httpx

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
OLLAMA_TIMEOUT_SECONDS = float(os.getenv("OLLAMA_TIMEOUT_SECONDS", "60"))
OLLAMA_LETTER_MODEL = os.getenv("OLLAMA_LETTER_MODEL", os.getenv("OLLAMA_MODEL", "qwen3.5"))


def _normalize_spaces(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _truncate(text: str, limit: int = 4500) -> str:
    cleaned = _normalize_spaces(text)
    if len(cleaned) <= limit:
        return cleaned
    return cleaned[: limit - 3].rstrip() + "..."


def _fallback_letter(
    cv_text: str,
    offer_text: str,
    company_name: str | None,
    candidate_name: str | None,
) -> str:
    company = (company_name or "votre entreprise").strip() or "votre entreprise"
    candidate = (candidate_name or "Madame, Monsieur").strip() or "Madame, Monsieur"

    cv_focus = _truncate(cv_text, 400)
    offer_focus = _truncate(offer_text, 400)

    return (
        f"{candidate},\n\n"
        f"Je vous adresse ma candidature pour le poste proposé au sein de {company}. "
        "Mon parcours et mes compétences sont en cohérence avec les missions décrites dans votre offre.\n\n"
        "J'ai développé une expérience concrète qui me permet de contribuer rapidement, "
        "notamment sur les volets techniques et collaboratifs attendus. "
        "Je veille à adapter mon travail aux besoins métier tout en conservant un haut niveau de qualité.\n\n"
        "Je suis particulièrement motivé(e) par l'opportunité d'évoluer dans votre environnement "
        "et de participer aux objectifs de l'équipe. Je serais ravi(e) d'échanger avec vous "
        "pour détailler ma contribution potentielle.\n\n"
        "Cordialement,\n"
        "[Signature]\n\n"
        f"Référence CV (résumé): {cv_focus}\n"
        f"Référence offre (résumé): {offer_focus}"
    )


async def generate_motivation_letter(
    cv_text: str,
    offer_text: str,
    company_name: str | None = None,
    candidate_name: str | None = None,
    tone: str = "professionnel",
) -> dict[str, str]:
    fallback = _fallback_letter(cv_text, offer_text, company_name, candidate_name)

    system_prompt = (
        "Tu es un recruteur senior francophone. "
        "Tu rédiges des lettres de motivation crédibles, précises et adaptées au poste. "
        "N'invente pas de diplôme, d'entreprise ou d'expérience non présents dans le CV."
    )

    company = (company_name or "").strip()
    candidate = (candidate_name or "").strip()

    user_prompt = (
        "Rédige une lettre de motivation en français (entre 180 et 260 mots), "
        f"avec un ton {tone}.\n"
        "Contraintes:\n"
        "- 4 paragraphes max\n"
        "- claire, orientée impact\n"
        "- cohérente avec l'offre\n"
        "- ne pas ajouter d'informations non présentes dans le CV\n"
        "- termine par une formule de politesse simple\n\n"
        f"Nom du candidat (optionnel): {candidate or 'non fourni'}\n"
        f"Entreprise ciblée (optionnel): {company or 'non fournie'}\n\n"
        f"CV:\n{_truncate(cv_text)}\n\n"
        f"Offre:\n{_truncate(offer_text)}"
    )

    try:
        async with httpx.AsyncClient(timeout=OLLAMA_TIMEOUT_SECONDS) as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/chat",
                json={
                    "model": OLLAMA_LETTER_MODEL,
                    "stream": False,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                },
            )
            response.raise_for_status()
            content = response.json().get("message", {}).get("content", "")

            if not isinstance(content, str) or not content.strip():
                raise ValueError("Empty response")

            return {
                "provider": "ollama",
                "model": OLLAMA_LETTER_MODEL,
                "status": "ok",
                "letter": content.strip(),
            }
    except Exception:
        return {
            "provider": "ollama",
            "model": OLLAMA_LETTER_MODEL,
            "status": "fallback",
            "letter": fallback,
        }
