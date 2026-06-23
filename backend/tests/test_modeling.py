from app.data.loaders import load_fixtures
from app.services.elo import expected_score, recency_weight
from app.services.odds import top_recommendations
from app.services.bankroll import build_bankroll_challenge
from app.services.poisson import score_matrix, summarize_score_matrix
from app.services.prediction import predict_match
from app.services.simulation import run_simulation


def test_expected_score_is_symmetric():
    a = expected_score(1800, 1700)
    b = expected_score(1700, 1800)
    assert round(a + b, 8) == 1


def test_recency_weight_prefers_recent_matches():
    from datetime import date

    recent = recency_weight(date(2025, 1, 1))
    older = recency_weight(date(2020, 1, 1))
    assert recent > older


def test_score_matrix_normalizes_probabilities():
    matrix = score_matrix(1.4, 1.1)
    total = sum(row["probability"] for row in matrix)
    assert abs(total - 1) < 0.000001
    summary = summarize_score_matrix(matrix)
    result_total = summary["home_win"] + summary["draw"] + summary["away_win"]
    totals_total = summary["over_2_5"] + summary["under_2_5"]
    assert abs(result_total - 1) < 0.000001
    assert abs(totals_total - 1) < 0.000001
    assert 0 <= summary["both_teams_to_score"] <= 1


def test_prediction_has_top_scorelines():
    prediction = predict_match(load_fixtures()[0])
    assert prediction.most_likely_score
    assert len(prediction.top_scorelines) == 5
    total = prediction.home_win_probability + prediction.draw_probability + prediction.away_win_probability
    assert abs(total - 1) < 0.000001


def test_simulation_returns_all_seed_teams():
    result = run_simulation(runs=100, seed=7)
    assert result.runs == 100
    assert len(result.teams) >= 32
    assert result.teams[0].champion_probability >= result.teams[-1].champion_probability


def test_betting_recommendations_find_model_edges():
    rows = top_recommendations(limit=5)
    assert rows
    assert rows[0].expected_value > 0
    assert 0 <= rows[0].model_probability <= 1


def test_bankroll_challenge_builds_fake_slips_and_timeline():
    challenge = build_bankroll_challenge()
    assert challenge.initial_bankroll == 100
    assert challenge.target_bankroll == 1000
    assert challenge.slips
    assert challenge.bankroll_timeline
    assert challenge.open_risk <= challenge.initial_bankroll
