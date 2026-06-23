# World Cup 2026 Prediction Platform

Production-minded MVP for explainable World Cup 2026 knockout predictions.

## What It Does

- Predicts knockout fixture scorelines with an Elo plus Poisson model.
- Shows win, draw, upset, and advancement probabilities.
- Runs Monte Carlo tournament simulations.
- Provides FastAPI endpoints for teams, fixtures, match predictions, simulations, and model explanations.
- Includes a Next.js analytics UI scaffold for home, bracket, match, team, and methodology views.
- Uses local seed data so the app works without third-party API keys.

## Repository Layout

```text
backend/      FastAPI service, model code, tests
frontend/     Next.js TypeScript application
data/         raw, processed, cache, and seed datasets
docs/         architecture, API options, and deployment notes
scripts/      local utility scripts
```

## Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest
uvicorn app.main:app --reload
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000` for local development.

## Key Endpoints

- `GET /health`
- `GET /teams`
- `GET /fixtures`
- `GET /predictions/match/{id}`
- `GET /simulation`
- `POST /simulate`
- `POST /refresh-data`
- `GET /model-explanation`

## Current Status

This repository contains the first working MVP foundation: deterministic seed data, explainable prediction services, API routes, UI scaffold, tests, Docker assets, and CI configuration. The bracket is a scenario dataset because the official Round of 32 will not be known until the 2026 group stage ends.
