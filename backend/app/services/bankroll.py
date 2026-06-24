from __future__ import annotations

from app.models.domain import (
    BankrollChallenge,
    BankrollPhase,
    BankrollPoint,
    BetLeg,
    FakeBetSlip,
    NewsItem,
    ResearchSource,
    StrategyStep,
)
from app.data.loaders import load_fixtures, load_group_fixtures
from app.services.news import latest_news
from app.services.odds import top_recommendations


INITIAL_BANKROLL = 100.0
TARGET_BANKROLL = 1000.0
MAX_SAFE_EXPOSURE = 28.0
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
            title="Reality check",
            detail="The active ledger keeps running through the remaining group-stage games, but Safe Growth Mode will not force bets just to make the math look exciting.",
        ),
        StrategyStep(
            title="Remaining group screen",
            detail="Scan only remaining group-stage fixtures and place fake bets that pass probability, odds-band, edge, and confidence filters.",
        ),
        StrategyStep(
            title="Markets",
            detail="Prefer lower-variance singles such as BTTS/totals or strong favorites. Avoid draw bets and low-probability upset singles.",
        ),
        StrategyStep(
            title="Stake sizing",
            detail="Use fractional Kelly as a ceiling, then cap each slip at $3-$6 and today’s total open risk at $28 or lower.",
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


def _stake_for(rec, bankroll: float, remaining_budget: float) -> float:
    kelly_dollars = bankroll * _fractional_kelly(rec.model_probability, rec.best_decimal_odds)
    confidence_multiplier = 1.0 if rec.confidence >= 0.78 else 0.75
    base_unit = 5.0 if rec.model_probability >= 0.55 or rec.edge >= 0.07 else 4.0
    stake = min(6.0, max(base_unit, kelly_dollars * confidence_multiplier), remaining_budget)
    return round(max(stake, 0.0), 2)


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
            exposure_policy=f"Keep open fake risk at ${MAX_SAFE_EXPOSURE:.0f} or lower; prefer singles and hold cash when edges are thin.",
            description=(
                "Use this phase to test whether the model can make disciplined small-EV decisions before the bracket locks. "
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
    recommendations = top_recommendations(limit=80, stage="group")
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
        "Safe mode keeps this group-stage run alive until groups end, then resets to $100 for Round of 32. The 10x push belongs to the longer knockout runway, not a rushed group-stage chase."
    )
    group_ev_bankroll = round(INITIAL_BANKROLL + expected_profit, 2)

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
            bankroll=group_ev_bankroll,
            available_cash=round(available_cash, 2),
            open_risk=round(open_risk, 2),
            potential_return=round(sum(slip.potential_return for slip in slips), 2),
            note="Expected value mark after today’s conservative fake card, not settled cash.",
        ),
        BankrollPoint(
            label="Group-stage close",
            bankroll=group_ev_bankroll,
            available_cash=group_ev_bankroll,
            open_risk=0,
            potential_return=0,
            note="Projected group-stage practice close after all open fake slips settle at model EV.",
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
        available_cash=round(available_cash, 2),
        open_risk=round(open_risk, 2),
        current_mark_to_model=group_ev_bankroll,
        max_possible_bankroll=round(max_possible, 2),
        probability_to_target=target_probability,
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
