from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.config import get_settings
from app.data.loaders import load_fixtures, load_teams
from app.services.prediction import predict_match
from app.services.simulation import run_simulation

router = APIRouter()


class SimulateRequest(BaseModel):
    runs: int = Field(default=5000, ge=100, le=100000)
    seed: int = 2026


@router.get("/health")
def health() -> dict:
    return {"status": "ok", "environment": get_settings().app_env}


@router.get("/teams")
def teams() -> list:
    return list(load_teams().values())


@router.get("/fixtures")
def fixtures() -> list:
    return load_fixtures()


@router.get("/predictions/match/{fixture_id}")
def match_prediction(fixture_id: str):
    fixture = next((item for item in load_fixtures() if item.id == fixture_id), None)
    if fixture is None:
        raise HTTPException(status_code=404, detail="Fixture not found")
    return predict_match(fixture)


@router.get("/simulation")
def simulation():
    return run_simulation(runs=get_settings().default_simulation_runs)


@router.post("/simulate")
def simulate(payload: SimulateRequest):
    return run_simulation(runs=payload.runs, seed=payload.seed)


@router.post("/refresh-data")
def refresh_data() -> dict:
    load_teams.cache_clear()
    load_fixtures.cache_clear()
    return {"status": "refreshed", "source": "seed-cache"}


@router.get("/model-explanation")
def model_explanation() -> dict:
    return {
        "model": "Hybrid Elo, recency-weighted form, and Poisson score model",
        "steps": [
            "Update team Elo from historical results with competition and recency weights.",
            "Estimate expected goals from attack, defense, Elo difference, and recent form.",
            "Generate a normalized 0-0 through 6-6 scoreline matrix with Poisson probabilities.",
            "Resolve knockout draws with a strength-weighted penalty shootout assumption.",
            "Aggregate advancement and champion rates through Monte Carlo simulation.",
        ],
        "limitations": [
            "Seed bracket is scenario-based until the official knockout fixtures are known.",
            "Squad, injury, and climate adjustments are architecture hooks in the MVP.",
            "The Poisson model is transparent but does not model in-match tactical state changes.",
        ],
    }
