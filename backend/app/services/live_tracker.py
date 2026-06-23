from __future__ import annotations

from datetime import UTC, datetime

from app.core.config import get_settings
from app.data.loaders import load_fixture_odds, load_fixtures, load_group_fixtures, load_news_items, load_teams
from app.models.domain import LiveDataStatus


def provider_status() -> LiveDataStatus:
    settings = get_settings()
    configured = []
    if settings.football_data_api_key:
        configured.append("football-data.org")
    if settings.api_football_key:
        configured.append("API-Football")
    if settings.odds_api_key:
        configured.append("The Odds API")
    if settings.news_api_key:
        configured.append("NewsAPI")

    fallback_mode = len(configured) == 0
    notes = [
        "Seed fixtures, odds, and news are used whenever provider keys are absent or a provider call fails.",
        "POST /refresh-data clears local caches so the next request can ingest fresh provider/cache data.",
        "A production deployment should call /refresh-data from a scheduler every 15-30 minutes during match windows.",
    ]
    if fallback_mode:
        notes.append("No live provider keys are configured, so recommendations are demo analytics rather than live prices.")

    return LiveDataStatus(
        results_provider="football-data.org/API-Football" if settings.football_data_api_key or settings.api_football_key else "seed results",
        odds_provider="The Odds API" if settings.odds_api_key else "seed odds",
        news_provider="NewsAPI" if settings.news_api_key else "seed news",
        configured_providers=configured,
        fallback_mode=fallback_mode,
        cache_ttl_minutes=settings.live_cache_ttl_minutes,
        last_refresh=datetime.now(UTC).isoformat(),
        notes=notes,
    )


def refresh_local_caches() -> dict:
    load_teams.cache_clear()
    load_fixtures.cache_clear()
    load_group_fixtures.cache_clear()
    load_fixture_odds.cache_clear()
    load_news_items.cache_clear()
    return {
        "status": "refreshed",
        "source": "provider-cache" if not provider_status().fallback_mode else "seed-cache",
        "providers": provider_status().configured_providers,
    }
