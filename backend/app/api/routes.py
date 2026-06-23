from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.config import get_settings
from app.data.loaders import load_all_fixtures, load_fixture_odds, load_fixtures, load_group_fixtures, load_teams
from app.services.bankroll import build_bankroll_challenge
from app.services.live_tracker import provider_status, refresh_local_caches
from app.services.news import latest_news
from app.services.odds import recommendations_for_fixture, top_recommendations
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
def fixtures(stage: str | None = None) -> list:
    if stage == "group":
        return load_group_fixtures()
    if stage == "knockout":
        return load_fixtures()
    return load_all_fixtures()


@router.get("/fixtures/group")
def group_fixtures() -> list:
    return load_group_fixtures()


@router.get("/predictions/match/{fixture_id}")
def match_prediction(fixture_id: str):
    fixture = next((item for item in load_all_fixtures() if item.id == fixture_id), None)
    if fixture is None:
        raise HTTPException(status_code=404, detail="Fixture not found")
    return predict_match(fixture)


@router.get("/predictions/group")
def group_predictions() -> list:
    return [predict_match(fixture) for fixture in load_group_fixtures()]


@router.get("/intelligence/match/{fixture_id}")
def match_intelligence(fixture_id: str) -> dict:
    fixture = next((item for item in load_all_fixtures() if item.id == fixture_id), None)
    if fixture is None:
        raise HTTPException(status_code=404, detail="Fixture not found")
    prediction = predict_match(fixture)
    return {
        "prediction": prediction,
        "odds": load_fixture_odds().get(fixture.id),
        "recommendations": recommendations_for_fixture(fixture),
        "news": [item for item in latest_news(limit=12) if fixture.home_team in item.team_ids or fixture.away_team in item.team_ids],
    }


@router.get("/odds")
def odds() -> list:
    return list(load_fixture_odds().values())


@router.get("/betting/recommendations")
def betting_recommendations(stage: str | None = None, limit: int = 12) -> list:
    return top_recommendations(limit=limit, stage=stage)


@router.get("/bankroll/challenge")
def bankroll_challenge():
    return build_bankroll_challenge()


@router.get("/news")
def news(team_id: str | None = None, limit: int = 8) -> list:
    return latest_news(limit=limit, team_id=team_id)


@router.get("/live/status")
def live_status():
    return provider_status()


@router.get("/simulation")
def simulation():
    return run_simulation(runs=get_settings().default_simulation_runs)


@router.post("/simulate")
def simulate(payload: SimulateRequest):
    return run_simulation(runs=payload.runs, seed=payload.seed)


@router.post("/refresh-data")
def refresh_data() -> dict:
    return refresh_local_caches()


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
            "Compare model probabilities to bookmaker implied probabilities to identify value candidates.",
            "Track news and provider-cache signals as explainability inputs, with seed fallbacks when API keys are missing.",
        ],
        "limitations": [
            "Seed bracket is scenario-based until the official knockout fixtures are known.",
            "Betting recommendations are analytics signals, not guarantees or financial advice.",
            "Squad, injury, odds, and climate adjustments depend on live provider coverage and API keys.",
            "The Poisson model is transparent but does not model in-match tactical state changes.",
        ],
    }
