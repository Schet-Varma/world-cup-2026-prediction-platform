# API Options

## Shortlist

| Provider | Coverage | Strengths | Tradeoffs |
| --- | --- | --- | --- |
| football-data.org | Fixtures, results, competitions | Simple API, useful free tier | International and World Cup coverage may be limited by plan. |
| API-Football | Broad football coverage | Fixtures, standings, odds-like metadata, injuries on paid plans | Paid tiers required for serious usage. |
| Sportmonks | Broad football and squad data | Strong commercial coverage, player and injury endpoints | Paid product; needs careful cost review. |
| Opta/Stats Perform | Enterprise football data | Best-in-class data quality | Expensive and procurement-heavy. |
| Open-Meteo | Weather | Free, no key for many endpoints | Weather is contextual, not a primary predictor. |

## MVP Decision

Use local seed data and provider interfaces. The platform should not block on keys or licensing during early development. A provider adapter can later normalize external payloads into the internal team, fixture, and match-result schemas.

## Future Adapter Contract

Provider adapters should implement:

- `fetch_teams()`
- `fetch_fixtures(competition, season)`
- `fetch_results(team_ids, from_date, to_date)`
- `fetch_injuries(team_ids)` when licensed data exists
- `fetch_weather(stadium_id, kickoff_time)` for climate adjustments

All adapters must write raw payloads to `data/cache` before normalization.
