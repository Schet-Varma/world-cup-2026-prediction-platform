from __future__ import annotations

from app.core.config import get_settings
from app.data.loaders import load_historical_matches, load_teams
from app.models.domain import Fixture, MatchPrediction, ScorelineProbability
from app.services.elo import dynamic_elo, recent_form_index
from app.services.poisson import score_matrix, summarize_score_matrix


def expected_goals(home_team_id: str, away_team_id: str) -> tuple[float, float, list[str]]:
    teams = load_teams()
    matches = load_historical_matches()
    ratings = dynamic_elo(teams, matches)
    home = teams[home_team_id]
    away = teams[away_team_id]
    home_rating = ratings[home_team_id]
    away_rating = ratings[away_team_id]
    home_form = recent_form_index(home_team_id, matches)
    away_form = recent_form_index(away_team_id, matches)
    elo_delta = (home_rating - away_rating) / 400
    form_delta = home_form - away_form

    base_goals = 1.32
    home_xg = base_goals * home.attack / away.defense
    away_xg = base_goals * away.attack / home.defense
    home_xg *= 1 + (0.18 * elo_delta) + (0.16 * form_delta)
    away_xg *= 1 - (0.18 * elo_delta) - (0.16 * form_delta)
    home_xg = max(0.25, min(home_xg, 3.4))
    away_xg = max(0.25, min(away_xg, 3.4))

    explanation = [
        f"{home.name} Elo projection is {home_rating:.0f} versus {away.name} at {away_rating:.0f}.",
        f"Recent-form index is {home_form:.2f} for {home.name} and {away_form:.2f} for {away.name}.",
        "Expected goals combine attack strength, opponent defense, Elo difference, and recency-weighted form.",
        "Fixture is treated as neutral venue unless a future provider marks a home advantage.",
    ]
    return home_xg, away_xg, explanation


def predict_match(fixture: Fixture) -> MatchPrediction:
    teams = load_teams()
    home_xg, away_xg, explanation = expected_goals(fixture.home_team, fixture.away_team)
    matrix = score_matrix(home_xg, away_xg, get_settings().max_scoreline_goals)
    summary = summarize_score_matrix(matrix)
    top = sorted(matrix, key=lambda row: row["probability"], reverse=True)[:5]
    top_scorelines = [ScorelineProbability(**row) for row in top]
    most_likely = top_scorelines[0]
    favorite_is_home = teams[fixture.home_team].elo >= teams[fixture.away_team].elo
    upset_probability = summary["away_win"] if favorite_is_home else summary["home_win"]
    probability_margin = abs(summary["home_win"] - summary["away_win"])
    data_depth_bonus = min(len(load_historical_matches()) / 80, 0.22)
    confidence_score = min(0.92, 0.48 + probability_margin * 0.42 + data_depth_bonus)

    return MatchPrediction(
        fixture=fixture,
        home_team=teams[fixture.home_team],
        away_team=teams[fixture.away_team],
        expected_home_goals=round(home_xg, 3),
        expected_away_goals=round(away_xg, 3),
        most_likely_score=f"{most_likely.home_goals}-{most_likely.away_goals}",
        top_scorelines=top_scorelines,
        home_win_probability=summary["home_win"],
        draw_probability=summary["draw"],
        away_win_probability=summary["away_win"],
        upset_probability=upset_probability,
        over_2_5_probability=summary["over_2_5"],
        under_2_5_probability=summary["under_2_5"],
        both_teams_to_score_probability=summary["both_teams_to_score"],
        home_clean_sheet_probability=summary["home_clean_sheet"],
        away_clean_sheet_probability=summary["away_clean_sheet"],
        confidence_score=confidence_score,
        explanation=explanation,
    )
