from __future__ import annotations

from app.models.domain import (
    BankrollChallenge,
    BankrollPhase,
    BankrollPoint,
    BetLeg,
    FakeBetSlip,
    Fixture,
    NewsItem,
    ResearchSource,
    StrategyStep,
)
from app.data.loaders import load_fixtures, load_group_fixtures
from app.services.news import latest_news
from app.services.odds import is_settled_fixture, top_recommendations


INITIAL_BANKROLL = 100.0
TARGET_BANKROLL = 1000.0
MAX_SAFE_EXPOSURE = 28.0
MAX_MULTI_EXPOSURE = 6.0
SINGLE_EXPOSURE_BUDGET = MAX_SAFE_EXPOSURE - MAX_MULTI_EXPOSURE
RECOVERY_EXPOSURE_BUDGET = 8.0
RECOVERY_SINGLE_MAX = 3.0
MAX_SAFE_MULTIS = 3
MAX_MULTI_LEGS = 2
KNOCKOUT_INITIAL_BANKROLL = 100.0
KNOCKOUT_RUNWAY_GAMES = 31
ROUND_OF_32_RESET_LABEL = "Round of 32 reset"


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


def _single_slip(
    index: int,
    rec,
    stake: float,
    *,
    prefix: str = "live-single",
    kind: str = "recovery single",
    placed_at: str = "2026-06-25 recovery card",
    status: str = "pending-live",
) -> FakeBetSlip:
    potential_return = stake * rec.best_decimal_odds
    return FakeBetSlip(
        id=f"{prefix}-{index + 1}",
        kind=kind,
        stake=round(stake, 2),
        decimal_odds=rec.best_decimal_odds,
        model_probability=rec.model_probability,
        market_probability=rec.market_probability,
        edge=rec.edge,
        expected_value=rec.expected_value,
        potential_return=round(potential_return, 2),
        potential_profit=round(potential_return - stake, 2),
        status=status,
        placed_at=placed_at,
        rationale=[
            "Safe mode only places higher-probability fake singles; longshots are screened out even when EV looks tempting.",
            f"Fractional Kelly raw size is {_fractional_kelly(rec.model_probability, rec.best_decimal_odds):.1%}; stake is capped below that for survival.",
            *rec.rationale,
        ],
        legs=[_leg_from_recommendation(rec)],
    )


def _combined_metrics(recs) -> tuple[float, float, float, float, float]:
    decimal_odds = 1.0
    model_probability = 1.0
    market_probability = 1.0
    for rec in recs:
        decimal_odds *= rec.best_decimal_odds
        model_probability *= rec.model_probability
        market_probability *= rec.market_probability
    expected_value = model_probability * decimal_odds - 1
    edge = model_probability - market_probability
    return decimal_odds, model_probability, market_probability, edge, expected_value


def _multi_slip(
    index: int,
    recs,
    stake: float,
    *,
    prefix: str = "live-safe-multi",
    placed_at: str = "2026-06-25 recovery card",
) -> FakeBetSlip:
    decimal_odds, model_probability, market_probability, edge, expected_value = _combined_metrics(recs)
    potential_return = stake * decimal_odds
    leg_labels = "; ".join(f"{rec.selection} in {rec.fixture_label}" for rec in recs)
    return FakeBetSlip(
        id=f"{prefix}-{index + 1}",
        kind="safe multi",
        stake=round(stake, 2),
        decimal_odds=round(decimal_odds, 4),
        model_probability=round(model_probability, 6),
        market_probability=round(market_probability, 6),
        edge=round(edge, 6),
        expected_value=round(expected_value, 6),
        potential_return=round(potential_return, 2),
        potential_profit=round(potential_return - stake, 2),
        status="pending-live",
        placed_at=placed_at,
        rationale=[
            f"Two-leg multi only: {leg_labels}. No same-fixture stacking.",
            f"Combined model hit rate is {model_probability:.1%} versus market-implied {market_probability:.1%}; this is upside, not the core plan.",
            "Stake is capped as a tiny sleeve because leg independence is approximate and multis can miss easily.",
        ],
        legs=[_leg_from_recommendation(rec) for rec in recs],
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


def _fixture_result_label(fixture: Fixture) -> str:
    if fixture.home_goals is None or fixture.away_goals is None:
        return "awaiting result"
    return f"{fixture.home_goals}-{fixture.away_goals}"


def _leg_won(leg: BetLeg, fixture: Fixture) -> bool:
    home_goals = fixture.home_goals or 0
    away_goals = fixture.away_goals or 0
    total_goals = home_goals + away_goals

    if leg.market == "totals":
        return (leg.selection == "Over 2.5" and total_goals > 2.5) or (
            leg.selection == "Under 2.5" and total_goals < 2.5
        )
    if leg.market == "btts":
        both_scored = home_goals > 0 and away_goals > 0
        return (leg.selection == "Yes" and both_scored) or (leg.selection == "No" and not both_scored)
    if leg.market == "h2h":
        home_name, away_name = leg.fixture_label.split(" vs ")
        if home_goals == away_goals:
            result = "Draw"
        elif home_goals > away_goals:
            result = home_name
        else:
            result = away_name
        return leg.selection == result
    return False


def _settle_leg(leg: BetLeg, fixtures_by_id: dict[str, Fixture]) -> BetLeg:
    fixture = fixtures_by_id.get(leg.fixture_id)
    if fixture is None or not is_settled_fixture(fixture):
        return leg.model_copy(update={"status": "pending", "result": "awaiting final score"})

    result_label = _fixture_result_label(fixture)
    won = _leg_won(leg, fixture)
    return leg.model_copy(
        update={
            "status": "won" if won else "lost",
            "result": f"{result_label} final",
        }
    )


def _settle_slip(slip: FakeBetSlip, fixtures_by_id: dict[str, Fixture]) -> FakeBetSlip:
    graded_legs = [_settle_leg(leg, fixtures_by_id) for leg in slip.legs]
    has_lost_leg = any(leg.status == "lost" for leg in graded_legs)
    has_pending_leg = any(leg.status == "pending" for leg in graded_legs)
    has_only_winning_legs = all(leg.status == "won" for leg in graded_legs)

    if has_lost_leg:
        status = "settled-lost"
        actual_return = 0.0
        profit_loss = -slip.stake
        settled_at = "result sync"
    elif has_only_winning_legs and not has_pending_leg:
        status = "settled-won"
        actual_return = slip.potential_return
        profit_loss = slip.potential_profit
        settled_at = "result sync"
    else:
        status = "pending-live"
        actual_return = 0.0
        profit_loss = 0.0
        settled_at = None

    result_summary = "; ".join(
        f"{leg.fixture_label}: {leg.result or 'awaiting final score'} ({leg.status})" for leg in graded_legs
    )

    return slip.model_copy(
        update={
            "status": status,
            "settled_at": settled_at,
            "actual_return": round(actual_return, 2),
            "profit_loss": round(profit_loss, 2),
            "result_summary": result_summary,
            "legs": graded_legs,
        }
    )


def _research_sources() -> list[ResearchSource]:
    return [
        ResearchSource(
            title="Scotland 0-3 Brazil match report",
            source="The Guardian",
            url="https://www.theguardian.com/football/live/2026/jun/24/scotland-v-brazil-world-cup-2026-live",
            category="result settlement",
            summary="Final-score source used to grade the Scotland-Brazil BTTS leg as lost.",
        ),
        ResearchSource(
            title="Morocco 4-2 Haiti match report",
            source="The Guardian",
            url="https://www.theguardian.com/football/live/2026/jun/24/morocco-v-haiti-world-cup-2026-live",
            category="result settlement",
            summary="Final-score source used to grade the Morocco-Haiti under-total leg as lost.",
        ),
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


def _group_stage_news_context() -> list[NewsItem]:
    group_team_ids = {fixture.home_team for fixture in load_group_fixtures()} | {
        fixture.away_team for fixture in load_group_fixtures()
    }
    items = [
        item
        for item in latest_news(limit=8)
        if not item.team_ids or any(team_id in group_team_ids for team_id in item.team_ids)
    ]
    return [
        item.model_copy(
            update={
                "summary": item.summary.replace("multiple Round of 32 paths", "multiple group-table paths")
            }
        )
        for item in items
    ]


def _plan() -> list[StrategyStep]:
    return [
        StrategyStep(
            title="Settle first",
            detail="Every refresh grades finished fake slips before placing anything new, so losses reduce cash immediately instead of staying as theoretical EV.",
        ),
        StrategyStep(
            title="Recovery mode",
            detail="Because the June 24 card missed badly, stake size drops to micro units and multis are paused until the settled hit rate improves.",
        ),
        StrategyStep(
            title="Remaining group screen",
            detail="Scan only unplayed group-stage fixtures and avoid draws, upset longshots, and thin edges that only look good because the price is huge.",
        ),
        StrategyStep(
            title="Stake sizing",
            detail=f"Use fractional Kelly as a ceiling, cap recovery singles at ${RECOVERY_SINGLE_MAX:.0f}, keep total new open risk under ${RECOVERY_EXPOSURE_BUDGET:.0f}, and scale only after settled profit.",
        ),
        StrategyStep(
            title="News gate",
            detail="Treat injury, rotation, weather, travel, and motivation news as context; downgrade confidence when sources disagree.",
        ),
        StrategyStep(
            title="Stop rules",
            detail="No chasing and no same-match overexposure. If safe filters do not find enough plays, hold cash.",
        ),
        StrategyStep(
            title=ROUND_OF_32_RESET_LABEL,
            detail="When the Round of 32 bracket locks, archive this group-stage practice ledger and restart the fake bankroll at $100 for the knockout runway.",
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


def _is_recovery_candidate(rec) -> bool:
    if rec.selection == "Draw" or rec.best_decimal_odds > 2.1:
        return False
    if rec.market == "h2h":
        return rec.model_probability >= 0.62 and 1.35 <= rec.best_decimal_odds <= 1.8 and rec.expected_value >= 0.025
    if rec.market in {"totals", "btts"}:
        return (
            rec.model_probability >= 0.53
            and 1.75 <= rec.best_decimal_odds <= 2.05
            and rec.expected_value >= 0.025
            and rec.confidence >= 0.74
        )
    return False


def _stake_for(rec, bankroll: float, remaining_budget: float) -> float:
    kelly_dollars = bankroll * _fractional_kelly(rec.model_probability, rec.best_decimal_odds)
    confidence_multiplier = 1.0 if rec.confidence >= 0.78 else 0.75
    base_unit = 5.0 if rec.model_probability >= 0.55 or rec.edge >= 0.07 else 4.0
    stake = min(6.0, max(base_unit, kelly_dollars * confidence_multiplier), remaining_budget)
    return round(max(stake, 0.0), 2)


def _recovery_stake_for(rec, bankroll: float, remaining_budget: float) -> float:
    kelly_dollars = bankroll * _fractional_kelly(rec.model_probability, rec.best_decimal_odds, fraction=0.1)
    base_unit = 2.0
    stake = min(RECOVERY_SINGLE_MAX, max(base_unit, kelly_dollars), remaining_budget)
    return round(max(stake, 0.0), 2)


def _multi_stake_for(expected_value: float, model_probability: float, remaining_budget: float) -> float:
    if remaining_budget < 2 or expected_value < 0.06 or model_probability < 0.3:
        return 0.0
    base = 2.0
    if expected_value >= 0.18 and model_probability >= 0.34:
        base = 2.5
    if expected_value >= 0.28 and model_probability >= 0.36:
        base = 3.0
    return round(min(base, remaining_budget), 2)


def _multi_candidates(recs) -> list[tuple[float, float, float, float, tuple]]:
    rows: list[tuple[float, float, float, float, tuple]] = []
    for left_index, left in enumerate(recs):
        for right in recs[left_index + 1 :]:
            if left.fixture_id == right.fixture_id:
                continue
            pair = (left, right)
            decimal_odds, model_probability, market_probability, edge, expected_value = _combined_metrics(pair)
            if len(pair) != MAX_MULTI_LEGS:
                continue
            if not 2.8 <= decimal_odds <= 4.75:
                continue
            if model_probability < 0.3 or edge < 0.025 or expected_value < 0.06:
                continue
            if min(left.confidence, right.confidence) < 0.7:
                continue
            score = expected_value + edge + (model_probability * 0.1)
            rows.append((score, expected_value, model_probability, edge, pair))
    rows.sort(key=lambda item: item[:4], reverse=True)
    return rows


def _phase_plan(group_ev_bankroll: float) -> list[BankrollPhase]:
    return [
        BankrollPhase(
            title="Group-stage practice run",
            status="active until groups end",
            starting_bankroll=INITIAL_BANKROLL,
            target_bankroll=TARGET_BANKROLL,
            fixture_count=len(load_group_fixtures()),
            match_window="Remaining group-stage fixtures",
            reset_trigger="Settles when the final group-stage fixture in the seed slate is complete.",
            exposure_policy=f"Recovery mode keeps new open fake risk at ${RECOVERY_EXPOSURE_BUDGET:.0f} or lower and pauses new multis until the ledger repairs.",
            description=(
                "Use this phase to test whether the model can make disciplined small-EV decisions after real misses. "
                f"The current model-EV mark is ${group_ev_bankroll:.2f}, but no group-stage result carries into the knockout reset."
            ),
            checkpoints=[
                "Refresh results and news after each group match window.",
                "Settle open fake slips, then update available cash and rejected edges.",
                "Do not add recovery bets after a miss; only place new slips that pass the same safe filters.",
            ],
        ),
        BankrollPhase(
            title="Round of 32 knockout reset",
            status="queued",
            starting_bankroll=KNOCKOUT_INITIAL_BANKROLL,
            target_bankroll=TARGET_BANKROLL,
            fixture_count=KNOCKOUT_RUNWAY_GAMES,
            match_window=f"{len(load_fixtures())} Round of 32 fixtures loaded now, {KNOCKOUT_RUNWAY_GAMES} knockout matches planned across the full bracket",
            reset_trigger="Starts when the Round of 32 bracket is confirmed.",
            exposure_policy="Reset to $100, use 2-4% base units, cap daily exposure, and scale only after settled profit.",
            description=(
                "This is the more realistic 10x attempt: about thirty knockout matches gives the model more chances to compound "
                "safe singles, selective plus-money totals, and only tiny higher-variance sleeves."
            ),
            checkpoints=[
                "Begin with no carry-over from group-stage profit or loss.",
                "Separate core singles from tiny optional upside slips.",
                "Re-rate every matchup after lineups, travel, injuries, and market movement.",
                "Stop for the day if drawdown hits 12% of the reset bankroll.",
            ],
        ),
    ]


def build_bankroll_challenge() -> BankrollChallenge:
    fixtures = load_group_fixtures()
    fixtures_by_id = {fixture.id: fixture for fixture in fixtures}
    settled_fixture_ids = {fixture.id for fixture in fixtures if is_settled_fixture(fixture)}
    active_fixture_ids = {fixture.id for fixture in fixtures if fixture.id not in settled_fixture_ids}
    recommendations = top_recommendations(limit=80, stage="group", include_completed=True)
    completed_safe_candidates = [
        rec for rec in recommendations if rec.fixture_id in settled_fixture_ids and _is_safe_candidate(rec)
    ]
    active_recommendations = [rec for rec in recommendations if rec.fixture_id in active_fixture_ids]

    historical_slips: list[FakeBetSlip] = []
    historical_single_recs = []
    used_historical_fixtures: set[str] = set()
    historical_budget = SINGLE_EXPOSURE_BUDGET
    for rec in completed_safe_candidates:
        if rec.fixture_id in used_historical_fixtures or historical_budget < 3:
            continue
        stake = _stake_for(rec, INITIAL_BANKROLL, historical_budget)
        if stake < 3:
            continue
        slip = _single_slip(
            len(historical_single_recs),
            rec,
            stake,
            prefix="settled-single",
            kind="settled single",
            placed_at="2026-06-24 practice card",
        )
        historical_slips.append(_settle_slip(slip, fixtures_by_id))
        historical_single_recs.append(rec)
        used_historical_fixtures.add(rec.fixture_id)
        historical_budget = round(historical_budget - stake, 2)
        if len(historical_single_recs) >= 4:
            break

    historical_multi_budget = min(MAX_MULTI_EXPOSURE, MAX_SAFE_EXPOSURE - sum(slip.stake for slip in historical_slips))
    used_historical_multi_fixtures: set[str] = set()
    historical_multi_count = 0
    for _, expected_value, model_probability, _, pair in _multi_candidates(historical_single_recs):
        if historical_multi_count >= 2 or historical_multi_budget < 2:
            break
        pair_fixture_ids = {rec.fixture_id for rec in pair}
        if used_historical_multi_fixtures & pair_fixture_ids:
            continue
        stake = _multi_stake_for(expected_value, model_probability, historical_multi_budget)
        if stake < 2:
            continue
        slip = _multi_slip(
            historical_multi_count,
            pair,
            stake,
            prefix="settled-safe-multi",
            placed_at="2026-06-24 practice card",
        )
        historical_slips.append(_settle_slip(slip, fixtures_by_id))
        used_historical_multi_fixtures |= pair_fixture_ids
        historical_multi_count += 1
        historical_multi_budget = round(historical_multi_budget - stake, 2)

    settled_staked = sum(slip.stake for slip in historical_slips if slip.status.startswith("settled"))
    settled_returns = sum(slip.actual_return for slip in historical_slips if slip.status.startswith("settled"))
    settled_profit_loss = round(settled_returns - settled_staked, 2)
    settled_bankroll = round(INITIAL_BANKROLL + settled_profit_loss, 2)
    lost_slips = sum(1 for slip in historical_slips if slip.status == "settled-lost")
    won_slips = sum(1 for slip in historical_slips if slip.status == "settled-won")
    settled_slips = won_slips + lost_slips
    recovery_mode = lost_slips > won_slips

    active_safe_candidates = [
        rec
        for rec in active_recommendations
        if (_is_recovery_candidate(rec) if recovery_mode else _is_safe_candidate(rec))
    ]
    unsafe_candidates = [rec for rec in active_recommendations if _is_tempting_but_unsafe(rec)]

    new_slips: list[FakeBetSlip] = []
    used_active_fixtures: set[str] = set()
    remaining_budget = min(RECOVERY_EXPOSURE_BUDGET if recovery_mode else SINGLE_EXPOSURE_BUDGET, settled_bankroll)
    active_single_recs = []
    for rec in active_safe_candidates:
        if rec.fixture_id in used_active_fixtures or remaining_budget < 2:
            continue
        stake = (
            _recovery_stake_for(rec, settled_bankroll, remaining_budget)
            if recovery_mode
            else _stake_for(rec, settled_bankroll, remaining_budget)
        )
        if stake < 2:
            continue
        new_slips.append(_settle_slip(_single_slip(len(new_slips), rec, stake), fixtures_by_id))
        active_single_recs.append(rec)
        used_active_fixtures.add(rec.fixture_id)
        remaining_budget = round(remaining_budget - stake, 2)
        if len(new_slips) >= (2 if recovery_mode else 7):
            break

    if not recovery_mode:
        multi_budget = min(MAX_MULTI_EXPOSURE, MAX_SAFE_EXPOSURE - sum(slip.stake for slip in new_slips))
        used_multi_fixtures: set[str] = set()
        multi_count = 0
        for _, expected_value, model_probability, _, pair in _multi_candidates(active_single_recs):
            if multi_count >= MAX_SAFE_MULTIS or multi_budget < 2:
                break
            pair_fixture_ids = {rec.fixture_id for rec in pair}
            if used_multi_fixtures & pair_fixture_ids:
                continue
            stake = _multi_stake_for(expected_value, model_probability, multi_budget)
            if stake < 2:
                continue
            new_slips.append(_settle_slip(_multi_slip(multi_count, pair, stake), fixtures_by_id))
            used_multi_fixtures |= pair_fixture_ids
            multi_count += 1
            multi_budget = round(multi_budget - stake, 2)

    slips = [*historical_slips, *new_slips]

    watchlist = []
    for rec in unsafe_candidates[:8]:
        if rec.model_probability < 0.5:
            reason = "Rejected: low hit-rate upset or longshot profile does not fit recovery mode."
        elif rec.best_decimal_odds > 2.1:
            reason = "Rejected: price is too lottery-like after the settled drawdown."
        elif recovery_mode and rec.market == "h2h":
            reason = "Rejected: match-result variance is too high until the ledger recovers."
        else:
            reason = "Rejected: does not clear the stricter post-loss probability, confidence, and odds-band filters."
        watchlist.append(_watchlist_slip(len(watchlist), rec, reason))

    pending_slips = sum(1 for slip in slips if slip.status == "pending-live")
    open_risk = sum(slip.stake for slip in slips if slip.status == "pending-live")
    available_cash = settled_bankroll - open_risk
    expected_profit = sum(slip.stake * slip.expected_value for slip in slips if slip.status == "pending-live")
    max_possible = available_cash + sum(slip.potential_return for slip in slips if slip.status == "pending-live")
    target_probability = 0.0
    if max_possible >= TARGET_BANKROLL:
        target_probability = min(
            0.08,
            sum(slip.model_probability for slip in slips if slip.status == "pending-live")
            / max(pending_slips, 1)
            * 0.08,
        )

    next_milestone = 90.0 if settled_bankroll < 90 else min(110.0, round(settled_bankroll + 10, 2))
    if pending_slips and settled_bankroll < 90 <= next_milestone and max_possible < next_milestone:
        next_milestone = round(max_possible, 2)
    if max_possible + 0.005 >= next_milestone and pending_slips:
        next_milestone_probability = min(
            0.85,
            sum(slip.model_probability for slip in slips if slip.status == "pending-live") / pending_slips,
        )
    else:
        next_milestone_probability = 0.0
    target_assessment = (
        f"After settled June 24 losses, the real fake-cash base is ${settled_bankroll:.2f}. "
        f"The live goal is recovery to ${next_milestone:.0f}; the $1000 chase stays parked for the Round of 32 reset."
    )
    strategy_shift = (
        "Recovery mode active: tiny singles only, no new multis, no upset longshots, no chasing yesterday's losses."
        if recovery_mode
        else "Normal safe-growth mode active: singles first, tiny multis only after clean settled performance."
    )
    group_ev_bankroll = round(settled_bankroll + expected_profit, 2)

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
            label="June 24 settled",
            bankroll=settled_bankroll,
            available_cash=settled_bankroll,
            open_risk=0,
            potential_return=0,
            note=f"Settled result sync: {won_slips} won, {lost_slips} lost, net P/L ${settled_profit_loss:.2f}.",
        ),
        BankrollPoint(
            label="Live recovery card",
            bankroll=settled_bankroll,
            available_cash=round(available_cash, 2),
            open_risk=round(open_risk, 2),
            potential_return=round(sum(slip.potential_return for slip in slips if slip.status == "pending-live"), 2),
            note="Only remaining group-stage fixtures can receive new fake stake; multis are paused in recovery mode.",
        ),
        BankrollPoint(
            label="Model EV mark",
            bankroll=group_ev_bankroll,
            available_cash=round(available_cash, 2),
            open_risk=round(open_risk, 2),
            potential_return=round(sum(slip.potential_return for slip in slips if slip.status == "pending-live"), 2),
            note="Expected-value mark after pending recovery slips, not settled cash.",
        ),
        BankrollPoint(
            label="Next milestone",
            bankroll=next_milestone,
            available_cash=next_milestone,
            open_risk=0,
            potential_return=0,
            note="Short-term recovery target before stake sizes are allowed to scale again.",
        ),
        BankrollPoint(
            label=ROUND_OF_32_RESET_LABEL,
            bankroll=KNOCKOUT_INITIAL_BANKROLL,
            available_cash=KNOCKOUT_INITIAL_BANKROLL,
            open_risk=0,
            potential_return=0,
            note="Knockout ledger starts fresh at $100; group-stage profit or loss is archived, not carried.",
        ),
        BankrollPoint(
            label="Knockout runway",
            bankroll=TARGET_BANKROLL,
            available_cash=TARGET_BANKROLL,
            open_risk=0,
            potential_return=0,
            note=f"Stretch target over about {KNOCKOUT_RUNWAY_GAMES} knockout matches, with safer compounding and no forced all-in card.",
        ),
    ]
    phase_plan = _phase_plan(group_ev_bankroll)

    return BankrollChallenge(
        title="Safe $100 Practice Bankroll",
        mode="remaining group-stage fake-money lab",
        strategy_name="Safe Growth Mode",
        initial_bankroll=INITIAL_BANKROLL,
        target_bankroll=TARGET_BANKROLL,
        slate_size=len(load_group_fixtures()),
        settled_bankroll=settled_bankroll,
        settled_profit_loss=settled_profit_loss,
        available_cash=round(available_cash, 2),
        open_risk=round(open_risk, 2),
        current_mark_to_model=group_ev_bankroll,
        max_possible_bankroll=round(max_possible, 2),
        probability_to_target=target_probability,
        next_milestone=next_milestone,
        next_milestone_probability=next_milestone_probability,
        won_slips=won_slips,
        lost_slips=lost_slips,
        pending_slips=pending_slips,
        settled_slips=settled_slips,
        strategy_shift=strategy_shift,
        last_settlement="2026-06-25 result sync" if settled_slips else None,
        target_assessment=target_assessment,
        risk_warning="Fake money only. Safe mode prioritizes survival and disciplined compounding; it will hold cash rather than force risky bets.",
        plan=_plan(),
        research_sources=_research_sources(),
        slips=slips,
        watchlist=watchlist,
        bankroll_timeline=bankroll_timeline,
        phase_plan=phase_plan,
        reset_policy=(
            f"At {ROUND_OF_32_RESET_LABEL}, archive the group-stage ledger and restart with ${KNOCKOUT_INITIAL_BANKROLL:.0f}. "
            f"The knockout target stays ${TARGET_BANKROLL:.0f} across about {KNOCKOUT_RUNWAY_GAMES} matches."
        ),
        knockout_runway_games=KNOCKOUT_RUNWAY_GAMES,
        news_context=_group_stage_news_context(),
    )
