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

    @property
    def seed_dir(self) -> Path:
        return self.data_dir / "seed"


@lru_cache
def get_settings() -> Settings:
    return Settings()
