import type { Fixture, MatchPrediction, SimulationResult, Team } from "./types";

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
  { id: "r32-01", round: "Round of 32", home_team: "arg", away_team: "jam", venue: "MetLife Stadium", kickoff_local: "2026-07-04T15:00:00-04:00", neutral: true },
  { id: "r32-02", round: "Round of 32", home_team: "fra", away_team: "rsa", venue: "AT&T Stadium", kickoff_local: "2026-07-04T18:00:00-05:00", neutral: true },
  { id: "r32-03", round: "Round of 32", home_team: "esp", away_team: "qat", venue: "SoFi Stadium", kickoff_local: "2026-07-05T15:00:00-07:00", neutral: true },
  { id: "r32-04", round: "Round of 32", home_team: "bra", away_team: "irl", venue: "Hard Rock Stadium", kickoff_local: "2026-07-05T20:00:00-04:00", neutral: true }
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
  explanation: [
    "Argentina carries a large Elo edge and stronger recent tournament performance.",
    "Expected goals combine attack, defense, Elo difference, and form.",
    "Neutral venue assumptions are used until live fixture metadata is available."
  ]
};
