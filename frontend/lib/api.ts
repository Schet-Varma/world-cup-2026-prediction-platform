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
    return await getJson<BankrollChallenge>("/bankroll/challenge");
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
  title: "Fake $100 to $1,000 Knockout-Day Challenge",
  mode: "fake-money analytics lab",
  initial_bankroll: 100,
  target_bankroll: 1000,
  available_cash: 22,
  open_risk: 78,
  current_mark_to_model: 141,
  max_possible_bankroll: 1180,
  probability_to_target: 0.08,
  risk_warning: "No model can make sports betting risk-free. This page is fake money only.",
  plan: [
    { title: "Filter", detail: "Only fake-place positive expected value bets.", status: "active" },
    { title: "Stake sizing", detail: "Use capped fractional Kelly and keep reserve cash.", status: "active" },
    { title: "10x ladder", detail: "Use a tiny parlay sleeve for the $1,000 target.", status: "active" }
  ],
  research_sources: [
    {
      title: "The Odds API V4 documentation",
      source: "The Odds API",
      url: "https://the-odds-api.com/liveapi/guides/v4/",
      category: "odds feed",
      summary: "Provider docs for bookmaker odds and scores."
    }
  ],
  slips: [
    {
      id: "demo-slip",
      kind: "single",
      stake: 16,
      decimal_odds: 5.2,
      model_probability: 0.29,
      market_probability: 0.19,
      edge: 0.1,
      expected_value: 0.54,
      potential_return: 83.2,
      potential_profit: 67.2,
      status: "fake-open",
      placed_at: "knockout-day 10:00 local",
      rationale: ["Fake slip generated from model edge and capped staking."],
      legs: [
        {
          fixture_id: "r32-04",
          fixture_label: "Brazil vs Ireland",
          market: "h2h",
          selection: "Ireland",
          decimal_odds: 10.5,
          model_probability: 0.16,
          market_probability: 0.095,
          edge: 0.065
        }
      ]
    }
  ],
  bankroll_timeline: [
    { label: "Start", bankroll: 100, available_cash: 100, open_risk: 0, potential_return: 0, note: "Fake bankroll initialized." },
    { label: "Slips submitted", bankroll: 100, available_cash: 22, open_risk: 78, potential_return: 1180, note: "Fake slips locked." }
  ],
  news_context: demoNews
};
