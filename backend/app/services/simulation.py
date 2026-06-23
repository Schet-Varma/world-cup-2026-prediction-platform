from __future__ import annotations

import random
from collections import defaultdict

from app.data.loaders import load_fixtures, load_teams
from app.models.domain import Fixture, SimulationResult, TeamSimulationResult
from app.services.prediction import predict_match


def _sample_winner(fixture: Fixture, rng: random.Random) -> str:
    prediction = predict_match(fixture)
    home = prediction.fixture.home_team
    away = prediction.fixture.away_team
    draw_split = prediction.home_team.elo / (prediction.home_team.elo + prediction.away_team.elo)
    home_probability = prediction.home_win_probability + prediction.draw_probability * draw_split
    return home if rng.random() <= home_probability else away


def _build_next_round(round_name: str, winners: list[str]) -> list[Fixture]:
    return [
        Fixture(
            id=f"{round_name.lower().replace(' ', '-')}-{index + 1}",
            round=round_name,
            home_team=winners[index],
            away_team=winners[index + 1],
            venue="TBD",
            kickoff_local="TBD",
        )
        for index in range(0, len(winners), 2)
    ]


def run_simulation(runs: int = 5000, seed: int = 2026) -> SimulationResult:
    teams = load_teams()
    opening_fixtures = load_fixtures()
    counters: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    rng = random.Random(seed)

    for _ in range(runs):
        round32_winners = [_sample_winner(fixture, rng) for fixture in opening_fixtures]
        for team_id in round32_winners:
            counters[team_id]["round_advancement"] += 1

        quarter_fixtures = _build_next_round("Round of 16", round32_winners)
        quarter_winners = [_sample_winner(fixture, rng) for fixture in quarter_fixtures]
        for team_id in quarter_winners:
            counters[team_id]["quarter"] += 1

        semi_fixtures = _build_next_round("Quarter-final", quarter_winners)
        semi_winners = [_sample_winner(fixture, rng) for fixture in semi_fixtures]
        for team_id in semi_winners:
            counters[team_id]["semi"] += 1

        final_fixtures = _build_next_round("Semi-final", semi_winners)
        finalists = [_sample_winner(fixture, rng) for fixture in final_fixtures]
        for team_id in finalists:
            counters[team_id]["final"] += 1

        champion = _sample_winner(
            Fixture(
                id="final",
                round="Final",
                home_team=finalists[0],
                away_team=finalists[1],
                venue="MetLife Stadium",
                kickoff_local="2026-07-19T15:00:00-04:00",
            ),
            rng,
        )
        counters[champion]["champion"] += 1

    rows = []
    for team_id, team in teams.items():
        row = counters[team_id]
        rows.append(
            TeamSimulationResult(
                team_id=team_id,
                team_name=team.name,
                champion_probability=row["champion"] / runs,
                final_probability=row["final"] / runs,
                semi_final_probability=row["semi"] / runs,
                quarter_final_probability=row["quarter"] / runs,
                round_advancement_probability=row["round_advancement"] / runs,
            )
        )
    rows.sort(key=lambda item: item.champion_probability, reverse=True)
    return SimulationResult(runs=runs, teams=rows)
