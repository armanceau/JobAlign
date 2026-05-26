import asyncio

import httpx

import services.ollama_recommender as ollama_recommender


class FakeResponse:
    def __init__(self, payload, status_code=200):
        self._payload = payload
        self.status_code = status_code

    def raise_for_status(self):
        if self.status_code >= 400:
            raise RuntimeError("HTTP error")

    def json(self):
        return self._payload


class FakeAsyncClient:
    def __init__(self, timeout):
        self.timeout = timeout

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    async def post(self, url, json):
        assert url.endswith("/api/chat")
        assert json["model"] == ollama_recommender.OLLAMA_MODEL
        return FakeResponse(
            {
                "message": {
                    "content": (
                        '{"summary":"Priorisez les mots-clés métiers.",'
                        '"missing_keywords":["FastAPI","Docker"],'
                        '"reformulations":[{"before":"Résumé faible","after":"Résumé orienté produit","reason":"Mieux aligné"}],'
                        '"improvements":["Mettre en avant les projets récents."]}'
                    )
                }
            }
        )


def test_generate_local_recommendations_parses_ollama_json(monkeypatch):
    monkeypatch.setattr(ollama_recommender.httpx, "AsyncClient", FakeAsyncClient)

    analysis = {
        "cv": {"hard_skills": ["Python"], "soft_skills": [], "diplomas": [], "languages": [], "experiences": []},
        "offer": {"hard_skills": ["Python", "FastAPI", "Docker"], "soft_skills": [], "diplomas": [], "languages": [], "experiences": []},
        "summary": {"shared_hard_skills": ["Python"], "shared_soft_skills": [], "shared_diplomas": [], "shared_languages": []},
        "matching": {"global_score_percent": 50, "subscores": {}},
        "cv_text": "CV",
        "offer_text": "Offre",
    }

    result = asyncio.run(ollama_recommender.generate_local_recommendations(analysis))

    assert result["status"] == "ok"
    assert result["provider"] == "ollama"
    assert result["missing_keywords"] == ["FastAPI", "Docker"]
    assert result["reformulations"][0]["after"] == "Résumé orienté produit"


def test_generate_local_recommendations_falls_back_on_http_error(monkeypatch):
    class FailingAsyncClient(FakeAsyncClient):
        async def post(self, url, json):
            raise httpx.ConnectError(
                "ollama unavailable",
                request=httpx.Request("POST", url),
            )

    monkeypatch.setattr(ollama_recommender.httpx, "AsyncClient", FailingAsyncClient)

    analysis = {
        "cv": {"hard_skills": ["Python"], "soft_skills": [], "diplomas": [], "languages": [], "experiences": []},
        "offer": {"hard_skills": ["Python", "FastAPI"], "soft_skills": [], "diplomas": [], "languages": [], "experiences": []},
        "summary": {"shared_hard_skills": ["Python"], "shared_soft_skills": [], "shared_diplomas": [], "shared_languages": []},
        "matching": {"global_score_percent": 50, "subscores": {}},
        "cv_text": "CV",
        "offer_text": "Offre",
    }

    result = asyncio.run(ollama_recommender.generate_local_recommendations(analysis))

    assert result["status"] == "fallback"
    assert "FastAPI" in result["missing_keywords"]