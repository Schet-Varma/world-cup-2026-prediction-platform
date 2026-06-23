import json
from functools import lru_cache
from pathlib import Path

from app.core.config import get_settings
from app.models.domain import Fixture, HistoricalMatch, Team


def _read_json(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


@lru_cache
def load_teams() -> dict[str, Team]:
    rows = _read_json(get_settings().seed_dir / "teams.json")
    return {row["id"]: Team(**row) for row in rows}


@lru_cache
def load_fixtures() -> list[Fixture]:
    rows = _read_json(get_settings().seed_dir / "fixtures.json")
    return [Fixture(**row) for row in rows]


@lru_cache
def load_historical_matches() -> list[HistoricalMatch]:
    rows = _read_json(get_settings().seed_dir / "historical_matches.json")
    return [HistoricalMatch(**row) for row in rows]
