from __future__ import annotations

from app.data.loaders import load_all_fixtures, load_fixture_odds
from app.models.domain import BettingRecommendation, Fixture, FixtureOdds
from app.services.prediction import predict_match


def decimal_to_implied_probability(decimal_odds: float) -> float:
    if decimal_odds <= 1:
        return 1.0
    return 1 / decimal_odds


def model_market_probabilities(fixture: Fixture) -> dict[str, dict[str, float]]:
    prediction = predict_match(fixture)
    return {
        "h2h": {
            prediction.home_team.name: prediction.home_win_probability,
            "Draw": prediction.draw_probability,
            prediction.away_team.name: prediction.away_win_probability,
        },
        "totals": {
            "Over 2.5": prediction.over_2_5_probability,
            "Under 2.5": prediction.under_2_5_probability,
        },
        "btts": {
            "Yes": prediction.both_teams_to_score_probability,
            "No": 1 - prediction.both_teams_to_score_probability,
        },
    }


def _best_outcomes(odds: FixtureOdds) -> dict[tuple[str, str], tuple[float, float, str]]:
    best: dict[tuple[str, str], tuple[float, float, str]] = {}
    for bookmaker in odds.bookmakers:
        for market in bookmaker.markets:
            for outcome in market.outcomes:
                key = (market.key, outcome.name)
                current = best.get(key)
                if current is None or outcome.price > current[0]:
                    best[key] = (outcome.price, outcome.implied_probability, bookmaker.title)
    return best


def _risk_label(edge: float, confidence: float) -> str:
    if edge >= 0.08 and confidence >= 0.65:
        return "strong model edge"
    if edge >= 0.04:
        return "watchlist edge"
    return "thin edge"


def recommendations_for_fixture(fixture: Fixture) -> list[BettingRecommendation]:
    odds = load_fixture_odds().get(fixture.id)
    if odds is None:
        return []
    prediction = predict_match(fixture)
    market_probs = model_market_probabilities(fixture)
    best = _best_outcomes(odds)
    label = f"{prediction.home_team.name} vs {prediction.away_team.name}"
    rows: list[BettingRecommendation] = []

    for market_key, selections in market_probs.items():
        for selection, model_probability in selections.items():
            best_line = best.get((market_key, selection))
            if best_line is None:
                continue
            price, market_probability, bookmaker = best_line
            edge = model_probability - market_probability
            expected_value = model_probability * price - 1
            if edge < 0.015 or expected_value < 0.015:
                continue
            rows.append(
                BettingRecommendation(
                    fixture_id=fixture.id,
                    fixture_label=label,
                    market=market_key,
                    selection=selection,
                    model_probability=model_probability,
                    market_probability=market_probability,
                    best_decimal_odds=price,
                    edge=edge,
                    expected_value=expected_value,
                    confidence=prediction.confidence_score,
                    risk_label=_risk_label(edge, prediction.confidence_score),
                    rationale=[
                        f"Best available seed line is {price:.2f} at {bookmaker}.",
                        f"Model probability is {model_probability:.1%} versus market-implied {market_probability:.1%}.",
                        "Use as an analytics signal only; odds move quickly and require live verification.",
                    ],
                )
            )
    return rows


def top_recommendations(limit: int = 12, stage: str | None = None) -> list[BettingRecommendation]:
    fixtures = load_all_fixtures()
    if stage:
        fixtures = [fixture for fixture in fixtures if fixture.stage == stage]
    rows: list[BettingRecommendation] = []
    for fixture in fixtures:
        rows.extend(recommendations_for_fixture(fixture))
    rows.sort(key=lambda item: (item.expected_value, item.edge, item.confidence), reverse=True)
    return rows[:limit]
