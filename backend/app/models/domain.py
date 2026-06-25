from datetime import date
from pydantic import BaseModel, Field


class Team(BaseModel):
    id: str
    name: str
    confederation: str
    elo: float
    attack: float = Field(gt=0)
    defense: float = Field(gt=0)
    fifa_rank: int
    climate_profile: str = "temperate"


class HistoricalMatch(BaseModel):
    date: date
    home_team: str
    away_team: str
    home_goals: int
    away_goals: int
    competition: str
    neutral: bool = True


class Fixture(BaseModel):
    id: str
    round: str
    home_team: str
    away_team: str
    venue: str
    kickoff_local: str
    neutral: bool = True
    stage: str = "knockout"
    group: str | None = None
    status: str = "scheduled"
    home_goals: int | None = None
    away_goals: int | None = None


class ScorelineProbability(BaseModel):
    home_goals: int
    away_goals: int
    probability: float


class MatchPrediction(BaseModel):
    fixture: Fixture
    home_team: Team
    away_team: Team
    expected_home_goals: float
    expected_away_goals: float
    most_likely_score: str
    top_scorelines: list[ScorelineProbability]
    home_win_probability: float
    draw_probability: float
    away_win_probability: float
    upset_probability: float
    over_2_5_probability: float
    under_2_5_probability: float
    both_teams_to_score_probability: float
    home_clean_sheet_probability: float
    away_clean_sheet_probability: float
    confidence_score: float
    explanation: list[str]


class TeamSimulationResult(BaseModel):
    team_id: str
    team_name: str
    champion_probability: float
    final_probability: float
    semi_final_probability: float
    quarter_final_probability: float
    round_advancement_probability: float


class SimulationResult(BaseModel):
    runs: int
    teams: list[TeamSimulationResult]


class OddsOutcome(BaseModel):
    name: str
    price: float
    implied_probability: float


class OddsMarket(BaseModel):
    key: str
    outcomes: list[OddsOutcome]


class BookmakerOdds(BaseModel):
    key: str
    title: str
    last_update: str
    markets: list[OddsMarket]


class FixtureOdds(BaseModel):
    fixture_id: str
    source: str
    last_update: str
    bookmakers: list[BookmakerOdds]


class BettingRecommendation(BaseModel):
    fixture_id: str
    fixture_label: str
    market: str
    selection: str
    model_probability: float
    market_probability: float
    best_decimal_odds: float
    edge: float
    expected_value: float
    confidence: float
    risk_label: str
    rationale: list[str]


class NewsItem(BaseModel):
    id: str
    title: str
    source: str
    url: str | None = None
    published_at: str
    team_ids: list[str] = []
    impact: str = "medium"
    sentiment: str = "neutral"
    summary: str


class LiveDataStatus(BaseModel):
    results_provider: str
    odds_provider: str
    news_provider: str
    configured_providers: list[str]
    fallback_mode: bool
    cache_ttl_minutes: int
    last_refresh: str
    notes: list[str]


class ResearchSource(BaseModel):
    title: str
    source: str
    url: str
    category: str
    summary: str


class StrategyStep(BaseModel):
    title: str
    detail: str
    status: str = "active"


class BetLeg(BaseModel):
    fixture_id: str
    fixture_label: str
    market: str
    selection: str
    decimal_odds: float
    model_probability: float
    market_probability: float
    edge: float
    status: str = "pending"
    result: str | None = None


class FakeBetSlip(BaseModel):
    id: str
    kind: str
    stake: float
    decimal_odds: float
    model_probability: float
    market_probability: float
    edge: float
    expected_value: float
    potential_return: float
    potential_profit: float
    status: str
    placed_at: str
    settled_at: str | None = None
    actual_return: float = 0
    profit_loss: float = 0
    result_summary: str = ""
    rationale: list[str]
    legs: list[BetLeg]


class BankrollPoint(BaseModel):
    label: str
    bankroll: float
    available_cash: float
    open_risk: float
    potential_return: float
    note: str


class BankrollPhase(BaseModel):
    title: str
    status: str
    starting_bankroll: float
    target_bankroll: float
    fixture_count: int
    match_window: str
    reset_trigger: str
    exposure_policy: str
    description: str
    checkpoints: list[str]


class BankrollChallenge(BaseModel):
    title: str
    mode: str
    strategy_name: str
    initial_bankroll: float
    target_bankroll: float
    slate_size: int
    settled_bankroll: float = 100
    settled_profit_loss: float = 0
    available_cash: float
    open_risk: float
    current_mark_to_model: float
    max_possible_bankroll: float
    probability_to_target: float
    next_milestone: float = 100
    next_milestone_probability: float = 0
    won_slips: int = 0
    lost_slips: int = 0
    pending_slips: int = 0
    settled_slips: int = 0
    strategy_shift: str = ""
    last_settlement: str | None = None
    target_assessment: str
    risk_warning: str
    plan: list[StrategyStep]
    research_sources: list[ResearchSource]
    slips: list[FakeBetSlip]
    watchlist: list[FakeBetSlip]
    bankroll_timeline: list[BankrollPoint]
    phase_plan: list[BankrollPhase]
    reset_policy: str
    knockout_runway_games: int
    news_context: list[NewsItem]
