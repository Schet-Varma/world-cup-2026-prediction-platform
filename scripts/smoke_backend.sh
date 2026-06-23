#!/usr/bin/env bash
set -euo pipefail

PYTHONPATH=backend backend/.venv/bin/python - <<'PY'
from app.data.loaders import load_fixtures
from app.services.prediction import predict_match
from app.services.simulation import run_simulation

prediction = predict_match(load_fixtures()[0])
simulation = run_simulation(runs=100, seed=2026)

print({
    "fixture": prediction.fixture.id,
    "score": prediction.most_likely_score,
    "teams": len(simulation.teams),
    "leader": simulation.teams[0].team_name,
})
PY
