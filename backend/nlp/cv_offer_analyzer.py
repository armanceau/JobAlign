from __future__ import annotations

import re
from typing import Any

import spacy
from spacy.language import Language
from spacy.matcher import PhraseMatcher
from spacy.tokens import Doc


SPACED_LETTER_PATTERN = re.compile(
    r"(?<!\S)(?:[A-Za-zÀ-ÖØ-öø-ÿ]\s+){2,}[A-Za-zÀ-ÖØ-öø-ÿ](?=[\s\.,;:!?\"')\]]|$)"
)


HARD_SKILLS = [
    "python",
    "fastapi",
    "spacy",
    "scikit-learn",
    "pandas",
    "numpy",
    "sql",
    "postgresql",
    "postgres",
    "mongodb",
    "docker",
    "git",
    "linux",
    "javascript",
    "typescript",
    "react",
    "api rest",
    "rest api",
    "machine learning",
    "deep learning",
    "nlp",
    "data analysis",
    "power bi",
    "excel",
]

SOFT_SKILLS = [
    "communication",
    "communication orale",
    "communication écrite",
    "travail d'équipe",
    "esprit d'équipe",
    "autonomie",
    "adaptabilité",
    "rigueur",
    "curiosité",
    "leadership",
    "gestion du temps",
    "collaboration",
    "créativité",
    "sens de l'analyse",
    "résolution de problèmes",
]

LANGUAGES = [
    "français",
    "anglais",
    "espagnol",
    "allemand",
    "italien",
    "portugais",
    "néerlandais",
    "arabe",
    "chinois",
    "japonais",
]

DIPLOMAS = [
    "bac",
    "bac+2",
    "bac+3",
    "bac+5",
    "bts",
    "dut",
    "licence",
    "master",
    "master 2",
    "m1",
    "m2",
    "doctorat",
    "école d'ingénieur",
    "diplôme d'ingénieur",
    "titre d'ingénieur",
    "mba",
    "mastère",
    "certification",
]

EXPERIENCE_KEYWORDS = (
    "expérience",
    "expériences",
    "stage",
    "alternance",
    "mission",
    "missions",
    "poste",
    "fonction",
    "emploi",
)

Doc.set_extension("jobalign_analysis", default=None, force=True)


def _normalize_text(text: str) -> str:
    lines = []
    for line in text.splitlines():
        cleaned_chunks = []
        for chunk in re.split(r"\s{2,}", line):
            chunk = SPACED_LETTER_PATTERN.sub(lambda match: match.group(0).replace(" ", ""), chunk)
            chunk = re.sub(r"\s*[-–—]\s*", "-", chunk)
            chunk = re.sub(r"\s+", " ", chunk).strip()
            if chunk:
                cleaned_chunks.append(chunk)

        if cleaned_chunks:
            lines.append(" ".join(cleaned_chunks))
    return "\n".join(lines)


def _unique_preserving_order(values: list[str]) -> list[str]:
    seen = set()
    ordered = []
    for value in values:
        candidate = value.strip()
        key = candidate.lower()
        if candidate and key not in seen:
            seen.add(key)
            ordered.append(candidate)
    return ordered


def _build_matcher(nlp: Language) -> PhraseMatcher:
    matcher = PhraseMatcher(nlp.vocab, attr="LOWER")
    matcher.add("HARD_SKILL", [nlp.make_doc(item) for item in HARD_SKILLS])
    matcher.add("SOFT_SKILL", [nlp.make_doc(item) for item in SOFT_SKILLS])
    matcher.add("DIPLOMA", [nlp.make_doc(item) for item in DIPLOMAS])
    matcher.add("LANGUAGE", [nlp.make_doc(item) for item in LANGUAGES])
    return matcher


def build_nlp_pipeline() -> Language:
    nlp = spacy.blank("fr")
    if "sentencizer" not in nlp.pipe_names:
        nlp.add_pipe("sentencizer")

    matcher = _build_matcher(nlp)

    @Language.component("jobalign_feature_extractor")
    def jobalign_feature_extractor(doc: Doc) -> Doc:
        matches_by_label: dict[str, list[str]] = {
            "hard_skills": [],
            "soft_skills": [],
            "diplomas": [],
            "languages": [],
        }
        entities: list[dict[str, Any]] = []

        for match_id, start, end in matcher(doc):
            label = nlp.vocab.strings[match_id]
            span = doc[start:end]
            normalized_text = span.text.strip()
            if not normalized_text:
                continue

            if label == "HARD_SKILL":
                matches_by_label["hard_skills"].append(normalized_text)
            elif label == "SOFT_SKILL":
                matches_by_label["soft_skills"].append(normalized_text)
            elif label == "DIPLOMA":
                matches_by_label["diplomas"].append(normalized_text)
            elif label == "LANGUAGE":
                matches_by_label["languages"].append(normalized_text)

            entities.append(
                {
                    "label": label,
                    "text": normalized_text,
                    "start": span.start_char,
                    "end": span.end_char,
                }
            )

        experience_snippets: list[dict[str, Any]] = []
        for sentence in doc.sents:
            sentence_text = sentence.text.strip()
            lowered = sentence_text.lower()
            if not sentence_text:
                continue

            years_match = re.search(r"(\d{1,2})\s*(?:\+\s*)?(?:ans?|years?)\s*(?:d['’]?)?(?:exp[ée]rience)?", lowered)
            has_experience_keyword = any(keyword in lowered for keyword in EXPERIENCE_KEYWORDS)

            if years_match or has_experience_keyword:
                item = {"text": sentence_text}
                if years_match:
                    item["years"] = int(years_match.group(1))
                experience_snippets.append(item)

        analysis = {
            "hard_skills": _unique_preserving_order(matches_by_label["hard_skills"]),
            "soft_skills": _unique_preserving_order(matches_by_label["soft_skills"]),
            "diplomas": _unique_preserving_order(matches_by_label["diplomas"]),
            "languages": _unique_preserving_order(matches_by_label["languages"]),
            "experiences": experience_snippets,
            "entities": entities,
        }
        doc._.jobalign_analysis = analysis
        return doc

    nlp.add_pipe("jobalign_feature_extractor")
    return nlp


NLP_PIPELINE = build_nlp_pipeline()


def analyze_text(text: str) -> dict[str, Any]:
    normalized_text = _normalize_text(text)
    if not normalized_text:
        return {
            "hard_skills": [],
            "soft_skills": [],
            "diplomas": [],
            "languages": [],
            "experiences": [],
            "entities": [],
        }

    doc = NLP_PIPELINE(normalized_text)
    return doc._.jobalign_analysis


def analyze_cv_and_offer(cv_text: str, offer_text: str) -> dict[str, Any]:
    cv_analysis = analyze_text(cv_text)
    offer_analysis = analyze_text(offer_text)

    return {
        "cv": cv_analysis,
        "offer": offer_analysis,
        "summary": {
            "shared_hard_skills": sorted(
                set(cv_analysis["hard_skills"]) & set(offer_analysis["hard_skills"])
            ),
            "shared_soft_skills": sorted(
                set(cv_analysis["soft_skills"]) & set(offer_analysis["soft_skills"])
            ),
            "shared_diplomas": sorted(
                set(cv_analysis["diplomas"]) & set(offer_analysis["diplomas"])
            ),
            "shared_languages": sorted(
                set(cv_analysis["languages"]) & set(offer_analysis["languages"])
            ),
        },
    }
