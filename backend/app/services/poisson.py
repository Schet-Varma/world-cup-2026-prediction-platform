from math import exp, factorial


def poisson_probability(lam: float, goals: int) -> float:
    return (lam**goals * exp(-lam)) / factorial(goals)


def score_matrix(home_xg: float, away_xg: float, max_goals: int = 6) -> list[dict]:
    rows: list[dict] = []
    for home_goals in range(max_goals + 1):
        for away_goals in range(max_goals + 1):
            probability = poisson_probability(home_xg, home_goals) * poisson_probability(away_xg, away_goals)
            rows.append(
                {
                    "home_goals": home_goals,
                    "away_goals": away_goals,
                    "probability": probability,
                }
            )
    total = sum(row["probability"] for row in rows)
    return [{**row, "probability": row["probability"] / total} for row in rows]


def summarize_score_matrix(matrix: list[dict]) -> dict[str, float]:
    home_win = sum(row["probability"] for row in matrix if row["home_goals"] > row["away_goals"])
    draw = sum(row["probability"] for row in matrix if row["home_goals"] == row["away_goals"])
    away_win = sum(row["probability"] for row in matrix if row["home_goals"] < row["away_goals"])
    return {"home_win": home_win, "draw": draw, "away_win": away_win}
