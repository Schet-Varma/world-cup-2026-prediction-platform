from functools import lru_cache
from pathlib import Path
from pydantic import BaseModel
import os


class Settings(BaseModel):
    app_name: str = "World Cup 2026 Prediction Platform"
    app_env: str = os.getenv("APP_ENV", "development")
    default_simulation_runs: int = int(os.getenv("SIMULATION_DEFAULT_RUNS", "5000"))
    max_scoreline_goals: int = 6
    data_dir: Path = Path(os.getenv("DATA_DIR", Path(__file__).resolve().parents[3] / "data"))
    odds_api_key: str | None = os.getenv("ODDS_API_KEY")
    odds_api_sport_key: str = os.getenv("ODDS_API_SPORT_KEY", "soccer_fifa_world_cup")
    odds_api_regions: str = os.getenv("ODDS_API_REGIONS", "us,uk,au,eu")
    football_data_api_key: str | None = os.getenv("FOOTBALL_DATA_API_KEY")
    api_football_key: str | None = os.getenv("API_FOOTBALL_KEY")
    news_api_key: str | None = os.getenv("NEWS_API_KEY")
    live_cache_ttl_minutes: int = int(os.getenv("LIVE_CACHE_TTL_MINUTES", "30"))

    @property
    def seed_dir(self) -> Path:
        return self.data_dir / "seed"


@lru_cache
def get_settings() -> Settings:
    return Settings()
