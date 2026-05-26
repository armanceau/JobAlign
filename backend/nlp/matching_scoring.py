from __future__ import annotations

from typing import Any


CATEGORY_WEIGHTS = {
    "technical_skills": 40,
    "experience": 25,
    "education": 15,
    "soft_skills": 10,
    "language": 10,
}

_DIPLOMA_RANKS = {
    "bac": 1,
    "bac+2": 2,
    "bts": 2,
    "dut": 2,
    "bac+3": 3,
    "licence": 3,
    "bac+5": 5,
    "master": 5,
    "master 2": 5,
    "m1": 5,
    "m2": 5,
    "mba": 5,
    "mastère": 5,
    "mastere": 5,
    "école d'ingénieur": 5,
    "diplôme d'ingénieur": 5,
    "titre d'ingénieur": 5,
    "doctorat": 8,
}


def _normalize(value: str) -> str:
    return value.strip().lower()


def _unique_lower(values: list[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for value in values:
        cleaned = value.strip()
        key = cleaned.lower()
        if cleaned and key not in seen:
            seen.add(key)
            ordered.append(cleaned)
    return ordered


def _build_match_details(cv_items: list[str], offer_items: list[str]) -> dict[str, Any]:
    cv_lookup = {_normalize(item): item for item in cv_items}
    offer_unique = _unique_lower(offer_items)
    matched = [item for item in offer_unique if _normalize(item) in cv_lookup]
    missing = [item for item in offer_unique if _normalize(item) not in cv_lookup]
    return {
        "matched_items": matched,
        "missing_items": missing,
        "required_count": len(offer_unique),
        "matched_count": len(matched),
    }


def _score_from_ratio(matched_count: int, required_count: int) -> float:
    if required_count <= 0:
        return 100.0
    return round(min((matched_count / required_count) * 100, 100), 2)


def _best_years(experiences: list[dict[str, Any]]) -> int:
    years = [int(item["years"]) for item in experiences if isinstance(item.get("years"), int)]
    return max(years, default=0)


def _best_diploma_rank(values: list[str]) -> int:
    best_rank = 0
    for value in values:
        normalized = _normalize(value)
        if normalized.startswith("bac+"):
            try:
                best_rank = max(best_rank, int(normalized.split("+", 1)[1]))
            except ValueError:
                pass
        for diploma, rank in _DIPLOMA_RANKS.items():
            if diploma in normalized:
                best_rank = max(best_rank, rank)
    return best_rank


def _score_technical_skills(cv_analysis: dict[str, Any], offer_analysis: dict[str, Any]) -> dict[str, Any]:
    details = _build_match_details(cv_analysis["hard_skills"], offer_analysis["hard_skills"])
    required = details["required_count"]
    score = _score_from_ratio(details["matched_count"], required) if required else 100.0
    missing_text = ", ".join(details["missing_items"]) if details["missing_items"] else "aucune"
    matched_text = ", ".join(details["matched_items"]) if details["matched_items"] else "aucune"
    justification = (
        "Aucune compétence technique explicite détectée dans l'offre. "
        if required == 0
        else f"{details['matched_count']}/{required} compétences techniques requises trouvées: {matched_text}. "
        f"Manquantes: {missing_text}."
    )
    return {
        "score_percent": score,
        "weight": CATEGORY_WEIGHTS["technical_skills"] if required else 0,
        "required_count": required,
        "matched_count": details["matched_count"],
        "required_items": _unique_lower(offer_analysis["hard_skills"]),
        "matched_items": details["matched_items"],
        "missing_items": details["missing_items"],
        "justification": justification,
    }


def _score_soft_skills(cv_analysis: dict[str, Any], offer_analysis: dict[str, Any]) -> dict[str, Any]:
    details = _build_match_details(cv_analysis["soft_skills"], offer_analysis["soft_skills"])
    required = details["required_count"]
    score = _score_from_ratio(details["matched_count"], required) if required else 100.0
    missing_text = ", ".join(details["missing_items"]) if details["missing_items"] else "aucune"
    matched_text = ", ".join(details["matched_items"]) if details["matched_items"] else "aucune"
    justification = (
        "Aucune soft skill explicite détectée dans l'offre. "
        if required == 0
        else f"{details['matched_count']}/{required} soft skills requises trouvées: {matched_text}. "
        f"Manquantes: {missing_text}."
    )
    return {
        "score_percent": score,
        "weight": CATEGORY_WEIGHTS["soft_skills"] if required else 0,
        "required_count": required,
        "matched_count": details["matched_count"],
        "required_items": _unique_lower(offer_analysis["soft_skills"]),
        "matched_items": details["matched_items"],
        "missing_items": details["missing_items"],
        "justification": justification,
    }


def _score_experience(cv_analysis: dict[str, Any], offer_analysis: dict[str, Any]) -> dict[str, Any]:
    cv_years = _best_years(cv_analysis["experiences"])
    offer_years = _best_years(offer_analysis["experiences"])
    offer_has_experience_focus = bool(offer_years or offer_analysis["experiences"])

    if offer_has_experience_focus:
        if offer_years > 0:
            score = round(min((cv_years / offer_years) * 100, 100), 2) if cv_years > 0 else 0.0
            justification = (
                f"Expérience détectée dans le CV: {cv_years} an(s). "
                f"Attente principale de l'offre: {offer_years} an(s)."
            )
        else:
            score = 100.0 if cv_analysis["experiences"] else 0.0
            justification = (
                "L'offre mentionne une expérience sans préciser de durée. "
                f"Le CV contient {len(cv_analysis['experiences'])} repère(s) d'expérience."
            )
        weight = CATEGORY_WEIGHTS["experience"]
    else:
        score = 100.0
        weight = 0
        justification = "Aucune exigence d'expérience explicite détectée dans l'offre."

    return {
        "score_percent": score,
        "weight": weight,
        "required_years": offer_years,
        "cv_years": cv_years,
        "required_count": 1 if offer_has_experience_focus else 0,
        "matched_count": 1 if offer_has_experience_focus and cv_years >= offer_years and (offer_years > 0 or cv_analysis["experiences"]) else 0,
        "required_items": [f"{offer_years} an(s)" if offer_years > 0 else "expérience" ] if offer_has_experience_focus else [],
        "matched_items": [f"{cv_years} an(s)" if cv_years > 0 else "expérience détectée"] if cv_analysis["experiences"] else [],
        "missing_items": [] if score >= 100 else ["expérience suffisante"],
        "justification": justification,
    }


def _score_education(cv_analysis: dict[str, Any], offer_analysis: dict[str, Any]) -> dict[str, Any]:
    cv_rank = _best_diploma_rank(cv_analysis["diplomas"])
    offer_rank = _best_diploma_rank(offer_analysis["diplomas"])
    offer_has_requirement = bool(offer_analysis["diplomas"])

    if offer_has_requirement:
        score = round(min((cv_rank / offer_rank) * 100, 100), 2) if offer_rank > 0 and cv_rank > 0 else 0.0
        matched_items = cv_analysis["diplomas"] if cv_rank >= offer_rank and cv_analysis["diplomas"] else []
        missing_items = [] if matched_items else offer_analysis["diplomas"]
        justification = (
            f"Diplôme attendu le plus élevé: {offer_analysis['diplomas'][0]}. "
            f"Niveau détecté dans le CV: {cv_analysis['diplomas'][0] if cv_analysis['diplomas'] else 'aucun'}."
        )
        weight = CATEGORY_WEIGHTS["education"]
    else:
        score = 100.0
        matched_items = cv_analysis["diplomas"]
        missing_items = []
        justification = "Aucune exigence de formation explicite détectée dans l'offre."
        weight = 0

    return {
        "score_percent": score,
        "weight": weight,
        "required_count": 1 if offer_has_requirement else 0,
        "matched_count": 1 if offer_has_requirement and score >= 100 else 0,
        "required_items": offer_analysis["diplomas"],
        "matched_items": matched_items,
        "missing_items": missing_items,
        "cv_rank": cv_rank,
        "required_rank": offer_rank,
        "justification": justification,
    }


def _score_language(cv_analysis: dict[str, Any], offer_analysis: dict[str, Any]) -> dict[str, Any]:
    details = _build_match_details(cv_analysis["languages"], offer_analysis["languages"])
    required = details["required_count"]
    score = _score_from_ratio(details["matched_count"], required) if required else 100.0
    missing_text = ", ".join(details["missing_items"]) if details["missing_items"] else "aucune"
    matched_text = ", ".join(details["matched_items"]) if details["matched_items"] else "aucune"
    justification = (
        "Aucune exigence linguistique explicite détectée dans l'offre. "
        if required == 0
        else f"{details['matched_count']}/{required} langue(s) requise(s) trouvée(s): {matched_text}. "
        f"Manquantes: {missing_text}."
    )
    return {
        "score_percent": score,
        "weight": CATEGORY_WEIGHTS["language"] if required else 0,
        "required_count": required,
        "matched_count": details["matched_count"],
        "required_items": _unique_lower(offer_analysis["languages"]),
        "matched_items": details["matched_items"],
        "missing_items": details["missing_items"],
        "justification": justification,
    }


def compute_matching_score(cv_analysis: dict[str, Any], offer_analysis: dict[str, Any]) -> dict[str, Any]:
    subscores = {
        "technical_skills": _score_technical_skills(cv_analysis, offer_analysis),
        "experience": _score_experience(cv_analysis, offer_analysis),
        "education": _score_education(cv_analysis, offer_analysis),
        "soft_skills": _score_soft_skills(cv_analysis, offer_analysis),
        "language": _score_language(cv_analysis, offer_analysis),
    }

    weighted_points = 0.0
    total_weight = 0
    for result in subscores.values():
        weight = int(result["weight"])
        weighted_points += float(result["score_percent"]) * weight
        total_weight += weight

    if total_weight > 0:
        global_score = round(weighted_points / total_weight, 2)
    else:
        global_score = 100.0

    justifications = [
        f"Compétences techniques: {subscores['technical_skills']['justification']}",
        f"Expérience: {subscores['experience']['justification']}",
        f"Formation: {subscores['education']['justification']}",
        f"Soft skills: {subscores['soft_skills']['justification']}",
        f"Langage: {subscores['language']['justification']}",
        (
            f"Score global déterministe: {global_score:.2f}% sur la base de {total_weight} point(s) de pondération."
            if total_weight > 0
            else "Score global déterministe: 100.00% car aucune exigence explicite n'a été détectée dans l'offre."
        ),
    ]

    return {
        "method": "deterministic_rule_based",
        "global_score_percent": global_score,
        "subscores": subscores,
        "justifications": justifications,
    }