from app.data.loaders import load_news_items
from app.models.domain import NewsItem


def latest_news(limit: int = 8, team_id: str | None = None) -> list[NewsItem]:
    items = load_news_items()
    if team_id:
        items = [item for item in items if team_id in item.team_ids]
    items.sort(key=lambda item: item.published_at, reverse=True)
    return items[:limit]
