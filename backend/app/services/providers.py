from __future__ import annotations

import httpx

from app.core.config import get_settings


class ProviderUnavailable(RuntimeError):
    pass


async def fetch_odds_api_events() -> list[dict]:
    settings = get_settings()
    if not settings.odds_api_key:
        raise ProviderUnavailable("ODDS_API_KEY is not configured")
    url = f"https://api.the-odds-api.com/v4/sports/{settings.odds_api_sport_key}/odds/"
    params = {
        "apiKey": settings.odds_api_key,
        "regions": settings.odds_api_regions,
        "markets": "h2h,totals",
        "oddsFormat": "decimal",
        "dateFormat": "iso",
    }
    async with httpx.AsyncClient(timeout=12) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        return response.json()


async def fetch_newsapi_world_cup() -> list[dict]:
    settings = get_settings()
    if not settings.news_api_key:
        raise ProviderUnavailable("NEWS_API_KEY is not configured")
    params = {
        "apiKey": settings.news_api_key,
        "q": '"World Cup 2026" football injury squad odds',
        "language": "en",
        "sortBy": "publishedAt",
        "pageSize": 20,
    }
    async with httpx.AsyncClient(timeout=12) as client:
        response = await client.get("https://newsapi.org/v2/everything", params=params)
        response.raise_for_status()
        return response.json().get("articles", [])
