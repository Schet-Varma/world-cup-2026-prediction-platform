from __future__ import annotations

from datetime import date
from math import exp

from app.models.domain import HistoricalMatch, Team


COMPETITION_WEIGHTS = {
    "World Cup": 2.25,
    "Continental Championship": 1.55,
    "Qualifier": 1.25,
    "Nations League": 1.0,
    "Friendly": 0.55,
}


def expected_score(rating_a: float, rating_b: float) -> float:
    return 1 / (1 + 10 ** ((rating_b - rating_a) / 400))


def match_outcome(home_goals: int, away_goals: int) -> float:
    if home_goals > away_goals:
        return 1.0
    if home_goals == away_goals:
        return 0.5
    return 0.0


def recency_weight(match_date: date, reference_date: date | None = None, half_life_days: int = 540) -> float:
    reference = reference_date or date(2026, 6, 1)
    age = max((reference - match_date).days, 0)
    return exp(-age / half_life_days)


def competition_weight(name: str) -> float:
    return COMPETITION_WEIGHTS.get(name, 0.85)


def dynamic_elo(teams: dict[str, Team], matches: list[HistoricalMatch]) -> dict[str, float]:
    ratings = {team_id: team.elo for team_id, team in teams.items()}
    for match in sorted(matches, key=lambda item: item.date):
        if match.home_team not in ratings or match.away_team not in ratings:
            continue
        home_rating = ratings[match.home_team]
        away_rating = ratings[match.away_team]
        k_factor = 22 * competition_weight(match.competition) * recency_weight(match.date)
        expected = expected_score(home_rating, away_rating)
        actual = match_outcome(match.home_goals, match.away_goals)
        delta = k_factor * (actual - expected)
        ratings[match.home_team] += delta
        ratings[match.away_team] -= delta
    return ratings


def recent_form_index(team_id: str, matches: list[HistoricalMatch]) -> float:
    weighted_points = 0.0
    weighted_possible = 0.0
    for match in matches:
        if team_id not in {match.home_team, match.away_team}:
            continue
        weight = recency_weight(match.date) * competition_weight(match.competition)
        if match.home_team == team_id:
            outcome = match_outcome(match.home_goals, match.away_goals)
        else:
            outcome = 1 - match_outcome(match.home_goals, match.away_goals)
        weighted_points += outcome * weight
        weighted_possible += weight
    if weighted_possible == 0:
        return 0.5
    return weighted_points / weighted_possible
