import type {
  BankrollChallenge,
  BettingRecommendation,
  Fixture,
  LiveDataStatus,
  MatchPrediction,
  NewsItem,
  SimulationResult,
  Team
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { next: { revalidate: 60 } });
  if (!response.ok) {
    throw new Error(`API request failed: ${path}`);
  }
  return response.json() as Promise<T>;
}

async function getFreshJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`API request failed: ${path}`);
  }
  return response.json() as Promise<T>;
}

export async function getTeams(): Promise<Team[]> {
  try {
    return await getJson<Team[]>("/teams");
  } catch {
    return demoTeams;
  }
}

export async function getFixtures(): Promise<Fixture[]> {
  try {
    return await getJson<Fixture[]>("/fixtures");
  } catch {
    return demoFixtures;
  }
}

export async function getGroupPredictions(): Promise<MatchPrediction[]> {
  try {
    return await getJson<MatchPrediction[]>("/predictions/group");
  } catch {
    return [demoPrediction, demoGroupPrediction];
  }
}

export async function getSimulation(): Promise<SimulationResult> {
  try {
    return await getJson<SimulationResult>("/simulation");
  } catch {
    return {
      runs: 5000,
      teams: demoTeams.slice(0, 8).map((team, index) => ({
        team_id: team.id,
        team_name: team.name,
        champion_probability: Math.max(0.02, 0.18 - index * 0.018),
        final_probability: Math.max(0.05, 0.32 - index * 0.026),
        semi_final_probability: Math.max(0.08, 0.48 - index * 0.032),
        quarter_final_probability: Math.max(0.15, 0.66 - index * 0.04),
        round_advancement_probability: Math.max(0.4, 0.82 - index * 0.04)
      }))
    };
  }
}

export async function getPrediction(id: string): Promise<MatchPrediction> {
  try {
    return await getJson<MatchPrediction>(`/predictions/match/${id}`);
  } catch {
    return demoPrediction;
  }
}

export async function getBettingRecommendations(stage?: string): Promise<BettingRecommendation[]> {
  const query = stage ? `?stage=${stage}&limit=10` : "?limit=10";
  try {
    return await getJson<BettingRecommendation[]>(`/betting/recommendations${query}`);
  } catch {
    return demoRecommendations;
  }
}

export async function getNews(): Promise<NewsItem[]> {
  try {
    return await getJson<NewsItem[]>("/news?limit=6");
  } catch {
    return demoNews;
  }
}

export async function getLiveStatus(): Promise<LiveDataStatus> {
  try {
    return await getJson<LiveDataStatus>("/live/status");
  } catch {
    return {
      results_provider: "seed results",
      odds_provider: "seed odds",
      news_provider: "seed news",
      configured_providers: [],
      fallback_mode: true,
      cache_ttl_minutes: 30,
      last_refresh: new Date().toISOString(),
      notes: ["Running from local fallback data until API keys are configured."]
    };
  }
}

export async function getBankrollChallenge(): Promise<BankrollChallenge> {
  try {
    return await getFreshJson<BankrollChallenge>("/bankroll/challenge");
  } catch {
    return demoBankrollChallenge;
  }
}

const demoTeams: Team[] = [
  { id: "arg", name: "Argentina", confederation: "CONMEBOL", elo: 2142, attack: 1.19, defense: 0.86, fifa_rank: 1, climate_profile: "warm" },
  { id: "fra", name: "France", confederation: "UEFA", elo: 2098, attack: 1.18, defense: 0.88, fifa_rank: 2, climate_profile: "temperate" },
  { id: "esp", name: "Spain", confederation: "UEFA", elo: 2055, attack: 1.14, defense: 0.9, fifa_rank: 3, climate_profile: "warm" },
  { id: "bra", name: "Brazil", confederation: "CONMEBOL", elo: 2038, attack: 1.16, defense: 0.92, fifa_rank: 5, climate_profile: "tropical" },
  { id: "eng", name: "England", confederation: "UEFA", elo: 2025, attack: 1.12, defense: 0.91, fifa_rank: 4, climate_profile: "temperate" },
  { id: "ned", name: "Netherlands", confederation: "UEFA", elo: 1980, attack: 1.09, defense: 0.94, fifa_rank: 7, climate_profile: "temperate" },
  { id: "por", name: "Portugal", confederation: "UEFA", elo: 1972, attack: 1.1, defense: 0.95, fifa_rank: 6, climate_profile: "warm" },
  { id: "ger", name: "Germany", confederation: "UEFA", elo: 1966, attack: 1.11, defense: 0.98, fifa_rank: 10, climate_profile: "temperate" }
];

const demoFixtures: Fixture[] = [
  { id: "r32-01", round: "Round of 32", home_team: "arg", away_team: "jam", venue: "MetLife Stadium", kickoff_local: "2026-07-04T15:00:00-04:00", neutral: true, stage: "knockout", status: "scheduled" },
  { id: "r32-02", round: "Round of 32", home_team: "fra", away_team: "rsa", venue: "AT&T Stadium", kickoff_local: "2026-07-04T18:00:00-05:00", neutral: true, stage: "knockout", status: "scheduled" },
  { id: "grp-c-05", round: "Group C Matchday 3", home_team: "sco", away_team: "bra", venue: "Hard Rock Stadium", kickoff_local: "2026-06-24T21:00:00-04:00", neutral: true, stage: "group", group: "C", status: "scheduled" },
  { id: "grp-l-05", round: "Group L Matchday 3", home_team: "pan", away_team: "eng", venue: "MetLife Stadium", kickoff_local: "2026-06-27T17:00:00-04:00", neutral: true, stage: "group", group: "L", status: "scheduled" }
];

const demoPrediction: MatchPrediction = {
  fixture: demoFixtures[0],
  home_team: demoTeams[0],
  away_team: { id: "jam", name: "Jamaica", confederation: "CONCACAF", elo: 1646, attack: 0.9, defense: 1.1, fifa_rank: 32, climate_profile: "tropical" },
  expected_home_goals: 1.87,
  expected_away_goals: 0.68,
  most_likely_score: "1-0",
  top_scorelines: [
    { home_goals: 1, away_goals: 0, probability: 0.17 },
    { home_goals: 2, away_goals: 0, probability: 0.16 },
    { home_goals: 2, away_goals: 1, probability: 0.11 },
    { home_goals: 1, away_goals: 1, probability: 0.11 },
    { home_goals: 3, away_goals: 0, probability: 0.1 }
  ],
  home_win_probability: 0.69,
  draw_probability: 0.19,
  away_win_probability: 0.12,
  upset_probability: 0.12,
  over_2_5_probability: 0.48,
  under_2_5_probability: 0.52,
  both_teams_to_score_probability: 0.34,
  home_clean_sheet_probability: 0.51,
  away_clean_sheet_probability: 0.16,
  confidence_score: 0.72,
  explanation: [
    "Argentina carries a large Elo edge and stronger recent tournament performance.",
    "Expected goals combine attack, defense, Elo difference, and form.",
    "Neutral venue assumptions are used until live fixture metadata is available."
  ]
};

const demoGroupPrediction: MatchPrediction = {
  ...demoPrediction,
  fixture: demoFixtures[2],
  home_team: { id: "sco", name: "Scotland", confederation: "UEFA", elo: 1740, attack: 0.95, defense: 1.04, fifa_rank: 36, climate_profile: "temperate" },
  away_team: demoTeams[3],
  expected_home_goals: 0.92,
  expected_away_goals: 1.62,
  most_likely_score: "0-1",
  home_win_probability: 0.19,
  draw_probability: 0.25,
  away_win_probability: 0.56,
  upset_probability: 0.19,
  over_2_5_probability: 0.45,
  under_2_5_probability: 0.55,
  both_teams_to_score_probability: 0.46,
  confidence_score: 0.67
};

const demoRecommendations: BettingRecommendation[] = [
  {
    fixture_id: "grp-c-05",
    fixture_label: "Scotland vs Brazil",
    market: "btts",
    selection: "No",
    model_probability: 0.54,
    market_probability: 0.48,
    best_decimal_odds: 2.08,
    edge: 0.06,
    expected_value: 0.12,
    confidence: 0.67,
    risk_label: "watchlist edge",
    rationale: ["Brazil projection is strong, but Scotland chance creation remains modest.", "This is an analytics signal and should be verified against live odds."]
  }
];

const demoNews: NewsItem[] = [
  {
    id: "demo-news",
    title: "Group-stage motivation is now a model input",
    source: "seed-news",
    published_at: "2026-06-24T00:00:00Z",
    team_ids: ["eng", "gha", "cro", "pan"],
    impact: "high",
    sentiment: "neutral",
    summary: "Final group matches are flagged as high volatility because qualification incentives change team selection and game state."
  }
];

const demoBankrollChallenge: BankrollChallenge = {
  title: "Safe $100 Practice Bankroll",
  mode: "remaining group-stage fake-money lab",
  strategy_name: "Safe Growth Mode",
  initial_bankroll: 100,
  target_bankroll: 1000,
  slate_size: 8,
  available_cash: 85,
  open_risk: 15,
  current_mark_to_model: 101.9,
  max_possible_bankroll: 112.95,
  probability_to_target: 0,
  target_assessment: "Safe mode starts on remaining group-stage games. It cannot honestly project a high-probability 10x from one card, so it compounds small positive-EV fake bets across the group slate instead of chasing longshots.",
  risk_warning: "Fake money only. Safe mode prioritizes survival and disciplined compounding; it will hold cash rather than force risky bets.",
  plan: [
    { title: "Reality check", detail: "Practice on remaining group-stage games only and refuse forced action.", status: "active" },
    { title: "Remaining group screen", detail: "Place fake bets that pass probability, odds-band, edge, and confidence filters.", status: "active" },
    { title: "Stake sizing", detail: "Use fractional Kelly as a ceiling with small single stakes and reserve cash.", status: "active" }
  ],
  research_sources: [
    {
      title: "The Odds API V4 documentation",
      source: "The Odds API",
      url: "https://the-odds-api.com/liveapi/guides/v4/",
      category: "odds feed",
      summary: "Provider docs for bookmaker odds and scores."
    },
    {
      title: "Advice to consider if you're gambling",
      source: "GambleAware",
      url: "https://www.gambleaware.org/advice/for-your-gambling/advice-to-consider-if-you-re-gambling/",
      category: "responsible gambling",
      summary: "Responsible gambling guidance: set spending limits, take breaks, and avoid chasing losses."
    }
  ],
  slips: [
    {
      id: "demo-single-1",
      kind: "single",
      stake: 5,
      decimal_odds: 2.02,
      model_probability: 0.568,
      market_probability: 0.495,
      edge: 0.073,
      expected_value: 0.147,
      potential_return: 10.1,
      potential_profit: 5.1,
      status: "fake-open",
      placed_at: "2026-06-24 practice card",
      rationale: ["Safe mode keeps this as a small single because the model edge is positive without needing an upset."],
      legs: [
        {
          fixture_id: "grp-c-05",
          fixture_label: "Scotland vs Brazil",
          market: "btts",
          selection: "Yes",
          decimal_odds: 2.02,
          model_probability: 0.568,
          market_probability: 0.495,
          edge: 0.073
        }
      ]
    },
    {
      id: "demo-single-2",
      kind: "single",
      stake: 5,
      decimal_odds: 1.82,
      model_probability: 0.615,
      market_probability: 0.549,
      edge: 0.066,
      expected_value: 0.119,
      potential_return: 9.1,
      potential_profit: 4.1,
      status: "fake-open",
      placed_at: "2026-06-24 practice card",
      rationale: ["Totals edge passes the safer odds band and keeps exposure limited."],
      legs: [
        {
          fixture_id: "grp-c-06",
          fixture_label: "Morocco vs Haiti",
          market: "totals",
          selection: "Under 2.5",
          decimal_odds: 1.82,
          model_probability: 0.615,
          market_probability: 0.549,
          edge: 0.066
        }
      ]
    },
    {
      id: "demo-single-3",
      kind: "single",
      stake: 5,
      decimal_odds: 1.75,
      model_probability: 0.636,
      market_probability: 0.571,
      edge: 0.065,
      expected_value: 0.113,
      potential_return: 8.75,
      potential_profit: 3.75,
      status: "fake-open",
      placed_at: "2026-06-24 practice card",
      rationale: ["The model prefers the lower-variance total instead of a match-result longshot."],
      legs: [
        {
          fixture_id: "grp-b-06",
          fixture_label: "Bosnia and Herzegovina vs Qatar",
          market: "totals",
          selection: "Under 2.5",
          decimal_odds: 1.75,
          model_probability: 0.636,
          market_probability: 0.571,
          edge: 0.065
        }
      ]
    }
  ],
  watchlist: [
    {
      id: "demo-rejected-1",
      kind: "screened edge",
      stake: 0,
      decimal_odds: 7.25,
      model_probability: 0.22,
      market_probability: 0.138,
      edge: 0.082,
      expected_value: 0.593,
      potential_return: 0,
      potential_profit: 0,
      status: "not-placed",
      placed_at: "2026-06-24 safety screen",
      rationale: ["Rejected: low hit-rate upset or longshot profile does not fit Safe Growth Mode."],
      legs: [
        {
          fixture_id: "grp-l-05",
          fixture_label: "Panama vs England",
          market: "h2h",
          selection: "Panama",
          decimal_odds: 7.25,
          model_probability: 0.22,
          market_probability: 0.138,
          edge: 0.082
        }
      ]
    }
  ],
  bankroll_timeline: [
    { label: "Start", bankroll: 100, available_cash: 100, open_risk: 0, potential_return: 0, note: "Fake bankroll initialized." },
    { label: "Today locked", bankroll: 100, available_cash: 85, open_risk: 15, potential_return: 27.95, note: "Only remaining group-stage safe singles are fake-placed." },
    { label: "Model EV mark", bankroll: 101.9, available_cash: 85, open_risk: 15, potential_return: 27.95, note: "Expected value mark after the conservative fake card, not settled cash." },
    { label: "Round of 32 reset", bankroll: 100, available_cash: 100, open_risk: 0, potential_return: 0, note: "Knockout ledger starts fresh at $100; group-stage profit or loss is archived." }
  ],
  phase_plan: [
    {
      title: "Group-stage practice run",
      status: "active until groups end",
      starting_bankroll: 100,
      target_bankroll: 1000,
      fixture_count: 8,
      match_window: "Remaining group-stage fixtures",
      reset_trigger: "Settles when the final group-stage fixture is complete.",
      exposure_policy: "Keep open fake risk at $28 or lower; prefer singles and hold cash when edges are thin.",
      description: "Use this phase to test disciplined small-EV decisions before the bracket locks.",
      checkpoints: [
        "Refresh results and news after each group match window.",
        "Settle open fake slips, then update available cash and rejected edges.",
        "Do not add recovery bets after a miss."
      ]
    },
    {
      title: "Round of 32 knockout reset",
      status: "queued",
      starting_bankroll: 100,
      target_bankroll: 1000,
      fixture_count: 31,
      match_window: "16 Round of 32 fixtures loaded now, 31 knockout matches planned across the full bracket",
      reset_trigger: "Starts when the Round of 32 bracket is confirmed.",
      exposure_policy: "Reset to $100, use 2-4% base units, cap daily exposure, and scale only after settled profit.",
      description: "This is the more realistic 10x attempt: about thirty knockout matches gives the model more chances to compound safely.",
      checkpoints: [
        "Begin with no carry-over from group-stage profit or loss.",
        "Separate core singles from tiny optional upside slips.",
        "Stop for the day if drawdown hits 12% of the reset bankroll."
      ]
    }
  ],
  reset_policy: "At Round of 32 reset, archive the group-stage ledger and restart with $100. The knockout target stays $1000 across about 31 matches.",
  knockout_runway_games: 31,
  news_context: demoNews
};
