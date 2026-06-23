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
