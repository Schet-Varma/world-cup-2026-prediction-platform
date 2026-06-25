export type Team = {
  id: string;
  name: string;
  confederation: string;
  elo: number;
  attack: number;
  defense: number;
  fifa_rank: number;
  climate_profile: string;
};

export type Fixture = {
  id: string;
  round: string;
  home_team: string;
  away_team: string;
  venue: string;
  kickoff_local: string;
  neutral: boolean;
  stage: string;
  group?: string | null;
  status: string;
  home_goals?: number | null;
  away_goals?: number | null;
};

export type Scoreline = {
  home_goals: number;
  away_goals: number;
  probability: number;
};

export type MatchPrediction = {
  fixture: Fixture;
  home_team: Team;
  away_team: Team;
  expected_home_goals: number;
  expected_away_goals: number;
  most_likely_score: string;
  top_scorelines: Scoreline[];
  home_win_probability: number;
  draw_probability: number;
  away_win_probability: number;
  upset_probability: number;
  over_2_5_probability: number;
  under_2_5_probability: number;
  both_teams_to_score_probability: number;
  home_clean_sheet_probability: number;
  away_clean_sheet_probability: number;
  confidence_score: number;
  explanation: string[];
};

export type SimulationTeam = {
  team_id: string;
  team_name: string;
  champion_probability: number;
  final_probability: number;
  semi_final_probability: number;
  quarter_final_probability: number;
  round_advancement_probability: number;
};

export type SimulationResult = {
  runs: number;
  teams: SimulationTeam[];
};

export type BettingRecommendation = {
  fixture_id: string;
  fixture_label: string;
  market: string;
  selection: string;
  model_probability: number;
  market_probability: number;
  best_decimal_odds: number;
  edge: number;
  expected_value: number;
  confidence: number;
  risk_label: string;
  rationale: string[];
};

export type NewsItem = {
  id: string;
  title: string;
  source: string;
  url?: string | null;
  published_at: string;
  team_ids: string[];
  impact: string;
  sentiment: string;
  summary: string;
};

export type LiveDataStatus = {
  results_provider: string;
  odds_provider: string;
  news_provider: string;
  configured_providers: string[];
  fallback_mode: boolean;
  cache_ttl_minutes: number;
  last_refresh: string;
  notes: string[];
};

export type ResearchSource = {
  title: string;
  source: string;
  url: string;
  category: string;
  summary: string;
};

export type StrategyStep = {
  title: string;
  detail: string;
  status: string;
};

export type BetLeg = {
  fixture_id: string;
  fixture_label: string;
  market: string;
  selection: string;
  decimal_odds: number;
  model_probability: number;
  market_probability: number;
  edge: number;
  status?: string;
  result?: string | null;
};

export type FakeBetSlip = {
  id: string;
  kind: string;
  stake: number;
  decimal_odds: number;
  model_probability: number;
  market_probability: number;
  edge: number;
  expected_value: number;
  potential_return: number;
  potential_profit: number;
  status: string;
  placed_at: string;
  settled_at?: string | null;
  actual_return?: number;
  profit_loss?: number;
  result_summary?: string;
  rationale: string[];
  legs: BetLeg[];
};

export type BankrollPoint = {
  label: string;
  bankroll: number;
  available_cash: number;
  open_risk: number;
  potential_return: number;
  note: string;
};

export type BankrollPhase = {
  title: string;
  status: string;
  starting_bankroll: number;
  target_bankroll: number;
  fixture_count: number;
  match_window: string;
  reset_trigger: string;
  exposure_policy: string;
  description: string;
  checkpoints: string[];
};

export type BankrollChallenge = {
  title: string;
  mode: string;
  strategy_name: string;
  initial_bankroll: number;
  target_bankroll: number;
  slate_size: number;
  settled_bankroll?: number;
  settled_profit_loss?: number;
  available_cash: number;
  open_risk: number;
  current_mark_to_model: number;
  max_possible_bankroll: number;
  probability_to_target: number;
  next_milestone?: number;
  next_milestone_probability?: number;
  won_slips?: number;
  lost_slips?: number;
  pending_slips?: number;
  settled_slips?: number;
  strategy_shift?: string;
  last_settlement?: string | null;
  target_assessment: string;
  risk_warning: string;
  plan: StrategyStep[];
  research_sources: ResearchSource[];
  slips: FakeBetSlip[];
  watchlist: FakeBetSlip[];
  bankroll_timeline: BankrollPoint[];
  phase_plan: BankrollPhase[];
  reset_policy: string;
  knockout_runway_games: number;
  news_context: NewsItem[];
};
