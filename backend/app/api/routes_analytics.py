from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
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
    # 1. Total Links
    total_stmt = select(func.count(LinkItem.id))
    total_res = await db.execute(total_stmt)
    total_links = total_res.scalar_one()

    # 2. Platform Breakdown
    platform_stmt = select(LinkItem.platform, func.count(LinkItem.id)).group_by(LinkItem.platform)
    platform_res = await db.execute(platform_stmt)
    platform_counts = {p: count for p, count in platform_res.all()}

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

    # 5. Recent count (last 7 days)
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent_stmt = select(func.count(LinkItem.id)).where(LinkItem.created_at >= seven_days_ago)
    recent_res = await db.execute(recent_stmt)
    recent_count_7d = recent_res.scalar_one()

    return AnalyticsStatsResponse(
        total_links=total_links,
        platform_counts=platform_counts,
        top_categories=top_categories,
        top_tags=top_tags,
        recent_count_7d=recent_count_7d
    )
