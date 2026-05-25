import nlp.cv_offer_analyzer as analyzer


def test_analyze_text_extracts_categories():
    text = (
        "Ingénieur logiciel avec 5 ans d'expérience en Python, FastAPI et Docker. "
        "Travail d'équipe, autonomie et rigueur. Master en informatique."
    )

    result = analyzer.analyze_text(text)

    assert result["hard_skills"] == ["Python", "FastAPI", "Docker"]
    assert result["soft_skills"] == ["Travail d'équipe", "autonomie", "rigueur"]
    assert result["diplomas"] == ["Master"]
    assert result["experiences"] == [
        {"text": "Ingénieur logiciel avec 5 ans d'expérience en Python, FastAPI et Docker.", "years": 5}
    ]
    assert any(entity["label"] == "HARD_SKILL" for entity in result["entities"])


def test_analyze_text_recovers_spaced_letters():
    text = (
        "D é v e l o p p e u r  f u l l - s t a c k avec 3 ans d'expérience en P y t h o n et D o c k e r. "
        "M a s t e r en informatique."
    )

    result = analyzer.analyze_text(text)

    assert result["hard_skills"] == ["Python", "Docker"]
    assert result["diplomas"] == ["Master"]
    assert result["experiences"] == [
        {"text": "Développeur full-stack avec 3 ans d'expérience en Python et Docker.", "years": 3}
    ]


def test_analyze_cv_and_offer_returns_shared_summary():
    cv_text = (
        "Développeur Python. 5 ans d'expérience en FastAPI et Docker. "
        "Autonomie et esprit d'équipe. Master en informatique."
    )
    offer_text = (
        "Nous recherchons un développeur Python avec 3 ans d'expérience. "
        "Esprit d'équipe, rigueur. Bac+5 exigé. Docker apprécié."
    )

    result = analyzer.analyze_cv_and_offer(cv_text, offer_text)

    assert result["cv"]["hard_skills"] == ["Python", "FastAPI", "Docker"]
    assert result["offer"]["hard_skills"] == ["Python", "Docker"]
    assert result["summary"]["shared_hard_skills"] == ["Docker", "Python"]
    assert result["summary"]["shared_diplomas"] == []
