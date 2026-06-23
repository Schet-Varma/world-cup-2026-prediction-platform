from __future__ import annotations

from app.models.domain import (
    BankrollChallenge,
    BankrollPoint,
    BetLeg,
    FakeBetSlip,
    ResearchSource,
    StrategyStep,
)
from app.data.loaders import load_fixtures
from app.services.news import latest_news
from app.services.odds import top_recommendations


INITIAL_BANKROLL = 100.0
TARGET_BANKROLL = 1000.0
MAX_SAFE_EXPOSURE = 28.0


def _fractional_kelly(probability: float, decimal_odds: float, fraction: float = 0.18) -> float:
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


def _single_slip(index: int, rec, stake: float, status: str = "fake-open") -> FakeBetSlip:
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
        status=status,
        placed_at="2026-06-24 practice card",
        rationale=[
            "Safe mode only places higher-probability fake singles; longshots are screened out even when EV looks tempting.",
            f"Fractional Kelly raw size is {_fractional_kelly(rec.model_probability, rec.best_decimal_odds):.1%}; stake is capped below that for survival.",
            *rec.rationale,
        ],
        legs=[_leg_from_recommendation(rec)],
    )


def _watchlist_slip(index: int, rec, reason: str) -> FakeBetSlip:
    return FakeBetSlip(
        id=f"not-placed-{index + 1}",
        kind="screened edge",
        stake=0,
        decimal_odds=rec.best_decimal_odds,
        model_probability=rec.model_probability,
        market_probability=rec.market_probability,
        edge=rec.edge,
        expected_value=rec.expected_value,
        potential_return=0,
        potential_profit=0,
        status="not-placed",
        placed_at="2026-06-24 safety screen",
        rationale=[
            reason,
            "This stays visible so the model shows restraint instead of hiding tempting but unsafe ideas.",
            *rec.rationale,
        ],
        legs=[_leg_from_recommendation(rec)],
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
            title="Guide to bankroll management in sports betting",
            source="New York Post",
            url="https://nypost.com/sports/bankroll-management/",
            category="staking discipline",
            summary="Explains flat betting, percentage staking, confidence units, tracking, and why bankroll management matters.",
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
            title="Reality check",
            detail="The $100 to $1,000 aim is a stretch target. Safe mode will not force bets just to make the math look exciting.",
        ),
        StrategyStep(
            title="16-game screen",
            detail="Scan the full Round of 32 slate, but only place fake bets that pass probability, odds-band, edge, and confidence filters.",
        ),
        StrategyStep(
            title="Markets",
            detail="Prefer lower-variance singles such as BTTS/totals or strong favorites. Avoid draw bets and low-probability upset singles.",
        ),
        StrategyStep(
            title="Stake sizing",
            detail="Use fractional Kelly as a ceiling, then cap each slip at $3-$6 and today’s total open risk below $28.",
        ),
        StrategyStep(
            title="News gate",
            detail="Treat injury, rotation, weather, travel, and motivation news as context; downgrade confidence when sources disagree.",
        ),
        StrategyStep(
            title="Stop rules",
            detail="No chasing and no same-match overexposure. If safe filters do not find enough plays, hold cash.",
        ),
    ]


def _is_safe_candidate(rec) -> bool:
    if rec.selection == "Draw":
        return False
    if rec.market == "h2h":
        return rec.model_probability >= 0.58 and 1.35 <= rec.best_decimal_odds <= 2.35
    if rec.market in {"totals", "btts"}:
        return rec.model_probability >= 0.525 and 1.65 <= rec.best_decimal_odds <= 2.35
    return False


def _is_tempting_but_unsafe(rec) -> bool:
    return rec.expected_value > 0.05 and not _is_safe_candidate(rec)


def _stake_for(rec, bankroll: float, remaining_budget: float) -> float:
    kelly_dollars = bankroll * _fractional_kelly(rec.model_probability, rec.best_decimal_odds)
    confidence_multiplier = 1.0 if rec.confidence >= 0.78 else 0.75
    base_unit = 5.0 if rec.model_probability >= 0.55 or rec.edge >= 0.07 else 4.0
    stake = min(6.0, max(base_unit, kelly_dollars * confidence_multiplier), remaining_budget)
    return round(max(stake, 0.0), 2)


def build_bankroll_challenge() -> BankrollChallenge:
    recommendations = top_recommendations(limit=80, stage="knockout")
    safe_candidates = [rec for rec in recommendations if _is_safe_candidate(rec)]
    unsafe_candidates = [rec for rec in recommendations if _is_tempting_but_unsafe(rec)]

    used_fixtures: set[str] = set()
    slips: list[FakeBetSlip] = []
    remaining_budget = MAX_SAFE_EXPOSURE
    for rec in safe_candidates:
        if rec.fixture_id in used_fixtures or remaining_budget < 3:
            continue
        stake = _stake_for(rec, INITIAL_BANKROLL, remaining_budget)
        if stake < 3:
            continue
        slips.append(_single_slip(len(slips), rec, stake))
        used_fixtures.add(rec.fixture_id)
        remaining_budget = round(remaining_budget - stake, 2)
        if len(slips) >= 7:
            break

    watchlist = []
    for rec in unsafe_candidates[:8]:
        if rec.model_probability < 0.5:
            reason = "Rejected: low hit-rate upset or longshot profile does not fit Safe Growth Mode."
        elif rec.best_decimal_odds > 2.35:
            reason = "Rejected: odds are outside the safe band, so variance is too high for today."
        else:
            reason = "Rejected: does not clear all safe-mode filters after confidence and market checks."
        watchlist.append(_watchlist_slip(len(watchlist), rec, reason))

    open_risk = sum(slip.stake for slip in slips)
    available_cash = INITIAL_BANKROLL - open_risk
    expected_profit = sum(slip.stake * slip.expected_value for slip in slips)
    max_possible = available_cash + sum(slip.potential_return for slip in slips)
    target_probability = 0.0
    if max_possible >= TARGET_BANKROLL:
        target_probability = min(0.08, sum(slip.model_probability for slip in slips) / max(len(slips), 1) * 0.08)
    target_assessment = (
        "Safe mode cannot honestly project a high-probability 10x from one slate. The path is to compound small positive-EV fake bets from today through the knockout start, not to chase longshots."
    )

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
            label="Today locked",
            bankroll=INITIAL_BANKROLL,
            available_cash=round(available_cash, 2),
            open_risk=round(open_risk, 2),
            potential_return=round(sum(slip.potential_return for slip in slips), 2),
            note="Only safe-filter singles are fake-placed; rejected edges are visible below.",
        ),
        BankrollPoint(
            label="Model EV mark",
            bankroll=round(INITIAL_BANKROLL + expected_profit, 2),
            available_cash=round(available_cash, 2),
            open_risk=round(open_risk, 2),
            potential_return=round(sum(slip.potential_return for slip in slips), 2),
            note="Expected value mark after today’s conservative fake card, not settled cash.",
        ),
        BankrollPoint(
            label="Stretch target",
            bankroll=round(max_possible, 2),
            available_cash=round(available_cash, 2),
            open_risk=round(open_risk, 2),
            potential_return=round(sum(slip.potential_return for slip in slips), 2),
            note="Upper bound for today. The $1,000 goal requires repeated compounding, not today’s all-in risk.",
        ),
    ]

    return BankrollChallenge(
        title="Safe $100 Practice Bankroll",
        mode="fake-money safe growth lab",
        strategy_name="Safe Growth Mode",
        initial_bankroll=INITIAL_BANKROLL,
        target_bankroll=TARGET_BANKROLL,
        slate_size=len(load_fixtures()),
        available_cash=round(available_cash, 2),
        open_risk=round(open_risk, 2),
        current_mark_to_model=round(INITIAL_BANKROLL + expected_profit, 2),
        max_possible_bankroll=round(max_possible, 2),
        probability_to_target=target_probability,
        target_assessment=target_assessment,
        risk_warning="Fake money only. Safe mode prioritizes survival and disciplined compounding; it will hold cash rather than force risky bets.",
        plan=_plan(),
        research_sources=_research_sources(),
        slips=slips,
        watchlist=watchlist,
        bankroll_timeline=bankroll_timeline,
        news_context=latest_news(limit=8),
    )
