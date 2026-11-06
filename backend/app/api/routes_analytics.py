from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case
from datetime import datetime, timezone, timedelta

from app.database.session import get_db
from app.models.link_item import LinkItem, LinkTag
from app.models.schemas import AnalyticsStatsResponse

router = APIRouter(prefix="/analytics", tags=["Analytics & Insights"])

@router.get("/stats", response_model=AnalyticsStatsResponse)
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    """
    Returns high-level statistics for the dashboard analytics cards.
    """
    # Total, platform, and recent counts share one scan and one round trip.
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    platform_stmt = select(
        LinkItem.platform,
        func.count(LinkItem.id),
        func.sum(case((LinkItem.created_at >= seven_days_ago, 1), else_=0)),
    ).group_by(LinkItem.platform)
    platform_res = await db.execute(platform_stmt)
    rows = platform_res.all()
    platform_counts = {p: count for p, count, _ in rows}
    total_links = sum(count for _, count, _ in rows)
    recent_count_7d = sum(recent or 0 for _, _, recent in rows)

    # Ensure all primary platforms exist in dict
    for p in ["Google Drive", "GitHub", "Web"]:
        if p not in platform_counts:
            platform_counts[p] = 0

    # 3. Top Categories
    cat_stmt = select(LinkItem.primary_category, func.count(LinkItem.id)).group_by(LinkItem.primary_category).order_by(func.count(LinkItem.id).desc()).limit(6)
    cat_res = await db.execute(cat_stmt)
    top_categories = [{"category": c, "count": cnt} for c, cnt in cat_res.all()]

    # 4. Top Tags
    tag_stmt = select(LinkTag.tag_name, func.count(LinkTag.id)).group_by(LinkTag.tag_name).order_by(func.count(LinkTag.id).desc()).limit(10)
    tag_res = await db.execute(tag_stmt)
    top_tags = [{"tag": t, "count": cnt} for t, cnt in tag_res.all()]

    return AnalyticsStatsResponse(
        total_links=total_links,
        platform_counts=platform_counts,
        top_categories=top_categories,
        top_tags=top_tags,
        recent_count_7d=recent_count_7d
    )
