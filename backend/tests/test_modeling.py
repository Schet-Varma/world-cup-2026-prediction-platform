from app.data.loaders import load_fixtures, load_group_fixtures
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


def test_group_betting_recommendations_skip_completed_fixtures():
    rows = top_recommendations(limit=20, stage="group")
    assert rows
    assert all(row.fixture_id in {"grp-l-05", "grp-l-06"} for row in rows)


def test_bankroll_challenge_builds_fake_slips_and_timeline():
    challenge = build_bankroll_challenge()
    assert challenge.initial_bankroll == 100
    assert challenge.target_bankroll == 1000
    assert challenge.slate_size == len(load_group_fixtures())
    assert challenge.slips
    assert challenge.watchlist
    assert challenge.bankroll_timeline
    assert challenge.open_risk <= 28
    assert challenge.open_risk <= 8
    assert challenge.settled_bankroll < 100
    assert challenge.settled_profit_loss < 0
    assert challenge.lost_slips > challenge.won_slips
    assert challenge.pending_slips >= 1
    assert challenge.next_milestone <= challenge.max_possible_bankroll
    assert "Recovery mode active" in challenge.strategy_shift
    assert any(slip.status == "settled-lost" for slip in challenge.slips)
    assert any(slip.status == "pending-live" for slip in challenge.slips)
    single_slips = [slip for slip in challenge.slips if len(slip.legs) == 1]
    multi_slips = [slip for slip in challenge.slips if len(slip.legs) > 1]
    assert single_slips
    assert multi_slips
    assert all(slip.kind == "safe multi" for slip in multi_slips)
    assert all(len(slip.legs) == 2 for slip in multi_slips)
    assert sum(slip.stake for slip in multi_slips) <= 6
    multi_fixture_ids = [leg.fixture_id for slip in multi_slips for leg in slip.legs]
    assert len(multi_fixture_ids) == len(set(multi_fixture_ids))
    assert all(leg.model_probability >= 0.525 for slip in challenge.slips for leg in slip.legs)
    assert all(slip.stake > 0 for slip in challenge.slips)
    assert all(slip.stake == 0 for slip in challenge.watchlist)
    assert all(leg.fixture_id.startswith("grp-") for slip in challenge.slips for leg in slip.legs)
    assert all(leg.fixture_id.startswith("grp-") for slip in challenge.watchlist for leg in slip.legs)
    assert challenge.knockout_runway_games == 31
    assert "restart with $100" in challenge.reset_policy
    assert [phase.title for phase in challenge.phase_plan] == [
        "Group-stage practice run",
        "Round of 32 knockout reset",
    ]
    assert challenge.phase_plan[1].starting_bankroll == 100
    assert challenge.phase_plan[1].fixture_count == 31
