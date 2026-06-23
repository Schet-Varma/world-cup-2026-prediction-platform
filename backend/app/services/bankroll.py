from __future__ import annotations

from math import prod

from app.models.domain import (
    BankrollChallenge,
    BankrollPoint,
    BetLeg,
    FakeBetSlip,
    ResearchSource,
    StrategyStep,
)
from app.services.news import latest_news
from app.services.odds import top_recommendations


INITIAL_BANKROLL = 100.0
TARGET_BANKROLL = 1000.0


def _fractional_kelly(probability: float, decimal_odds: float, fraction: float = 0.35) -> float:
    b = decimal_odds - 1
    if b <= 0:
        return 0.0
    full_kelly = (probability * b - (1 - probability)) / b
    return max(0.0, full_kelly * fraction)


def _leg_from_recommendation(item) -> BetLeg:
    return BetLeg(
        fixture_id=item.fixture_id,
        fixture_label=item.fixture_label,
        market=item.market,
        selection=item.selection,
        decimal_odds=item.best_decimal_odds,
        model_probability=item.model_probability,
        market_probability=item.market_probability,
        edge=item.edge,
    )


def _single_slip(index: int, rec, stake: float) -> FakeBetSlip:
    potential_return = stake * rec.best_decimal_odds
    return FakeBetSlip(
        id=f"fake-single-{index + 1}",
        kind="single",
        stake=round(stake, 2),
        decimal_odds=rec.best_decimal_odds,
        model_probability=rec.model_probability,
        market_probability=rec.market_probability,
        edge=rec.edge,
        expected_value=rec.expected_value,
        potential_return=round(potential_return, 2),
        potential_profit=round(potential_return - stake, 2),
        status="fake-open",
        placed_at="knockout-day 10:00 local",
        rationale=[
            "Placed only in fake-money mode because the model probability clears market probability and expected value filters.",
            f"Fractional Kelly raw size is {_fractional_kelly(rec.model_probability, rec.best_decimal_odds):.1%}; stake is capped for survival.",
            *rec.rationale,
        ],
        legs=[_leg_from_recommendation(rec)],
    )


def _parlay_slip(index: int, legs, stake: float, discount: float) -> FakeBetSlip:
    decimal_odds = prod(leg.best_decimal_odds for leg in legs)
    model_probability = prod(leg.model_probability for leg in legs) * discount
    market_probability = prod(leg.market_probability for leg in legs)
    edge = model_probability - market_probability
    expected_value = model_probability * decimal_odds - 1
    potential_return = stake * decimal_odds
    return FakeBetSlip(
        id=f"fake-ladder-{index + 1}",
        kind="ladder parlay",
        stake=round(stake, 2),
        decimal_odds=round(decimal_odds, 2),
        model_probability=model_probability,
        market_probability=market_probability,
        edge=edge,
        expected_value=expected_value,
        potential_return=round(potential_return, 2),
        potential_profit=round(potential_return - stake, 2),
        status="fake-open",
        placed_at="knockout-day 10:05 local",
        rationale=[
            "Small-stake ladder ticket exists only because the user goal is a 10x fake-bankroll challenge.",
            "Correlation and model-error discount is applied before computing probability.",
            "This is the high-volatility part of the portfolio, not the core bankroll plan.",
        ],
        legs=[_leg_from_recommendation(leg) for leg in legs],
    )


def _research_sources() -> list[ResearchSource]:
    return [
        ResearchSource(
            title="The Odds API V4 documentation",
            source="The Odds API",
            url="https://the-odds-api.com/liveapi/guides/v4/",
            category="odds feed",
            summary="Documents sports keys, odds endpoints, bookmaker markets, scores, event odds, and quota headers used by the provider adapter.",
        ),
        ResearchSource(
            title="football-data.org API quickstart",
            source="football-data.org",
            url="https://www.football-data.org/documentation/quickstart",
            category="results feed",
            summary="Fixture/result API option for keeping played matches and standings synchronized with the model cache.",
        ),
        ResearchSource(
            title="NewsAPI Everything endpoint",
            source="NewsAPI",
            url="https://newsapi.org/docs/endpoints/everything",
            category="news feed",
            summary="Article search endpoint that can monitor injuries, squad rotation, travel, and tactical news when a key is configured.",
        ),
        ResearchSource(
            title="Kelly criterion",
            source="Kelly growth sizing",
            url="https://en.wikipedia.org/wiki/Kelly_criterion",
            category="bankroll strategy",
            summary="Growth-optimal bet-sizing framework; the app uses capped fractional Kelly because probability estimates are uncertain.",
        ),
        ResearchSource(
            title="Advice to consider if you're gambling",
            source="GambleAware",
            url="https://www.gambleaware.org/advice/for-your-gambling/advice-to-consider-if-you-re-gambling/",
            category="responsible gambling",
            summary="Responsible gambling guidance: set spending limits, set time limits, take breaks, and do not chase losses.",
        ),
        ResearchSource(
            title="World Cup schedule and context",
            source="FIFA",
            url="https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026",
            category="tournament context",
            summary="Official tournament hub used as the primary context source for schedule and competition state.",
        ),
    ]


def _plan() -> list[StrategyStep]:
    return [
        StrategyStep(
            title="Target",
            detail="Start with fake $100 and try to reach fake $1,000 on a knockout-day slate without touching real money.",
        ),
        StrategyStep(
            title="Filter",
            detail="Only fake-place bets where model probability exceeds market implied probability and expected value is positive.",
        ),
        StrategyStep(
            title="Stake sizing",
            detail="Use capped fractional Kelly for singles, then force a hard portfolio cap so one model miss cannot erase every dollar.",
        ),
        StrategyStep(
            title="10x ladder",
            detail="Reserve a small high-volatility parlay sleeve because a $100 to $1,000 target needs nonlinear payout exposure.",
        ),
        StrategyStep(
            title="News gate",
            detail="Treat injury, rotation, weather, travel, and motivation news as context; downgrade confidence when sources disagree.",
        ),
        StrategyStep(
            title="Stop rules",
            detail="No chasing. No extra fake bets after the planned slip set. Keep a reserve and show risk instead of hiding it.",
        ),
    ]


def build_bankroll_challenge() -> BankrollChallenge:
    recommendations = top_recommendations(limit=14, stage="knockout")
    if len(recommendations) < 4:
        recommendations = top_recommendations(limit=14)

    singles = recommendations[:5]
    single_stakes = [16.0, 14.0, 12.0, 10.0, 8.0]
    slips: list[FakeBetSlip] = [_single_slip(index, rec, single_stakes[index]) for index, rec in enumerate(singles)]

    if len(recommendations) >= 5:
        slips.append(_parlay_slip(0, recommendations[:3], 8.0, 0.72))
        slips.append(_parlay_slip(1, recommendations[2:5], 6.0, 0.68))

    open_risk = sum(slip.stake for slip in slips)
    available_cash = INITIAL_BANKROLL - open_risk
    expected_profit = sum(slip.stake * slip.expected_value for slip in slips)
    max_possible = available_cash + sum(slip.potential_return for slip in slips)
    target_probability = sum(
        slip.model_probability
        for slip in slips
        if available_cash + slip.potential_return >= TARGET_BANKROLL
    )
    if len(slips) >= 2 and available_cash + slips[-1].potential_return + slips[-2].potential_return >= TARGET_BANKROLL:
        target_probability += slips[-1].model_probability * slips[-2].model_probability * 0.75
    target_probability = min(max(target_probability, 0.0), 0.95)

    bankroll_timeline = [
        BankrollPoint(
            label="Start",
            bankroll=INITIAL_BANKROLL,
            available_cash=INITIAL_BANKROLL,
            open_risk=0,
            potential_return=0,
            note="Fake bankroll initialized.",
        ),
        BankrollPoint(
            label="Slips submitted",
            bankroll=INITIAL_BANKROLL,
            available_cash=round(available_cash, 2),
            open_risk=round(open_risk, 2),
            potential_return=round(sum(slip.potential_return for slip in slips), 2),
            note="Stake set is locked; no chasing is allowed.",
        ),
        BankrollPoint(
            label="Model EV mark",
            bankroll=round(INITIAL_BANKROLL + expected_profit, 2),
            available_cash=round(available_cash, 2),
            open_risk=round(open_risk, 2),
            potential_return=round(sum(slip.potential_return for slip in slips), 2),
            note="Expected value mark, not settled cash.",
        ),
        BankrollPoint(
            label="$1,000 route",
            bankroll=round(max_possible, 2),
            available_cash=round(available_cash, 2),
            open_risk=round(open_risk, 2),
            potential_return=round(sum(slip.potential_return for slip in slips), 2),
            note="Upper bound if all fake slips hit; very unlikely, but visible.",
        ),
    ]

    return BankrollChallenge(
        title="Fake $100 to $1,000 Knockout-Day Challenge",
        mode="fake-money analytics lab",
        initial_bankroll=INITIAL_BANKROLL,
        target_bankroll=TARGET_BANKROLL,
        available_cash=round(available_cash, 2),
        open_risk=round(open_risk, 2),
        current_mark_to_model=round(INITIAL_BANKROLL + expected_profit, 2),
        max_possible_bankroll=round(max_possible, 2),
        probability_to_target=target_probability,
        risk_warning="No model can make sports betting risk-free. This page uses fake money only and intentionally shows volatility, reserve cash, and no-chase rules.",
        plan=_plan(),
        research_sources=_research_sources(),
        slips=slips,
        bankroll_timeline=bankroll_timeline,
        news_context=latest_news(limit=8),
    )
