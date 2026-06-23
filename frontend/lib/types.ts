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
